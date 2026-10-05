"use client";

import { useState } from "react";
import { formatBs, formatBsShort } from "@/modules/pos/money";
import { cn } from "@/lib/utils";

export interface Bar {
  key: string;
  label: string; // axis label
  detail: string; // tooltip title
  valueMinor: number;
  highlight?: boolean;
}

/**
 * Single-series bar chart (no legend: the panel title names it). Thin rounded bars anchored to the
 * baseline, 2px gaps, recessive gridlines, hover tooltip, and an sr-only table for screen readers.
 */
export function BarSeries({ bars, label, height = 180, every = 1 }: { bars: Bar[]; label: string; height?: number; every?: number }) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(...bars.map((b) => b.valueMinor), 1);
  const nice = niceMax(max);
  const ticks = [0, 0.5, 1].map((f) => Math.round(nice * f));

  return (
    <figure className="relative" aria-label={label}>
      <div className="flex gap-2">
        <div className="flex flex-col justify-between text-right text-[11px] text-muted-foreground tabular" style={{ height }} aria-hidden>
          {[...ticks].reverse().map((t) => (
            <span key={t} className="-translate-y-1/2 first:translate-y-0 last:translate-y-0">
              {formatBsShort(t).replace("Bs ", "")}
            </span>
          ))}
        </div>
        <div className="relative flex-1">
          <div className="pointer-events-none absolute inset-0 flex flex-col justify-between" aria-hidden>
            {ticks.map((t) => (
              <span key={t} className="block border-t border-chart-grid" />
            ))}
          </div>
          <div className="relative flex items-end gap-[2px]" style={{ height }} onMouseLeave={() => setHover(null)}>
            {bars.map((b, i) => (
              <div
                key={b.key}
                className="group relative flex h-full flex-1 items-end"
                onMouseEnter={() => setHover(i)}
                onFocus={() => setHover(i)}
                onBlur={() => setHover(null)}
                tabIndex={0}
                aria-label={`${b.detail}: ${formatBs(b.valueMinor)}`}
              >
                <div
                  className={cn(
                    "w-full rounded-t-[4px] transition-opacity",
                    b.highlight ? "bg-primary" : "bg-primary/55",
                    hover !== null && hover !== i && "opacity-45",
                  )}
                  style={{ height: `${Math.max((b.valueMinor / nice) * 100, b.valueMinor ? 1.5 : 0)}%` }}
                />
              </div>
            ))}
          </div>
          {hover !== null && (
            <div
              className="pointer-events-none absolute -top-2 z-10 -translate-x-1/2 -translate-y-full rounded-xl border bg-popover px-3 py-2 text-[12px] whitespace-nowrap shadow-float"
              style={{ left: `${((hover + 0.5) / bars.length) * 100}%` }}
              role="status"
            >
              <p className="font-medium capitalize">{bars[hover].detail}</p>
              <p className="font-semibold tabular">{formatBs(bars[hover].valueMinor)}</p>
            </div>
          )}
          <div className="mt-2 flex gap-[2px] text-[10.5px] text-muted-foreground" aria-hidden>
            {bars.map((b, i) => (
              <span key={b.key} className={cn("flex-1 truncate text-center capitalize", b.highlight && "font-semibold text-primary")}>
                {i % every === 0 ? b.label : ""}
              </span>
            ))}
          </div>
        </div>
      </div>
      <table className="sr-only">
        <caption>{label}</caption>
        <tbody>
          {bars.map((b) => (
            <tr key={b.key}>
              <th scope="row">{b.detail}</th>
              <td>{formatBs(b.valueMinor)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}

function niceMax(v: number): number {
  const exp = Math.pow(10, Math.floor(Math.log10(v)));
  const n = v / exp;
  const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10;
  return step * exp;
}
