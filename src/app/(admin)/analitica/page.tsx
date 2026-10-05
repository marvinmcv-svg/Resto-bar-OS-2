"use client";

import { useState } from "react";
import { HandCoins, Receipt, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { ChipSelect } from "@/components/app/form";
import { Panel, PanelHeader } from "@/components/app/panel";
import { PageBody, PageHeader } from "@/components/app/page-header";
import { StatTile } from "@/components/app/stat-tile";
import { BarSeries } from "@/components/analytics/bar-series";
import { ItemImage } from "@/components/pos/item-image";
import {
  changePct, menuEngineering, periodWithPrevious, QUADRANT_LABEL, staffRanking, totals, weekdayAverages, type DaySales, type Quadrant,
} from "@/modules/analytics/analytics";
import { dateKey } from "@/modules/hr/time";
import { recipeCostMinor } from "@/modules/inventory/inventory";
import { formatBs } from "@/modules/pos/money";
import { ROLE_LABEL } from "@/modules/pos/permissions";
import { useNow, useStore } from "@/modules/pos/store";
import { cn } from "@/lib/utils";

const DAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

export default function AnaliticaPage() {
  const { state, itemById, staffById } = useStore();
  const now = useNow(60000);
  const [range, setRange] = useState<"7" | "30">("7");
  const n = Number(range);

  // Today is live; earlier days are closed totals.
  const today: DaySales = {
    date: dateKey(new Date(now)),
    salesMinor: state.history.reduce((s, o) => s + o.totalMinor, 0),
    orders: state.history.length,
    tipsMinor: state.history.reduce((s, o) => s + o.tipMinor, 0),
  };
  const days = [...state.salesDays.filter((d) => d.date !== today.date), today];
  const { current, previous } = periodWithPrevious(days, n);
  const cur = totals(current);
  const prev = totals(previous);
  const salesChange = changePct(cur.salesMinor, prev.salesMinor);
  const weekday = weekdayAverages(days);
  const bestDay = weekday.indexOf(Math.max(...weekday));

  // Menu engineering from today's sales and recipe costs.
  const byItem = new Map<string, { qty: number; revenueMinor: number }>();
  for (const o of state.history)
    for (const it of o.items) {
      const cur2 = byItem.get(it.itemId) ?? { qty: 0, revenueMinor: 0 };
      byItem.set(it.itemId, { qty: cur2.qty + it.qty, revenueMinor: cur2.revenueMinor + it.totalMinor });
    }
  const perf = [...byItem.entries()]
    .filter(([id]) => state.recipes[id])
    .map(([itemId, v]) => {
      const price = itemById(itemId)?.priceMinor ?? 0;
      return { itemId, ...v, unitMarginMinor: price - recipeCostMinor(state.recipes[itemId], state.ingredients) };
    });
  const quadrants = menuEngineering(perf);
  const staff = staffRanking(state.history);
  const topSales = staff[0]?.salesMinor ?? 1;

  return (
    <PageBody wide>
      <PageHeader
        eyebrow={`Últimos ${n} días`}
        title="Analítica"
        description="Cómo van las ventas, qué platos te conviene empujar y quién vende más."
        actions={
          <ChipSelect
            label="Período"
            value={range}
            onChange={setRange}
            options={[
              { value: "7", label: "7 días" },
              { value: "30", label: "30 días" },
            ]}
          />
        }
      />

      <div className="mt-7 grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatTile
          icon={salesChange !== null && salesChange < 0 ? TrendingDown : TrendingUp}
          label="Ventas"
          value={formatBs(cur.salesMinor)}
          note={salesChange === null ? "Sin período anterior" : `${salesChange >= 0 ? "↑" : "↓"} ${Math.abs(salesChange)}% vs ${n} días anteriores`}
          tone={salesChange === null ? undefined : salesChange >= 0 ? "good" : "bad"}
        />
        <StatTile icon={Receipt} label="Cuentas" value={cur.orders.toLocaleString("es-BO")} note={`${Math.round(cur.orders / n)} por día`} />
        <StatTile icon={Wallet} label="Ticket promedio" value={formatBs(cur.avgTicketMinor)} note={`Antes ${formatBs(prev.avgTicketMinor)}`} />
        <StatTile icon={HandCoins} label="Propinas" value={formatBs(cur.tipsMinor)} />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-12">
        <Panel className="lg:col-span-8">
          <PanelHeader title="Ventas por día" subtitle="Hoy en color sólido" />
          <BarSeries
            label="Ventas por día"
            every={n > 7 ? 3 : 1}
            bars={current.map((d) => {
              const [y, m, dd] = d.date.split("-").map(Number);
              const dt = new Date(y, m - 1, dd);
              return {
                key: d.date,
                label: n > 7 ? String(dd) : DAYS[(dt.getDay() + 6) % 7],
                detail: dt.toLocaleDateString("es-BO", { weekday: "long", day: "numeric", month: "short" }),
                valueMinor: d.salesMinor,
                highlight: d.date === today.date,
              };
            })}
          />
        </Panel>
        <Panel className="lg:col-span-4">
          <PanelHeader title="Promedio por día de la semana" subtitle={`El mejor día es el ${DAYS[bestDay].toLowerCase()}`} />
          <BarSeries
            label="Promedio de ventas por día de la semana"
            height={150}
            bars={weekday.map((v, i) => ({ key: DAYS[i], label: DAYS[i], detail: `Promedio ${DAYS[i]}`, valueMinor: v, highlight: i === bestDay }))}
          />
        </Panel>
      </div>

      <Panel className="mt-4">
        <PanelHeader title="Ingeniería de menú" subtitle="Ventas de hoy contra el margen de cada plato (según su receta)" />
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {(["estrella", "caballo", "enigma", "perro"] as Quadrant[]).map((q) => {
            const items = perf.filter((p) => quadrants.get(p.itemId) === q).sort((a, b) => b.qty - a.qty);
            return (
              <section
                key={q}
                className={cn("rounded-[18px] border p-4", q === "estrella" && "border-status-good/40 bg-status-good/[0.05]", q === "perro" && "border-status-critical/30 bg-status-critical/[0.04]")}
                aria-label={QUADRANT_LABEL[q].name}
              >
                <h3 className="text-[14px] font-semibold">
                  {QUADRANT_LABEL[q].name} <span className="font-normal text-muted-foreground">· {items.length}</span>
                </h3>
                <p className="mt-0.5 text-[12.5px] text-muted-foreground">{QUADRANT_LABEL[q].action}</p>
                <ul className="mt-3 space-y-2">
                  {items.length === 0 && <li className="text-[12.5px] text-muted-foreground">Ninguno.</li>}
                  {items.map((p) => {
                    const item = itemById(p.itemId);
                    return (
                      <li key={p.itemId} className="flex items-center gap-2.5 text-[13px]">
                        {item && <ItemImage item={item} className="size-8 shrink-0 rounded-lg" sizes="32px" />}
                        <span className="min-w-0 flex-1 truncate font-medium">{item?.name}</span>
                        <span className="text-muted-foreground tabular">{p.qty} vendidos</span>
                        <span className="w-24 text-right tabular">{formatBs(p.unitMarginMinor)}/u</span>
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}
        </div>
      </Panel>

      <Panel className="mt-4">
        <PanelHeader title="Ventas por mesero" subtitle="Hoy" />
        <ul className="space-y-3">
          {staff.map((r) => {
            const p = staffById(r.staffId);
            return (
              <li key={r.staffId} className="grid grid-cols-[120px_1fr_auto] items-center gap-3 text-[13px] sm:grid-cols-[160px_1fr_auto]">
                <span>
                  <span className="block font-semibold">{p?.name}</span>
                  <span className="block text-[11.5px] text-muted-foreground">{p ? ROLE_LABEL[p.role] : ""}</span>
                </span>
                <span className="h-2.5 overflow-hidden rounded-full bg-secondary" aria-hidden>
                  <span className="block h-full rounded-full bg-primary" style={{ width: `${(r.salesMinor / topSales) * 100}%` }} />
                </span>
                <span className="text-right tabular">
                  <span className="block font-semibold">{formatBs(r.salesMinor)}</span>
                  <span className="block text-[11.5px] text-muted-foreground">
                    {r.orders} cuentas · ticket {formatBs(r.avgTicketMinor)} · propinas {formatBs(r.tipsMinor)}
                  </span>
                </span>
              </li>
            );
          })}
        </ul>
      </Panel>
    </PageBody>
  );
}
