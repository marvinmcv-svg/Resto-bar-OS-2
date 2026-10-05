"use client";

import { useEffect, useState } from "react";
import { Minus, Plus, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { cashDifference, countTotalMinor, DENOMINATIONS } from "@/modules/pos/cash";
import { formatBs, minorToInput, parseBsInput } from "@/modules/pos/money";
import type { CashCount } from "@/modules/pos/types";
import { cn } from "@/lib/utils";

const label = (d: number) => (d >= 100 ? `Bs ${d / 100}` : `${d} ctvs`);

/**
 * Count bills and coins (or type a total). Used to open the register and to close it ("arqueo").
 * With `expectedMinor`, shows the live difference against what the system expects.
 */
export function CountDialog({
  open, title, description, confirmLabel, expectedMinor, warning, suggestedMinor, onClose, onConfirm,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  expectedMinor?: number;
  warning?: string;
  suggestedMinor?: number;
  onClose: () => void;
  onConfirm: (totalMinor: number, count: CashCount | undefined) => void;
}) {
  const [count, setCount] = useState<CashCount>({});
  const [typed, setTyped] = useState("");
  const [mode, setMode] = useState<"count" | "total">("count");

  useEffect(() => {
    if (!open) return;
    setCount({});
    setTyped(suggestedMinor ? minorToInput(suggestedMinor) : "");
    setMode(suggestedMinor ? "total" : "count");
  }, [open, suggestedMinor]);

  const typedMinor = parseBsInput(typed);
  const total = mode === "count" ? countTotalMinor(count) : (typedMinor ?? 0);
  const valid = mode === "count" ? true : typedMinor !== null;
  const diff = expectedMinor !== undefined ? cashDifference(total, expectedMinor) : null;
  const bump = (d: number, by: number) => setCount((c) => ({ ...c, [d]: Math.max(0, (c[d] ?? 0) + by) }));

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[94dvh] gap-0 overflow-hidden p-0 sm:max-w-[520px]">
        <div className="border-b px-6 pt-6 pb-5">
          <DialogTitle className="text-xl">{title}</DialogTitle>
          <DialogDescription className="mt-1">{description}</DialogDescription>
          <div className="mt-4 grid grid-cols-2 rounded-xl bg-secondary p-1" role="tablist" aria-label="Cómo contar">
            {([["count", "Contar billetes"], ["total", "Escribir total"]] as const).map(([id, l]) => (
              <button
                key={id}
                role="tab"
                aria-selected={mode === id}
                onClick={() => setMode(id)}
                className={cn("press h-9 rounded-lg text-[13px] font-semibold text-muted-foreground", mode === id && "bg-card text-foreground shadow-card")}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        <div className="max-h-[52dvh] overflow-y-auto px-6 py-4">
          {mode === "count" ? (
            <ul className="divide-y">
              {DENOMINATIONS.map((d) => {
                const n = count[d] ?? 0;
                return (
                  <li key={d} className="flex items-center gap-3 py-2">
                    <span className={cn("w-[84px] text-[15px] font-semibold tabular", d < 1000 && "text-muted-foreground")}>{label(d)}</span>
                    <span className="flex items-center gap-1.5">
                      <Button variant="secondary" size="icon-sm" aria-label={`Menos ${label(d)}`} onClick={() => bump(d, -1)} disabled={n === 0}>
                        <Minus />
                      </Button>
                      <input
                        value={n || ""}
                        onChange={(e) => setCount((c) => ({ ...c, [d]: Math.max(0, Number(e.target.value.replace(/\D/g, "")) || 0) }))}
                        inputMode="numeric"
                        placeholder="0"
                        aria-label={`Cantidad de ${label(d)}`}
                        className="h-9 w-14 rounded-lg border bg-secondary text-center text-[15px] font-semibold outline-none tabular focus-visible:ring-[3px] focus-visible:ring-ring/50"
                      />
                      <Button variant="secondary" size="icon-sm" aria-label={`Más ${label(d)}`} onClick={() => bump(d, 1)}>
                        <Plus />
                      </Button>
                    </span>
                    <span className="ml-auto text-[14px] text-muted-foreground tabular">{n ? formatBs(n * d) : "—"}</span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <label className="block py-4">
              <span className="text-[13px] font-semibold">Total en efectivo (Bs)</span>
              <input
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                inputMode="decimal"
                autoFocus
                placeholder="500"
                className="mt-2 h-14 w-full rounded-2xl border bg-secondary px-4 text-[24px] font-semibold outline-none tabular focus-visible:ring-[3px] focus-visible:ring-ring/50"
              />
              {!valid && typed && <span className="mt-1.5 block text-[12px] text-status-critical">Escribe un monto, por ejemplo 500 o 512,50.</span>}
            </label>
          )}
        </div>

        <div className="space-y-3 border-t p-5">
          {warning && (
            <p className="flex items-start gap-2 rounded-xl bg-status-warning/14 px-3 py-2.5 text-[13px]">
              <TriangleAlert className="mt-0.5 size-4 shrink-0 text-status-warning-ink" aria-hidden /> {warning}
            </p>
          )}
          <div className="flex items-end justify-between gap-4">
            <span>
              <span className="block text-[13px] text-muted-foreground">Contado</span>
              <span className="block text-[30px] leading-none font-semibold tracking-[-0.025em] tabular">{formatBs(total)}</span>
            </span>
            {diff && expectedMinor !== undefined && (
              <span className="text-right">
                <span className="block text-[13px] text-muted-foreground">Esperado {formatBs(expectedMinor)}</span>
                <span
                  className={cn(
                    "mt-1 inline-block rounded-full px-2.5 py-1 text-[13px] font-semibold tabular",
                    diff.status === "ok" && "bg-status-good/14 text-status-good-ink",
                    diff.status !== "ok" && !diff.flagged && "bg-secondary text-foreground",
                    diff.flagged && "bg-status-critical/14 text-status-critical",
                  )}
                  aria-live="polite"
                >
                  {diff.status === "ok" ? "Cuadra exacto" : `${diff.status === "over" ? "Sobra" : "Falta"} ${formatBs(Math.abs(diff.diffMinor))}`}
                </span>
              </span>
            )}
          </div>
          <Button
            size="xl"
            className="w-full"
            disabled={!valid}
            onClick={() => onConfirm(total, mode === "count" ? Object.fromEntries(Object.entries(count).filter(([, n]) => n > 0)) : undefined)}
          >
            {confirmLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
