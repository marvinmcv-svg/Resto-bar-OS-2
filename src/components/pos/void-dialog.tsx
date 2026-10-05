"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatBs } from "@/modules/pos/money";
import { lineTotalMinor } from "@/modules/pos/order";
import type { OrderLine } from "@/modules/pos/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PinPad } from "./pin-pad";

const REASONS = ["Error de mesa", "Cliente cambió de opinión", "Producto con problema", "Demora en cocina"];

/** Voiding a sent item needs a manager PIN and a reason. Both land in the owner's report. */
export function VoidDialog({
  line, onClose, verify, onConfirm, approver,
}: {
  line: OrderLine | null;
  /** Signed-in staff allowed to void without a PIN (owner/manager). */
  approver?: { id: string; name: string };
  onClose: () => void;
  verify: (pin: string) => string | null;
  onConfirm: (approvedBy: string, reason: string) => void;
}) {
  const [reason, setReason] = useState(REASONS[0]);

  useEffect(() => {
    setReason(REASONS[0]);
  }, [line]);

  if (!line) return null;

  return (
    <Dialog open={!!line} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-xl">Anular {line.qty}× {line.name}</DialogTitle>
          <DialogDescription>
            −{formatBs(lineTotalMinor(line))}. {approver
              ? "Ya se envió a cocina. Queda registrado a tu nombre en el cierre del dueño."
              : "Ya se envió a cocina, así que necesita el PIN de un encargado. Queda registrado en el cierre del dueño."}
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
        {approver ? (
          <Button size="xl" variant="destructive" className="mt-2 w-full" onClick={() => onConfirm(approver.id, reason)}>
            Anular como {approver.name}
          </Button>
        ) : (
        <PinPad
          className="mt-2"
          resetKey={line}
          hint="PIN de encargada (demo: 1234)"
          onComplete={(pin) => {
            const who = verify(pin);
            if (who) onConfirm(who, reason);
            return !!who;
          }}
        />
        )}
      </DialogContent>
    </Dialog>
  );
}
