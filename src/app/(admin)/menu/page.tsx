"use client";

import { useMemo, useState } from "react";
import { ChevronRight, FolderPlus, Plus, RotateCcw, Search, Star } from "lucide-react";
import { toast } from "sonner";
import { ChipSelect, Field, TextInput } from "@/components/app/form";
import { Panel } from "@/components/app/panel";
import { ItemEditorSheet } from "@/components/menu/item-editor-sheet";
import { CATEGORY_ICON_KEYS, CATEGORY_ICON_LABEL, CategoryIcon } from "@/components/pos/category-icon";
import { ItemImage } from "@/components/pos/item-image";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { formatBs } from "@/modules/pos/money";
import { newId, useStore } from "@/modules/pos/store";
import type { MenuItem, Station } from "@/modules/pos/types";
import { cn } from "@/lib/utils";

export default function MenuPage() {
  const { state, dispatch, activeMenu } = useStore();
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<string>("todas");
  const [editing, setEditing] = useState<MenuItem | "new" | null>(null);
  const [removing, setRemoving] = useState<MenuItem | null>(null);
  const [newCat, setNewCat] = useState(false);

  const out = activeMenu.filter((m) => state.unavailable.includes(m.id)).length;
  const archived = state.menu.filter((m) => m.archived);
  const q = query.trim().toLowerCase();
  const visible = useMemo(
    () => activeMenu.filter((m) => (cat === "todas" || m.categoryId === cat) && (!q || m.name.toLowerCase().includes(q))),
    [activeMenu, cat, q],
  );
  const categories = state.categories.filter((c) => visible.some((m) => m.categoryId === c.id));

  const remove = (item: MenuItem) => {
    dispatch({ type: "archiveItem", itemId: item.id, archived: true });
    setRemoving(null);
    setEditing(null);
    toast(`${item.name} quitado del menú`, {
      description: "Ya no aparece en la caja. Las ventas pasadas no cambian.",
      action: { label: "Deshacer", onClick: () => dispatch({ type: "archiveItem", itemId: item.id, archived: false }) },
    });
  };

  return (
    <div className="mx-auto max-w-[980px] px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
      <header className="animate-enter flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[13px] font-medium text-muted-foreground">
            {activeMenu.length} productos · {out} {out === 1 ? "agotado" : "agotados"}
          </p>
          <h1 className="mt-1 text-[28px] font-semibold sm:text-[34px]">Menú</h1>
          <p className="mt-2 max-w-xl text-[15px] text-muted-foreground">
            Agrega, edita o quita productos. Cada cambio llega al instante a la caja y a los celulares de tus meseros.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="lg" onClick={() => setNewCat(true)}>
            <FolderPlus /> Categoría
          </Button>
          <Button size="lg" onClick={() => setEditing("new")}>
            <Plus /> Nuevo producto
          </Button>
        </div>
      </header>

      <div className="animate-enter mt-7 space-y-3">
        <label className="relative block">
          <span className="sr-only">Buscar en el menú</span>
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-[18px] -translate-y-1/2 text-muted-foreground" aria-hidden />
          <TextInput value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar producto" className="pl-10" />
        </label>
        <div className="no-scrollbar -mx-4 overflow-x-auto px-4">
          <ChipSelect
            label="Filtrar por categoría"
            className="flex-nowrap"
            value={cat}
            onChange={setCat}
            options={[
              { value: "todas", label: "Todas" },
              ...state.categories.map((c) => ({
                value: c.id,
                label: (
                  <>
                    <CategoryIcon icon={c.icon} className="size-3.5" /> {c.name}
                  </>
                ),
              })),
            ]}
          />
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {categories.length === 0 && (
          <Panel className="py-12 text-center">
            <p className="text-[15px] font-semibold">Nada coincide con “{query}”</p>
            <p className="mt-1 text-[14px] text-muted-foreground">Prueba con otra palabra o agrégalo como producto nuevo.</p>
            <Button className="mt-5" onClick={() => setEditing("new")}>
              <Plus /> Nuevo producto
            </Button>
          </Panel>
        )}
        {categories.map((c) => (
          <Panel key={c.id} className="animate-enter p-2 sm:p-2">
            <div className="flex items-center gap-2.5 px-4 pt-3 pb-2">
              <CategoryIcon icon={c.icon} className="size-[18px] text-primary" />
              <h2 className="text-[15px] font-semibold">{c.name}</h2>
              <span className="text-xs text-muted-foreground">· {c.station === "cocina" ? "Cocina" : "Barra"}</span>
            </div>
            <ul className="divide-y">
              {visible
                .filter((m) => m.categoryId === c.id)
                .map((m) => {
                  const available = !state.unavailable.includes(m.id);
                  return (
                    <li key={m.id} className="flex items-center gap-2 pr-3">
                      <button
                        onClick={() => setEditing(m)}
                        className="press flex min-w-0 flex-1 items-center gap-3.5 rounded-[14px] px-4 py-3 text-left hover:bg-accent"
                        aria-label={`Editar ${m.name}`}
                      >
                        <ItemImage item={m} className={cn("size-12 shrink-0 rounded-xl", !available && "opacity-50")} sizes="48px" />
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-1.5">
                            <span className="truncate text-[14px] font-medium">{m.name}</span>
                            {m.popular && <Star className="size-3.5 shrink-0 fill-primary text-primary" aria-label="Popular" />}
                          </span>
                          <span className="block truncate text-[13px] text-muted-foreground">
                            {m.description ?? (m.modifierGroups.length > 0 ? m.modifierGroups.map((g) => g.name).join(" · ") : "Sin opciones")}
                          </span>
                        </span>
                        <span className="text-[14px] font-medium tabular">{formatBs(m.priceMinor)}</span>
                        <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                      </button>
                      <label className="flex items-center gap-2.5 text-[13px] text-muted-foreground">
                        <span className="hidden w-[68px] text-right sm:inline">{available ? "Disponible" : "Agotado"}</span>
                        <Switch
                          checked={available}
                          aria-label={`${m.name} disponible`}
                          onCheckedChange={() => {
                            dispatch({ type: "toggleAvailable", itemId: m.id });
                            toast(available ? `${m.name} agotado` : `${m.name} disponible otra vez`);
                          }}
                        />
                      </label>
                    </li>
                  );
                })}
            </ul>
          </Panel>
        ))}

        {archived.length > 0 && (
          <Panel className="p-2 sm:p-2">
            <div className="px-4 pt-3 pb-2">
              <h2 className="text-[15px] font-semibold">Quitados del menú</h2>
              <p className="text-[13px] text-muted-foreground">Se guardan para tus reportes. Puedes volver a ponerlos.</p>
            </div>
            <ul className="divide-y">
              {archived.map((m) => (
                <li key={m.id} className="flex items-center gap-3.5 px-4 py-3">
                  <ItemImage item={m} className="size-10 shrink-0 rounded-xl opacity-60 grayscale" sizes="40px" />
                  <span className="min-w-0 flex-1 truncate text-[14px] text-muted-foreground">{m.name}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      dispatch({ type: "archiveItem", itemId: m.id, archived: false });
                      toast.success(`${m.name} volvió al menú`);
                    }}
                  >
                    <RotateCcw /> Restaurar
                  </Button>
                </li>
              ))}
            </ul>
          </Panel>
        )}
      </div>

      <ItemEditorSheet
        item={editing}
        defaultCategoryId={cat !== "todas" ? cat : undefined}
        onClose={() => setEditing(null)}
        onRemove={(m) => setRemoving(m)}
      />

      <Dialog open={!!removing} onOpenChange={(v) => !v && setRemoving(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-xl">¿Quitar {removing?.name} del menú?</DialogTitle>
            <DialogDescription>
              Deja de aparecer en la caja y en los celulares. Las ventas pasadas y los reportes no cambian, y puedes restaurarlo cuando
              quieras.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRemoving(null)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={() => removing && remove(removing)}>
              Quitar del menú
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <NewCategoryDialog open={newCat} onClose={() => setNewCat(false)} onCreated={(id) => setCat(id)} />
    </div>
  );
}

