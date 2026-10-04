const bs = new Intl.NumberFormat("es-BO", { style: "currency", currency: "BOB" });
const bsCompact = new Intl.NumberFormat("es-BO", { style: "currency", currency: "BOB", maximumFractionDigits: 0 });

/** 4550 -> "Bs 45,50" */
export function formatBs(minor: number): string {
  return bs.format(minor / 100);
}

/** 455000 -> "Bs 4.550" (no decimals, for headlines and tiles) */
export function formatBsShort(minor: number): string {
  return bsCompact.format(Math.round(minor / 100));
}

export function toMinor(bolivianos: number): number {
  return Math.round(bolivianos * 100);
}
