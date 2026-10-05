"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ChipSelect, Field, TextInput } from "@/components/app/form";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { costOfMinor, formatQty, parseQtyInput, UNIT_LABEL, type Ingredient, type StockMovementKind } from "@/modules/inventory/inventory";
import { formatBs, parseBsInput } from "@/modules/pos/money";
import { can } from "@/modules/pos/permissions";
import { newId, useStore } from "@/modules/pos/store";

type Kind = Exclude<StockMovementKind, "sale">;

const KIND_LABEL: Record<Kind, string> = { receive: "Compra recibida", count: "Conteo físico", waste: "Merma" };
const WASTE_REASONS = ["Vencido", "Se quemó / mal preparado", "Plato devuelto", "Roto o derramado", "Otro"];

/** Receive a purchase, record a physical count, or log waste for one ingredient. */
export function StockDialog({ ingredient, initialKind, onClose }: { ingredient: Ingredient | null; initialKind?: Kind; onClose: () => void }) {
  const { me, dispatch } = useStore();
  const manage = can(me?.role, "inventory.manage");
  const kinds: Kind[] = manage ? ["receive", "count", "waste"] : ["waste"];
  const [kind, setKind] = useState<Kind>("receive");
  const [qty, setQty] = useState("");
  const [paid, setPaid] = useState("");
  const [reason, setReason] = useState(WASTE_REASONS[0]);
  const [tried, setTried] = useState(false);

  useEffect(() => {
    if (!ingredient) return;
    setKind(initialKind && kinds.includes(initialKind) ? initialKind : kinds[0]);
    setQty("");
    setPaid("");
    setReason(WASTE_REASONS[0]);
    setTried(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset when another ingredient opens
  }, [ingredient]);

  if (!ingredient) return null;
  const unit = UNIT_LABEL[ingredient.unit];
  const qtyMilli = parseQtyInput(qty);
  const paidMinor = paid.trim() ? parseBsInput(paid) : undefined;
  const qtyError = qtyMilli === null || (kind !== "count" && qtyMilli === 0) ? `Escribe la cantidad en ${unit}, por ejemplo 2,5.` : undefined;
  const paidError = paidMinor === null ? "Escribe el monto pagado, por ejemplo 320." : undefined;
  const delta = qtyMilli === null ? 0 : kind === "receive" ? qtyMilli : kind === "waste" ? -qtyMilli : qtyMilli - ingredient.stockMilli;

  const save = () => {
    setTried(true);
    if (qtyError || paidError || qtyMilli === null || !me) return;
    if (kind === "count" && delta === 0) {
      toast("El conteo coincide con el sistema", { description: `${ingredient.name}: ${formatQty(qtyMilli, ingredient.unit)}` });
      onClose();
      return;
    }
    // A purchase updates the unit cost to what was actually paid.
    const newCost = kind === "receive" && paidMinor ? Math.round((paidMinor * 1000) / qtyMilli) : undefined;
    dispatch({
      type: "stockMovement",
      movement: {
        id: newId(), ingredientId: ingredient.id, kind, deltaMilli: delta, at: Date.now(), by: me.id,
        reason: kind === "waste" ? reason : kind === "count" ? "Conteo físico" : "Compra",
        costMinor: kind === "receive" ? (paidMinor ?? costOfMinor(ingredient, qtyMilli)) : kind === "waste" ? costOfMinor(ingredient, qtyMilli) : undefined,
      },
      unitCostMinor: newCost,
    });
    toast.success(
      kind === "receive" ? `Compra de ${ingredient.name} registrada` : kind === "waste" ? `Merma de ${ingredient.name} registrada` : `${ingredient.name} contado`,
      { description: `${delta > 0 ? "+" : "−"}${formatQty(Math.abs(delta), ingredient.unit)} en stock` },
    );
    onClose();
  };

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <form
          className="space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            save();
          }}
        >
          <DialogHeader>
            <DialogTitle className="text-xl">{ingredient.name}</DialogTitle>
            <DialogDescription>
              En stock: {formatQty(ingredient.stockMilli, ingredient.unit)} · {formatBs(ingredient.unitCostMinor)} por {unit}
            </DialogDescription>
          </DialogHeader>
          {kinds.length > 1 && (
            <ChipSelect label="Tipo de movimiento" value={kind} onChange={setKind} options={kinds.map((k) => ({ value: k, label: KIND_LABEL[k] }))} />
          )}
          <Field
            label={kind === "count" ? `Cantidad contada (${unit})` : `Cantidad (${unit})`}
            error={tried ? qtyError : undefined}
            hint={kind === "count" && qtyMilli !== null ? `Diferencia: ${delta >= 0 ? "+" : "−"}${formatQty(Math.abs(delta), ingredient.unit)}` : undefined}
          >
            {(p) => <TextInput {...p} value={qty} onChange={(e) => setQty(e.target.value)} inputMode="decimal" placeholder="2,5" autoFocus className="tabular" />}
          </Field>
          {kind === "receive" && (
            <Field label="Total pagado (Bs)" error={tried ? paidError : undefined} hint="Opcional. Actualiza el costo por unidad.">
              {(p) => <TextInput {...p} value={paid} onChange={(e) => setPaid(e.target.value)} inputMode="decimal" placeholder="320" className="tabular" />}
            </Field>
          )}
          {kind === "waste" && (
            <div className="space-y-1.5">
              <p className="text-[13px] font-semibold">Motivo</p>
              <ChipSelect label="Motivo de la merma" value={reason} onChange={setReason} options={WASTE_REASONS.map((r) => ({ value: r, label: r }))} />
              {qtyMilli ? <p className="text-[12px] text-muted-foreground">Costo de la merma: {formatBs(costOfMinor(ingredient, qtyMilli))}</p> : null}
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">Registrar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
