"use client";

import { toast } from "sonner";
import { Panel } from "@/components/app/panel";
import { CategoryIcon } from "@/components/pos/category-icon";
import { ItemImage } from "@/components/pos/item-image";
import { Switch } from "@/components/ui/switch";
import { CATEGORIES, MENU } from "@/modules/pos/demo-data";
import { formatBs } from "@/modules/pos/money";
import { useStore } from "@/modules/pos/store";

export default function MenuPage() {
  const { state, dispatch } = useStore();
  const out = state.unavailable.length;
  return (
    <div className="mx-auto max-w-[960px] px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
      <header className="animate-enter">
        <p className="text-[13px] font-medium text-muted-foreground">
          {MENU.length} productos · {out} {out === 1 ? "agotado" : "agotados"}
        </p>
        <h1 className="mt-1 text-[28px] font-semibold sm:text-[34px]">Menú</h1>
        <p className="mt-2 max-w-xl text-[15px] text-muted-foreground">
          Marca un producto como agotado y desaparece al instante de todas las cajas y celulares de tus meseros.
        </p>
      </header>
      <div className="mt-8 space-y-4">
        {CATEGORIES.map((c) => (
          <Panel key={c.id} className="animate-enter p-2 sm:p-2">
            <div className="flex items-center gap-2.5 px-4 pt-3 pb-2">
              <CategoryIcon icon={c.icon} className="size-[18px] text-primary" />
              <h2 className="text-[15px] font-semibold">{c.name}</h2>
              <span className="text-xs text-muted-foreground">· {c.station === "cocina" ? "Cocina" : "Barra"}</span>
            </div>
            <ul className="divide-y">
              {MENU.filter((m) => m.categoryId === c.id).map((m) => {
                const available = !state.unavailable.includes(m.id);
                return (
                  <li key={m.id} className="flex items-center gap-3.5 px-4 py-3">
                    <ItemImage item={m} className="size-12 shrink-0 rounded-xl" sizes="48px" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14px] font-medium">{m.name}</p>
                      <p className="text-[13px] text-muted-foreground">
                        {m.modifierGroups.length > 0 ? m.modifierGroups.map((g) => g.name).join(" · ") : "Sin opciones"}
                      </p>
                    </div>
                    <span className="text-[14px] font-medium tabular">{formatBs(m.priceMinor)}</span>
                    <label className="flex items-center gap-2.5 pl-2 text-[13px] text-muted-foreground">
                      <span className="hidden w-16 text-right sm:inline">{available ? "Disponible" : "Agotado"}</span>
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
      </div>
    </div>
  );
}
