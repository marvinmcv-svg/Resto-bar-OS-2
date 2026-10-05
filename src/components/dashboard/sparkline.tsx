/** 12-point trend line in the de-emphasis hue with the latest point accented (dataviz stat-tile spec). */
export function Sparkline({ values, className }: { values: number[]; className?: string }) {
  const w = 76;
  const h = 28;
  const max = Math.max(...values, 1);
  const pts = values.map((v, i) => [(i / Math.max(values.length - 1, 1)) * (w - 4) + 2, h - 3 - (v / max) * (h - 8)] as const);
  const line = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const last = [...pts].reverse().find((_, i) => values[values.length - 1 - i] > 0) ?? pts[pts.length - 1];
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h} className={className} aria-hidden>
      <path d={`${line} L${pts[pts.length - 1][0]},${h} L${pts[0][0]},${h} Z`} fill="var(--primary)" opacity={0.08} />
      <path d={line} fill="none" stroke="var(--primary)" strokeWidth={1.75} strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={last[0]} cy={last[1]} r={3} fill="var(--primary)" stroke="var(--card)" strokeWidth={1.5} />
    </svg>
  );
}
