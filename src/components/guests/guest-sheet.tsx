"use client";

import { useEffect, useState } from "react";
import { MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { Field, TextArea, TextInput } from "@/components/app/form";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { averageTicketMinor, normalizePhone, TAG_LABEL, whatsappLink, type Guest, type GuestTag } from "@/modules/guests/guests";
import { formatBs } from "@/modules/pos/money";
import { newId, useStore } from "@/modules/pos/store";
import { cn } from "@/lib/utils";

/** Create or edit a guest. `guest === "new"` creates. */
export function GuestSheet({ guest, onClose }: { guest: Guest | "new" | null; onClose: () => void }) {
  const { dispatch } = useStore();
  const editing = guest && guest !== "new" ? guest : null;
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [birthday, setBirthday] = useState("");
  const [tags, setTags] = useState<GuestTag[]>([]);
  const [notes, setNotes] = useState("");
  const [optIn, setOptIn] = useState(false);
  const [tried, setTried] = useState(false);

  useEffect(() => {
    if (!guest) return;
    setName(editing?.name ?? "");
    setPhone(editing?.phone ?? "");
    setBirthday(editing?.birthday ? editing.birthday.split("-").reverse().join("/") : "");
    setTags(editing?.tags ?? []);
    setNotes(editing?.notes ?? "");
    setOptIn(editing?.optIn ?? false);
    setTried(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset when another guest opens
  }, [guest]);

  const phoneNorm = phone.trim() ? normalizePhone(phone) : undefined;
  const bdMatch = birthday.trim().match(/^(\d{1,2})\/(\d{1,2})$/);
  const bd = bdMatch && Number(bdMatch[1]) >= 1 && Number(bdMatch[1]) <= 31 && Number(bdMatch[2]) >= 1 && Number(bdMatch[2]) <= 12
    ? `${bdMatch[2].padStart(2, "0")}-${bdMatch[1].padStart(2, "0")}`
    : undefined;
  const errors = {
    name: !name.trim() ? "Escribe el nombre." : undefined,
    phone: phoneNorm === null ? "Celular boliviano de 8 dígitos, ej. 70012345." : undefined,
    birthday: birthday.trim() && !bd ? "Día/mes, ej. 21/10." : undefined,
  };

  const save = () => {
    setTried(true);
    if (Object.values(errors).some(Boolean)) return;
    const g: Guest = {
      ...(editing ?? { id: newId(), visits: 0, spentMinor: 0, createdAt: Date.now() }),
      name: name.trim(), phone: phoneNorm ?? undefined, birthday: bd, tags, notes: notes.trim() || undefined, optIn: optIn && !!phoneNorm,
    };
    dispatch({ type: "upsertGuest", guest: g });
    toast.success(editing ? `${g.name} actualizado` : `${g.name} agregado`);
    onClose();
  };

  return (
    <Sheet open={!!guest} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-[460px]" onOpenAutoFocus={(e) => e.preventDefault()}>
        <SheetHeader className="border-b px-6 pt-6 pb-4">
          <SheetTitle className="text-[20px]">{editing ? editing.name : "Nuevo cliente"}</SheetTitle>
          <SheetDescription>
            {editing
              ? `${editing.visits} visitas · ${formatBs(editing.spentMinor)} en total · ticket ${formatBs(averageTicketMinor(editing))}`
              : "Sus visitas y consumo se suman solos cuando lo asignas a una mesa."}
          </SheetDescription>
        </SheetHeader>
        <form
          id="guest-form"
          className="flex-1 space-y-5 overflow-y-auto px-6 py-5"
          onSubmit={(e) => {
            e.preventDefault();
            save();
          }}
        >
          <Field label="Nombre" error={tried ? errors.name : undefined}>
            {(p) => <TextInput {...p} value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej. Gabriela Suárez" autoComplete="off" />}
          </Field>
          <div className="grid grid-cols-[3fr_2fr] gap-3">
            <Field label="Celular" error={tried ? errors.phone : undefined}>
              {(p) => <TextInput {...p} value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" placeholder="70012345" />}
            </Field>
            <Field label="Cumpleaños" error={tried ? errors.birthday : undefined} hint="Día/mes">
              {(p) => <TextInput {...p} value={birthday} onChange={(e) => setBirthday(e.target.value)} inputMode="numeric" placeholder="21/10" />}
            </Field>
          </div>
          <div className="space-y-1.5">
            <p className="text-[13px] font-semibold">Etiquetas</p>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Etiquetas">
              {(Object.keys(TAG_LABEL) as GuestTag[]).map((t) => {
                const on = tags.includes(t);
                return (
                  <button
                    key={t}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setTags(on ? tags.filter((x) => x !== t) : [...tags, t])}
                    className={cn(
                      "press h-9 rounded-full border px-3.5 text-[13px] font-medium",
                      on ? "border-primary bg-primary/12" : "bg-secondary text-muted-foreground",
                    )}
                  >
                    {TAG_LABEL[t]}
                  </button>
                );
              })}
            </div>
          </div>
          <Field label="Notas" hint="Preferencias, alergias, mesa favorita.">
            {(p) => <TextArea {...p} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Ej. Alergia al maní" />}
          </Field>
          <label className="flex items-center justify-between gap-4 rounded-[16px] border px-4 py-3">
            <span>
              <span className="block text-[14px] font-medium">Acepta promociones por WhatsApp</span>
              <span className="block text-[12px] text-muted-foreground">Solo le escribimos si dijo que sí.</span>
            </span>
            <Switch checked={optIn} onCheckedChange={setOptIn} disabled={!phoneNorm} />
          </label>
        </form>
        <div className="flex items-center gap-2 border-t px-6 py-4">
          {editing?.phone && (
            <Button asChild variant="ghost">
              <a href={whatsappLink(editing.phone, `Hola ${editing.name.split(" ")[0]}, `)} target="_blank" rel="noopener">
                <MessageCircle /> WhatsApp
              </a>
            </Button>
          )}
          <span className="flex-1" />
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form="guest-form">
            {editing ? "Guardar" : "Agregar"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
