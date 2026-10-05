// Pay estimate for the accountant export. Not payroll (ADR-012): no AFP, bonuses or aguinaldo.
import type { PayType, StaffProfile } from "./demo-hr";

export const PAY_LABEL: Record<PayType, string> = { monthly: "Mensual", hourly: "Por hora", per_shift: "Por turno" };

/** Hourly and per-shift staff only; monthly salaries return null (the accountant handles them). */
export function estimatedPayMinor(profile: StaffProfile | undefined, workedMin: number, shifts: number): number | null {
  if (!profile?.payType || profile.payRateMinor === undefined) return null;
  if (profile.payType === "hourly") return Math.round((profile.payRateMinor * workedMin) / 60);
  if (profile.payType === "per_shift") return profile.payRateMinor * shifts;
  return null;
}
