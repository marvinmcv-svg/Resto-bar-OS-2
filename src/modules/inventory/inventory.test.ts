import { describe, expect, it } from "vitest";
import {
  consumption, costOfMinor, formatQty, isLow, marginPct, parseQtyInput, portionsLeft, recipeCostMinor, stockValueMinor,
  suggestedOrderMilli, wasteCostMinor, type Ingredient,
} from "./inventory";

const beef: Ingredient = { id: "res", name: "Carne de res", category: "carnes", unit: "kg", stockMilli: 2500, parMilli: 3000, unitCostMinor: 6500, supplierId: "s" };
const potato: Ingredient = { id: "papa", name: "Papa", category: "verduras", unit: "kg", stockMilli: 10000, parMilli: 5000, unitCostMinor: 600, supplierId: "s" };

describe("inventory", () => {
  it("values stock in centavos without floats leaking", () => {
    expect(stockValueMinor(beef)).toBe(16250);
    expect(costOfMinor(beef, 180)).toBe(1170);
    expect(stockValueMinor({ ...beef, stockMilli: -100 })).toBe(0);
  });

  it("flags low stock and suggests ordering up to twice the reorder point", () => {
    expect(isLow(beef)).toBe(true);
    expect(isLow(potato)).toBe(false);
    expect(suggestedOrderMilli(beef)).toBe(3500);
    expect(suggestedOrderMilli(potato)).toBe(0);
  });

  it("costs a recipe and its margin", () => {
    const pique = [{ ingredientId: "res", qtyMilli: 200 }, { ingredientId: "papa", qtyMilli: 250 }];
    expect(recipeCostMinor(pique, [beef, potato])).toBe(1300 + 150);
    expect(marginPct(8500, 1450)).toBe(83);
    expect(marginPct(0, 10)).toBe(0);
    expect(recipeCostMinor(undefined, [beef])).toBe(0);
  });

  it("computes what an order consumes and how many portions are left", () => {
    const recipes = { pique: [{ ingredientId: "res", qtyMilli: 200 }, { ingredientId: "papa", qtyMilli: 250 }], papas: [{ ingredientId: "papa", qtyMilli: 300 }] };
    const used = consumption([{ itemId: "pique", qty: 2 }, { itemId: "papas", qty: 1 }, { itemId: "agua", qty: 3 }], recipes);
    expect(Object.fromEntries(used)).toEqual({ res: 400, papa: 800 });
    expect(portionsLeft(recipes.pique, [beef, potato])).toBe(12);
    expect(portionsLeft(undefined, [beef])).toBeNull();
  });

  it("sums waste cost in a window", () => {
    const m = (at: number, costMinor: number, kind: "waste" | "receive" = "waste") => ({ id: String(at), ingredientId: "res", kind, deltaMilli: -1, at, by: "x", costMinor });
    expect(wasteCostMinor([m(1, 100), m(5, 200), m(9, 999, "receive")], 0, 6)).toBe(300);
  });

  it("formats and parses quantities in the ingredient's unit", () => {
    expect(formatQty(600, "kg")).toBe("600 g");
    expect(formatQty(2500, "kg")).toBe("2,5 kg");
    expect(formatQty(12000, "u")).toBe("12 u");
    expect(parseQtyInput("1,5")).toBe(1500);
    expect(parseQtyInput("0.25")).toBe(250);
    expect(parseQtyInput("-2")).toBeNull();
    expect(parseQtyInput("abc")).toBeNull();
  });
});
