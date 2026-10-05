"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";

const control =
  "w-full min-w-0 rounded-xl border border-input bg-card px-3.5 text-[15px] outline-none transition-[border-color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40 aria-invalid:border-destructive dark:bg-input/30";

/** Label + control + hint/error, wired with ids for screen readers. */
export function Field({
  label, hint, error, children, className,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: (props: { id: string; "aria-describedby"?: string; "aria-invalid"?: boolean }) => React.ReactNode;
  className?: string;
}) {
  const id = useId();
  const msgId = `${id}-msg`;
  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={id} className="block text-[13px] font-semibold">
        {label}
      </label>
      {children({ id, "aria-describedby": hint || error ? msgId : undefined, "aria-invalid": error ? true : undefined })}
      {(error || hint) && (
        <p id={msgId} className={cn("text-[12px]", error ? "text-status-critical" : "text-muted-foreground")}>
          {error ?? hint}
        </p>
      )}
    </div>
  );
}

export function TextInput({ className, ...props }: React.ComponentProps<"input">) {
  return <input className={cn(control, "h-11", className)} {...props} />;
}

export function TextArea({ className, ...props }: React.ComponentProps<"textarea">) {
  return <textarea className={cn(control, "min-h-20 resize-none py-2.5", className)} {...props} />;
}

/** Single choice as a row of chips (radio semantics). */
export function ChipSelect<T extends string>({
  value, onChange, options, label, className,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: React.ReactNode; ariaLabel?: string }[];
  label: string;
  className?: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className={cn("flex flex-wrap gap-2", className)}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          aria-label={o.ariaLabel}
          onClick={() => onChange(o.value)}
          className={cn(
            "press flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-[13px] font-medium",
            value === o.value ? "border-primary bg-primary/12 text-foreground" : "bg-secondary text-muted-foreground hover:text-foreground",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
