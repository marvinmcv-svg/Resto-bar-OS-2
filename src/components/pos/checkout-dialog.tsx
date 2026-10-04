"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeftRight, Banknote, Check, CreditCard, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { formatBs, toMinor } from "@/modules/pos/money";
import {
  activeLines, balanceMinor, changeMinor, lineTotalMinor, orderTotalMinor, paidMinor, splitEqually, tipForPercent,
} from "@/modules/pos/order";
import type { Order, PaymentMethod } from "@/modules/pos/types";
import { cn } from "@/lib/utils";

const METHODS: { id: PaymentMethod; label: string; icon: typeof QrCode }[] = [
  { id: "qr", label: "QR", icon: QrCode },
  { id: "cash", label: "Efectivo", icon: Banknote },
  { id: "card_external", label: "Tarjeta", icon: CreditCard },
  { id: "transfer", label: "Transfer.", icon: ArrowLeftRight },
];

type Mode = "all" | "equal" | "items";

export interface CheckoutResult {
  method: PaymentMethod;
  amountMinor: number;
  tipMinor: number;
  nit?: string;
  name?: string;
}

export function CheckoutDialog({
  order, tableLabel, open, onClose, onPay,
}: {
  order: Order;
  tableLabel: string;
  open: boolean;
  onClose: () => void;
  onPay: (r: CheckoutResult) => void;
}) {
  const [mode, setMode] = useState<Mode>("all");
  const [parts, setParts] = useState(2);
  const [selected, setSelected] = useState<string[]>([]);
  const [method, setMethod] = useState<PaymentMethod>("qr");
  const [tipPct, setTipPct] = useState(0);
  const [received, setReceived] = useState<number | null>(null);
  const [nit, setNit] = useState("");
  const [name, setName] = useState("");

  const balance = balanceMinor(order);
  const paid = paidMinor(order);

  useEffect(() => {
    if (!open) return;
    setMode("all");
    setSelected([]);
    setTipPct(0);
    setReceived(null);
  }, [open]);

  const due = useMemo(() => {
    if (mode === "equal") {
      const shares = splitEqually(orderTotalMinor(order), parts);
      // Next share to collect, capped by what's left.
      const paidShares = shares.reduce(
        (acc, s) => (acc.sum + s <= paid ? { n: acc.n + 1, sum: acc.sum + s } : acc),
        { n: 0, sum: 0 },
      );
      return Math.min(shares[Math.min(paidShares.n, parts - 1)], balance);
    }
    if (mode === "items") {
      const ids = new Set(selected);
      return Math.min(activeLines(order).filter((l) => ids.has(l.id)).reduce((s, l) => s + lineTotalMinor(l), 0), balance);
    }
    return balance;
  }, [mode, parts, selected, order, balance, paid]);

  const tip = tipForPercent(due, tipPct);
  const totalToCharge = due + tip;
  const change = method === "cash" && received !== null ? changeMinor(totalToCharge, received) : 0;
  const cashShort = method === "cash" && received !== null && received < totalToCharge;
  const quickCash = [totalToCharge, ...[5000, 10000, 20000].filter((v) => v > totalToCharge)].slice(0, 4);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[92dvh] gap-0 overflow-hidden p-0 sm:max-w-[560px]">
        <div className="border-b px-6 pt-6 pb-5">
          <DialogTitle className="text-xl">Cobrar mesa {tableLabel}</DialogTitle>
          <DialogDescription className="mt-1">
            Total {formatBs(orderTotalMinor(order))}
            {paid > 0 && ` · pagado ${formatBs(paid)}`} · <span className="font-medium text-foreground">falta {formatBs(balance)}</span>
          </DialogDescription>
          <div className="mt-4 grid grid-cols-3 rounded-xl bg-secondary p-1" role="tablist" aria-label="Forma de dividir">
            {([["all", "Todo"], ["equal", "Por igual"], ["items", "Por ítems"]] as [Mode, string][]).map(([id, label]) => (
              <button
                key={id}
                role="tab"
                aria-selected={mode === id}
                onClick={() => setMode(id)}
                className={cn(
                  "press h-9 rounded-lg text-[13px] font-semibold text-muted-foreground",
                  mode === id && "bg-card text-foreground shadow-card",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="max-h-[56dvh] space-y-6 overflow-y-auto px-6 py-5">
          {mode === "equal" && (
            <div className="flex items-center justify-between">
              <span className="text-[14px] font-medium">Dividir entre</span>
              <div className="flex gap-1.5">
                {[2, 3, 4, 5, 6].map((n) => (
                  <button
                    key={n}
                    aria-pressed={parts === n}
                    onClick={() => setParts(n)}
                    className={cn(
                      "press size-10 rounded-xl text-[14px] font-semibold tabular",
                      parts === n ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground",
                    )}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          )}

          {mode === "items" && (
            <ul className="space-y-1.5">
              {activeLines(order).map((l) => {
                const on = selected.includes(l.id);
                return (
                  <li key={l.id}>
                    <button
                      aria-pressed={on}
                      onClick={() => setSelected((s) => (on ? s.filter((x) => x !== l.id) : [...s, l.id]))}
                      className={cn(
                        "press flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left text-[14px]",
                        on ? "border-primary bg-primary/10" : "bg-secondary/60",
                      )}
                    >
                      <span
                        className={cn(
                          "grid size-5 place-items-center rounded-md border",
                          on ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/40",
                        )}
                      >
                        {on && <Check className="size-3.5" />}
                      </span>
                      <span className="flex-1">
                        {l.qty}× {l.name}
                      </span>
                      <span className="font-medium tabular">{formatBs(lineTotalMinor(l))}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          <div>
            <p className="mb-2.5 text-[13px] font-semibold">Método</p>
            <div className="grid grid-cols-4 gap-2">
              {METHODS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  aria-pressed={method === id}
                  onClick={() => {
                    setMethod(id);
                    setReceived(null);
                  }}
                  className={cn(
                    "press flex h-[72px] flex-col items-center justify-center gap-1.5 rounded-2xl border text-[13px] font-medium",
                    method === id ? "border-primary bg-primary/12 text-foreground" : "bg-secondary text-muted-foreground",
                  )}
                >
                  <Icon className={cn("size-[22px]", method === id && "text-primary")} aria-hidden />
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2.5 text-[13px] font-semibold">Propina</p>
            <div className="flex gap-2">
              {[0, 5, 10, 15].map((p) => (
                <button
                  key={p}
                  aria-pressed={tipPct === p}
                  onClick={() => setTipPct(p)}
                  className={cn(
                    "press h-10 flex-1 rounded-xl text-[13px] font-semibold",
                    tipPct === p ? "bg-foreground text-background" : "bg-secondary text-muted-foreground",
                  )}
                >
                  {p === 0 ? "Sin propina" : `${p}%`}
                </button>
              ))}
            </div>
          </div>

          {method === "cash" && (
            <div>
              <p className="mb-2.5 text-[13px] font-semibold">Recibido</p>
              <div className="grid grid-cols-4 gap-2">
                {quickCash.map((v, i) => (
                  <button
                    key={v}
                    aria-pressed={received === v}
                    onClick={() => setReceived(v)}
                    className={cn(
                      "press h-11 rounded-xl text-[13px] font-semibold tabular",
                      received === v ? "bg-foreground text-background" : "bg-secondary text-muted-foreground",
                    )}
                  >
                    {i === 0 ? "Exacto" : formatBs(v).replace(",00", "")}
                  </button>
                ))}
              </div>
              <input
                inputMode="decimal"
                placeholder="Otro monto (Bs)"
                aria-label="Monto recibido en bolivianos"
                onChange={(e) => {
                  const n = Number(e.target.value.replace(",", "."));
                  setReceived(Number.isFinite(n) && n > 0 ? toMinor(n) : null);
                }}
                className="mt-2 h-11 w-full rounded-xl border bg-secondary px-3.5 text-[14px] outline-none placeholder:text-muted-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
              />
              {received !== null && (
                <p className={cn("mt-2 text-[14px]", cashShort ? "text-status-critical" : "text-foreground")}>
                  {cashShort ? `Faltan ${formatBs(totalToCharge - received)}` : <>Vuelto: <b className="tabular">{formatBs(change)}</b></>}
                </p>
              )}
            </div>
          )}

          <div>
            <p className="mb-2.5 text-[13px] font-semibold">
              Factura <span className="font-normal text-muted-foreground">· opcional</span>
            </p>
            <div className="grid grid-cols-[2fr_3fr] gap-2">
              <input
                value={nit}
                onChange={(e) => setNit(e.target.value.replace(/[^\d-]/g, ""))}
                inputMode="numeric"
                placeholder="NIT / CI"
                aria-label="NIT o CI"
                className="h-11 rounded-xl border bg-secondary px-3.5 text-[14px] outline-none placeholder:text-muted-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
              />
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Razón social"
                aria-label="Razón social"
                className="h-11 rounded-xl border bg-secondary px-3.5 text-[14px] outline-none placeholder:text-muted-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
              />
            </div>
          </div>
        </div>

        <div className="border-t p-4">
          <Button
            size="xl"
            className="w-full"
            disabled={due <= 0 || cashShort}
            onClick={() =>
              onPay({ method, amountMinor: due, tipMinor: tip, nit: nit || undefined, name: name || undefined })
            }
          >
            {due <= 0 ? "Elige qué cobrar" : `Cobrar ${formatBs(totalToCharge)}`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
