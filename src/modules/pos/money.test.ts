import { describe, expect, it } from "vitest";
import { minorToInput, parseBsInput } from "./money";

describe("price input", () => {
  it("parses what people type into centavos, without floats", () => {
    expect(parseBsInput("85")).toBe(8500);
    expect(parseBsInput("12,50")).toBe(1250);
    expect(parseBsInput("12.5")).toBe(1250);
    expect(parseBsInput("Bs 0,10")).toBe(10);
    expect(parseBsInput(" 19,99 ")).toBe(1999);
  });

  it("rejects things that aren't prices", () => {
    for (const bad of ["", "abc", "12,505", "-3", "1.234,50", "12,"]) expect(parseBsInput(bad)).toBeNull();
  });

  it("round-trips the editable form", () => {
    for (const m of [8500, 1250, 1999, 10]) expect(parseBsInput(minorToInput(m))).toBe(m);
  });
});
