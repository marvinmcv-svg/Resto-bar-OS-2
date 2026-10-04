"use client";

import { useMemo, useState } from "react";
import { formatBs, formatBsShort } from "@/modules/pos/money";
import { useElementWidth } from "./use-width";

export interface HourPoint {
  hour: number;
  totalMinor: number;
  orders: number;
}

const H = 232;
const PAD = { top: 28, right: 12, bottom: 28, left: 52 };

function niceMax(v: number) {
  const bs = v / 100;
  const step = bs > 4000 ? 1000 : bs > 1500 ? 500 : 250;
  return Math.max(step, Math.ceil(bs / step) * step) * 100;
}

/** Single-series area chart (dataviz spec: 2px line, 10% wash, hairline grid, crosshair tooltip). */
export function HourlySalesChart({ data }: { data: HourPoint[] }) {
  const [ref, width] = useElementWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);

  const geo = useMemo(() => {
    const w = Math.max(width, 280);
    const max = niceMax(Math.max(...data.map((d) => d.totalMinor), 1));
    const iw = w - PAD.left - PAD.right;
    const ih = H - PAD.top - PAD.bottom;
    const x = (i: number) => PAD.left + (data.length === 1 ? iw / 2 : (i / (data.length - 1)) * iw);
    const y = (v: number) => PAD.top + ih - (v / max) * ih;
    // Monotone-ish smoothing with a gentle cubic between points.
    const pts = data.map((d, i) => [x(i), y(d.totalMinor)] as const);
    let line = `M${pts[0][0]},${pts[0][1]}`;
    for (let i = 1; i < pts.length; i++) {
      const [x0, y0] = pts[i - 1];
      const [x1, y1] = pts[i];
      const cx = (x0 + x1) / 2;
      line += ` C${cx},${y0} ${cx},${y1} ${x1},${y1}`;
    }
    const area = `${line} L${pts[pts.length - 1][0]},${PAD.top + ih} L${pts[0][0]},${PAD.top + ih} Z`;
    const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => ({ v: max * f, y: y(max * f) }));
    const peak = data.reduce((best, d, i) => (d.totalMinor > data[best].totalMinor ? i : best), 0);
    return { w, x, y, line, area, ticks, peak, ih, pts };
  }, [data, width]);

  const active = hover ?? null;

  return (
    <div ref={ref} className="relative w-full select-none">
      {width > 0 && (
        <svg
          width={geo.w}
          height={H}
          role="img"
          aria-label="Ventas por hora de hoy"
          className="block touch-none overflow-visible"
          onPointerLeave={() => setHover(null)}
          onPointerMove={(e) => {
            const r = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
            const px = e.clientX - r.left;
            let best = 0;
            geo.pts.forEach(([x], i) => {
              if (Math.abs(x - px) < Math.abs(geo.pts[best][0] - px)) best = i;
            });
            setHover(best);
          }}
        >
          <defs>
            <linearGradient id="sales-wash" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.16" />
              <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.01" />
            </linearGradient>
          </defs>
          {geo.ticks.map((t, i) => (
            <g key={i}>
              <line x1={PAD.left} x2={geo.w - PAD.right} y1={t.y} y2={t.y} stroke="var(--chart-grid)" strokeWidth={1} />
              <text x={PAD.left - 10} y={t.y} dy="0.32em" textAnchor="end" className="fill-muted-foreground text-[11px] tabular">
                {formatBsShort(t.v).replace("Bs", "").trim()}
              </text>
            </g>
          ))}
          {data.map((d, i) =>
            i % 2 === 0 ? (
              <text key={d.hour} x={geo.x(i)} y={H - 8} textAnchor="middle" className="fill-muted-foreground text-[11px] tabular">
                {d.hour}h
              </text>
            ) : null,
          )}
          <path d={geo.area} fill="url(#sales-wash)" />
          <path d={geo.line} fill="none" stroke="var(--primary)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />

          {/* Selective direct label: the peak only */}
          {active === null && (
            <g>
              <circle cx={geo.pts[geo.peak][0]} cy={geo.pts[geo.peak][1]} r={4} fill="var(--primary)" stroke="var(--card)" strokeWidth={2} />
              <text
                x={geo.pts[geo.peak][0]}
                y={geo.pts[geo.peak][1] - 12}
                textAnchor="middle"
                className="fill-foreground text-[11px] font-semibold"
              >
                Pico {data[geo.peak].hour}:00
              </text>
            </g>
          )}

          {active !== null && (
            <g>
              <line
                x1={geo.pts[active][0]}
                x2={geo.pts[active][0]}
                y1={PAD.top}
                y2={PAD.top + geo.ih}
                stroke="var(--muted-foreground)"
                strokeOpacity={0.4}
                strokeWidth={1}
              />
              <circle cx={geo.pts[active][0]} cy={geo.pts[active][1]} r={5} fill="var(--primary)" stroke="var(--card)" strokeWidth={2} />
            </g>
          )}
        </svg>
      )}
      {active !== null && (
        <div
          className="pointer-events-none absolute top-0 z-10 min-w-36 -translate-x-1/2 rounded-xl border bg-popover px-3 py-2 text-xs shadow-float"
          style={{ left: Math.min(Math.max(geo.pts[active][0], 72), geo.w - 72) }}
          role="status"
        >
          <p className="text-muted-foreground">
            {data[active].hour}:00 – {data[active].hour + 1}:00
          </p>
          <p className="mt-0.5 text-sm font-semibold tabular">{formatBs(data[active].totalMinor)}</p>
          <p className="text-muted-foreground tabular">{data[active].orders} cuentas</p>
        </div>
      )}
    </div>
  );
}
