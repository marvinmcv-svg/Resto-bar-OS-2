// Analytics over closed sales: periods, menu engineering and staff ranking. Pure; centavos.

export interface DaySales {
  date: string; // YYYY-MM-DD
  salesMinor: number;
  orders: number;
  tipsMinor: number;
}

export interface PeriodTotals {
  salesMinor: number;
  orders: number;
  tipsMinor: number;
  avgTicketMinor: number;
}

export function totals(days: DaySales[]): PeriodTotals {
  const salesMinor = days.reduce((s, d) => s + d.salesMinor, 0);
  const orders = days.reduce((s, d) => s + d.orders, 0);
  return { salesMinor, orders, tipsMinor: days.reduce((s, d) => s + d.tipsMinor, 0), avgTicketMinor: orders ? Math.round(salesMinor / orders) : 0 };
}

/** The last n days (sorted ascending) and the n before them, for "vs período anterior". */
export function periodWithPrevious(days: DaySales[], n: number): { current: DaySales[]; previous: DaySales[] } {
  const sorted = [...days].sort((a, b) => a.date.localeCompare(b.date));
  return { current: sorted.slice(-n), previous: sorted.slice(-2 * n, -n) };
}

/** Whole-percent change; null when there's nothing to compare against. */
export function changePct(current: number, previous: number): number | null {
  if (previous <= 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}

/** Average sales per weekday (0 = Monday) over the given days. */
export function weekdayAverages(days: DaySales[]): number[] {
  const sum = Array(7).fill(0);
  const count = Array(7).fill(0);
  for (const d of days) {
    const [y, m, dd] = d.date.split("-").map(Number);
    const w = (new Date(y, m - 1, dd).getDay() + 6) % 7;
    sum[w] += d.salesMinor;
    count[w] += 1;
  }
  return sum.map((s, i) => (count[i] ? Math.round(s / count[i]) : 0));
}

export type Quadrant = "estrella" | "caballo" | "enigma" | "perro";

export const QUADRANT_LABEL: Record<Quadrant, { name: string; action: string }> = {
  estrella: { name: "Estrellas", action: "Se venden mucho y dejan buen margen. Cuídalas y destácalas." },
  caballo: { name: "Caballos de batalla", action: "Se venden mucho pero dejan poco. Sube el precio o baja el costo." },
  enigma: { name: "Enigmas", action: "Buen margen pero se venden poco. Recomiéndalos o cambia su lugar en la carta." },
  perro: { name: "Perros", action: "Poca venta y poco margen. Considera sacarlos del menú." },
};

export interface ItemPerformance {
  itemId: string;
  qty: number;
  revenueMinor: number;
  /** Contribution per portion: price − recipe cost. */
  unitMarginMinor: number;
}

/**
 * Classic menu engineering (Kasavana & Smith): popularity vs 70% of the fair share,
 * margin vs the menu's quantity-weighted average contribution.
 */
export function menuEngineering(items: ItemPerformance[]): Map<string, Quadrant> {
  const out = new Map<string, Quadrant>();
  const sold = items.filter((i) => i.qty > 0);
  if (sold.length === 0) return out;
  const totalQty = sold.reduce((s, i) => s + i.qty, 0);
  const popularAt = (totalQty / sold.length) * 0.7;
  const avgMargin = sold.reduce((s, i) => s + i.unitMarginMinor * i.qty, 0) / totalQty;
  for (const i of sold) {
    const popular = i.qty >= popularAt;
    const profitable = i.unitMarginMinor >= avgMargin;
    out.set(i.itemId, popular ? (profitable ? "estrella" : "caballo") : profitable ? "enigma" : "perro");
  }
  return out;
}

export interface StaffRow {
  staffId: string;
  orders: number;
  salesMinor: number;
  tipsMinor: number;
  avgTicketMinor: number;
}

export function staffRanking(orders: { waiterId: string; totalMinor: number; tipMinor: number }[]): StaffRow[] {
  const map = new Map<string, StaffRow>();
  for (const o of orders) {
    const r = map.get(o.waiterId) ?? { staffId: o.waiterId, orders: 0, salesMinor: 0, tipsMinor: 0, avgTicketMinor: 0 };
    r.orders += 1;
    r.salesMinor += o.totalMinor;
    r.tipsMinor += o.tipMinor;
    map.set(o.waiterId, r);
  }
  return [...map.values()]
    .map((r) => ({ ...r, avgTicketMinor: Math.round(r.salesMinor / r.orders) }))
    .sort((a, b) => b.salesMinor - a.salesMinor);
}
