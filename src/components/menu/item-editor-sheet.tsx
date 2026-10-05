"use client";

import { useEffect, useState } from "react";
import { Check, ImageOff, Trash2 } from "lucide-react";
import { ChipSelect, Field, TextArea, TextInput } from "@/components/app/form";
import { CategoryIcon } from "@/components/pos/category-icon";
import { ItemImage } from "@/components/pos/item-image";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { MENU } from "@/modules/pos/demo-data";
import { minorToInput, parseBsInput } from "@/modules/pos/money";
import { newId, useStore } from "@/modules/pos/store";
import type { MenuItem } from "@/modules/pos/types";
import { cn } from "@/lib/utils";

/** Photos bundled with the demo. Real restaurants upload their own (Supabase Storage). */
const PHOTOS = [...new Set(MENU.map((m) => m.image).filter((x): x is string => !!x))];

interface Draft {
  name: string;
  price: string;
  categoryId: string;
  description: string;
  image?: string;
  popular: boolean;
}

/** Create or edit a menu item. `item === null` closes; `item === "new"` creates. */
export function ItemEditorSheet({
  item, defaultCategoryId, onClose, onRemove,
}: {
  item: MenuItem | "new" | null;
  defaultCategoryId?: string;
  onClose: () => void;
  onRemove: (item: MenuItem) => void;
}) {
  const { state, dispatch } = useStore();
  const editing = item && item !== "new" ? item : null;
  const [draft, setDraft] = useState<Draft | null>(null);
  const [tried, setTried] = useState(false);

  useEffect(() => {
    if (!item) return;
    setTried(false);
    setDraft(
      editing
        ? {
            name: editing.name, price: minorToInput(editing.priceMinor), categoryId: editing.categoryId,
            description: editing.description ?? "", image: editing.image, popular: !!editing.popular,
          }
        : { name: "", price: "", categoryId: defaultCategoryId ?? state.categories[0]?.id ?? "", description: "", popular: false },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset only when a different item opens
  }, [item]);

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setDraft((d) => (d ? { ...d, [k]: v } : d));
  const priceMinor = draft ? parseBsInput(draft.price) : null;
  const nameError = draft && !draft.name.trim() ? "Escribe el nombre como sale en la carta." : undefined;
  const priceError = draft && (priceMinor === null || priceMinor <= 0) ? "Escribe un precio, por ejemplo 45 o 12,50." : undefined;
  const duplicate =
    draft && state.menu.some((m) => !m.archived && m.id !== editing?.id && m.name.trim().toLowerCase() === draft.name.trim().toLowerCase());

  const save = () => {
    setTried(true);
    if (!draft || nameError || priceError || priceMinor === null) return;
    const base: MenuItem = editing ?? { id: newId(), categoryId: draft.categoryId, name: "", priceMinor: 0, modifierGroups: [], available: true };
    dispatch({
      type: "upsertItem",
      item: {
        ...base,
        name: draft.name.trim(),
        priceMinor,
        categoryId: draft.categoryId,
        description: draft.description.trim() || undefined,
        image: draft.image,
        popular: draft.popular,
      },
    });
    onClose();
  };

  const preview: MenuItem | null = draft
    ? { id: "preview", name: draft.name || "Nuevo producto", categoryId: draft.categoryId, priceMinor: priceMinor ?? 0, image: draft.image, modifierGroups: [], available: true }
    : null;

  return (
    <Sheet open={!!item} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-[460px]" onOpenAutoFocus={(e) => e.preventDefault()}>
        <SheetHeader className="border-b px-6 pt-6 pb-4">
          <SheetTitle className="text-[20px]">{editing ? "Editar producto" : "Nuevo producto"}</SheetTitle>
          <SheetDescription>Los cambios llegan al instante a la caja y a los celulares del equipo.</SheetDescription>
        </SheetHeader>

        {draft && preview && (
          <form
            id="item-editor"
            className="flex-1 space-y-5 overflow-y-auto px-6 py-5"
            onSubmit={(e) => {
              e.preventDefault();
              save();
            }}
          >
            <div className="flex items-center gap-4 rounded-[18px] border bg-secondary/50 p-3">
              <ItemImage item={preview} className="size-16 shrink-0 rounded-[14px]" sizes="64px" />
              <div className="min-w-0">
                <p className="truncate text-[15px] font-semibold">{preview.name}</p>
                <p className="text-[14px] font-semibold text-primary tabular">
                  {priceMinor ? `Bs ${minorToInput(priceMinor)}` : "Bs —"}
                </p>
              </div>
            </div>

            <Field label="Nombre" error={tried ? nameError : undefined} hint={duplicate ? "Ya hay un producto con este nombre." : undefined}>
              {(p) => (
                <TextInput {...p} value={draft.name} onChange={(e) => set("name", e.target.value)} placeholder="Ej. Api con pastel" autoComplete="off" />
              )}
            </Field>

            <Field label="Precio (Bs)" error={tried ? priceError : undefined} hint="IVA incluido, como en la carta.">
              {(p) => (
                <TextInput
                  {...p}
                  inputMode="decimal"
                  value={draft.price}
                  onChange={(e) => set("price", e.target.value)}
                  placeholder="45"
                  className="tabular"
                />
              )}
            </Field>

            <div className="space-y-1.5">
              <p className="text-[13px] font-semibold">Categoría</p>
              <ChipSelect
                label="Categoría"
                value={draft.categoryId}
                onChange={(v) => set("categoryId", v)}
                options={state.categories.map((c) => ({
                  value: c.id,
                  label: (
                    <>
                      <CategoryIcon icon={c.icon} className="size-3.5" /> {c.name}
                    </>
                  ),
                }))}
              />
              <p className="text-[12px] text-muted-foreground">
                Sale por {state.categories.find((c) => c.id === draft.categoryId)?.station === "barra" ? "la barra" : "cocina"}.
              </p>
            </div>

            <Field label="Descripción" hint="Opcional. Ayuda a los meseros a recomendar.">
              {(p) => (
                <TextArea {...p} value={draft.description} onChange={(e) => set("description", e.target.value)} placeholder="Ej. Morado, con canela y clavo." />
              )}
            </Field>

            <div className="space-y-2">
              <p className="text-[13px] font-semibold">Foto</p>
              <div className="grid grid-cols-5 gap-2" role="radiogroup" aria-label="Foto">
                <button
                  type="button"
                  role="radio"
                  aria-checked={!draft.image}
                  aria-label="Sin foto"
                  onClick={() => set("image", undefined)}
                  className={cn(
                    "press grid aspect-square place-items-center rounded-xl border bg-secondary text-muted-foreground",
                    !draft.image && "ring-2 ring-primary ring-offset-2 ring-offset-background",
                  )}
                >
                  <ImageOff className="size-5" aria-hidden />
                </button>
                {PHOTOS.map((src) => (
                  <button
                    key={src}
                    type="button"
                    role="radio"
                    aria-checked={draft.image === src}
                    aria-label={`Foto ${src.split("/").pop()?.replace(/\.\w+$/, "").replace(/-/g, " ")}`}
                    onClick={() => set("image", src)}
                    className={cn(
                      "press relative aspect-square overflow-hidden rounded-xl",
                      draft.image === src && "ring-2 ring-primary ring-offset-2 ring-offset-background",
                    )}
                  >
                    <ItemImage item={{ ...preview, image: src }} className="absolute inset-0" sizes="72px" />
                    {draft.image === src && (
                      <span className="absolute top-1 right-1 grid size-5 place-items-center rounded-full bg-primary text-primary-foreground">
                        <Check className="size-3" aria-hidden />
                      </span>
                    )}
                  </button>
                ))}
              </div>
              <p className="text-[12px] text-muted-foreground">En tu local, subes la foto desde el celular.</p>
            </div>

            <label className="flex items-center justify-between gap-4 rounded-[16px] border px-4 py-3">
              <span>
                <span className="block text-[14px] font-medium">Destacar en Populares</span>
                <span className="block text-[12px] text-muted-foreground">Aparece primero en la caja y en las sugerencias.</span>
              </span>
              <Switch checked={draft.popular} onCheckedChange={(v) => set("popular", v)} />
            </label>

            {editing && editing.modifierGroups.length > 0 && (
              <p className="text-[12px] text-muted-foreground">
                Opciones: {editing.modifierGroups.map((g) => g.name).join(" · ")}. Se mantienen al guardar.
              </p>
            )}
          </form>
        )}

        <div className="flex items-center gap-2 border-t px-6 py-4">
          {editing && (
            <Button type="button" variant="ghost" className="text-status-critical hover:text-status-critical" onClick={() => onRemove(editing)}>
              <Trash2 /> Quitar del menú
            </Button>
          )}
          <span className="flex-1" />
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form="item-editor">
            {editing ? "Guardar" : "Agregar al menú"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
