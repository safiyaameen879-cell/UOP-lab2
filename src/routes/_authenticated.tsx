import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { LayoutDashboard, ClipboardList, Wrench, FileBarChart, Building2, Users, LogOut, Menu } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Brand } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  component: Layout,
});

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/records", label: "Usage records", icon: ClipboardList },
  { to: "/issues", label: "Equipment issues", icon: Wrench },
  { to: "/reports", label: "Monthly reports", icon: FileBarChart },
  { to: "/labs", label: "Laboratories", icon: Building2 },
  { to: "/staff", label: "Staff access", icon: Users, admin: true },
] as const;

function Layout() {
  const { session, loading, isStaff, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!loading && !session) navigate({ to: "/login" });
  }, [loading, session, navigate]);

  if (loading || !session) return <div className="p-10 text-center text-muted-foreground">Loading…</div>;
  if (!isStaff)
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
        <Brand />
        <h1 className="text-2xl font-semibold">Awaiting access</h1>
        <p className="max-w-md text-muted-foreground">
          Your account ({session.user.email}) has not been granted a staff role yet. Ask a Department of IT administrator.
        </p>
        <Button variant="outline" onClick={signOut}>Sign out</Button>
      </div>
    );

  const side = (
    <nav className="flex h-full flex-col gap-1 p-4">
      <div className="mb-6 px-2"><Brand light compact /></div>
      {nav.filter((n) => !("admin" in n) || isAdmin).map((n) => (
        <Link
          key={n.to}
          to={n.to}
          onClick={() => setOpen(false)}
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-sidebar-foreground transition hover:bg-sidebar-accent"
          activeProps={{ className: "bg-sidebar-primary !text-sidebar-primary-foreground hover:bg-sidebar-primary" }}
        >
          <n.icon className="h-4 w-4" /> {n.label}
        </Link>
      ))}
      <div className="mt-auto border-t border-sidebar-border pt-4">
        <div className="truncate px-3 text-xs text-sidebar-foreground/60">{session.user.email}</div>
        <div className="px-3 text-xs font-bold uppercase text-sidebar-primary">{isAdmin ? "Administrator" : "Lab staff"}</div>
        <button onClick={signOut} className="mt-3 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-foreground hover:bg-sidebar-accent">
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </div>
    </nav>
  );

  return (
    <div className="min-h-screen md:flex">
      <aside className="no-print hidden w-64 shrink-0 bg-sidebar md:block md:sticky md:top-0 md:h-screen">{side}</aside>
      <div className="no-print flex items-center justify-between bg-sidebar px-4 py-3 md:hidden">
        <Brand light compact />
        <button aria-label="Menu" onClick={() => setOpen(!open)} className="text-sidebar-foreground"><Menu /></button>
      </div>
      <div className={cn("no-print bg-sidebar md:hidden", open ? "block" : "hidden")}>{side}</div>
      <main className="min-w-0 flex-1 p-4 md:p-8"><Outlet /></main>
    </div>
  );
}
