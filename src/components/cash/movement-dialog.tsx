"use client";

import { useEffect, useState } from "react";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { ChipSelect, Field, TextInput } from "@/components/app/form";
import { PinPad } from "@/components/pos/pin-pad";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatBs, parseBsInput } from "@/modules/pos/money";
import { can } from "@/modules/pos/permissions";
import { newId, useStore } from "@/modules/pos/store";
import type { CashMovement, CashMovementReason } from "@/modules/pos/types";
import { cn } from "@/lib/utils";

export const REASON_LABEL: Record<CashMovementReason, string> = {
  compra: "Compra de insumos",
  retiro: "Retiro del dueño",
  cambio: "Cambio / sencillo",
  otro: "Otro",
};

/** Money in or out of the drawer. Taking money out needs a manager (their own session, or their PIN). */
export function MovementDialog({
  open, kind, shiftId, onClose, onSaved,
}: {
  open: boolean;
  kind: "in" | "out";
  shiftId: string;
  onClose: () => void;
  onSaved: (m: CashMovement) => void;
}) {
  const { me, dispatch, verifyManagerPin } = useStore();
  const [reason, setReason] = useState<CashMovementReason>(kind === "out" ? "compra" : "cambio");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [tried, setTried] = useState(false);
  const [needPin, setNeedPin] = useState(false);

  useEffect(() => {
    if (!open) return;
    setReason(kind === "out" ? "compra" : "cambio");
    setAmount("");
    setNote("");
    setTried(false);
    setNeedPin(false);
  }, [open, kind]);

  const amountMinor = parseBsInput(amount);
  const error = amountMinor === null || amountMinor <= 0 ? "Escribe el monto, por ejemplo 120." : undefined;
  const selfApproves = !!me && can(me.role, "order.void"); // owner or manager on the device

  const save = (approvedBy?: string) => {
    if (!me || amountMinor === null) return;
    const m: CashMovement = {
      id: newId(), shiftId, kind, amountMinor, reason, note: note.trim() || undefined, at: Date.now(), by: me.id,
      approvedBy: kind === "out" ? approvedBy : undefined,
    };
    dispatch({ type: "addCashMovement", movement: m });
    onSaved(m);
  };

  const submit = () => {
    setTried(true);
    if (error) return;
    if (kind === "out" && !selfApproves) setNeedPin(true);
    else save(kind === "out" ? me?.id : undefined);
  };

  const Icon = kind === "in" ? ArrowDownLeft : ArrowUpRight;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        {!needPin ? (
          <form
            className="space-y-5"
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
          >
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2.5 text-xl">
                <span className={cn("grid size-9 place-items-center rounded-xl", kind === "in" ? "bg-status-good/14 text-status-good-ink" : "bg-status-critical/12 text-status-critical")}>
                  <Icon className="size-5" aria-hidden />
                </span>
                {kind === "in" ? "Entrada de efectivo" : "Salida de efectivo"}
              </DialogTitle>
              <DialogDescription>
                {kind === "in" ? "Dinero que entra a la caja sin ser una venta." : "Queda registrado con tu nombre y quién lo aprobó."}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-1.5">
              <p className="text-[13px] font-semibold">Motivo</p>
              <ChipSelect
                label="Motivo"
                value={reason}
                onChange={setReason}
                options={(kind === "in" ? (["cambio", "otro"] as const) : (["compra", "retiro", "otro"] as const)).map((r) => ({ value: r, label: REASON_LABEL[r] }))}
              />
            </div>
            <Field label="Monto (Bs)" error={tried ? error : undefined}>
              {(p) => <TextInput {...p} value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" placeholder="120" autoFocus className="tabular" />}
            </Field>
            <Field label="Detalle" hint="Opcional. Ej. hielo y limones, proveedor.">
              {(p) => <TextInput {...p} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Detalle" autoComplete="off" />}
            </Field>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit">{kind === "out" && !selfApproves ? "Pedir aprobación" : "Registrar"}</Button>
            </DialogFooter>
          </form>
        ) : (
          <div>
            <DialogHeader>
              <DialogTitle className="text-xl">Aprobar salida de {amountMinor !== null ? formatBs(amountMinor) : ""}</DialogTitle>
              <DialogDescription>{REASON_LABEL[reason]}. Un encargado ingresa su PIN.</DialogDescription>
            </DialogHeader>
            <PinPad
              className="mt-5"
              resetKey={needPin}
              hint="PIN de encargado (demo: 1234)"
              onComplete={(pin) => {
                const who = verifyManagerPin(pin);
                if (who) save(who);
                return !!who;
              }}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
