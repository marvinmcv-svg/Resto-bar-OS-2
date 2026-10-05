"use client";

import { useMemo, useState } from "react";
import { Boxes, ChevronRight, Coins, MessageCircle, PackagePlus, Search, ShoppingCart, Trash2, TriangleAlert } from "lucide-react";
import { ChipSelect, TextInput } from "@/components/app/form";
import { PageBody, PageHeader, PillTabs } from "@/components/app/page-header";
import { StatTile } from "@/components/app/stat-tile";
import { RecipeSheet } from "@/components/inventory/recipe-sheet";
import { StockDialog } from "@/components/inventory/stock-dialog";
import { ItemImage } from "@/components/pos/item-image";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { whatsappLink } from "@/modules/guests/guests";
import {
  CATEGORY_LABEL, formatQty, isLow, marginPct, portionsLeft, recipeCostMinor, stockValueMinor, suggestedOrderMilli, wasteCostMinor,
  type Ingredient, type IngredientCategory, type StockMovement,
} from "@/modules/inventory/inventory";
import { formatBs } from "@/modules/pos/money";
import { can } from "@/modules/pos/permissions";
import { useNow, useStore } from "@/modules/pos/store";
import type { MenuItem } from "@/modules/pos/types";
import { cn } from "@/lib/utils";

type Tab = "stock" | "recetas" | "mermas" | "movimientos";
const DAY = 24 * 3600_000;
const when = (t: number) => new Date(t).toLocaleString("es-BO", { weekday: "short", day: "numeric", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });

