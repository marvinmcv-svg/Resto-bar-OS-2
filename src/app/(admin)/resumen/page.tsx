"use client";

import Link from "next/link";
import { ArrowDownRight, ArrowUpRight, Banknote, ChevronRight, Download, HandCoins, MessageCircle, Receipt, Send, ShieldAlert, Wallet } from "lucide-react";
import { toast } from "sonner";
import { Panel, PanelHeader } from "@/components/app/panel";
import { CategoryDonut, type DonutSlice } from "@/components/dashboard/category-donut";
import { HourlySalesChart, type HourPoint } from "@/components/dashboard/hourly-sales-chart";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { PaymentMix, type MixSlice } from "@/components/dashboard/payment-mix";
import { ServiceMeter } from "@/components/dashboard/service-meter";
import { ItemImage } from "@/components/pos/item-image";
import { StatusBadge } from "@/components/pos/status-badge";
import { Button } from "@/components/ui/button";
import { CATEGORIES, RESTAURANT, TABLES } from "@/modules/pos/demo-data";
import { formatBs, formatBsShort } from "@/modules/pos/money";
import { orderTotalMinor } from "@/modules/pos/order";
import { itemById, staffById, useNow, useStore } from "@/modules/pos/store";
import { tableStatus, type TableStatus } from "@/modules/pos/table-status";
import { cn } from "@/lib/utils";

const METHOD_LABEL = { qr: "QR", cash: "Efectivo", card_external: "Tarjeta", transfer: "Transferencia" } as const;
const METHOD_ORDER = ["qr", "cash", "card_external", "transfer"] as const;
const HOURS = Array.from({ length: 12 }, (_, i) => 11 + i);

function greeting(h: number) {
  if (h < 12) return "Buenos días";
  if (h < 19) return "Buenas tardes";
  return "Buenas noches";
}

