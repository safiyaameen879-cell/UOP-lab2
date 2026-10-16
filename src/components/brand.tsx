import logo from "@/assets/uop-logo.png";
import { cn } from "@/lib/utils";

export function Brand({ light = false, compact = false }: { light?: boolean; compact?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <img src={logo} alt="University of Peradeniya logo" className={compact ? "h-10 w-10" : "h-12 w-12"} />
      <div className="leading-tight">
        <div className={cn("font-display text-base font-semibold", light ? "text-sidebar-accent-foreground" : "text-foreground")}>
          University of Peradeniya
        </div>
        <div className={cn("text-xs", light ? "text-sidebar-foreground/70" : "text-muted-foreground")}>
          Dept. of IT · Faculty of Arts
        </div>
      </div>
    </div>
  );
}

const statusStyles: Record<string, string> = {
  verified: "bg-success-soft text-success",
  resolved: "bg-success-soft text-success",
  active: "bg-success-soft text-success",
  pending: "bg-warning-soft text-warning",
  in_progress: "bg-warning-soft text-warning",
  maintenance: "bg-warning-soft text-warning",
  incomplete: "bg-danger-soft text-destructive",
  open: "bg-danger-soft text-destructive",
  closed: "bg-muted text-muted-foreground",
  critical: "bg-destructive text-destructive-foreground",
  high: "bg-danger-soft text-destructive",
  medium: "bg-warning-soft text-warning",
  low: "bg-muted text-muted-foreground",
};

export function StatusBadge({ value }: { value: string }) {
  return (
    <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold capitalize", statusStyles[value] ?? "bg-muted")}>
      {value.replace("_", " ")}
    </span>
  );
}

export function PageHeader({ title, sub, children }: { title: string; sub?: string; children?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-3xl font-semibold">{title}</h1>
        {sub && <p className="mt-1 text-sm text-muted-foreground">{sub}</p>}
      </div>
      {children && <div className="flex flex-wrap gap-2">{children}</div>}
    </div>
  );
}
