import { cn } from "@/lib/utils";

/** Brand mark: a plate seen from above with an ember "live" dot. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "relative inline-grid size-9 place-items-center rounded-[11px] bg-primary text-primary-foreground shadow-[0_1px_0_rgb(255_255_255/0.25)_inset,0_2px_6px_rgb(207_74_10/0.35)]",
        className,
      )}
      aria-hidden
    >
      <svg viewBox="0 0 24 24" className="size-[60%]" fill="none">
        <circle cx="12" cy="12" r="8.25" stroke="currentColor" strokeWidth="2" />
        <circle cx="12" cy="12" r="3.25" fill="currentColor" />
      </svg>
    </span>
  );
}

export function Logo({ className, subtitle }: { className?: string; subtitle?: string }) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <LogoMark />
      <span className="flex flex-col leading-none">
        <span className="text-[15px] font-semibold tracking-[-0.01em]">RestoBar OS</span>
        {subtitle && <span className="mt-1 text-xs text-muted-foreground">{subtitle}</span>}
      </span>
    </span>
  );
}
