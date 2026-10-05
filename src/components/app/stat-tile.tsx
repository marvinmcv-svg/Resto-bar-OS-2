import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/** Hero number tile: icon chip, label, value, one line of context. Status tones carry an icon, never color alone. */
export function StatTile({
  icon: Icon, label, value, note, tone,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  note?: React.ReactNode;
  tone?: "good" | "warn" | "bad";
}) {
  return (
    <section className="animate-enter rounded-[22px] border bg-card p-4 shadow-card sm:p-5">
      <div className="flex items-center gap-2.5 sm:gap-3">
        <span
          className={cn(
            "grid size-9 shrink-0 place-items-center rounded-[11px] bg-ember-soft text-primary sm:size-10 sm:rounded-[12px]",
            tone === "good" && "bg-status-good/14 text-status-good-ink",
            tone === "warn" && "bg-status-warning/18 text-status-warning-ink",
            tone === "bad" && "bg-status-critical/12 text-status-critical",
          )}
        >
          <Icon className="size-[18px] sm:size-5" aria-hidden />
        </span>
        <h2 className="text-[12.5px] leading-tight font-medium text-muted-foreground sm:text-[13px]">{label}</h2>
      </div>
      <p className="mt-3 text-[22px] leading-none font-semibold tracking-[-0.025em] tabular sm:mt-4 sm:text-[28px]">{value}</p>
      {note && <p className="mt-2 truncate text-[12.5px] text-muted-foreground">{note}</p>}
    </section>
  );
}
