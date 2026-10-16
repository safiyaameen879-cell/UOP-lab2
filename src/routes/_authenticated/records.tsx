import { createFileRoute, Link, Outlet, useMatchRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { PageHeader, StatusBadge } from "@/components/brand";
import { fetchDepts, fetchLabs, fetchRecords, monthRange } from "@/lib/queries";
import { fmtTime, formatHours } from "@/lib/usage";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/records")({
  head: () => ({
    meta: [
      { title: "Usage records — UOP IT Lab Monitoring" },
      { name: "description", content: "Search and verify laboratory usage records." },
      { property: "og:title", content: "Usage records" },
      { property: "og:description", content: "Laboratory usage records." },
    ],
  }),
  component: RecordsPage,
});

function RecordsPage() {
  const match = useMatchRoute();
  if (match({ to: "/records/$id", fuzzy: true })) return <Outlet />;
  return <Records />;
}

function Records() {
  const [f, setF] = useState({ month: "", from: "", to: "", lab: "", dept: "", status: "", q: "" });
  const range = f.month ? monthRange(f.month) : { from: f.from, to: f.to };
  const filters = { ...f, ...range };
  const recs = useQuery({ queryKey: ["records", filters], queryFn: () => fetchRecords(filters) });
  const labs = useQuery({ queryKey: ["labs"], queryFn: fetchLabs });
  const depts = useQuery({ queryKey: ["depts"], queryFn: fetchDepts });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });

  return (
    <div>
      <PageHeader title="Usage records" sub={`${recs.data?.length ?? 0} records`} />
      <div className="panel mb-5 grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-7">
        <input className="field lg:col-span-2" placeholder="Search ID, person, purpose…" value={f.q} onChange={set("q")} />
        <input className="field" type="month" value={f.month} onChange={set("month")} title="Month" />
        <input className="field" type="date" value={f.from} onChange={set("from")} disabled={!!f.month} title="From" />
        <input className="field" type="date" value={f.to} onChange={set("to")} disabled={!!f.month} title="To" />
        <select className="field" value={f.lab} onChange={set("lab")}>
          <option value="">All labs</option>
          {labs.data?.map((l) => <option key={l.id} value={l.id}>{l.code}</option>)}
        </select>
        <select className="field" value={f.status} onChange={set("status")}>
          <option value="">Any status</option><option value="pending">Pending</option><option value="verified">Verified</option><option value="incomplete">Incomplete</option>
        </select>
        <select className="field lg:col-span-3" value={f.dept} onChange={set("dept")}>
          <option value="">All visiting departments</option>
          {depts.data?.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        <Button variant="outline" onClick={() => setF({ month: "", from: "", to: "", lab: "", dept: "", status: "", q: "" })}>Clear</Button>
      </div>
      <div className="panel overflow-x-auto">
        <table className="tbl">
          <thead><tr><th>Record</th><th>Date</th><th>Lab</th><th>Department</th><th>Responsible</th><th>Expected</th><th>Actual</th><th>Verified</th><th>Status</th></tr></thead>
          <tbody>
            {recs.isLoading && <tr><td colSpan={9} className="text-center text-muted-foreground">Loading…</td></tr>}
            {recs.data?.map((r) => (
              <tr key={r.id}>
                <td><Link to="/records/$id" params={{ id: r.id }} className="font-mono font-semibold text-gold-deep">{r.record_no}</Link></td>
                <td className="whitespace-nowrap">{r.usage_date}</td>
                <td>{r.labs?.code}</td>
                <td>{r.departments?.name}</td>
                <td>{r.responsible_name}</td>
                <td className="whitespace-nowrap text-muted-foreground">{fmtTime(r.expected_start)}–{fmtTime(r.expected_end)}</td>
                <td className="whitespace-nowrap">{fmtTime(r.actual_start)}–{fmtTime(r.actual_end)}</td>
                <td className="whitespace-nowrap font-semibold">{r.status === "verified" && r.duration_minutes ? formatHours(r.duration_minutes) : "—"}</td>
                <td><StatusBadge value={r.status} /></td>
              </tr>
            ))}
            {recs.data?.length === 0 && <tr><td colSpan={9} className="text-center text-muted-foreground">No records match these filters.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