function NewCategoryDialog({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: (id: string) => void }) {
  const { state, dispatch } = useStore();
  const [name, setName] = useState("");
  const [station, setStation] = useState<Station>("cocina");
  const [icon, setIcon] = useState("utensils");
  const [tried, setTried] = useState(false);
  const error = !name.trim()
    ? "Escribe un nombre."
    : state.categories.some((c) => c.name.toLowerCase() === name.trim().toLowerCase())
      ? "Ya existe esa categoría."
      : undefined;

  const close = () => {
    setName("");
    setStation("cocina");
    setIcon("utensils");
    setTried(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && close()}>
      <DialogContent className="sm:max-w-md">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setTried(true);
            if (error) return;
            const id = newId();
            dispatch({ type: "upsertCategory", category: { id, name: name.trim(), station, icon } });
            toast.success(`Categoría ${name.trim()} creada`);
            onCreated(id);
            close();
          }}
          className="space-y-5"
        >
          <DialogHeader>
            <DialogTitle className="text-xl">Nueva categoría</DialogTitle>
            <DialogDescription>Define a qué impresora o pantalla van sus pedidos.</DialogDescription>
          </DialogHeader>
          <Field label="Nombre" error={tried ? error : undefined}>
            {(p) => <TextInput {...p} value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej. Vinos" autoFocus />}
          </Field>
          <div className="space-y-1.5">
            <p className="text-[13px] font-semibold">Sale por</p>
            <ChipSelect
              label="Estación"
              value={station}
              onChange={setStation}
              options={[
                { value: "cocina", label: "Cocina" },
                { value: "barra", label: "Barra" },
              ]}
            />
          </div>
          <div className="space-y-1.5">
            <p className="text-[13px] font-semibold">Ícono</p>
            <ChipSelect
              label="Ícono"
              value={icon}
              onChange={setIcon}
              options={CATEGORY_ICON_KEYS.map((k) => ({ value: k, label: <CategoryIcon icon={k} className="size-4" />, ariaLabel: CATEGORY_ICON_LABEL[k] }))}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={close}>
              Cancelar
            </Button>
            <Button type="submit">Crear categoría</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
