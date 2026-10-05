import { describe, expect, it } from "vitest";
import { cashDifference, countTotalMinor, expectedCashMinor, openShift, salesByMethod } from "./cash";
import type { CashMovement, CashShift, PaymentRecord } from "./types";

const shift: CashShift = { id: "s1", openedBy: "c", openedAt: 0, openingMinor: 50000 };
const pay = (method: PaymentRecord["method"], amountMinor: number, tipMinor = 0, shiftId = "s1"): PaymentRecord => ({
  id: crypto.randomUUID(), shiftId, orderId: "o", tableId: "m1", method, amountMinor, tipMinor, at: 1, by: "c",
});
const mov = (kind: "in" | "out", amountMinor: number): CashMovement => ({
  id: crypto.randomUUID(), shiftId: "s1", kind, amountMinor, reason: "otro", at: 1, by: "c",
});

describe("cash register", () => {
  it("counts bills and coins in centavos", () => {
    expect(countTotalMinor({ 20000: 2, 5000: 1, 50: 3, 10: 4 })).toBe(40000 + 5000 + 150 + 40);
    expect(countTotalMinor({ 10000: -1, 2000: 1.7 })).toBe(2000);
  });

  it("expects opening + cash sales + cash tips + money in − money out, for this shift only", () => {
    const payments = [pay("cash", 10000, 500), pay("qr", 20000, 1000), pay("cash", 4500), pay("cash", 9999, 0, "other")];
    const movements = [mov("in", 2000), mov("out", 12000)];
    expect(expectedCashMinor(shift, payments, movements)).toBe(50000 + 10000 + 500 + 4500 + 2000 - 12000);
  });

  it("totals sales per method", () => {
    const t = salesByMethod([pay("cash", 100, 10), pay("qr", 200), pay("qr", 300, 5)]);
    expect(t.qr).toEqual({ amountMinor: 500, tipMinor: 5, count: 2 });
    expect(t.card_external.count).toBe(0);
  });

  it("flags differences beyond Bs 10", () => {
    expect(cashDifference(1000, 1000)).toEqual({ diffMinor: 0, status: "ok", flagged: false });
    expect(cashDifference(9000, 10000)).toMatchObject({ diffMinor: -1000, status: "short", flagged: false });
    expect(cashDifference(8990, 10000)).toMatchObject({ status: "short", flagged: true });
    expect(cashDifference(11500, 10000)).toMatchObject({ status: "over", flagged: true });
  });

  it("finds the open shift", () => {
    expect(openShift([{ ...shift, closedAt: 5 }, { ...shift, id: "s2" }])?.id).toBe("s2");
    expect(openShift([{ ...shift, closedAt: 5 }])).toBeUndefined();
  });
});
