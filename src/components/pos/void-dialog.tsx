"use client";

import { useEffect, useState } from "react";
import { Delete, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatBs } from "@/modules/pos/money";
import { lineTotalMinor } from "@/modules/pos/order";
import type { OrderLine } from "@/modules/pos/types";
import { cn } from "@/lib/utils";

const REASONS = ["Error de mesa", "Cliente cambió de opinión", "Producto con problema", "Demora en cocina"];

/** Voiding a sent item needs a manager PIN and a reason. Both land in the owner's report. */
export function VoidDialog({
  line, onClose, verify, onConfirm,
}: {
  line: OrderLine | null;
  onClose: () => void;
  verify: (pin: string) => string | null;
  onConfirm: (approvedBy: string, reason: string) => void;
}) {
  const [reason, setReason] = useState(REASONS[0]);
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);

  useEffect(() => {
    setPin("");
    setError(false);
    setReason(REASONS[0]);
  }, [line]);

  if (!line) return null;
  const press = (d: string) => {
    if (pin.length >= 4) return;
    const next = pin + d;
    setError(false);
    setPin(next);
    if (next.length < 4) return;
    const who = verify(next);
    if (who) onConfirm(who, reason);
    else {
      setError(true);
      setTimeout(() => setPin(""), 350);
    }
  };

  return (
    <Dialog open={!!line} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-xl">Anular {line.qty}× {line.name}</DialogTitle>
          <DialogDescription>
            −{formatBs(lineTotalMinor(line))}. Ya se envió a cocina, así que necesita el PIN de la encargada. Queda registrado en el
            cierre del dueño.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-wrap gap-2">
          {REASONS.map((r) => (
            <button
              key={r}
              type="button"
              aria-pressed={reason === r}
              onClick={() => setReason(r)}
              className={cn(
                "press h-9 rounded-full border px-3.5 text-[13px] font-medium",
                reason === r ? "border-primary bg-primary/12" : "bg-secondary text-muted-foreground",
              )}
            >
              {r}
            </button>
          ))}
        </div>
        <div className={cn("mt-2 flex justify-center gap-3", error && "animate-[shake_300ms]")} aria-live="assertive">
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
        <p className="text-center text-[13px] text-muted-foreground">
          {error ? <span className="text-status-critical">PIN incorrecto</span> : "PIN de encargada (demo: 1234)"}
        </p>
        <div className="grid grid-cols-3 gap-2">
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
          <Button variant="ghost" className="h-14" aria-label="Borrar" onClick={() => setPin((p) => p.slice(0, -1))}>
            <Delete className="size-5" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
