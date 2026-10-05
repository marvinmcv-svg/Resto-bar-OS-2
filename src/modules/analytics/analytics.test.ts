import { describe, expect, it } from "vitest";
import { changePct, menuEngineering, periodWithPrevious, staffRanking, totals, weekdayAverages } from "./analytics";

const day = (date: string, salesMinor: number, orders = 10) => ({ date, salesMinor, orders, tipsMinor: 100 });

describe("analytics", () => {
  it("totals a period and compares it with the one before", () => {
    const days = [day("2026-10-01", 1000), day("2026-10-02", 2000), day("2026-10-03", 3000), day("2026-10-04", 6000)];
    const { current, previous } = periodWithPrevious(days, 2);
    expect(totals(current)).toEqual({ salesMinor: 9000, orders: 20, tipsMinor: 200, avgTicketMinor: 450 });
    expect(changePct(totals(current).salesMinor, totals(previous).salesMinor)).toBe(200);
    expect(changePct(5, 0)).toBeNull();
    expect(totals([]).avgTicketMinor).toBe(0);
  });

  it("averages sales per weekday, Monday first", () => {
    const avg = weekdayAverages([day("2026-10-05", 1000), day("2026-10-12", 3000), day("2026-10-11", 500)]);
    expect(avg[0]).toBe(2000); // Mondays
    expect(avg[6]).toBe(500); // Sunday
  });

  it("classifies the menu into stars, plowhorses, puzzles and dogs", () => {
    const q = menuEngineering([
      { itemId: "star", qty: 50, revenueMinor: 0, unitMarginMinor: 6000 },
      { itemId: "horse", qty: 60, revenueMinor: 0, unitMarginMinor: 1500 },
      { itemId: "puzzle", qty: 5, revenueMinor: 0, unitMarginMinor: 7000 },
      { itemId: "dog", qty: 4, revenueMinor: 0, unitMarginMinor: 800 },
      { itemId: "unsold", qty: 0, revenueMinor: 0, unitMarginMinor: 9000 },
    ]);
    expect(Object.fromEntries(q)).toEqual({ star: "estrella", horse: "caballo", puzzle: "enigma", dog: "perro" });
  });

  it("ranks staff by sales", () => {
    const r = staffRanking([
      { waiterId: "ana", totalMinor: 1000, tipMinor: 100 },
      { waiterId: "luis", totalMinor: 3000, tipMinor: 0 },
      { waiterId: "ana", totalMinor: 3000, tipMinor: 50 },
    ]);
    expect(r[0]).toEqual({ staffId: "ana", orders: 2, salesMinor: 4000, tipsMinor: 150, avgTicketMinor: 2000 });
    expect(r[1].staffId).toBe("luis");
  });
});