export default function InventarioPage() {
  const { state, me, staffById } = useStore();
  const now = useNow(60000);
  const manage = can(me?.role, "inventory.manage");
  const [tab, setTab] = useState<Tab>("stock");
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<IngredientCategory | "todas">("todas");
  const [adjust, setAdjust] = useState<{ ing: Ingredient; kind?: "receive" | "count" | "waste" } | null>(null);
  const [recipe, setRecipe] = useState<MenuItem | null>(null);
  const [ordering, setOrdering] = useState(false);

  const ings = state.ingredients;
  const low = ings.filter(isLow);
  const value = ings.reduce((s, i) => s + stockValueMinor(i), 0);
  const waste7 = wasteCostMinor(state.stockMovements, now - 7 * DAY, now + 1);
  const q = query.trim().toLowerCase();
  const rows = useMemo(
    () =>
      ings
        .filter((i) => (cat === "todas" || i.category === cat) && (!q || i.name.toLowerCase().includes(q)))
        .sort((a, b) => Number(isLow(b)) - Number(isLow(a)) || a.name.localeCompare(b.name)),
    [ings, cat, q],
  );
  const supplier = (id: string) => state.suppliers.find((s) => s.id === id);
  const ingName = (id: string) => ings.find((i) => i.id === id);

  return (
    <PageBody wide>
      <PageHeader
        eyebrow={`${ings.length} insumos · ${formatBs(value)} en stock`}
        title="Inventario"
        description="Stock que baja solo con cada pedido, costo real de cada plato y control de mermas."
        actions={
          manage && (
            <Button size="lg" onClick={() => setOrdering(true)} disabled={low.length === 0}>
              <ShoppingCart /> Pedido sugerido{low.length ? ` (${low.length})` : ""}
            </Button>
          )
        }
      />

      <div className="mt-7 grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatTile icon={Boxes} label="Insumos" value={String(ings.length)} note={`${Object.keys(state.recipes).length} platos con receta`} />
        <StatTile icon={TriangleAlert} label="Stock bajo" value={String(low.length)} note={low.length ? "Hay que reponer" : "Todo en orden"} tone={low.length ? "bad" : "good"} />
        <StatTile icon={Coins} label="Valor en stock" value={formatBs(value)} note="A costo de compra" />
        <StatTile icon={Trash2} label="Mermas (7 días)" value={formatBs(waste7)} note="Vencido, quemado, roto" tone={waste7 > 0 ? "warn" : undefined} />
      </div>

      <div className="mt-6">
        <PillTabs
          label="Secciones de inventario"
          value={tab}
          onChange={setTab}
          tabs={[
            { id: "stock", label: "Stock" },
            { id: "recetas", label: "Recetas y costos" },
            { id: "mermas", label: "Mermas" },
            { id: "movimientos", label: "Movimientos" },
          ]}
        />
      </div>

      {tab === "stock" && (
        <section className="mt-5 overflow-hidden rounded-[22px] border bg-card shadow-card" aria-label="Stock de insumos">
          <div className="flex flex-wrap items-center gap-3 border-b px-5 py-4">
            <label className="relative min-w-[200px] flex-1">
              <span className="sr-only">Buscar insumo</span>
              <Search className="pointer-events-none absolute top-1/2 left-3.5 size-[18px] -translate-y-1/2 text-muted-foreground" aria-hidden />
              <TextInput value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar insumo" className="pl-10" />
            </label>
            <div className="no-scrollbar w-full min-w-0 overflow-x-auto">
              <ChipSelect
                label="Categoría"
                className="flex-nowrap"
                value={cat}
                onChange={setCat}
                options={[{ value: "todas" as const, label: "Todas" }, ...(Object.keys(CATEGORY_LABEL) as IngredientCategory[]).map((c) => ({ value: c, label: CATEGORY_LABEL[c] }))]}
              />
            </div>
          </div>
          <div className="relative overflow-x-auto">
            <table className="w-full min-w-[820px] text-[13.5px]">
              <thead>
                <tr className="border-b text-left text-[12px] text-muted-foreground">
                  <th scope="col" className="px-5 py-3 font-medium">Insumo</th>
                  <th scope="col" className="px-3 py-3 font-medium">Stock</th>
                  <th scope="col" className="px-3 py-3 text-right font-medium">Costo</th>
                  <th scope="col" className="px-3 py-3 text-right font-medium">Valor</th>
                  <th scope="col" className="px-3 py-3 font-medium">Proveedor</th>
                  <th scope="col" className="px-5 py-3 text-right font-medium"><span className="sr-only">Acciones</span></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((i) => {
                  const lowNow = isLow(i);
                  const pct = Math.min(100, (i.stockMilli / Math.max(1, i.parMilli * 2)) * 100);
                  return (
                    <tr key={i.id} className={cn("border-b last:border-0", lowNow && "bg-status-critical/[0.04]")}>
                      <th scope="row" className="px-5 py-3 text-left font-normal">
                        <span className="block text-[14px] font-semibold">{i.name}</span>
                        <span className="block text-[12px] text-muted-foreground">{CATEGORY_LABEL[i.category]}</span>
                      </th>
                      <td className="px-3 py-3">
                        <span className="flex items-center gap-2">
                          <span className="font-medium tabular">{formatQty(i.stockMilli, i.unit)}</span>
                          {lowNow && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-status-critical/12 px-2 py-0.5 text-[11px] font-semibold text-status-critical">
                              <TriangleAlert className="size-3" aria-hidden /> Bajo
                            </span>
                          )}
                        </span>
                        <span className="mt-1.5 block h-1.5 w-28 overflow-hidden rounded-full bg-secondary" aria-hidden>
                          <span className={cn("block h-full rounded-full", lowNow ? "bg-status-critical" : "bg-status-good")} style={{ width: `${pct}%` }} />
                        </span>
                        <span className="mt-1 block text-[11px] text-muted-foreground">Mínimo {formatQty(i.parMilli, i.unit)}</span>
                      </td>
                      <td className="px-3 py-3 text-right tabular">{formatBs(i.unitCostMinor)}<span className="text-muted-foreground">/{i.unit}</span></td>
                      <td className="px-3 py-3 text-right font-medium tabular">{formatBs(stockValueMinor(i))}</td>
                      <td className="px-3 py-3 text-muted-foreground">{supplier(i.supplierId)?.name}</td>
                      <td className="px-5 py-3 text-right whitespace-nowrap">
                        {manage && (
                          <Button variant="ghost" size="sm" onClick={() => setAdjust({ ing: i, kind: "receive" })} aria-label={`Ajustar ${i.name}`}>
                            <PackagePlus /> Ajustar
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" onClick={() => setAdjust({ ing: i, kind: "waste" })} aria-label={`Merma de ${i.name}`}>
                          <Trash2 /> Merma
                        </Button>
                      </td>
                    </tr>
                  );
                })}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-5 py-10 text-center text-muted-foreground">Nada coincide con la búsqueda.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {tab === "recetas" && (
        <section className="mt-5 overflow-hidden rounded-[22px] border bg-card shadow-card" aria-label="Recetas y costos">
          <p className="border-b px-5 py-3.5 text-[13px] text-muted-foreground">
            Costo por porción según tus precios de compra. Margen bajo el 60% en ámbar.
          </p>
          <ul className="divide-y">
            {state.menu
              .filter((m) => !m.archived)
              .map((m) => {
                const lines = state.recipes[m.id];
                const cost = recipeCostMinor(lines, ings);
                const margin = marginPct(m.priceMinor, cost);
                const left = portionsLeft(lines, ings);
                return (
                  <li key={m.id}>
                    <button
                      onClick={() => manage && setRecipe(m)}
                      disabled={!manage}
                      className="press flex w-full items-center gap-3.5 px-5 py-3 text-left enabled:hover:bg-accent"
                      aria-label={`Receta de ${m.name}`}
                    >
                      <ItemImage item={m} className="size-11 shrink-0 rounded-xl" sizes="44px" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[14px] font-semibold">{m.name}</span>
                        <span className="block truncate text-[12px] text-muted-foreground">
                          {lines ? `${lines.length} ingredientes · alcanza para ${left} porciones` : "Sin receta: no descuenta stock"}
                        </span>
                      </span>
                      <span className="hidden w-24 text-right text-[13px] text-muted-foreground tabular sm:block">{formatBs(m.priceMinor)}</span>
                      <span className="w-24 text-right text-[13px] tabular">{lines ? formatBs(cost) : "—"}</span>
                      <span
                        className={cn(
                          "w-16 text-right text-[14px] font-semibold tabular",
                          !lines && "text-muted-foreground",
                          lines && margin < 60 && "text-status-warning-ink",
                          lines && margin >= 60 && "text-status-good-ink",
                        )}
                      >
                        {lines ? `${margin}%` : "—"}
                      </span>
                      {manage && <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />}
                    </button>
                  </li>
                );
              })}
          </ul>
        </section>
      )}

      {tab === "mermas" && (
        <Ledger
          title="Mermas"
          empty="Sin mermas registradas."
          moves={state.stockMovements.filter((m) => m.kind === "waste")}
          ingName={ingName}
          who={(id) => staffById(id)?.name ?? ""}
          total={wasteCostMinor(state.stockMovements)}
        />
      )}
      {tab === "movimientos" && (
        <Ledger title="Movimientos de stock" empty="Sin movimientos." moves={state.stockMovements} ingName={ingName} who={(id) => staffById(id)?.name ?? ""} />
      )}

      {adjust && <StockDialog ingredient={adjust.ing} initialKind={adjust.kind} onClose={() => setAdjust(null)} />}
      <RecipeSheet item={recipe} onClose={() => setRecipe(null)} />
      <ReorderDialog open={ordering} onClose={() => setOrdering(false)} low={low} />
    </PageBody>
  );
}

