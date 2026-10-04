"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { formatBs } from "@/modules/pos/money";
import type { ChosenModifier, MenuItem } from "@/modules/pos/types";
import { cn } from "@/lib/utils";
import { ItemImage } from "./item-image";

export function ModifierDialog({
  item, onClose, onAdd,
}: {
  item: MenuItem | null;
  onClose: () => void;
  onAdd: (mods: ChosenModifier[], qty: number, note?: string) => void;
}) {
  const [picked, setPicked] = useState<Record<string, string[]>>({});
  const [qty, setQty] = useState(1);
  const [note, setNote] = useState("");

  useEffect(() => {
    if (!item) return;
    // Preselect the first option of required groups: fastest path for the common order.
    setPicked(Object.fromEntries(item.modifierGroups.filter((g) => g.required).map((g) => [g.id, [g.options[0].id]])));
    setQty(1);
    setNote("");
  }, [item]);

  const mods: ChosenModifier[] = useMemo(() => {
    if (!item) return [];
    return item.modifierGroups.flatMap((g) =>
      (picked[g.id] ?? []).map((oid) => {
        const o = g.options.find((x) => x.id === oid)!;
        return { groupId: g.id, optionId: o.id, name: o.name, priceMinor: o.priceMinor };
      }),
    );
  }, [item, picked]);

  if (!item) return null;
  const unit = item.priceMinor + mods.reduce((s, m) => s + m.priceMinor, 0);
  const valid = item.modifierGroups.every((g) => !g.required || (picked[g.id]?.length ?? 0) > 0);

  return (
    <Dialog open={!!item} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-md">
        <ItemImage item={item} className="aspect-[16/9] w-full" sizes="448px" />
        <div className="max-h-[52dvh] overflow-y-auto px-6 pt-5 pb-2">
          <div className="flex items-start justify-between gap-4">
            <DialogTitle className="text-xl leading-tight">{item.name}</DialogTitle>
            <span className="text-lg font-semibold tabular">{formatBs(item.priceMinor)}</span>
          </div>
          <DialogDescription className="mt-1.5">{item.description ?? "Personaliza el pedido."}</DialogDescription>

          {item.modifierGroups.map((g) => (
            <fieldset key={g.id} className="mt-6">
              <legend className="mb-2.5 flex w-full items-center justify-between text-[13px] font-semibold">
                {g.name}
                <span className="text-xs font-medium text-muted-foreground">{g.required ? "Obligatorio" : "Opcional"}</span>
              </legend>
              <div className="flex flex-wrap gap-2">
                {g.options.map((o) => {
                  const on = picked[g.id]?.includes(o.id) ?? false;
                  return (
                    <button
                      key={o.id}
                      type="button"
                      aria-pressed={on}
                      onClick={() =>
                        setPicked((p) => {
                          const cur = p[g.id] ?? [];
                          if (g.multi) return { ...p, [g.id]: on ? cur.filter((x) => x !== o.id) : [...cur, o.id] };
                          return { ...p, [g.id]: g.required || !on ? [o.id] : [] };
                        })
                      }
                      className={cn(
                        "press flex h-11 items-center gap-1.5 rounded-xl border px-4 text-[14px] font-medium",
                        on ? "border-primary bg-primary/12 text-foreground" : "border-border bg-secondary text-muted-foreground",
                      )}
                    >
                      {on && <Check className="size-4 text-primary" aria-hidden />}
                      {o.name}
                      {o.priceMinor > 0 && <span className="text-xs text-muted-foreground tabular">+{formatBs(o.priceMinor)}</span>}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          ))}

          <label className="mt-6 block text-[13px] font-semibold" htmlFor="note">
            Nota para cocina
          </label>
          <input
            id="note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Ej.: sin cebolla"
            className="mt-2 h-11 w-full rounded-xl border bg-secondary px-3.5 text-[14px] outline-none placeholder:text-muted-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
          />
        </div>
        <div className="flex items-center gap-3 border-t p-4">
          <div className="flex items-center gap-1 rounded-2xl bg-secondary p-1">
            <Button variant="ghost" size="icon" aria-label="Menos" onClick={() => setQty((q) => Math.max(1, q - 1))}>
              <Minus />
            </Button>
            <span className="w-7 text-center text-lg font-semibold tabular" aria-live="polite">
              {qty}
            </span>
            <Button variant="ghost" size="icon" aria-label="Más" onClick={() => setQty((q) => q + 1)}>
              <Plus />
            </Button>
          </div>
          <Button size="lg" className="flex-1" disabled={!valid} onClick={() => onAdd(mods, qty, note.trim() || undefined)}>
            Agregar · {formatBs(unit * qty)}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
