"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ItemImage } from "@/components/pos/item-image";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { costOfMinor, formatQty, marginPct, parseQtyInput, recipeCostMinor, UNIT_LABEL, type RecipeLine } from "@/modules/inventory/inventory";
import { formatBs } from "@/modules/pos/money";
import { useStore } from "@/modules/pos/store";
import type { MenuItem } from "@/modules/pos/types";
import { cn } from "@/lib/utils";

interface Row {
  ingredientId: string;
  qty: string;
}

/** What one portion of a dish uses; cost and margin update as you type. */
export function RecipeSheet({ item, onClose }: { item: MenuItem | null; onClose: () => void }) {
  const { state, dispatch } = useStore();
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    if (!item) return;
    const lines = state.recipes[item.id] ?? [];
    setRows(lines.map((l) => ({ ingredientId: l.ingredientId, qty: String(l.qtyMilli / 1000).replace(".", ",") })));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset when another dish opens
  }, [item]);

  if (!item) return null;
  const lines: RecipeLine[] = rows
    .map((r) => ({ ingredientId: r.ingredientId, qtyMilli: parseQtyInput(r.qty) ?? 0 }))
    .filter((l) => l.ingredientId && l.qtyMilli > 0);
  const cost = recipeCostMinor(lines, state.ingredients);
  const margin = marginPct(item.priceMinor, cost);
  const unused = state.ingredients.filter((i) => !rows.some((r) => r.ingredientId === i.id));

  return (
    <Sheet open onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-[480px]" onOpenAutoFocus={(e) => e.preventDefault()}>
        <SheetHeader className="border-b px-6 pt-6 pb-4">
          <div className="flex items-center gap-3">
            <ItemImage item={item} className="size-12 shrink-0 rounded-xl" sizes="48px" />
            <div>
              <SheetTitle className="text-[20px]">Receta · {item.name}</SheetTitle>
              <SheetDescription>Lo que usa una porción. Al enviar a cocina se descuenta del stock.</SheetDescription>
            </div>
          </div>
        </SheetHeader>
        <div className="flex-1 space-y-3 overflow-y-auto px-6 py-5">
          {rows.length === 0 && <p className="rounded-2xl border border-dashed p-6 text-center text-[14px] text-muted-foreground">Sin ingredientes todavía.</p>}
          {rows.map((r, idx) => {
            const ing = state.ingredients.find((i) => i.id === r.ingredientId);
            const qtyMilli = parseQtyInput(r.qty);
            return (
              <div key={r.ingredientId} className="flex items-center gap-2 rounded-2xl border p-3">
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14px] font-medium">{ing?.name}</span>
                  <span className="block text-[12px] text-muted-foreground tabular">
                    {ing && qtyMilli ? `${formatQty(qtyMilli, ing.unit)} · ${formatBs(costOfMinor(ing, qtyMilli))}` : "Escribe la cantidad"}
                  </span>
                </span>
                <label className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
                  <input
                    value={r.qty}
                    onChange={(e) => setRows(rows.map((x, i) => (i === idx ? { ...x, qty: e.target.value } : x)))}
                    inputMode="decimal"
                    aria-label={`Cantidad de ${ing?.name} en ${ing ? UNIT_LABEL[ing.unit] : ""}`}
                    className={cn("h-10 w-20 rounded-xl border bg-secondary px-2.5 text-right text-[14px] tabular", r.qty && qtyMilli === null && "border-destructive")}
                  />
                  {ing && UNIT_LABEL[ing.unit]}
                </label>
                <Button variant="ghost" size="icon-sm" aria-label={`Quitar ${ing?.name}`} onClick={() => setRows(rows.filter((_, i) => i !== idx))}>
                  <Trash2 />
                </Button>
              </div>
            );
          })}
          {unused.length > 0 && (
            <label className="flex items-center gap-2 rounded-2xl border border-dashed p-3 text-[14px]">
              <Plus className="size-4 text-muted-foreground" aria-hidden />
              <select
                value=""
                onChange={(e) => e.target.value && setRows([...rows, { ingredientId: e.target.value, qty: "" }])}
                aria-label="Agregar ingrediente"
                className="h-9 flex-1 rounded-lg bg-transparent text-[14px] outline-none"
              >
                <option value="">Agregar ingrediente…</option>
                {unused.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.name} ({UNIT_LABEL[i.unit]})
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>
        <div className="space-y-3 border-t px-6 py-4">
          <div className="grid grid-cols-3 gap-2 text-center">
            <Metric label="Precio" value={formatBs(item.priceMinor)} />
            <Metric label="Costo" value={formatBs(cost)} />
            <Metric label="Margen" value={`${margin}%`} tone={margin < 60 ? "warn" : "good"} />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              onClick={() => {
                dispatch({ type: "setRecipe", itemId: item.id, lines });
                toast.success(`Receta de ${item.name} guardada`, { description: `Costo ${formatBs(cost)} · margen ${margin}%` });
                onClose();
              }}
            >
              Guardar receta
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Metric({ label, value, tone }: { label: string; value: string; tone?: "good" | "warn" }) {
  return (
    <div className="rounded-2xl bg-secondary px-2 py-2.5">
      <p className="text-[11.5px] text-muted-foreground">{label}</p>
      <p className={cn("text-[16px] font-semibold tabular", tone === "warn" && "text-status-warning-ink", tone === "good" && "text-status-good-ink")}>{value}</p>
    </div>
  );
}