const KIND_TEXT: Record<StockMovement["kind"], string> = { receive: "Compra", sale: "Venta", waste: "Merma", count: "Conteo" };

function Ledger({
  title, empty, moves, ingName, who, total,
}: {
  title: string;
  empty: string;
  moves: StockMovement[];
  ingName: (id: string) => Ingredient | undefined;
  who: (id: string) => string;
  total?: number;
}) {
  const list = [...moves].sort((a, b) => b.at - a.at).slice(0, 80);
  return (
    <section className="mt-5 rounded-[22px] border bg-card shadow-card" aria-label={title}>
      <div className="flex items-baseline justify-between border-b px-5 py-4">
        <h2 className="text-[15px] font-semibold">{title}</h2>
        {total !== undefined && <span className="text-[13px] text-muted-foreground tabular">Total {formatBs(total)}</span>}
      </div>
      {list.length === 0 ? (
        <p className="p-10 text-center text-[14px] text-muted-foreground">{empty}</p>
      ) : (
        <ul className="divide-y">
          {list.map((m) => {
            const ing = ingName(m.ingredientId);
            return (
              <li key={m.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-3 text-[13.5px]">
                <span className="w-[120px] text-muted-foreground capitalize tabular">{when(m.at)}</span>
                <span className="min-w-0 flex-1">
                  <span className="font-medium">{ing?.name}</span>
                  <span className="text-muted-foreground">
                    {" "}· {KIND_TEXT[m.kind]}
                    {m.reason && m.kind === "waste" ? ` · ${m.reason}` : ""} · {who(m.by)}
                  </span>
                </span>
                <span className={cn("font-semibold tabular", m.deltaMilli < 0 ? "text-status-critical" : "text-status-good-ink")}>
                  {m.deltaMilli > 0 ? "+" : "−"}
                  {ing ? formatQty(Math.abs(m.deltaMilli), ing.unit) : Math.abs(m.deltaMilli)}
                </span>
                {m.costMinor !== undefined && <span className="w-24 text-right text-muted-foreground tabular">{formatBs(m.costMinor)}</span>}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

/** Low items grouped by supplier, with a ready-to-send WhatsApp order per supplier. */
function ReorderDialog({ open, onClose, low }: { open: boolean; onClose: () => void; low: Ingredient[] }) {
  const { state } = useStore();
  const bySupplier = state.suppliers
    .map((s) => ({ s, items: low.filter((i) => i.supplierId === s.id) }))
    .filter((x) => x.items.length);
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl">Pedido sugerido</DialogTitle>
          <DialogDescription>Lo que está bajo el mínimo, hasta el doble del mínimo. Envíalo a cada proveedor por WhatsApp.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          {bySupplier.map(({ s, items }) => {
            const text = `Hola, soy de La Casona. Quisiera pedir:\n${items.map((i) => `• ${i.name}: ${formatQty(suggestedOrderMilli(i), i.unit)}`).join("\n")}\nGracias.`;
            const est = items.reduce((sum, i) => sum + Math.round((i.unitCostMinor * suggestedOrderMilli(i)) / 1000), 0);
            return (
              <div key={s.id} className="rounded-2xl border p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[15px] font-semibold">{s.name}</p>
                    <p className="text-[12px] text-muted-foreground">Aprox. {formatBs(est)}</p>
                  </div>
                  <Button asChild size="sm">
                    <a href={whatsappLink(s.phone, text)} target="_blank" rel="noopener">
                      <MessageCircle /> Pedir por WhatsApp
                    </a>
                  </Button>
                </div>
                <ul className="mt-3 space-y-1 text-[13.5px]">
                  {items.map((i) => (
                    <li key={i.id} className="flex justify-between gap-3">
                      <span>{i.name}</span>
                      <span className="tabular">
                        {formatQty(suggestedOrderMilli(i), i.unit)} <span className="text-muted-foreground">· hay {formatQty(i.stockMilli, i.unit)}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
