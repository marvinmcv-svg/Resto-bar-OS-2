import { cn } from "@/lib/utils";

/** Standard back-office page header: eyebrow, title, one-line description, actions on the right. */
export function PageHeader({
  eyebrow, title, description, actions, className,
}: {
  eyebrow?: React.ReactNode;
  title: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("animate-enter flex flex-wrap items-end justify-between gap-4", className)}>
      <div className="min-w-0">
        {eyebrow && <p className="text-[13px] font-medium text-muted-foreground">{eyebrow}</p>}
        <h1 className="mt-1 text-[28px] font-semibold sm:text-[34px]">{title}</h1>
        {description && <p className="mt-2 max-w-xl text-[15px] text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </header>
  );
}

export function PageBody({ children, wide = false }: { children: React.ReactNode; wide?: boolean }) {
  return <div className={cn("mx-auto px-4 py-6 sm:px-6 lg:px-10 lg:py-10", wide ? "max-w-[1240px]" : "max-w-[1080px]")}>{children}</div>;
}

/** Pill tabs used across back-office pages. */
export function PillTabs<T extends string>({ value, onChange, tabs, label }: { value: T; onChange: (v: T) => void; tabs: { id: T; label: string }[]; label: string }) {
  return (
    <div className="no-scrollbar -mx-4 max-w-[calc(100%+2rem)] overflow-x-auto px-4">
      <div className="inline-flex rounded-full bg-secondary p-1" role="tablist" aria-label={label}>
        {tabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={value === t.id}
            onClick={() => onChange(t.id)}
            className={cn("press h-9 rounded-full px-4 text-[13px] font-semibold whitespace-nowrap text-muted-foreground", value === t.id && "bg-card text-foreground shadow-card")}
          >
            {t.label}
          </button>
        ))}
      </div>
    </div>
  );
}
