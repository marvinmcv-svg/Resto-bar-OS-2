import { AlarmClock, Circle, CircleDot, Receipt } from "lucide-react";
import { STATUS_LABEL, type TableStatus } from "@/modules/pos/table-status";
import { cn } from "@/lib/utils";

const STYLE: Record<TableStatus, { icon: typeof Circle; className: string }> = {
  free: { icon: Circle, className: "text-muted-foreground bg-muted" },
  occupied: { icon: CircleDot, className: "text-status-info bg-status-info/12" },
  bill: { icon: Receipt, className: "text-[#a86b00] bg-status-warning/18 dark:text-status-warning" },
  late: { icon: AlarmClock, className: "text-status-critical bg-status-critical/12" },
};

/** Status is never color alone: icon + label (dataviz status rule). */
export function StatusBadge({ status, className }: { status: TableStatus; className?: string }) {
  const { icon: Icon, className: tone } = STYLE[status];
  return (
    <span className={cn("inline-flex h-6 items-center gap-1.5 rounded-full px-2.5 text-xs font-medium", tone, className)}>
      <Icon className="size-3.5" aria-hidden />
      {STATUS_LABEL[status]}
    </span>
  );
}
