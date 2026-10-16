import { supabase } from "@/integrations/supabase/client";

export const RECORD_SELECT = "*, labs(code,name,location), departments(name,faculty)";

export async function fetchRecords(f: { from?: string; to?: string; lab?: string; dept?: string; status?: string; q?: string }) {
  let q = supabase.from("usage_records").select(RECORD_SELECT).order("usage_date", { ascending: false }).order("created_at", { ascending: false });
  if (f.from) q = q.gte("usage_date", f.from);
  if (f.to) q = q.lte("usage_date", f.to);
  if (f.lab) q = q.eq("lab_id", Number(f.lab));
  if (f.dept) q = q.eq("department_id", Number(f.dept));
  if (f.status) q = q.eq("status", f.status as "pending");
  if (f.q) {
    const s = f.q.replace(/[%,()]/g, "");
    q = q.or(`record_no.ilike.%${s}%,responsible_name.ilike.%${s}%,purpose.ilike.%${s}%`);
  }
  const { data, error } = await q.limit(1000);
  if (error) throw error;
  return data;
}

export const fetchLabs = async () => (await supabase.from("labs").select("*").order("code")).data ?? [];
export const fetchDepts = async () => (await supabase.from("departments").select("*").order("name")).data ?? [];

export function monthRange(ym: string) {
  const [y = 2000, m = 1] = ym.split("-").map(Number);
  const last = new Date(y, m, 0).getDate();
  return { from: `${ym}-01`, to: `${ym}-${String(last).padStart(2, "0")}` };
}
