import { describe, expect, it } from "vitest";
import { estimatedPayMinor } from "./pay";

describe("estimatedPayMinor", () => {
  it("pays hourly staff by minutes worked, in whole centavos", () => {
    expect(estimatedPayMinor({ payType: "hourly", payRateMinor: 1800 }, 390, 1)).toBe(11700);
    expect(estimatedPayMinor({ payType: "hourly", payRateMinor: 1850 }, 7, 1)).toBe(216);
  });
  it("pays per-shift staff by shifts", () => {
    expect(estimatedPayMinor({ payType: "per_shift", payRateMinor: 16000 }, 999, 3)).toBe(48000);
  });
  it("leaves monthly salaries and missing rates to the accountant", () => {
    expect(estimatedPayMinor({ payType: "monthly", payRateMinor: 330000 }, 600, 5)).toBeNull();
    expect(estimatedPayMinor({ payType: "hourly" }, 600, 5)).toBeNull();
    expect(estimatedPayMinor(undefined, 600, 5)).toBeNull();
  });
});
