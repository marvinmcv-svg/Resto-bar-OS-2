// Attendance math: scheduled vs worked minutes, lateness, absences. Local time, pure and tested.

export interface ScheduleShift {
  id: string;
  staffId: string;
  date: string; // YYYY-MM-DD (local)
  start: string; // HH:MM
  end: string; // HH:MM; an end at or before the start means it ends the next day
}

export interface TimeEntry {
  id: string;
  staffId: string;
  inAt: number;
  outAt?: number;
  /** Manager corrections are recorded, never silent. */
  editedBy?: string;
}

export const LATE_TOLERANCE_MIN = 10;

export function dateKey(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function shiftBounds(s: Pick<ScheduleShift, "date" | "start" | "end">): [number, number] {
  const [y, m, d] = s.date.split("-").map(Number);
  const [sh, sm] = s.start.split(":").map(Number);
  const [eh, em] = s.end.split(":").map(Number);
  const start = new Date(y, m - 1, d, sh, sm).getTime();
  let end = new Date(y, m - 1, d, eh, em).getTime();
  if (end <= start) end += 24 * 3600_000;
  return [start, end];
}

export function scheduledMinutes(s: ScheduleShift): number {
  const [a, b] = shiftBounds(s);
  return Math.round((b - a) / 60000);
}

/** Minutes worked inside [from, to). Open entries count until `now`. */
export function minutesWorked(entries: TimeEntry[], staffId: string, from: number, to: number, now: number): number {
  let ms = 0;
  for (const e of entries) {
    if (e.staffId !== staffId) continue;
    const a = Math.max(e.inAt, from);
    const b = Math.min(e.outAt ?? now, to);
    if (b > a) ms += b - a;
  }
  return Math.round(ms / 60000);
}

export type ShiftAttendance =
  | { kind: "upcoming" }
  | { kind: "absent" }
  | { kind: "on-time"; inAt: number }
  | { kind: "late"; inAt: number; minutesLate: number };

/** Matches the first clock-in from 2 h before the start until the end of the shift. */
export function attendanceFor(s: ScheduleShift, entries: TimeEntry[], now: number, toleranceMin = LATE_TOLERANCE_MIN): ShiftAttendance {
  const [start, end] = shiftBounds(s);
  const entry = entries
    .filter((e) => e.staffId === s.staffId && e.inAt >= start - 2 * 3600_000 && e.inAt < end)
    .sort((a, b) => a.inAt - b.inAt)[0];
  if (!entry) return now < start + toleranceMin * 60000 ? { kind: "upcoming" } : { kind: "absent" };
  const late = Math.floor((entry.inAt - start) / 60000);
  return late > toleranceMin ? { kind: "late", inAt: entry.inAt, minutesLate: late } : { kind: "on-time", inAt: entry.inAt };
}

export interface WeekRow {
  staffId: string;
  scheduledMin: number;
  workedMin: number;
  shifts: number;
  /** Scheduled shifts the person actually clocked in for (on time or late). */
  attended: number;
  late: number;
  absent: number;
}

export function weekSummary(staffIds: string[], schedule: ScheduleShift[], entries: TimeEntry[], weekStart: Date, now: number): WeekRow[] {
  const from = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate()).getTime();
  const to = from + 7 * 24 * 3600_000;
  return staffIds.map((staffId) => {
    const mine = schedule.filter((s) => s.staffId === staffId && shiftBounds(s)[0] >= from && shiftBounds(s)[0] < to);
    const att = mine.map((s) => attendanceFor(s, entries, now));
    return {
      staffId,
      scheduledMin: mine.reduce((sum, s) => sum + scheduledMinutes(s), 0),
      workedMin: minutesWorked(entries, staffId, from, to, now),
      shifts: mine.length,
      attended: att.filter((a) => a.kind === "on-time" || a.kind === "late").length,
      late: att.filter((a) => a.kind === "late").length,
      absent: att.filter((a) => a.kind === "absent").length,
    };
  });
}

/** Monday 00:00 of the week containing `d`. */
export function weekStartOf(d: Date): Date {
  const day = (d.getDay() + 6) % 7;
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() - day);
}

export function formatHours(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}
