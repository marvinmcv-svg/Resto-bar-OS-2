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

/** Parses a price typed by a person ("85", "12,50", "12.5") into centavos. null when it isn't a price. */
export function parseBsInput(text: string): number | null {
  const t = text.trim().replace(/^bs\.?\s*/i, "");
  if (!/^\d{1,6}([.,]\d{1,2})?$/.test(t)) return null;
  const [whole, frac = ""] = t.split(/[.,]/);
  return Number(whole) * 100 + Number(frac.padEnd(2, "0"));
}

/** Centavos → the editable text form ("85" or "12,50"). */
export function minorToInput(minor: number): string {
  const whole = Math.floor(minor / 100);
  const cents = minor % 100;
  return cents ? `${whole},${String(cents).padStart(2, "0")}` : String(whole);
}
