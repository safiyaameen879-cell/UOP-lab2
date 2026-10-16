import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, StatusBadge } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { fetchLabs } from "@/lib/queries";
import type { Database } from "@/integrations/supabase/types";

type Issue = Database["public"]["Tables"]["equipment_issues"]["Row"] & { labs: { code: string } | null };

export const Route = createFileRoute("/_authenticated/issues")({
  head: () => ({
    meta: [
      { title: "Equipment issues — UOP IT Lab Monitoring" },
      { name: "description", content: "Track equipment faults and maintenance in IT laboratories." },
      { property: "og:title", content: "Equipment issues" },
      { property: "og:description", content: "Lab equipment issue tracking." },
    ],
  }),
  component: Issues,
});

function Issues() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState("unresolved");
  const [adding, setAdding] = useState(false);
  const [edit, setEdit] = useState<Issue | null>(null);
  const labs = useQuery({ queryKey: ["labs"], queryFn: fetchLabs });
  const q = useQuery({
    queryKey: ["issues"],
    queryFn: async () => ((await supabase.from("equipment_issues").select("*, labs(code)").order("reported_on", { ascending: false })).data ?? []) as Issue[],
  });
  const rows = (q.data ?? []).filter((i) => (filter === "all" ? true : filter === "resolved" ? i.status === "resolved" : i.status !== "resolved"));

  async function add(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.currentTarget)) as any;
    if (!f.lab_id || f.description.trim().length < 3) { toast.error("Lab and description are required"); return; }
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from("equipment_issues").insert({
      lab_id: Number(f.lab_id), equipment_ref: f.equipment_ref || null, description: f.description.trim(),
      reported_on: f.reported_on, priority: f.priority as "medium", reported_by: u.user?.id ?? null,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Issue recorded");
    setAdding(false);
    qc.invalidateQueries({ queryKey: ["issues"] });
  }

  async function update(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!edit) return;
    const f = Object.fromEntries(new FormData(e.currentTarget)) as any;
    const status = f.status as Issue["status"];
    if (status === "resolved" && !f.resolution.trim()) { toast.error("Resolution details are required to resolve"); return; }
    const { error } = await supabase.from("equipment_issues").update({
      status, priority: f.priority as Issue["priority"], actions_taken: f.actions_taken || null, resolution: f.resolution || null,
      resolved_on: status === "resolved" ? edit.resolved_on ?? new Date().toISOString().slice(0, 10) : null,
    }).eq("id", edit.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Issue updated");
    setEdit(null);
    qc.invalidateQueries({ queryKey: ["issues"] });
  }

  return (
    <div>
      <PageHeader title="Equipment issues" sub="Faults, damage and maintenance across the three laboratories">
        <select className="field w-auto" value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="unresolved">Unresolved</option><option value="resolved">Resolved</option><option value="all">All</option>
        </select>
        <Button variant="hero" onClick={() => setAdding(!adding)}><Plus /> Report issue</Button>
      </PageHeader>

      {adding && (
        <form onSubmit={add} className="panel mb-5 grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-4">
          <select name="lab_id" className="field"><option value="">Laboratory *</option>{labs.data?.map((l) => <option key={l.id} value={l.id}>{l.code} — {l.name}</option>)}</select>
          <input name="equipment_ref" className="field" placeholder="Equipment ID (e.g. PC-L1-14)" />
          <input name="reported_on" type="date" className="field" defaultValue={new Date().toISOString().slice(0, 10)} />
          <select name="priority" className="field" defaultValue="medium"><option>low</option><option>medium</option><option>high</option><option>critical</option></select>
          <textarea name="description" className="field sm:col-span-2 lg:col-span-3" rows={2} placeholder="Description *" />
          <Button type="submit" variant="dark">Save issue</Button>
        </form>
      )}

      <div className="panel overflow-x-auto">
        <table className="tbl">
          <thead><tr><th>Reported</th><th>Lab</th><th>Equipment</th><th>Description</th><th>Priority</th><th>Status</th><th>Actions / resolution</th><th /></tr></thead>
          <tbody>
            {rows.map((i) => (
              <tr key={i.id}>
                <td className="whitespace-nowrap">{i.reported_on}</td><td>{i.labs?.code}</td><td>{i.equipment_ref ?? "—"}</td><td>{i.description}</td>
                <td><StatusBadge value={i.priority} /></td><td><StatusBadge value={i.status} /></td>
                <td className="text-xs text-muted-foreground">{i.actions_taken}{i.resolution && <div className="text-success">✓ {i.resolution} ({i.resolved_on})</div>}</td>
                <td><Button size="sm" variant="outline" onClick={() => setEdit(i)}>Update</Button></td>
              </tr>
            ))}
            {!rows.length && <tr><td colSpan={8} className="text-center text-muted-foreground">No issues.</td></tr>}
          </tbody>
        </table>
      </div>

      {edit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal/50 p-4" onClick={() => setEdit(null)}>
          <form onSubmit={update} onClick={(e) => e.stopPropagation()} className="panel w-full max-w-lg space-y-3 p-6">
            <h2 className="text-xl font-semibold">{edit.labs?.code} · {edit.equipment_ref ?? "Issue"}</h2>
            <p className="text-sm text-muted-foreground">{edit.description}</p>
            <div className="grid grid-cols-2 gap-3">
              <select name="status" className="field" defaultValue={edit.status}><option value="open">open</option><option value="in_progress">in progress</option><option value="resolved">resolved</option></select>
              <select name="priority" className="field" defaultValue={edit.priority}><option>low</option><option>medium</option><option>high</option><option>critical</option></select>
            </div>
            <textarea name="actions_taken" rows={2} className="field" placeholder="Actions taken" defaultValue={edit.actions_taken ?? ""} />
            <textarea name="resolution" rows={2} className="field" placeholder="Resolution details" defaultValue={edit.resolution ?? ""} />
            <div className="flex justify-end gap-2"><Button type="button" variant="ghost" onClick={() => setEdit(null)}>Cancel</Button><Button variant="hero" type="submit">Save</Button></div>
          </form>
        </div>
      )}
    </div>
  );
}
