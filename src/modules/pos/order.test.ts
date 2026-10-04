import { describe, expect, it } from "vitest";
import {
  balanceMinor, changeMinor, itemCount, lineTotalMinor, orderTotalMinor, selectedLinesMinor,
  splitEqually, tipForPercent, unsentLines,
} from "./order";
import type { Order, OrderLine } from "./types";

const line = (over: Partial<OrderLine> = {}): OrderLine => ({
  id: crypto.randomUUID(), itemId: "i", name: "Salteña", unitPriceMinor: 1200, qty: 2, modifiers: [], ...over,
});

const order = (lines: OrderLine[], paid = 0): Order => ({
  id: "o", tableId: "t", waiterId: "w", guests: 2, openedAt: 0, lines, status: "open",
  payments: paid ? [{ id: "p", method: "cash", amountMinor: paid, tipMinor: 0, at: 0, by: "c" }] : [],
});

describe("order math", () => {
  it("adds modifier prices per unit", () => {
    const l = line({ modifiers: [{ groupId: "g", optionId: "o", name: "Queso", priceMinor: 500 }] });
    expect(lineTotalMinor(l)).toBe((1200 + 500) * 2);
  });

  it("excludes voided lines from totals and counts", () => {
    const o = order([line(), line({ voided: { by: "m", reason: "error", at: 1 } })]);
    expect(orderTotalMinor(o)).toBe(2400);
    expect(itemCount(o)).toBe(2);
  });

  it("computes the remaining balance", () => {
    expect(balanceMinor(order([line()], 1000))).toBe(1400);
    expect(balanceMinor(order([line()], 9000))).toBe(0);
  });

  it("lists only unsent, non-voided lines", () => {
    const o = order([line({ sentAt: 1 }), line(), line({ voided: { by: "m", reason: "x", at: 1 } })]);
    expect(unsentLines(o)).toHaveLength(1);
  });

  it("sums selected lines for split by items", () => {
    const a = line({ id: "a" });
    const b = line({ id: "b", unitPriceMinor: 3000, qty: 1 });
    expect(selectedLinesMinor(order([a, b]), ["b"])).toBe(3000);
  });
});

describe("splitEqually", () => {
  it("gives the remainder to the last part and adds up exactly", () => {
    expect(splitEqually(10000, 3)).toEqual([3333, 3333, 3334]);
    expect(splitEqually(10000, 3).reduce((a, b) => a + b)).toBe(10000);
  });

  it("rejects invalid part counts", () => {
    expect(() => splitEqually(100, 0)).toThrow();
  });
});

describe("tips and change", () => {
  it("rounds percentage tips to whole bolivianos", () => {
    expect(tipForPercent(14550, 10)).toBe(1500);
  });

  it("never returns negative change", () => {
    expect(changeMinor(5000, 10000)).toBe(5000);
    expect(changeMinor(5000, 2000)).toBe(0);
  });
});
