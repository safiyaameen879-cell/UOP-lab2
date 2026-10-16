import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Download, Printer, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, StatusBadge } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { RECORD_SELECT } from "@/lib/queries";
import { fmtTime, formatHours, minutesBetween } from "@/lib/usage";
import { recordPdf, type RecordForPdf } from "@/lib/pdf";

export const Route = createFileRoute("/_authenticated/records/$id")({
  head: () => ({
    meta: [
      { title: "Usage record — UOP IT Lab Monitoring" },
      { name: "description", content: "Usage record details and verification." },
      { property: "og:title", content: "Usage record" },
      { property: "og:description", content: "Laboratory usage record." },
    ],
  }),
  component: RecordDetail,
});

function RecordDetail() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["record", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("usage_records").select(RECORD_SELECT).eq("id", id).single();
      if (error) throw error;
      return data;
    },
  });
  const r = q.data;
  const [v, setV] = useState({ actual_start: "", actual_end: "", participants_actual: "", verification_note: "" });
  useEffect(() => {
    if (r) setV({ actual_start: fmtTime(r.actual_start).replace("—", ""), actual_end: fmtTime(r.actual_end).replace("—", ""), participants_actual: r.participants_actual?.toString() ?? "", verification_note: r.verification_note ?? "" });
  }, [r]);

  if (q.isLoading) return <p className="text-muted-foreground">Loading…</p>;
  if (!r) return <p>Record not found.</p>;

  const preview = minutesBetween(v.actual_start || null, v.actual_end || null);

  async function save(status: "verified" | "incomplete" | "pending") {
    if (status === "verified" && !preview) { toast.error("Enter valid actual start and end times (end after start) to verify."); return; }
    const { error } = await supabase.from("usage_records").update({
      actual_start: v.actual_start || null,
      actual_end: v.actual_end || null,
      participants_actual: v.participants_actual ? Number(v.participants_actual) : null,
      verification_note: v.verification_note || null,
      status,
    }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success(status === "verified" ? "Record verified" : "Record saved");
    qc.invalidateQueries({ queryKey: ["record", id] });
    qc.invalidateQueries({ queryKey: ["records"] });
  }

  const Row = ({ k, val }: { k: string; val: React.ReactNode }) => (
    <div className="grid grid-cols-3 gap-3 border-t py-2.5 text-sm first:border-t-0"><dt className="font-semibold text-muted-foreground">{k}</dt><dd className="col-span-2">{val}</dd></div>
  );

  return (
    <div>
      <Link to="/records" className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:underline"><ArrowLeft className="h-4 w-4" /> Records</Link>
      <PageHeader title={r.record_no} sub={`${r.labs?.name} · ${r.usage_date}`}>
        <Button variant="outline" onClick={() => recordPdf(r as unknown as RecordForPdf, "print")}><Printer /> Print</Button>
        <Button variant="hero" onClick={() => recordPdf(r as unknown as RecordForPdf, "download")}><Download /> Download PDF</Button>
      </PageHeader>
      <div className="grid gap-6 lg:grid-cols-5">
        <dl className="panel p-6 lg:col-span-3">
          <Row k="Status" val={<StatusBadge value={r.status} />} />
          <Row k="Laboratory" val={`${r.labs?.code} — ${r.labs?.name}`} />
          <Row k="Faculty" val={r.departments?.faculty} />
          <Row k="Department" val={r.departments?.name} />
          <Row k="Responsible" val={`${r.responsible_name}${r.responsible_designation ? `, ${r.responsible_designation}` : ""}`} />
          <Row k="Contact" val={[r.contact_email, r.contact_phone].filter(Boolean).join(" · ") || "—"} />
          <Row k="Activity" val={`${r.activity_type} — ${r.purpose}`} />
          <Row k="Expected time" val={<span className="text-muted-foreground">{fmtTime(r.expected_start)} – {fmtTime(r.expected_end)} (declared, not used for hours)</span>} />
          <Row k="Actual time" val={`${fmtTime(r.actual_start)} – ${fmtTime(r.actual_end)}`} />
          <Row k="Verified duration" val={<b>{r.status === "verified" && r.duration_minutes ? formatHours(r.duration_minutes) : "Not verified"}</b>} />
          <Row k="Participants" val={`Expected ${r.participants_expected ?? "—"} · Actual ${r.participants_actual ?? "—"}`} />
          <Row k="Notes" val={r.notes ?? "—"} />
          <Row k="Submitted" val={new Date(r.created_at).toLocaleString()} />
          {r.verified_at && <Row k="Verified at" val={new Date(r.verified_at).toLocaleString()} />}
        </dl>
        <div className="panel h-fit space-y-4 p-6 lg:col-span-2">
          <h2 className="text-lg font-semibold">Actual time verification</h2>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="field-label">Actual start</label><input type="time" className="field" value={v.actual_start} onChange={(e) => setV({ ...v, actual_start: e.target.value })} /></div>
            <div><label className="field-label">Actual end</label><input type="time" className="field" value={v.actual_end} onChange={(e) => setV({ ...v, actual_end: e.target.value })} /></div>
          </div>
          <div><label className="field-label">Actual participants</label><input type="number" min={0} className="field" value={v.participants_actual} onChange={(e) => setV({ ...v, participants_actual: e.target.value })} /></div>
          <div><label className="field-label">Verification note</label><textarea rows={2} className="field" value={v.verification_note} onChange={(e) => setV({ ...v, verification_note: e.target.value })} /></div>
          <div className="rounded-lg bg-butter p-3 text-sm">Duration: <b>{preview ? formatHours(preview) : "invalid / incomplete"}</b></div>
          <div className="flex flex-wrap gap-2">
            <Button variant="hero" onClick={() => save("verified")}>Verify</Button>
            <Button variant="outline" onClick={() => save("incomplete")}>Mark incomplete</Button>
            <Button variant="ghost" onClick={() => save("pending")}>Save as pending</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
