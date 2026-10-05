"use client";

import { useState } from "react";
import { formatBsShort } from "@/modules/pos/money";

export interface DonutSlice {
  key: string;
  label: string;
  valueMinor: number;
  color: string; // categorical slot, fixed order
}

const R = 70;
const STROKE = 18;
const C = 2 * Math.PI * R;
const GAP = 3; // px of surface between segments

/** Donut with the total in the center, a 2px surface gap, hover tooltip, and a legend with values. */
export function CategoryDonut({ slices, centerLabel }: { slices: DonutSlice[]; centerLabel: string }) {
  const [hover, setHover] = useState<string | null>(null);
  const total = slices.reduce((s, x) => s + x.valueMinor, 0) || 1;
  let offset = 0;
  const arcs = slices
    .filter((s) => s.valueMinor > 0)
    .map((s) => {
      const len = (s.valueMinor / total) * C;
      const arc = { ...s, dash: Math.max(len - GAP, 0.5), offset };
      offset += len;
      return arc;
    });
  const active = slices.find((s) => s.key === hover);

  return (
    <div className="flex flex-col items-center gap-5">
      <div className="relative size-[172px] shrink-0">
        <svg viewBox="0 0 172 172" className="size-full -rotate-90" role="img" aria-label="Ventas por categoría">
          <circle cx={86} cy={86} r={R} fill="none" stroke="var(--muted)" strokeWidth={STROKE} />
          {arcs.map((a) => (
            <circle
              key={a.key}
              cx={86}
              cy={86}
              r={R}
              fill="none"
              stroke={a.color}
              strokeWidth={hover === a.key ? STROKE + 4 : STROKE}
              strokeDasharray={`${a.dash} ${C - a.dash}`}
              strokeDashoffset={-a.offset}
              className="cursor-pointer transition-[stroke-width] duration-200"
              onPointerEnter={() => setHover(a.key)}
              onPointerLeave={() => setHover(null)}
            />
          ))}
        </svg>
        <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
          <div>
            <p className="text-[18px] leading-none font-semibold tracking-[-0.02em]">
              {active ? formatBsShort(active.valueMinor) : formatBsShort(total)}
            </p>
            <p className="mt-1 text-[12px] text-muted-foreground">{active ? active.label : centerLabel}</p>
          </div>
        </div>
      </div>
      <ul className="w-full min-w-0 space-y-2.5">
        {slices.filter((s) => s.valueMinor > 0).map((s) => (
          <li
            key={s.key}
            className="flex items-center gap-2.5 text-[13px]"
            onPointerEnter={() => setHover(s.key)}
            onPointerLeave={() => setHover(null)}
          >
            <span className="size-2.5 shrink-0 rounded-[3px]" style={{ background: s.color }} aria-hidden />
            <span className="min-w-0 flex-1 truncate">{s.label}</span>
            <span className="shrink-0 text-muted-foreground tabular">{formatBsShort(s.valueMinor)}</span>
            <span className="w-9 text-right font-semibold tabular">{Math.round((s.valueMinor / total) * 100)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
