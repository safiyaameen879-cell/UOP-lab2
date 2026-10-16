
CREATE TYPE public.app_role AS ENUM ('admin','staff');
CREATE TYPE public.lab_status AS ENUM ('active','maintenance','closed');
CREATE TYPE public.record_status AS ENUM ('pending','verified','incomplete');
CREATE TYPE public.issue_priority AS ENUM ('low','medium','high','critical');
CREATE TYPE public.issue_status AS ENUM ('open','in_progress','resolved');

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
CREATE TABLE public.labs (
  id serial PRIMARY KEY,
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  location text,
  capacity int NOT NULL DEFAULT 0 CHECK (capacity >= 0),
  status public.lab_status NOT NULL DEFAULT 'active',
  qr_slug text NOT NULL UNIQUE,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.departments (
  id serial PRIMARY KEY,
  faculty text NOT NULL,
  name text NOT NULL,
  UNIQUE (faculty, name)
);
CREATE SEQUENCE public.usage_record_seq;
CREATE TABLE public.usage_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  record_no text NOT NULL UNIQUE,
  lab_id int NOT NULL REFERENCES public.labs(id),
  department_id int NOT NULL REFERENCES public.departments(id),
  responsible_name text NOT NULL CHECK (length(responsible_name) BETWEEN 2 AND 120),
  responsible_designation text,
  contact_email text,
  contact_phone text,
  purpose text NOT NULL,
  activity_type text NOT NULL,
  usage_date date NOT NULL,
  expected_start time,
  expected_end time,
  participants_expected int CHECK (participants_expected >= 0),
  participants_actual int CHECK (participants_actual >= 0),
  notes text,
  actual_start time,
  actual_end time,
  duration_minutes int GENERATED ALWAYS AS (
    CASE WHEN actual_start IS NOT NULL AND actual_end IS NOT NULL AND actual_end > actual_start
    THEN (extract(epoch FROM (actual_end - actual_start)) / 60)::int END) STORED,
  status public.record_status NOT NULL DEFAULT 'pending',
  verified_by uuid,
  verified_at timestamptz,
  verification_note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON public.usage_records (usage_date);
CREATE INDEX ON public.usage_records (lab_id);
CREATE INDEX ON public.usage_records (department_id);
CREATE INDEX ON public.usage_records (status);

CREATE TABLE public.equipment_issues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lab_id int NOT NULL REFERENCES public.labs(id),
  equipment_ref text,
  description text NOT NULL,
  reported_on date NOT NULL DEFAULT current_date,
  priority public.issue_priority NOT NULL DEFAULT 'medium',
  status public.issue_status NOT NULL DEFAULT 'open',
  actions_taken text,
  resolution text,
  resolved_on date,
  reported_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON public.equipment_issues (lab_id, status);

CREATE TABLE public.audit_log (
  id bigserial PRIMARY KEY,
  actor uuid,
  action text NOT NULL,
  entity text NOT NULL,
  entity_id text,
  details jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- role helpers
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;
CREATE OR REPLACE FUNCTION public.is_staff(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id)
$$;

-- signup: profile; first user becomes admin
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- verification rules
CREATE OR REPLACE FUNCTION public.usage_records_guard()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    -- submitted details are immutable; only verification fields may change
    IF NEW.record_no <> OLD.record_no OR NEW.lab_id <> OLD.lab_id OR NEW.department_id <> OLD.department_id
       OR NEW.responsible_name <> OLD.responsible_name OR NEW.usage_date <> OLD.usage_date
       OR NEW.purpose <> OLD.purpose OR NEW.created_at <> OLD.created_at THEN
      RAISE EXCEPTION 'Submitted record details cannot be changed';
    END IF;
  END IF;
  IF NEW.status = 'verified' THEN
    IF NEW.actual_start IS NULL OR NEW.actual_end IS NULL OR NEW.actual_end <= NEW.actual_start THEN
      RAISE EXCEPTION 'A record can only be verified with valid actual start and end times';
    END IF;
    IF NEW.verified_at IS NULL OR (TG_OP='UPDATE' AND OLD.status <> 'verified') THEN
      NEW.verified_at := now();
      NEW.verified_by := auth.uid();
    END IF;
  ELSE
    NEW.verified_at := NULL;
    NEW.verified_by := NULL;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER usage_records_guard BEFORE INSERT OR UPDATE ON public.usage_records
FOR EACH ROW EXECUTE FUNCTION public.usage_records_guard();

CREATE OR REPLACE FUNCTION public.audit_trigger()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.audit_log (actor, action, entity, entity_id, details)
  VALUES (auth.uid(), TG_OP, TG_TABLE_NAME,
          COALESCE(NEW.id::text, OLD.id::text),
          CASE WHEN TG_OP='DELETE' THEN to_jsonb(OLD) ELSE to_jsonb(NEW) END);
  RETURN COALESCE(NEW, OLD);
END $$;
CREATE TRIGGER audit_usage AFTER INSERT OR UPDATE OR DELETE ON public.usage_records FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();
CREATE TRIGGER audit_issues AFTER INSERT OR UPDATE OR DELETE ON public.equipment_issues FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();
CREATE TRIGGER audit_labs AFTER UPDATE ON public.labs FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();

-- public QR submission (no admin access granted)
CREATE OR REPLACE FUNCTION public.submit_usage(
  _qr_slug text, _department_id int, _responsible_name text, _responsible_designation text,
  _contact_email text, _contact_phone text, _purpose text, _activity_type text, _usage_date date,
  _expected_start time, _expected_end time, _participants_expected int, _notes text)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _lab public.labs; _no text;
BEGIN
  SELECT * INTO _lab FROM public.labs WHERE qr_slug = _qr_slug;
  IF _lab.id IS NULL THEN RAISE EXCEPTION 'Unknown laboratory'; END IF;
  IF _lab.status <> 'active' THEN RAISE EXCEPTION 'This laboratory is not currently accepting usage records'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.departments WHERE id = _department_id) THEN RAISE EXCEPTION 'Invalid department'; END IF;
  IF coalesce(length(trim(_responsible_name)),0) < 2 THEN RAISE EXCEPTION 'Responsible person is required'; END IF;
  IF coalesce(length(trim(_purpose)),0) < 3 OR length(_purpose) > 500 THEN RAISE EXCEPTION 'Purpose is required (max 500 characters)'; END IF;
  IF _contact_email IS NULL AND _contact_phone IS NULL THEN RAISE EXCEPTION 'An email or phone number is required'; END IF;
  IF _contact_email IS NOT NULL AND _contact_email !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' THEN RAISE EXCEPTION 'Invalid email'; END IF;
  IF _usage_date IS NULL OR _usage_date > current_date + 1 OR _usage_date < current_date - 7 THEN RAISE EXCEPTION 'Usage date must be within the last 7 days'; END IF;
  IF _expected_start IS NOT NULL AND _expected_end IS NOT NULL AND _expected_end <= _expected_start THEN RAISE EXCEPTION 'Expected end must be after start'; END IF;
  IF _participants_expected IS NOT NULL AND (_participants_expected < 0 OR _participants_expected > 1000) THEN RAISE EXCEPTION 'Invalid participant count'; END IF;
  _no := 'LUR-' || to_char(_usage_date,'YYYYMM') || '-' || lpad(nextval('public.usage_record_seq')::text, 5, '0');
  INSERT INTO public.usage_records (record_no, lab_id, department_id, responsible_name, responsible_designation,
    contact_email, contact_phone, purpose, activity_type, usage_date, expected_start, expected_end,
    participants_expected, notes)
  VALUES (_no, _lab.id, _department_id, trim(_responsible_name), nullif(trim(_responsible_designation),''),
    nullif(trim(_contact_email),''), nullif(trim(_contact_phone),''), trim(_purpose), _activity_type, _usage_date,
    _expected_start, _expected_end, _participants_expected, nullif(trim(_notes),''));
  RETURN _no;
END $$;
REVOKE ALL ON FUNCTION public.submit_usage FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_usage TO anon, authenticated;

-- grants
GRANT SELECT ON public.profiles TO authenticated;
GRANT SELECT ON public.user_roles TO authenticated;
GRANT INSERT, DELETE ON public.user_roles TO authenticated;
GRANT SELECT ON public.labs, public.departments TO anon;
GRANT SELECT, UPDATE ON public.labs TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.departments TO authenticated;
GRANT SELECT, UPDATE ON public.usage_records TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.equipment_issues TO authenticated;
GRANT SELECT ON public.audit_log TO authenticated;
GRANT USAGE ON SEQUENCE public.departments_id_seq TO authenticated;
GRANT ALL ON public.profiles, public.user_roles, public.labs, public.departments, public.usage_records, public.equipment_issues, public.audit_log TO service_role;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.labs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own or admin profiles" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "own or admin roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin grants roles" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin revokes roles" ON public.user_roles FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin') AND user_id <> auth.uid());
CREATE POLICY "labs public read" ON public.labs FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "admin updates labs" ON public.labs FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "departments public read" ON public.departments FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "staff add departments" ON public.departments FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "admin edit departments" ON public.departments FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "staff read usage" ON public.usage_records FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "staff verify usage" ON public.usage_records FOR UPDATE TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "staff read issues" ON public.equipment_issues FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "staff add issues" ON public.equipment_issues FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "staff update issues" ON public.equipment_issues FOR UPDATE TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "admin reads audit" ON public.audit_log FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- synthetic seed data
INSERT INTO public.labs (code, name, location, capacity, status, qr_slug) VALUES
 ('LAB-01','IT Computer Laboratory 01','Arts Faculty, Ground Floor',60,'active','it-lab-01'),
 ('LAB-02','IT Computer Laboratory 02','Arts Faculty, First Floor',45,'active','it-lab-02'),
 ('LAB-03','IT Computer Laboratory 03','Arts Faculty, First Floor',40,'active','it-lab-03');
INSERT INTO public.departments (faculty, name) VALUES
 ('Faculty of Arts','Department of Economics and Statistics'),
 ('Faculty of Arts','Department of Geography'),
 ('Faculty of Arts','Department of English'),
 ('Faculty of Arts','Department of Sociology'),
 ('Faculty of Arts','Department of Psychology'),
 ('Faculty of Management','Department of Business Finance'),
 ('Faculty of Science','Department of Statistics and Computer Science'),
 ('Faculty of Allied Health Sciences','Department of Nursing');

INSERT INTO public.usage_records (record_no, lab_id, department_id, responsible_name, responsible_designation, contact_email, purpose, activity_type, usage_date, expected_start, expected_end, participants_expected, participants_actual, actual_start, actual_end, status)
SELECT 'LUR-' || to_char(d,'YYYYMM') || '-' || lpad(nextval('public.usage_record_seq')::text,5,'0'),
  1 + (n % 3), 1 + (n % 8),
  (ARRAY['Dr. A. Perera (sample)','Ms. N. Silva (sample)','Mr. K. Fernando (sample)','Prof. R. Jayasinghe (sample)','Dr. S. Bandara (sample)'])[1 + n % 5],
  (ARRAY['Senior Lecturer','Lecturer','Instructor','Professor','Senior Lecturer'])[1 + n % 5],
  'sample' || n || '@example.edu',
  (ARRAY['SPSS practical session','GIS mapping practical','Online examination','Academic writing workshop','Data analysis lecture'])[1 + n % 5],
  (ARRAY['Practical','Practical','Examination','Workshop','Lecture'])[1 + n % 5],
  d, '09:00', '11:00', 30 + (n % 20),
  CASE WHEN n % 4 <> 0 THEN 28 + (n % 18) END,
  CASE WHEN n % 4 <> 0 THEN time '09:05' + (n % 3) * interval '5 min' END,
  CASE WHEN n % 4 <> 0 THEN time '10:50' + (n % 4) * interval '10 min' END,
  (CASE WHEN n % 4 <> 0 THEN 'verified' ELSE 'pending' END)::public.record_status
FROM (SELECT n, (current_date - (n * 2))::date AS d FROM generate_series(0, 29) n) s;

INSERT INTO public.equipment_issues (lab_id, equipment_ref, description, reported_on, priority, status, actions_taken, resolution, resolved_on) VALUES
 (1,'PC-L1-14','Monitor flickering intermittently', current_date - 20,'medium','resolved','Replaced VGA cable','Fixed — cable fault', current_date - 18),
 (2,'PC-L2-07','System does not boot (no POST)', current_date - 6,'high','in_progress','Sent PSU for testing',NULL,NULL),
 (3,'PROJ-L3','Projector lamp dim', current_date - 3,'low','open',NULL,NULL,NULL),
 (1,'NET-SW-1','Network switch port 12 dead', current_date - 1,'critical','open',NULL,NULL,NULL);
