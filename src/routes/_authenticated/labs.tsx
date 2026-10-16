import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import QRCode from "qrcode";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, StatusBadge } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { fetchLabs } from "@/lib/queries";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/labs")({
  head: () => ({
    meta: [
      { title: "Laboratories — UOP IT Lab Monitoring" },
      { name: "description", content: "Manage the three IT computer laboratories and their QR codes." },
      { property: "og:title", content: "Laboratories" },
      { property: "og:description", content: "IT laboratory management." },
    ],
  }),
  component: Labs,
});

function QR({ url }: { url: string }) {
  const [src, setSrc] = useState("");
  useEffect(() => { QRCode.toDataURL(url, { width: 220, margin: 1 }).then(setSrc); }, [url]);
  return src ? <img src={src} alt="QR code" className="h-36 w-36 rounded-lg border bg-card p-1" /> : null;
}

function Labs() {
  const qc = useQueryClient();
  const { isAdmin } = useAuth();
  const labs = useQuery({ queryKey: ["labs"], queryFn: fetchLabs });
  const origin = typeof window !== "undefined" ? window.location.origin : "";

  async function save(id: number, e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.currentTarget)) as any;
    if (f.name.trim().length < 3) { toast.error("Name is required"); return; }
    const { error } = await supabase.from("labs").update({
      name: f.name.trim(), location: f.location || null, capacity: Number(f.capacity) || 0, status: f.status as "active", updated_at: new Date().toISOString(),
    }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Laboratory updated");
    qc.invalidateQueries({ queryKey: ["labs"] });
  }

  return (
    <div>
      <PageHeader title="Laboratories" sub={isAdmin ? "Update details and print entrance QR codes" : "Only administrators can edit laboratory details"} />
      <div className="grid gap-5 xl:grid-cols-3">
        {labs.data?.map((l) => {
          const url = `${origin}/lab/${l.qr_slug}`;
          return (
            <form key={l.id} onSubmit={(e) => save(l.id, e)} className="panel space-y-3 p-5">
              <div className="flex items-start justify-between"><div><div className="text-xs font-bold tracking-widest text-gold-deep">{l.code}</div><StatusBadge value={l.status} /></div><QR url={url} /></div>
              <a href={url} target="_blank" rel="noreferrer" className="block break-all text-xs text-muted-foreground underline">{url}</a>
              <fieldset disabled={!isAdmin} className="space-y-3">
                <div><label className="field-label">Name</label><input name="name" className="field" defaultValue={l.name} /></div>
                <div><label className="field-label">Location</label><input name="location" className="field" defaultValue={l.location ?? ""} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="field-label">Capacity</label><input name="capacity" type="number" min={0} className="field" defaultValue={l.capacity} /></div>
                  <div><label className="field-label">Status</label><select name="status" className="field" defaultValue={l.status}><option>active</option><option>maintenance</option><option>closed</option></select></div>
                </div>
                {isAdmin && <Button variant="dark" type="submit" className="w-full">Save changes</Button>}
              </fieldset>
            </form>
          );
        })}
      </div>
    </div>
  );
}
