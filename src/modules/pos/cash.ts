// Cash register math. Pure and tested; all amounts are integer centavos.
import type { CashCount, CashMovement, CashShift, PaymentMethod, PaymentRecord } from "./types";

/** Bolivian bills and coins, largest first, in centavos. */
export const DENOMINATIONS = [20000, 10000, 5000, 2000, 1000, 500, 200, 100, 50, 20, 10] as const;

/** Over/short beyond this is flagged to the owner. */
export const DIFFERENCE_TOLERANCE_MINOR = 1000;

export function countTotalMinor(count: CashCount): number {
  return Object.entries(count).reduce((s, [denom, n]) => s + Number(denom) * Math.max(0, Math.floor(n || 0)), 0);
}

export function shiftPayments(payments: PaymentRecord[], shiftId: string): PaymentRecord[] {
  return payments.filter((p) => p.shiftId === shiftId);
}

export function shiftMovements(movements: CashMovement[], shiftId: string): CashMovement[] {
  return movements.filter((m) => m.shiftId === shiftId);
}

export type MethodTotals = Record<PaymentMethod, { amountMinor: number; tipMinor: number; count: number }>;

export function salesByMethod(payments: PaymentRecord[]): MethodTotals {
  const out: MethodTotals = {
    cash: { amountMinor: 0, tipMinor: 0, count: 0 },
    qr: { amountMinor: 0, tipMinor: 0, count: 0 },
    card_external: { amountMinor: 0, tipMinor: 0, count: 0 },
    transfer: { amountMinor: 0, tipMinor: 0, count: 0 },
  };
  for (const p of payments) {
    out[p.method].amountMinor += p.amountMinor;
    out[p.method].tipMinor += p.tipMinor;
    out[p.method].count += 1;
  }
  return out;
}

export function movementsNetMinor(movements: CashMovement[]): { inMinor: number; outMinor: number } {
  let inMinor = 0;
  let outMinor = 0;
  for (const m of movements) {
    if (m.kind === "in") inMinor += m.amountMinor;
    else outMinor += m.amountMinor;
  }
  return { inMinor, outMinor };
}

/** What should be in the drawer: opening + cash sales + cash tips + money in − money out. */
export function expectedCashMinor(shift: CashShift, payments: PaymentRecord[], movements: CashMovement[]): number {
  const cash = salesByMethod(shiftPayments(payments, shift.id)).cash;
  const { inMinor, outMinor } = movementsNetMinor(shiftMovements(movements, shift.id));
  return shift.openingMinor + cash.amountMinor + cash.tipMinor + inMinor - outMinor;
}

export interface CashDifference {
  diffMinor: number; // counted − expected
  status: "ok" | "over" | "short";
  flagged: boolean;
}

export function cashDifference(countedMinor: number, expectedMinor: number): CashDifference {
  const diffMinor = countedMinor - expectedMinor;
  return {
    diffMinor,
    status: diffMinor === 0 ? "ok" : diffMinor > 0 ? "over" : "short",
    flagged: Math.abs(diffMinor) > DIFFERENCE_TOLERANCE_MINOR,
  };
}

export function openShift(shifts: CashShift[]): CashShift | undefined {
  return shifts.find((s) => !s.closedAt);
}
