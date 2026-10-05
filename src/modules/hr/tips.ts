// Tip pool split. Shares always add up to the total (largest-remainder method), in centavos.

export interface TipShareInput {
  staffId: string;
  /** Equal split: 1 each. By hours: minutes worked. */
  weight: number;
}

export interface TipShare {
  staffId: string;
  amountMinor: number;
}

export function splitTips(totalMinor: number, people: TipShareInput[]): TipShare[] {
  if (people.length === 0 || totalMinor <= 0) return people.map((p) => ({ staffId: p.staffId, amountMinor: 0 }));
  const weights = people.map((p) => Math.max(0, p.weight));
  const sum = weights.reduce((a, b) => a + b, 0);
  const w = sum > 0 ? weights : people.map(() => 1);
  const total = sum > 0 ? sum : people.length;

  const exact = w.map((x) => (totalMinor * x) / total);
  const base = exact.map((x) => Math.floor(x));
  let left = totalMinor - base.reduce((a, b) => a + b, 0);
  // Remaining centavos go to the largest fractions; ties keep list order (deterministic).
  const order = exact.map((x, i) => ({ i, frac: x - Math.floor(x) })).sort((a, b) => b.frac - a.frac || a.i - b.i);
  for (const { i } of order) {
    if (left <= 0) break;
    base[i] += 1;
    left -= 1;
  }
  return people.map((p, i) => ({ staffId: p.staffId, amountMinor: base[i] }));
}
