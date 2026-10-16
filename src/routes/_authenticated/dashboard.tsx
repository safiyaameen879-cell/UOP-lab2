import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Clock, ClipboardCheck, AlertTriangle, Wrench } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, StatusBadge } from "@/components/brand";
import { fetchRecords } from "@/lib/queries";
import { formatHours, hoursDecimal, sumBy, verifiedMinutes } from "@/lib/usage";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — UOP IT Lab Monitoring" },
      { name: "description", content: "Laboratory usage statistics and recent activity." },
      { property: "og:title", content: "Dashboard — UOP IT Lab Monitoring" },
      { property: "og:description", content: "Usage statistics for Department of IT laboratories." },
    ],
  }),
  component: Dashboard,
});

function Bars({ data }: { data: [string, number][] }) {
  const max = Math.max(1, ...data.map((d) => d[1]));
  return (
    <div className="space-y-3">
      {data.map(([k, v]) => (
        <div key={k}>
          <div className="mb-1 flex justify-between text-sm"><span className="truncate pr-2">{k}</span><span className="font-bold">{hoursDecimal(v)} h</span></div>
          <div className="h-2.5 rounded-full bg-muted"><div className="h-full rounded-full bg-gradient-gold" style={{ width: `${(v / max) * 100}%` }} /></div>
        </div>
      ))}
      {!data.length && <p className="text-sm text-muted-foreground">No data yet.</p>}
    </div>
  );
}

function Dashboard() {
  const recs = useQuery({ queryKey: ["records", "all"], queryFn: () => fetchRecords({}) });
  const issues = useQuery({
    queryKey: ["issues"],
    queryFn: async () => (await supabase.from("equipment_issues").select("*, labs(code)").order("reported_on", { ascending: false })).data ?? [],
  });
  const rows = recs.data ?? [];
  const verifiedMin = rows.reduce((a, r) => a + verifiedMinutes(r), 0);
  const pending = rows.filter((r) => r.status !== "verified").length;
  const openIssues = (issues.data ?? []).filter((i) => i.status !== "resolved").length;
  const byLab = [...sumBy(rows, (r) => `${r.labs?.code} · ${r.labs?.name}`, verifiedMinutes)].sort();
  const byDept = [...sumBy(rows, (r) => r.departments?.name ?? "—", verifiedMinutes)].sort((a, b) => b[1] - a[1]).slice(0, 6);
  const sessionsByLab = sumBy(rows, (r) => r.labs?.code ?? "", () => 1);

  const stats = [
    { label: "Total sessions", value: rows.length, icon: ClipboardCheck },
    { label: "Verified usage", value: formatHours(verifiedMin), icon: Clock },
    { label: "Pending verification", value: pending, icon: AlertTriangle },
    { label: "Open equipment issues", value: openIssues, icon: Wrench },
  ];

  return (
    <div>
      <PageHeader title="Dashboard" sub="Live figures from recorded laboratory usage" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s, i) => (
          <div key={s.label} className={i === 0 ? "rounded-xl bg-gradient-gold p-5 shadow-gold" : "panel p-5"}>
            <s.icon className="h-5 w-5 opacity-70" />
            <div className="mt-3 font-display text-3xl font-semibold">{recs.isLoading ? "…" : s.value}</div>
            <div className="text-sm font-semibold opacity-75">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="panel p-6">
          <h2 className="mb-1 text-lg font-semibold">Verified hours by laboratory</h2>
          <p className="mb-4 text-xs text-muted-foreground">
            Sessions: {[...sessionsByLab].map(([k, v]) => `${k} ${v}`).join(" · ") || "—"}
          </p>
          <Bars data={byLab} />
        </div>
        <div className="panel p-6">
          <h2 className="mb-4 text-lg font-semibold">Top visiting departments (verified hours)</h2>
          <Bars data={byDept} />
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="panel overflow-x-auto lg:col-span-2">
          <div className="flex items-center justify-between p-5"><h2 className="text-lg font-semibold">Recent activity</h2><Link to="/records" className="text-sm font-semibold text-gold-deep">View all →</Link></div>
          <table className="tbl">
            <thead><tr><th>Record</th><th>Date</th><th>Lab</th><th>Department</th><th>Status</th></tr></thead>
            <tbody>
              {rows.slice(0, 8).map((r) => (
                <tr key={r.id}>
                  <td><Link to="/records/$id" params={{ id: r.id }} className="font-mono font-semibold text-gold-deep">{r.record_no}</Link></td>
                  <td>{r.usage_date}</td><td>{r.labs?.code}</td><td>{r.departments?.name}</td><td><StatusBadge value={r.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="panel p-5">
          <h2 className="mb-4 text-lg font-semibold">Latest equipment issues</h2>
          <ul className="space-y-3">
            {(issues.data ?? []).slice(0, 5).map((i) => (
              <li key={i.id} className="rounded-lg border p-3">
                <div className="flex justify-between gap-2"><span className="text-xs font-bold">{i.labs?.code} · {i.equipment_ref ?? "—"}</span><StatusBadge value={i.priority} /></div>
                <p className="mt-1 text-sm">{i.description}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
