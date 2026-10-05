import { describe, expect, it } from "vitest";
import { splitTips } from "./tips";

const sum = (xs: { amountMinor: number }[]) => xs.reduce((s, x) => s + x.amountMinor, 0);

describe("splitTips", () => {
  it("splits equally and never loses a centavo", () => {
    const r = splitTips(1000, [{ staffId: "a", weight: 1 }, { staffId: "b", weight: 1 }, { staffId: "c", weight: 1 }]);
    expect(r.map((x) => x.amountMinor)).toEqual([334, 333, 333]);
    expect(sum(r)).toBe(1000);
  });

  it("splits by hours worked", () => {
    const r = splitTips(9000, [{ staffId: "a", weight: 360 }, { staffId: "b", weight: 180 }]);
    expect(r).toEqual([{ staffId: "a", amountMinor: 6000 }, { staffId: "b", amountMinor: 3000 }]);
  });

  it("always sums to the total for awkward numbers", () => {
    for (const total of [1, 7, 99, 81137, 123457]) {
      const r = splitTips(total, [{ staffId: "a", weight: 7 }, { staffId: "b", weight: 13 }, { staffId: "c", weight: 29 }]);
      expect(sum(r)).toBe(total);
      expect(r.every((x) => x.amountMinor >= 0)).toBe(true);
    }
  });

  it("falls back to equal when nobody has hours, and handles empty input", () => {
    expect(splitTips(100, [{ staffId: "a", weight: 0 }, { staffId: "b", weight: 0 }]).map((x) => x.amountMinor)).toEqual([50, 50]);
    expect(splitTips(100, [])).toEqual([]);
    expect(splitTips(0, [{ staffId: "a", weight: 1 }])).toEqual([{ staffId: "a", amountMinor: 0 }]);
  });
});
