// Inventory math. Quantities are integer thousandths of the unit ("milli": grams for kg, ml for l,
// thousandths for units) and money is integer centavos, so nothing is ever a float.

export type StockUnit = "kg" | "l" | "u";
export type IngredientCategory = "carnes" | "verduras" | "lacteos" | "abarrotes" | "bebidas" | "licores";

export interface Ingredient {
  id: string;
  name: string;
  category: IngredientCategory;
  unit: StockUnit;
  stockMilli: number;
  /** Reorder point: at or below this, the item is "bajo". */
  parMilli: number;
  /** Cost of one whole unit (1 kg, 1 l, 1 u), in centavos. */
  unitCostMinor: number;
  supplierId: string;
}

export interface Supplier {
  id: string;
  name: string;
  phone: string;
}

export interface RecipeLine {
  ingredientId: string;
  qtyMilli: number;
}

/** menu item id -> what one portion uses. */
export type Recipes = Record<string, RecipeLine[]>;

export type StockMovementKind = "receive" | "sale" | "waste" | "count";

/** Append-only stock ledger. A count stores the difference it found, so the ledger always sums to stock. */
export interface StockMovement {
  id: string;
  ingredientId: string;
  kind: StockMovementKind;
  deltaMilli: number;
  at: number;
  by: string;
  reason?: string;
  costMinor?: number; // purchases and waste: money involved
  orderId?: string;
}

export const CATEGORY_LABEL: Record<IngredientCategory, string> = {
  carnes: "Carnes",
  verduras: "Verduras y frutas",
  lacteos: "Lácteos y huevos",
  abarrotes: "Abarrotes",
  bebidas: "Bebidas",
  licores: "Licores",
};

export const UNIT_LABEL: Record<StockUnit, string> = { kg: "kg", l: "l", u: "u" };

/** Cost of `qtyMilli` of an ingredient, in centavos (rounded once). */
export function costOfMinor(ing: Pick<Ingredient, "unitCostMinor">, qtyMilli: number): number {
  return Math.round((ing.unitCostMinor * qtyMilli) / 1000);
}

export function stockValueMinor(ing: Ingredient): number {
  return costOfMinor(ing, Math.max(0, ing.stockMilli));
}

export function isLow(ing: Ingredient): boolean {
  return ing.stockMilli <= ing.parMilli;
}

/** Order up to twice the reorder point. */
export function suggestedOrderMilli(ing: Ingredient): number {
  return Math.max(0, ing.parMilli * 2 - ing.stockMilli);
}

export function recipeCostMinor(lines: RecipeLine[] | undefined, ingredients: Ingredient[]): number {
  if (!lines) return 0;
  const exact = lines.reduce((s, l) => {
    const ing = ingredients.find((i) => i.id === l.ingredientId);
    return s + (ing ? (ing.unitCostMinor * l.qtyMilli) / 1000 : 0);
  }, 0);
  return Math.round(exact);
}

/** Gross margin of a dish as a whole percent (price includes tax; good enough for a menu decision). */
export function marginPct(priceMinor: number, costMinor: number): number {
  if (priceMinor <= 0) return 0;
  return Math.round(((priceMinor - costMinor) / priceMinor) * 100);
}

/** Ingredients consumed by sold or fired lines. */
export function consumption(lines: { itemId: string; qty: number }[], recipes: Recipes): Map<string, number> {
  const out = new Map<string, number>();
  for (const l of lines) {
    for (const r of recipes[l.itemId] ?? []) out.set(r.ingredientId, (out.get(r.ingredientId) ?? 0) + r.qtyMilli * l.qty);
  }
  return out;
}

/** Portions you can still make of a dish with current stock (null when it has no recipe). */
export function portionsLeft(lines: RecipeLine[] | undefined, ingredients: Ingredient[]): number | null {
  if (!lines || lines.length === 0) return null;
  return Math.min(
    ...lines.map((l) => {
      const ing = ingredients.find((i) => i.id === l.ingredientId);
      return ing && l.qtyMilli > 0 ? Math.max(0, Math.floor(ing.stockMilli / l.qtyMilli)) : 0;
    }),
  );
}

export function wasteCostMinor(movements: StockMovement[], from = 0, to = Number.POSITIVE_INFINITY): number {
  return movements.filter((m) => m.kind === "waste" && m.at >= from && m.at < to).reduce((s, m) => s + (m.costMinor ?? 0), 0);
}

/** "0,6 kg", "250 g", "12 u". Small kg/l amounts read better in g/ml. */
export function formatQty(milli: number, unit: StockUnit): string {
  if (unit === "u") return `${(milli / 1000).toLocaleString("es-BO", { maximumFractionDigits: 1 })} u`;
  if (Math.abs(milli) < 1000) return `${milli.toLocaleString("es-BO")} ${unit === "kg" ? "g" : "ml"}`;
  return `${(milli / 1000).toLocaleString("es-BO", { maximumFractionDigits: 2 })} ${unit}`;
}

/** Parses "1,5" / "0.25" / "3" in the ingredient's unit into milli-units. null when invalid. */
export function parseQtyInput(text: string): number | null {
  const t = text.trim();
  if (!/^\d{1,5}([.,]\d{1,3})?$/.test(t)) return null;
  const [w, f = ""] = t.split(/[.,]/);
  return Number(w) * 1000 + Number(f.padEnd(3, "0"));
}
