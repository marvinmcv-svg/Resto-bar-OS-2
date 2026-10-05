"use client";

import { useEffect, useRef, useState } from "react";
import { Delete, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * 4-digit PIN pad. `onComplete` returns true when the PIN is accepted; otherwise the dots
 * shake and clear. Hardware keyboards work too (digits, Backspace).
 */
export function PinPad({
  hint, onComplete, resetKey, className,
}: {
  hint: React.ReactNode;
  onComplete: (pin: string) => boolean;
  resetKey?: unknown;
  className?: string;
}) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const busy = useRef(false);

  useEffect(() => {
    pinRef.current = "";
    setPin("");
    setError(false);
  }, [resetKey]);

  const pinRef = useRef("");
  const update = (next: string) => {
    pinRef.current = next;
    setPin(next);
  };

  const press = (d: string) => {
    if (busy.current || pinRef.current.length >= 4) return;
    const next = pinRef.current + d;
    setError(false);
    update(next);
    if (next.length < 4) return;
    busy.current = true;
    // Let the 4th dot fill before deciding.
    setTimeout(() => {
      if (!onComplete(next)) {
        setError(true);
        setTimeout(() => update(""), 350);
      }
      busy.current = false;
    }, 90);
  };
  const back = () => update(pinRef.current.slice(0, -1));

  const pressRef = useRef((d: string) => (d === "back" ? back() : press(d)));
  pressRef.current = (d: string) => (d === "back" ? back() : press(d));
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (/^\d$/.test(e.key)) pressRef.current(e.key);
      else if (e.key === "Backspace") pressRef.current("back");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className={className}>
      <div className={cn("flex justify-center gap-3.5", error && "animate-[shake_300ms]")} aria-live="assertive">
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className={cn(
              "size-3.5 rounded-full border-2 border-muted-foreground/50 transition-colors",
              i < pin.length && "border-primary bg-primary",
              error && "border-status-critical bg-status-critical",
            )}
          />
        ))}
      </div>
      <p className="mt-3 text-center text-[13px] text-muted-foreground">
        {error ? <span className="text-status-critical">PIN incorrecto</span> : hint}
      </p>
      <div className="mt-4 grid grid-cols-3 gap-2">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
          <Button key={d} variant="secondary" className="h-14 text-xl font-semibold" onClick={() => press(d)}>
            {d}
          </Button>
        ))}
        <span className="grid place-items-center text-muted-foreground">
          <ShieldCheck className="size-5" aria-hidden />
        </span>
        <Button variant="secondary" className="h-14 text-xl font-semibold" onClick={() => press("0")}>
          0
        </Button>
        <Button variant="ghost" className="h-14" aria-label="Borrar" onClick={back}>
          <Delete className="size-5" />
        </Button>
      </div>
    </div>
  );
}
