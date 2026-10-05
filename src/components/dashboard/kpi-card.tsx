import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Sparkline } from "./sparkline";

export function KpiCard({
  icon: Icon, label, value, note, trend, tone = "neutral", series,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  note: string;
  trend?: "up" | "down";
  tone?: "neutral" | "good" | "bad";
  series: number[];
}) {
  return (
    <section className="animate-enter flex flex-col justify-between gap-4 rounded-[22px] border bg-card p-5 shadow-card">
      <div className="flex items-center gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-[12px] bg-ember-soft text-primary">
          <Icon className="size-5" aria-hidden />
        </span>
        <h2 className="min-w-0 flex-1 text-[13px] font-medium text-muted-foreground">{label}</h2>
      </div>
      <div>
        <div className="min-w-0">
          <div className="flex items-end justify-between gap-2">
            <p className="text-[28px] leading-none font-semibold tracking-[-0.025em] whitespace-nowrap">{value}</p>
            <Sparkline values={series} className="mb-0.5 shrink-0" />
          </div>
          <p
            className={cn(
              "mt-2 text-[12.5px] font-medium",
              tone === "good" && "text-[#0a7a0a] dark:text-status-good",
              tone === "bad" && "text-status-critical",
              tone === "neutral" && "text-muted-foreground",
            )}
          >
            {trend === "up" ? "↑ " : trend === "down" ? "↓ " : ""}
            {note}
          </p>
        </div>
      </div>
    </section>
  );
}
