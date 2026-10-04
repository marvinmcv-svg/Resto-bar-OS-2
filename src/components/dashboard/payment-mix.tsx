import { formatBs } from "@/modules/pos/money";

export interface MixSlice {
  key: string;
  label: string;
  valueMinor: number;
  color: string; // a --chart-N token, assigned in fixed order
}

/** Stacked 100% bar with a 2px surface gap between segments, plus a legend with direct values. */
export function PaymentMix({ slices }: { slices: MixSlice[] }) {
  const total = slices.reduce((s, x) => s + x.valueMinor, 0) || 1;
  const visible = slices.filter((s) => s.valueMinor > 0);
  return (
    <div>
      <div className="flex h-3.5 w-full gap-[2px] overflow-hidden rounded-[4px]" role="img" aria-label="Distribución de cobros por método">
        {visible.map((s) => (
          <div
            key={s.key}
            className="h-full first:rounded-l-[4px] last:rounded-r-[4px]"
            style={{ width: `${(s.valueMinor / total) * 100}%`, background: s.color }}
            title={`${s.label}: ${formatBs(s.valueMinor)}`}
          />
        ))}
      </div>
      <ul className="mt-4 space-y-2.5">
        {slices.map((s) => (
          <li key={s.key} className="flex items-center gap-2.5 text-[13px]">
            <span className="size-2.5 shrink-0 rounded-[3px]" style={{ background: s.color }} aria-hidden />
            <span className="flex-1 text-muted-foreground">{s.label}</span>
            <span className="font-medium tabular">{formatBs(s.valueMinor)}</span>
            <span className="w-10 text-right text-muted-foreground tabular">{Math.round((s.valueMinor / total) * 100)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