export default function ResumenPage() {
  const { state } = useStore();
  const now = useNow();
  const date = new Date(now);
  const weekday = date.toLocaleDateString("es-BO", { weekday: "long" });

  const sales = state.history.reduce((s, o) => s + o.totalMinor, 0);
  const orders = state.history.length;
  const avg = orders ? Math.round(sales / orders) : 0;
  const tips = state.history.reduce((s, o) => s + o.tipMinor, 0);
  const tipped = state.history.filter((o) => o.tipMinor > 0).length;
  const delta = state.lastWeekTotalMinor ? (sales - state.lastWeekTotalMinor) / state.lastWeekTotalMinor : 0;
  const deltaPct = Math.round(delta * 100);

  const byHour = HOURS.map((hour) => state.history.filter((o) => new Date(o.closedAt).getHours() === hour));
  const hours: HourPoint[] = byHour.map((list, i) => ({
    hour: HOURS[i],
    totalMinor: list.reduce((s, o) => s + o.totalMinor, 0),
    orders: list.length,
  }));
  const series = {
    sales: hours.map((h) => h.totalMinor),
    orders: hours.map((h) => h.orders),
    avg: hours.map((h) => (h.orders ? h.totalMinor / h.orders : 0)),
    tips: byHour.map((list) => list.reduce((s, o) => s + o.tipMinor, 0)),
  };

  const mix: MixSlice[] = METHOD_ORDER.map((m, i) => ({
    key: m,
    label: METHOD_LABEL[m],
    valueMinor: state.history.filter((o) => o.method === m).reduce((s, o) => s + o.totalMinor, 0),
    color: `var(--chart-${i + 1})`,
  }));

  const byItem = new Map<string, { qty: number; totalMinor: number }>();
  const byCategory = new Map<string, number>();
  for (const o of state.history)
    for (const it of o.items) {
      const cur = byItem.get(it.itemId) ?? { qty: 0, totalMinor: 0 };
      byItem.set(it.itemId, { qty: cur.qty + it.qty, totalMinor: cur.totalMinor + it.totalMinor });
      const cat = itemById(it.itemId)?.categoryId ?? "otros";
      byCategory.set(cat, (byCategory.get(cat) ?? 0) + it.totalMinor);
    }
  const top = [...byItem.entries()].sort((a, b) => b[1].totalMinor - a[1].totalMinor).slice(0, 5);
  const topMax = top[0]?.[1].totalMinor ?? 1;
  const donut: DonutSlice[] = CATEGORIES.map((c, i) => ({
    key: c.id,
    label: c.name,
    valueMinor: byCategory.get(c.id) ?? 0,
    color: `var(--chart-${i + 1})`,
  }));

  const voidTotal = state.voids.reduce((s, v) => s + v.amountMinor, 0);
  const cashSales = mix.find((m) => m.key === "cash")?.valueMinor ?? 0;
  const expectedCash = state.openingCashMinor + cashSales;

  const live = state.live.filter((o) => o.lines.length > 0);
  const liveTotal = live.reduce((s, o) => s + orderTotalMinor(o), 0);
  const counts: Record<TableStatus, number> = { free: 0, occupied: 0, bill: 0, late: 0 };
  for (const t of TABLES) counts[tableStatus(state.live.find((o) => o.tableId === t.id), now)]++;

  const mixText = mix
    .filter((m) => m.valueMinor > 0)
    .map((m) => `${m.label} ${Math.round((m.valueMinor / (sales || 1)) * 100)}%`)
    .join(" · ");

  return (
    <div className="mx-auto max-w-[1320px] px-4 py-6 sm:px-6 lg:px-10 lg:py-9">
      <header className="animate-enter flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[13px] font-medium text-muted-foreground first-letter:uppercase">
            {date.toLocaleDateString("es-BO", { weekday: "long", day: "numeric", month: "long" })} · {RESTAURANT.location}
          </p>
          <h1 className="mt-1 text-[28px] font-semibold sm:text-[34px]">{greeting(date.getHours())}, Marvin</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="lg"
            onClick={() => toast.success("Reporte del día listo", { description: "En producción se descarga en PDF y Excel." })}
          >
            <Download /> Reporte
          </Button>
          <Button asChild size="lg">
            <Link href="/pos">
              Abrir punto de venta <ChevronRight />
            </Link>
          </Button>
        </div>
      </header>

      {/* KPI row */}
      <div className="mt-7 grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
        <KpiCard
          icon={Wallet}
          label="Ventas de hoy"
          value={formatBsShort(sales)}
          note={`${deltaPct >= 0 ? "+" : ""}${deltaPct}% vs el ${weekday} pasado`}
          trend={deltaPct >= 0 ? "up" : "down"}
          tone={deltaPct >= 0 ? "good" : "bad"}
          series={series.sales}
        />
        <KpiCard icon={Receipt} label="Cuentas cerradas" value={String(orders)} note={`${live.length} mesas abiertas ahora`} series={series.orders} />
        <KpiCard icon={Banknote} label="Ticket promedio" value={formatBsShort(avg)} note="por cuenta" series={series.avg} />
        <KpiCard icon={HandCoins} label="Propinas" value={formatBsShort(tips)} note={`en ${tipped} cuentas`} series={series.tips} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-12">
        <Panel className="animate-enter lg:col-span-8">
          <PanelHeader
            title="Ventas por hora"
            subtitle="Hoy, de 11:00 a 23:00"
            action={
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[12.5px] font-medium",
                  delta >= 0 ? "bg-status-good/12 text-[#0a7a0a] dark:text-status-good" : "bg-status-critical/12 text-status-critical",
                )}
              >
                {delta >= 0 ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}
                {deltaPct >= 0 ? "+" : ""}
                {deltaPct}%
              </span>
            }
          />
          <HourlySalesChart data={hours} />
        </Panel>

        <Panel className="animate-enter lg:col-span-4">
          <PanelHeader title="Ventas por categoría" subtitle="Lo que más pide tu gente" />
          <CategoryDonut slices={donut} centerLabel="vendido hoy" />
        </Panel>

        <Panel className="animate-enter lg:col-span-4">
          <PanelHeader
            title="Ahora en el local"
            subtitle={`${live.length} de ${TABLES.length} mesas ocupadas`}
            action={
              <Button asChild variant="ghost" size="sm">
                <Link href="/pos">
                  Salón <ChevronRight />
                </Link>
              </Button>
            }
          />
          <ServiceMeter counts={counts} />
          <div className="mt-5 flex items-baseline justify-between border-t pt-4">
            <span className="text-[13px] text-muted-foreground">Por cobrar</span>
            <span className="text-xl font-semibold tracking-[-0.02em] tabular">{formatBs(liveTotal)}</span>
          </div>
          <ul className="mt-2">
            {[...live]
              .sort((a, b) => a.openedAt - b.openedAt)
              .slice(0, 4)
              .map((o) => {
                const t = TABLES.find((x) => x.id === o.tableId)!;
                return (
                  <li key={o.id}>
                    <Link href={`/pos/mesa/${t.id}`} className="press -mx-2 flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-accent">
                      <span className="grid size-9 place-items-center rounded-xl bg-secondary text-[13px] font-semibold">{t.label}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[13px] font-medium tabular">{formatBs(orderTotalMinor(o))}</span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {staffById(o.waiterId)?.name} · {Math.floor((now - o.openedAt) / 60000)} min
                        </span>
                      </span>
                      {tableStatus(o, now) !== "occupied" && <StatusBadge status={tableStatus(o, now)} />}
                    </Link>
                  </li>
                );
              })}
          </ul>
        </Panel>

        <Panel className="animate-enter lg:col-span-4">
          <PanelHeader title="Lo más vendido" subtitle="Por ingresos de hoy" />
          <ol className="space-y-3.5">
            {top.map(([id, v], i) => {
              const it = itemById(id)!;
              return (
                <li key={id} className="flex items-center gap-3">
                  <span className="w-4 text-center text-[12px] font-semibold text-muted-foreground tabular">{i + 1}</span>
                  <ItemImage item={it} className="size-11 shrink-0 rounded-[12px]" sizes="44px" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2 text-[13px]">
                      <span className="truncate font-medium">{it.name}</span>
                      <span className="font-semibold tabular">{formatBsShort(v.totalMinor)}</span>
                    </div>
                    <div className="mt-1.5 flex items-center gap-2">
                      <div className="h-1.5 flex-1 rounded-full bg-muted">
                        <div className="h-full rounded-full bg-primary/85" style={{ width: `${(v.totalMinor / topMax) * 100}%` }} />
                      </div>
                      <span className="w-12 text-right text-xs text-muted-foreground tabular">{v.qty} u.</span>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        </Panel>

        <Panel className="animate-enter lg:col-span-4">
          <PanelHeader title="Cómo te pagaron" subtitle="Por método de cobro" />
          <PaymentMix slices={mix} />
        </Panel>
        <Panel className="animate-enter lg:col-span-5">
          <PanelHeader title="Control" subtitle="Anulaciones y caja del turno" />
          <div className="flex items-center gap-3 rounded-2xl bg-status-critical/8 p-3.5">
            <span className="grid size-9 place-items-center rounded-xl bg-status-critical/14 text-status-critical">
              <ShieldAlert className="size-[18px]" aria-hidden />
            </span>
            <div className="text-[13px]">
              <p className="font-semibold">
                {state.voids.length} {state.voids.length === 1 ? "anulación" : "anulaciones"} · {formatBs(voidTotal)}
              </p>
              <p className="text-muted-foreground">Todas con PIN de encargada</p>
            </div>
          </div>
          <ul className="mt-2">
            {[...state.voids]
              .reverse()
              .slice(0, 3)
              .map((v) => (
                <li key={v.id} className="flex gap-3 py-2 text-[13px]">
                  <span className="w-11 shrink-0 pt-px text-muted-foreground tabular">
                    {new Date(v.at).toLocaleTimeString("es-BO", { hour: "2-digit", minute: "2-digit", hourCycle: "h23" })}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">
                      {v.qty}× {v.itemName}
                    </span>
                    <span className="block truncate text-muted-foreground">
                      {staffById(v.waiterId)?.name} · Mesa {v.tableLabel} · {v.reason}
                    </span>
                  </span>
                  <span className="font-medium tabular">−{formatBs(v.amountMinor)}</span>
                </li>
              ))}
          </ul>
          <div className="mt-2 flex items-center justify-between border-t pt-4 text-[13px]">
            <span className="text-muted-foreground">Efectivo esperado en caja</span>
            <span className="font-semibold tabular">{formatBs(expectedCash)}</span>
          </div>
        </Panel>


        <Panel className="animate-enter lg:col-span-7">
          <div className="grid gap-6 md:grid-cols-[1fr_minmax(0,300px)] md:items-center">
            <div>
              <span className="inline-flex size-10 items-center justify-center rounded-[12px] bg-ember-soft text-primary">
                <MessageCircle className="size-5" aria-hidden />
              </span>
              <h2 className="mt-4 text-[20px] font-semibold">Tu cierre llega solo a WhatsApp</h2>
              <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground">
                Ventas, cobros, propinas y cada anulación con nombre y hora. Sabes qué pasó sin estar en el local.
              </p>
              <Button
                className="mt-5"
                variant="outline"
                onClick={() => toast.success("Cierre enviado", { description: "Demo: en producción lo envía n8n a tu WhatsApp." })}
              >
                <Send /> Enviar cierre de prueba
              </Button>
            </div>
            <div className="rounded-[20px] bg-muted p-3">
              <div className="rounded-2xl rounded-tr-md bg-card p-4 text-[13px] leading-relaxed shadow-card">
                <p className="font-semibold">Cierre · {RESTAURANT.name}</p>
                <p className="text-muted-foreground first-letter:uppercase">
                  {date.toLocaleDateString("es-BO", { weekday: "long", day: "numeric", month: "short" })}
                </p>
                <p className="mt-2">
                  Ventas: <b>{formatBs(sales)}</b> ({deltaPct >= 0 ? "+" : ""}
                  {deltaPct}%)
                </p>
                <p>
                  Cuentas: {orders} · Ticket: {formatBsShort(avg)}
                </p>
                <p>{mixText}</p>
                <p>Propinas: {formatBs(tips)}</p>
                <p className="mt-2">
                  ⚠️ {state.voids.length} anulaciones ({formatBs(voidTotal)})
                </p>
                <p>Caja esperada: {formatBs(expectedCash)}</p>
                <p className="mt-1 text-right text-[11px] text-muted-foreground">23:41 ✓✓</p>
              </div>
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
}
