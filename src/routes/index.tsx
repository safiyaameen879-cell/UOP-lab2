import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { QrCode, ShieldCheck, FileText, Wrench } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Brand } from "@/components/brand";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "UOP Computer Laboratory Usage Monitoring — Dept. of IT" },
      { name: "description", content: "Record, verify and report usage of the Department of IT computer laboratories, University of Peradeniya." },
      { property: "og:title", content: "UOP Computer Laboratory Usage Monitoring" },
      { property: "og:description", content: "QR-based lab usage recording, verification and monthly reports for the Department of IT." },
    ],
  }),
  component: Index,
});

function Index() {
  const { data: labs } = useQuery({
    queryKey: ["public-labs"],
    queryFn: async () => (await supabase.from("labs").select("code,name,location,status,qr_slug").order("code")).data ?? [],
  });
  return (
    <div className="min-h-screen bg-gradient-soft">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
        <Brand />
        <Button asChild variant="dark">
          <Link to="/login">Staff sign in</Link>
        </Button>
      </header>
      <main className="mx-auto max-w-6xl px-5 pb-20">
        <section className="py-14 md:py-20">
          <p className="mb-4 inline-flex rounded-full bg-butter px-3 py-1 text-xs font-bold uppercase tracking-widest text-gold-deep">
            Department of Information Technology
          </p>
          <h1 className="max-w-3xl text-4xl font-semibold leading-tight md:text-6xl">
            Computer Laboratory Usage <span className="text-gold-deep">Monitoring</span> &amp; Management
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-muted-foreground">
            Visiting departments record each session by scanning the QR code at the laboratory entrance. IT staff verify actual
            times, track equipment and prepare monthly reports for HOD signature.
          </p>
        </section>

        <section className="grid gap-5 md:grid-cols-3">
          {(labs ?? []).map((l) => (
            <div key={l.code} className="panel overflow-hidden">
              <div className="h-2 bg-gradient-gold" />
              <div className="p-6">
                <div className="text-xs font-bold tracking-widest text-gold-deep">{l.code}</div>
                <h2 className="mt-1 text-xl font-semibold">{l.name}</h2>
                <p className="text-sm text-muted-foreground">{l.location}</p>
                <Button asChild variant="hero" className="mt-5 w-full" disabled={l.status !== "active"}>
                  <Link to="/lab/$slug" params={{ slug: l.qr_slug }}>
                    <QrCode /> Open usage form
                  </Link>
                </Button>
              </div>
            </div>
          ))}
        </section>

        <section className="mt-14 grid gap-5 sm:grid-cols-3">
          {[
            [ShieldCheck, "Verified durations", "Only staff-confirmed actual times count toward hours."],
            [FileText, "Printable A4 PDFs", "Per-session records and monthly reports with HOD signature spaces."],
            [Wrench, "Equipment tracking", "Faults and maintenance logged per laboratory until resolved."],
          ].map(([Icon, t, d]) => {
            const I = Icon as typeof ShieldCheck;
            return (
              <div key={t as string} className="rounded-xl bg-card/60 p-5">
                <I className="h-6 w-6 text-gold-deep" />
                <h3 className="mt-3 font-semibold">{t as string}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{d as string}</p>
              </div>
            );
          })}
        </section>
      </main>
    </div>
  );
}
