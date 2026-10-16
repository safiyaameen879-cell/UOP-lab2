import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Download, Printer } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, StatusBadge } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { fetchLabs, fetchRecords, monthRange } from "@/lib/queries";
import { fmtTime, hoursDecimal, verifiedMinutes } from "@/lib/usage";
import { monthlyPdf, type MonthlyData, type RecordForPdf } from "@/lib/pdf";

export const Route = createFileRoute("/_authenticated/reports")({
  head: () => ({
    meta: [
      { title: "Monthly reports — UOP IT Lab Monitoring" },
      { name: "description", content: "Consolidated monthly laboratory usage reports for HOD signature." },
      { property: "og:title", content: "Monthly reports" },
      { property: "og:description", content: "Monthly lab usage reports." },
    ],
  }),
  component: Reports,
});

function Reports() {
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const range = monthRange(month);
  const recs = useQuery({ queryKey: ["records", "month", month], queryFn: () => fetchRecords(range) });
  const labs = useQuery({ queryKey: ["labs"], queryFn: fetchLabs });
  const issues = useQuery({
    queryKey: ["issues", month],
    queryFn: async () =>
      (await supabase.from("equipment_issues").select("*, labs(code)").gte("reported_on", range.from).lte("reported_on", range.to).order("reported_on")).data ?? [],
  });
  const rows = (recs.data ?? []).map((r) => ({ ...r, verified_min: verifiedMinutes(r) })).sort((a, b) => a.usage_date.localeCompare(b.usage_date));
  const byLab: [string, number, number][] = (labs.data ?? []).map((l) => {
    const rs = rows.filter((r) => r.lab_id === l.id);
    return [`${l.code} — ${l.name}`, rs.length, rs.reduce((a, r) => a + r.verified_min, 0)];
  });
  const dm = new Map<string, [number, number]>();
  rows.forEach((r) => {
    const k = r.departments?.name ?? "—";
    const c = dm.get(k) ?? [0, 0];
    dm.set(k, [c[0] + 1, c[1] + r.verified_min]);
  });
  const byDept: [string, number, number][] = [...dm].map(([k, [s, m]]) => [k, s, m] as [string, number, number]).sort((a, b) => b[2] - a[2]);
  const totalMin = rows.reduce((a, r) => a + r.verified_min, 0);
  const unverified = rows.filter((r) => r.status !== "verified").length;
  const label = new Date(month + "-01").toLocaleString("en-GB", { month: "long", year: "numeric" });

  const data: MonthlyData = {
    monthLabel: label,
    rows: rows as unknown as MonthlyData["rows"],
    byLab,
    byDept,
    totalMin,
    unverified,
    issues: (issues.data ?? []).map((i) => ({ lab: i.labs?.code ?? "", equipment_ref: i.equipment_ref, description: i.description, priority: i.priority, status: i.status, reported_on: i.reported_on })),
  };
  void ({} as RecordForPdf);

  return (
    <div>
      <PageHeader title="Monthly usage report" sub="All three laboratories, consolidated for HOD review">
        <input type="month" className="field w-auto" value={month} onChange={(e) => setMonth(e.target.value)} />
        <Button variant="outline" disabled={recs.isLoading} onClick={() => monthlyPdf(data, "print")}><Printer /> Print</Button>
        <Button variant="hero" disabled={recs.isLoading} onClick={() => monthlyPdf(data, "download")}><Download /> Export PDF</Button>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl bg-gradient-gold p-5 shadow-gold"><div className="font-display text-3xl font-semibold">{rows.length}</div><div className="text-sm font-semibold opacity-75">Sessions in {label}</div></div>
        <div className="panel p-5"><div className="font-display text-3xl font-semibold">{hoursDecimal(totalMin)} h</div><div className="text-sm font-semibold text-muted-foreground">Verified hours</div></div>
        <div className={unverified ? "rounded-xl bg-danger-soft p-5" : "panel p-5"}><div className="font-display text-3xl font-semibold">{unverified}</div><div className="text-sm font-semibold text-muted-foreground">Unverified / incomplete — excluded from hours</div></div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {[["Laboratory", byLab], ["Visiting department", byDept]].map(([t, list]) => (
          <div key={t as string} className="panel overflow-x-auto">
            <table className="tbl"><thead><tr><th>{t as string}</th><th>Sessions</th><th>Verified hours</th></tr></thead>
              <tbody>{(list as [string, number, number][]).map(([k, s, m]) => <tr key={k}><td>{k}</td><td>{s}</td><td className="font-semibold">{hoursDecimal(m)}</td></tr>)}</tbody>
            </table>
          </div>
        ))}
      </div>

      <div className="panel mt-6 overflow-x-auto">
        <table className="tbl">
          <thead><tr><th>Record</th><th>Date</th><th>Lab</th><th>Department</th><th>Responsible</th><th>Actual</th><th>Hours</th><th>Pax</th><th>Status</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="font-mono">{r.record_no}</td><td>{r.usage_date}</td><td>{r.labs?.code}</td><td>{r.departments?.name}</td><td>{r.responsible_name}</td>
                <td>{r.status === "verified" ? `${fmtTime(r.actual_start)}–${fmtTime(r.actual_end)}` : <span className="font-bold text-destructive">Missing</span>}</td>
                <td>{r.status === "verified" ? hoursDecimal(r.verified_min) : "—"}</td><td>{r.participants_actual ?? "—"}</td><td><StatusBadge value={r.status} /></td>
              </tr>
            ))}
            {!rows.length && <tr><td colSpan={9} className="text-center text-muted-foreground">No usage recorded this month.</td></tr>}
          </tbody>
        </table>
      </div>

      <div className="panel mt-6 p-5">
        <h2 className="mb-3 text-lg font-semibold">Equipment issues reported this month</h2>
        {data.issues.length ? (
          <ul className="space-y-2 text-sm">{data.issues.map((i, n) => <li key={n} className="flex flex-wrap gap-2"><b>{i.lab}</b> {i.equipment_ref} — {i.description} <StatusBadge value={i.status} /></li>)}</ul>
        ) : <p className="text-sm text-muted-foreground">None.</p>}
      </div>
    </div>
  );
}
