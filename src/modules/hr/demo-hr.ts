// Demo HR data for "La Casona": this week's schedule, clock-ins up to now, staff files.
// Deterministic so every device shows the same story.
import type { CashShift, PaymentMethod } from "../pos/types";
import { dateKey, shiftBounds, weekStartOf, type ScheduleShift, type TimeEntry } from "./time";

export type PayType = "monthly" | "hourly" | "per_shift";

export interface StaffProfile {
  nationalId?: string; // CI
  phone?: string;
  emergencyContact?: string;
  startedOn?: string; // YYYY-MM-DD
  payType?: PayType;
  payRateMinor?: number;
}

export interface TipSplit {
  id: string;
  shiftId: string;
  method: "equal" | "hours";
  includeKitchen: boolean;
  totalMinor: number;
  shares: { staffId: string; amountMinor: number; minutes: number; paidAt?: number }[];
  createdBy: string;
  at: number;
}

/** A closed register shift keeps a snapshot so reports don't need the old payments. */
export interface ClosedShiftSummary {
  salesMinor: number;
  tipsMinor: number;
  byMethod: Partial<Record<PaymentMethod, number>>;
  payments: number;
}

export type ClosedCashShift = CashShift & { summary?: ClosedShiftSummary };

const bs = (n: number) => Math.round(n * 100);

/** Weekly pattern per person: day index (0 = Monday) -> [start, end]. */
const PATTERN: Record<string, Record<number, [string, string]>> = {
  "s-daniela": { 1: ["16:00", "00:00"], 2: ["16:00", "00:00"], 3: ["16:00", "00:00"], 4: ["16:00", "00:00"], 5: ["16:00", "00:00"], 6: ["12:00", "20:00"] },
  "s-carla": { 0: ["11:00", "19:00"], 1: ["11:00", "19:00"], 2: ["11:00", "19:00"], 3: ["11:00", "19:00"], 4: ["11:00", "19:00"], 5: ["11:00", "19:00"] },
  "s-ana": { 0: ["11:00", "17:00"], 1: ["11:00", "17:00"], 2: ["11:00", "17:00"], 3: ["11:00", "17:00"], 4: ["11:00", "17:00"], 5: ["12:00", "18:00"] },
  "s-luis": { 0: ["17:00", "00:00"], 2: ["17:00", "00:00"], 3: ["17:00", "00:00"], 4: ["17:00", "01:00"], 5: ["17:00", "01:00"], 6: ["17:00", "00:00"] },
  "s-jorge": { 0: ["18:00", "00:00"], 1: ["18:00", "00:00"], 3: ["18:00", "02:00"], 4: ["18:00", "02:00"], 5: ["18:00", "02:00"], 6: ["18:00", "00:00"] },
  "s-rosa": { 0: ["10:00", "18:00"], 1: ["10:00", "18:00"], 2: ["10:00", "18:00"], 3: ["10:00", "18:00"], 4: ["10:00", "18:00"], 5: ["10:00", "18:00"] },
};

export const SHIFT_TEMPLATES: { label: string; start: string; end: string }[] = [
  { label: "Mañana", start: "10:00", end: "16:00" },
  { label: "Tarde", start: "11:00", end: "19:00" },
  { label: "Noche", start: "17:00", end: "00:00" },
  { label: "Barra noche", start: "18:00", end: "02:00" },
];

/** Last week and this week, same pattern. */
export function seedSchedule(today: Date): ScheduleShift[] {
  const monday = weekStartOf(today);
  const out: ScheduleShift[] = [];
  for (const week of [-1, 0]) {
    for (const [staffId, days] of Object.entries(PATTERN)) {
      for (const [day, [start, end]] of Object.entries(days)) {
        const d = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + week * 7 + Number(day));
        out.push({ id: `sch-${staffId}-${week}-${day}`, staffId, date: dateKey(d), start, end });
      }
    }
  }
  return out;
}

/** Arrival offset in minutes per person (negative = early). Ana runs late today; Luis doesn't show up. */
const ARRIVAL: Record<string, number[]> = {
  "s-daniela": [-6, -3, 2, -8, -1, 4, -5],
  "s-carla": [-7, -4, -5, -2, -9, -3, 0],
  "s-ana": [3, 18, -2, 6, 1, 0, 0],
  "s-luis": [-2, 0, 4, 12, -3, 2, -1],
  "s-jorge": [-4, 5, 0, -6, 2, -2, 1],
  "s-rosa": [-12, -9, -10, -8, -11, -7, -10],
};

export function seedTimeEntries(schedule: ScheduleShift[], now: number): TimeEntry[] {
  const today = dateKey(new Date(now));
  const out: TimeEntry[] = [];
  for (const s of schedule) {
    const [start, end] = shiftBounds(s);
    const dow = (new Date(start).getDay() + 6) % 7;
    let offset = ARRIVAL[s.staffId]?.[dow] ?? 0;
    if (s.date === today) {
      if (s.staffId === "s-luis") continue; // no-show today
      if (s.staffId === "s-ana") offset = 22; // late today
    }
    const inAt = start + offset * 60000;
    if (inAt > now) continue;
    const outAt = end + ((dow * 7) % 11) * 60000;
    out.push({ id: `te-${s.id}`, staffId: s.staffId, inAt, outAt: outAt <= now ? outAt : undefined });
  }
  return out;
}

export const PROFILES: Record<string, StaffProfile> = {
  "s-roberto": { nationalId: "4567123 SC", phone: "+591 70000001", startedOn: "2026-09-01", payType: "monthly" },
  "s-daniela": { nationalId: "6123456 SC", phone: "+591 71234567", emergencyContact: "Mamá · +591 72000011", startedOn: "2026-09-15", payType: "monthly", payRateMinor: bs(4500) },
  "s-carla": { nationalId: "7012345 SC", phone: "+591 72345678", startedOn: "2026-09-20", payType: "monthly", payRateMinor: bs(3300) },
  "s-ana": { nationalId: "8123450 SC", phone: "+591 73456789", emergencyContact: "Hermano · +591 74000022", startedOn: "2026-09-20", payType: "hourly", payRateMinor: bs(18) },
  "s-luis": { nationalId: "9234561 SC", phone: "+591 74567890", startedOn: "2026-09-22", payType: "hourly", payRateMinor: bs(18) },
  "s-jorge": { nationalId: "5345672 SC", phone: "+591 75678901", startedOn: "2026-09-18", payType: "per_shift", payRateMinor: bs(160) },
  "s-rosa": { nationalId: "4456783 SC", phone: "+591 76789012", startedOn: "2026-09-10", payType: "monthly", payRateMinor: bs(3800) },
};

/** Last night's closed register: Bs 15 short, flagged on the owner's dashboard. */
export function seedLastNightShift(today: Date): ClosedCashShift {
  const y = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
  const at = (h: number, m = 0) => new Date(y.getFullYear(), y.getMonth(), y.getDate(), h, m).getTime();
  const cashSales = bs(3840);
  const cashTips = bs(160);
  const expected = bs(500) + cashSales + cashTips - bs(150);
  return {
    id: "shift-yesterday",
    openedBy: "s-daniela",
    openedAt: at(11, 32),
    openingMinor: bs(500),
    closedAt: at(23, 48),
    closedBy: "s-daniela",
    expectedMinor: expected,
    countedMinor: expected - bs(15),
    summary: {
      salesMinor: bs(12960),
      tipsMinor: bs(742),
      byMethod: { qr: bs(6120), cash: cashSales, card_external: bs(1980), transfer: bs(1020) },
      payments: 54,
    },
  };
}
