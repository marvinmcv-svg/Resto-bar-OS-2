"use client";

import { useEffect, useState } from "react";
import { ChipSelect, Field, TextArea, TextInput } from "@/components/app/form";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { GuestNote } from "@/modules/pos/types";
import { OCCASION } from "./ticket-panel";

type Occ = NonNullable<GuestNote["occasion"]> | "ninguna";

/** Toast's "digital chit": who's at the table and what the team should know. */
export function GuestNoteDialog({
  open, tableLabel, note, onClose, onSave,
}: {
  open: boolean;
  tableLabel: string;
  note?: GuestNote;
  onClose: () => void;
  onSave: (note: GuestNote | null) => void;
}) {
  const [name, setName] = useState("");
  const [occasion, setOccasion] = useState<Occ>("ninguna");
  const [text, setText] = useState("");

  useEffect(() => {
    if (!open) return;
    setName(note?.name ?? "");
    setOccasion(note?.occasion ?? "ninguna");
    setText(note?.text ?? "");
  }, [open, note]);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <form
          className="space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            const n: GuestNote = {
              name: name.trim() || undefined,
              occasion: occasion === "ninguna" ? undefined : occasion,
              text: text.trim() || undefined,
            };
            onSave(n.name || n.occasion || n.text ? n : null);
          }}
        >
          <DialogHeader>
            <DialogTitle className="text-xl">Nota de la mesa {tableLabel}</DialogTitle>
            <DialogDescription>Todo el equipo la ve en la caja y en el pedido.</DialogDescription>
          </DialogHeader>
          <Field label="Nombre del cliente" hint="Opcional">
            {(p) => <TextInput {...p} value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej. Familia Rojas" autoComplete="off" />}
          </Field>
          <div className="space-y-1.5">
            <p className="text-[13px] font-semibold">Ocasión</p>
            <ChipSelect
              label="Ocasión"
              value={occasion}
              onChange={setOccasion}
              options={[
                { value: "ninguna", label: "Ninguna" },
                ...(Object.keys(OCCASION) as (keyof typeof OCCASION)[]).map((k) => {
                  const Icon = OCCASION[k].icon;
                  return { value: k, label: <><Icon className="size-3.5" aria-hidden /> {OCCASION[k].label}</> };
                }),
              ]}
            />
          </div>
          <Field label="Nota" hint="Alergias, preferencias, pedidos especiales.">
            {(p) => <TextArea {...p} value={text} onChange={(e) => setText(e.target.value)} placeholder="Ej. Sin maní en ningún plato" />}
          </Field>
          <DialogFooter>
            {note && (
              <Button type="button" variant="ghost" className="mr-auto" onClick={() => onSave(null)}>
                Borrar nota
              </Button>
            )}
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">Guardar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
