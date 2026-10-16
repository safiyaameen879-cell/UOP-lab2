import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Brand } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { ACTIVITY_TYPES } from "@/lib/usage";

export const Route = createFileRoute("/lab/$slug")({
  head: () => ({
    meta: [
      { title: "Record laboratory usage — UOP Dept. of IT" },
      { name: "description", content: "Record a session in a Department of IT computer laboratory." },
      { property: "og:title", content: "Record laboratory usage" },
      { property: "og:description", content: "QR usage form for UOP IT computer laboratories." },
    ],
  }),
  component: LabForm,
});

const today = () => new Date().toISOString().slice(0, 10);

function LabForm() {
  const { slug } = Route.useParams();
  const lab = useQuery({
    queryKey: ["lab", slug],
    queryFn: async () => (await supabase.from("labs").select("*").eq("qr_slug", slug).maybeSingle()).data,
  });
  const depts = useQuery({
    queryKey: ["departments"],
    queryFn: async () => (await supabase.from("departments").select("*").order("faculty").order("name")).data ?? [],
  });
  const [faculty, setFaculty] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverErr, setServerErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<string | null>(null);

  const faculties = [...new Set((depts.data ?? []).map((d) => d.faculty))];

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.currentTarget)) as any;
    const errs: Record<string, string> = {};
    if (!f.department_id) errs.department_id = "Select the visiting department";
    if ((f.responsible_name ?? "").trim().length < 2) errs.responsible_name = "Enter the responsible person's name";
    if (!f.contact_email && !f.contact_phone) errs.contact_email = "Provide an email or phone number";
    if (f.contact_phone && !/^[+\d][\d\s-]{6,15}$/.test(f.contact_phone)) errs.contact_phone = "Enter a valid phone number";
    if ((f.purpose ?? "").trim().length < 3) errs.purpose = "Describe the purpose";
    if (f.expected_start && f.expected_end && f.expected_end <= f.expected_start) errs.expected_end = "End must be after start";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setBusy(true);
    setServerErr("");
    const n = (v: string) => (v ? v : null);
    const { data, error } = await supabase.rpc("submit_usage", {
      _qr_slug: slug,
      _department_id: Number(f.department_id),
      _responsible_name: f.responsible_name,
      _responsible_designation: f.responsible_designation,
      _contact_email: n(f.contact_email) as string,
      _contact_phone: n(f.contact_phone) as string,
      _purpose: f.purpose,
      _activity_type: f.activity_type,
      _usage_date: f.usage_date,
      _expected_start: n(f.expected_start) as string,
      _expected_end: n(f.expected_end) as string,
      _participants_expected: f.participants_expected ? Number(f.participants_expected) : (null as unknown as number),
      _notes: f.notes,
    });
    setBusy(false);
    if (error) setServerErr(error.message);
    else setDone(data as string);
  }

  const Err = ({ k }: { k: string }) => (errors[k] ? <p className="mt-1 text-xs font-semibold text-destructive">{errors[k]}</p> : null);

  if (lab.isLoading) return <div className="p-10 text-center text-muted-foreground">Loading…</div>;
  if (!lab.data)
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 p-6 text-center">
        <h1 className="text-2xl font-semibold">Laboratory not found</h1>
        <p className="text-muted-foreground">This QR code is not linked to a laboratory.</p>
        <Link to="/" className="text-gold-deep underline">Home</Link>
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-soft">
      <div className="bg-charcoal px-5 py-4">
        <div className="mx-auto max-w-2xl"><Brand light compact /></div>
      </div>
      <div className="mx-auto max-w-2xl px-4 py-6">
        <div className="panel mb-5 overflow-hidden">
          <div className="bg-gradient-gold px-6 py-5">
            <div className="text-xs font-bold tracking-widest">{lab.data.code}</div>
            <h1 className="text-2xl font-semibold">{lab.data.name}</h1>
            <p className="text-sm opacity-80">{lab.data.location}</p>
          </div>
        </div>

        {done ? (
          <div className="panel p-8 text-center">
            <CheckCircle2 className="mx-auto h-14 w-14 text-success" />
            <h2 className="mt-4 text-2xl font-semibold">Usage recorded</h2>
            <p className="mt-2 text-muted-foreground">Thank you. Please quote this record ID to laboratory staff:</p>
            <div className="mx-auto mt-4 inline-block rounded-lg bg-butter px-5 py-3 font-mono text-xl font-bold tracking-wider">{done}</div>
            <p className="mt-4 text-sm text-muted-foreground">IT staff will verify the actual start and end times.</p>
            <Button variant="outline" className="mt-6" onClick={() => setDone(null)}>Record another session</Button>
          </div>
        ) : lab.data.status !== "active" ? (
          <div className="panel p-8 text-center">
            <h2 className="text-xl font-semibold">This laboratory is currently {lab.data.status}</h2>
            <p className="mt-2 text-muted-foreground">Please contact the Department of IT.</p>
          </div>
        ) : (
          <form onSubmit={submit} noValidate className="panel space-y-5 p-6">
            <h2 className="text-xl font-semibold">Session details</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="field-label">Visiting faculty *</label>
                <select className="field" value={faculty} onChange={(e) => setFaculty(e.target.value)}>
                  <option value="">Select faculty</option>
                  {faculties.map((f) => <option key={f}>{f}</option>)}
                </select>
              </div>
              <div>
                <label className="field-label">Visiting department *</label>
                <select name="department_id" className="field" defaultValue="">
                  <option value="">Select department</option>
                  {(depts.data ?? []).filter((d) => !faculty || d.faculty === faculty).map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
                <Err k="department_id" />
              </div>
              <div>
                <label className="field-label">Responsible lecturer / staff *</label>
                <input name="responsible_name" className="field" maxLength={120} />
                <Err k="responsible_name" />
              </div>
              <div>
                <label className="field-label">Designation</label>
                <input name="responsible_designation" className="field" maxLength={80} placeholder="e.g. Senior Lecturer" />
              </div>
              <div>
                <label className="field-label">Email</label>
                <input name="contact_email" type="email" className="field" maxLength={120} />
                <Err k="contact_email" />
              </div>
              <div>
                <label className="field-label">Phone</label>
                <input name="contact_phone" type="tel" className="field" maxLength={16} />
                <Err k="contact_phone" />
              </div>
              <div>
                <label className="field-label">Activity type *</label>
                <select name="activity_type" className="field">
                  {ACTIVITY_TYPES.map((a) => <option key={a}>{a}</option>)}
                </select>
              </div>
              <div>
                <label className="field-label">Date *</label>
                <input name="usage_date" type="date" className="field" defaultValue={today()} required />
              </div>
              <div className="sm:col-span-2">
                <label className="field-label">Purpose of use *</label>
                <input name="purpose" className="field" maxLength={500} placeholder="e.g. SPSS practical for 2nd year students" />
                <Err k="purpose" />
              </div>
              <div>
                <label className="field-label">Expected start (if known)</label>
                <input name="expected_start" type="time" className="field" />
              </div>
              <div>
                <label className="field-label">Expected end (if known)</label>
                <input name="expected_end" type="time" className="field" />
                <Err k="expected_end" />
              </div>
              <div>
                <label className="field-label">Expected participants</label>
                <input name="participants_expected" type="number" min={0} max={1000} className="field" />
              </div>
              <div className="sm:col-span-2">
                <label className="field-label">Notes</label>
                <textarea name="notes" rows={3} className="field" maxLength={1000} />
              </div>
            </div>
            {serverErr && <p className="rounded-lg bg-danger-soft p-3 text-sm font-semibold text-destructive">{serverErr}</p>}
            <Button type="submit" variant="hero" size="lg" className="w-full" disabled={busy}>
              {busy ? "Submitting…" : "Submit usage record"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
