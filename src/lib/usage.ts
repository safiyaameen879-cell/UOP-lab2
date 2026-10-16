// Shared business rules for usage durations and reporting.

export type RecordStatus = "pending" | "verified" | "incomplete";

export interface DurationInput {
  status: RecordStatus;
  actual_start: string | null;
  actual_end: string | null;
}

/** Minutes between two "HH:MM[:SS]" strings, or null when invalid. */
export function minutesBetween(start: string | null, end: string | null): number | null {
  if (!start || !end) return null;
  const toMin = (t: string) => {
    const [h = 0, m = 0] = t.split(":").map(Number);
    return h * 60 + m;
  };
  const diff = toMin(end) - toMin(start);
  return diff > 0 ? diff : null;
}

/** Confirmed duration: only verified records with valid actual times count. Never uses expected times. */
export function verifiedMinutes(r: DurationInput): number {
  if (r.status !== "verified") return 0;
  return minutesBetween(r.actual_start, r.actual_end) ?? 0;
}

export function formatHours(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${String(m).padStart(2, "0")}m`;
}

export function hoursDecimal(minutes: number): string {
  return (minutes / 60).toFixed(2);
}

export function fmtTime(t: string | null | undefined): string {
  return t ? t.slice(0, 5) : "—";
}

export function sumBy<T>(rows: T[], key: (r: T) => string, val: (r: T) => number) {
  const m = new Map<string, number>();
  for (const r of rows) m.set(key(r), (m.get(key(r)) ?? 0) + val(r));
  return m;
}

export const ACTIVITY_TYPES = ["Lecture", "Practical", "Examination", "Workshop", "Training", "Other"];
