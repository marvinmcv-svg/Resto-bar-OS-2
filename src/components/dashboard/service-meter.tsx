import { AlarmClock, Circle, CircleDot, Receipt } from "lucide-react";
import type { TableStatus } from "@/modules/pos/table-status";

const ROWS: { key: TableStatus; label: string; color: string; icon: typeof Circle }[] = [
  { key: "occupied", label: "Ocupadas", color: "var(--status-info)", icon: CircleDot },
  { key: "bill", label: "Piden cuenta", color: "var(--status-warning)", icon: Receipt },
  { key: "late", label: "+75 min", color: "var(--status-critical)", icon: AlarmClock },
  { key: "free", label: "Libres", color: "var(--muted)", icon: Circle },
];

/** Segmented meter of table states; status is always paired with icon + label. */
export function ServiceMeter({ counts }: { counts: Record<TableStatus, number> }) {
  const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1;
  return (
    <div>
      <div className="flex h-3 gap-[2px] overflow-hidden rounded-[4px]" role="img" aria-label="Estado de las mesas">
        {ROWS.filter((r) => counts[r.key] > 0).map((r) => (
          <div key={r.key} style={{ width: `${(counts[r.key] / total) * 100}%`, background: r.color }} />
        ))}
      </div>
      <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2">
        {ROWS.map(({ key, label, color, icon: Icon }) => (
          <li key={key} className="flex items-center gap-2 text-[12.5px]">
            <Icon className="size-3.5 shrink-0" style={{ color: key === "free" ? "var(--muted-foreground)" : color }} aria-hidden />
            <span className="min-w-0 flex-1 truncate text-muted-foreground">{label}</span>
            <span className="font-semibold tabular">{counts[key]}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
