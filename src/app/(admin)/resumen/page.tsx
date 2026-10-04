"use client";

import Link from "next/link";
import { ArrowDownRight, ArrowUpRight, ChevronRight, MessageCircle, ShieldAlert, Send } from "lucide-react";
import { toast } from "sonner";
import { Panel, PanelHeader } from "@/components/app/panel";
import { HourlySalesChart, type HourPoint } from "@/components/dashboard/hourly-sales-chart";
import { PaymentMix, type MixSlice } from "@/components/dashboard/payment-mix";
import { ItemImage } from "@/components/pos/item-image";
import { StatusBadge } from "@/components/pos/status-badge";
import { Button } from "@/components/ui/button";
import { RESTAURANT, TABLES } from "@/modules/pos/demo-data";
import { formatBs, formatBsShort } from "@/modules/pos/money";
import { orderTotalMinor } from "@/modules/pos/order";
import { itemById, staffById, useNow, useStore } from "@/modules/pos/store";
import { tableStatus } from "@/modules/pos/table-status";
import { cn } from "@/lib/utils";

const METHOD_LABEL = { qr: "QR", cash: "Efectivo", card_external: "Tarjeta", transfer: "Transferencia" } as const;
const METHOD_ORDER = ["qr", "cash", "card_external", "transfer"] as const;

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
  const delta = state.lastWeekTotalMinor ? (sales - state.lastWeekTotalMinor) / state.lastWeekTotalMinor : 0;

  const hours: HourPoint[] = Array.from({ length: 12 }, (_, i) => 11 + i).map((hour) => {
    const inHour = state.history.filter((o) => new Date(o.closedAt).getHours() === hour);
    return { hour, totalMinor: inHour.reduce((s, o) => s + o.totalMinor, 0), orders: inHour.length };
  });

  const mix: MixSlice[] = METHOD_ORDER.map((m, i) => ({
    key: m,
    label: METHOD_LABEL[m],
    valueMinor: state.history.filter((o) => o.method === m).reduce((s, o) => s + o.totalMinor, 0),
    color: `var(--chart-${i + 1})`,
  }));

  const byItem = new Map<string, { qty: number; totalMinor: number }>();
  for (const o of state.history)
    for (const it of o.items) {
      const cur = byItem.get(it.itemId) ?? { qty: 0, totalMinor: 0 };
      byItem.set(it.itemId, { qty: cur.qty + it.qty, totalMinor: cur.totalMinor + it.totalMinor });
    }
  const top = [...byItem.entries()].sort((a, b) => b[1].totalMinor - a[1].totalMinor).slice(0, 5);
  const topMax = top[0]?.[1].totalMinor ?? 1;

  const voidTotal = state.voids.reduce((s, v) => s + v.amountMinor, 0);
  const cashSales = mix.find((m) => m.key === "cash")?.valueMinor ?? 0;
  const expectedCash = state.openingCashMinor + cashSales;

  const live = state.live.filter((o) => o.lines.length > 0);
  const liveTotal = live.reduce((s, o) => s + orderTotalMinor(o), 0);

  const mixText = mix
    .filter((m) => m.valueMinor > 0)
    .map((m) => `${m.label} ${Math.round((m.valueMinor / (sales || 1)) * 100)}%`)
    .join(" · ");
  const deltaPct = Math.round(delta * 100);

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
      <header className="animate-enter flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[13px] font-medium text-muted-foreground first-letter:uppercase">
            {date.toLocaleDateString("es-BO", { weekday: "long", day: "numeric", month: "long" })} · {RESTAURANT.location}
          </p>
          <h1 className="mt-1 text-[28px] font-semibold sm:text-[34px]">{greeting(date.getHours())}, Marvin</h1>
        </div>
        <Button asChild size="lg">
          <Link href="/pos">
            Abrir punto de venta <ChevronRight />
          </Link>
        </Button>
      </header>

      <div className="mt-8 grid gap-4 lg:grid-cols-12">
        {/* Hero + tiles */}
        <Panel className="animate-enter lg:col-span-8">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div>
              <p className="text-[13px] font-medium text-muted-foreground">Ventas de hoy</p>
              <p className="mt-1 text-[44px] leading-none font-semibold tracking-[-0.03em] sm:text-[56px]">{formatBsShort(sales)}</p>
              <p
                className={cn(
                  "mt-3 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[13px] font-medium",
                  delta >= 0 ? "bg-status-good/12 text-[#0a7a0a] dark:text-status-good" : "bg-status-critical/12 text-status-critical",
                )}
              >
                {delta >= 0 ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}
                {delta >= 0 ? "+" : ""}
                {deltaPct}% vs el {weekday} pasado
              </p>
            </div>
            <dl className="grid grid-cols-3 gap-6 sm:gap-10">
              {[
                ["Cuentas", String(orders)],
                ["Ticket promedio", formatBsShort(avg)],
                ["Propinas", formatBsShort(tips)],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="text-[13px] text-muted-foreground">{k}</dt>
                  <dd className="mt-1 text-xl font-semibold tracking-[-0.01em] sm:text-2xl">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="mt-6">
            <p className="mb-1 text-[13px] font-medium text-muted-foreground">Ventas por hora</p>
            <HourlySalesChart data={hours} />
          </div>
        </Panel>

        {/* Live floor */}
        <Panel className="animate-enter lg:col-span-4">
          <PanelHeader
            title="Ahora en el local"
            subtitle={`${live.length} de ${TABLES.length} mesas ocupadas`}
            action={
              <Button asChild variant="ghost" size="sm">
                <Link href="/pos">
                  Ver salón <ChevronRight />
                </Link>
              </Button>
            }
          />
          <p className="text-[13px] text-muted-foreground">Por cobrar en mesas</p>
          <p className="mt-0.5 text-[28px] font-semibold tracking-[-0.02em]">{formatBs(liveTotal)}</p>
          <ul className="mt-4 divide-y">
            {live
              .sort((a, b) => a.openedAt - b.openedAt)
              .slice(0, 5)
              .map((o) => {
                const t = TABLES.find((x) => x.id === o.tableId)!;
                return (
                  <li key={o.id}>
                    <Link href={`/pos/mesa/${t.id}`} className="press -mx-2 flex items-center gap-3 rounded-xl px-2 py-2.5 hover:bg-accent">
                      <span className="grid size-9 place-items-center rounded-xl bg-secondary text-[13px] font-semibold">{t.label}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[13px] font-medium">{formatBs(orderTotalMinor(o))}</span>
                        <span className="block text-xs text-muted-foreground">
                          {staffById(o.waiterId)?.name} · {Math.floor((now - o.openedAt) / 60000)} min
                        </span>
                      </span>
                      <StatusBadge status={tableStatus(o, now)} />
                    </Link>
                  </li>
                );
              })}
          </ul>
        </Panel>

        {/* Control */}
        <Panel className="animate-enter lg:col-span-4">
          <PanelHeader title="Control" subtitle="Lo que tu equipo anuló o movió hoy" />
          <div className="flex items-center gap-3 rounded-2xl bg-status-critical/8 p-3.5">
            <span className="grid size-9 place-items-center rounded-xl bg-status-critical/14 text-status-critical">
              <ShieldAlert className="size-[18px]" aria-hidden />
            </span>
            <div className="text-[13px]">
              <p className="font-semibold">
                {state.voids.length} {state.voids.length === 1 ? "anulación" : "anulaciones"} · {formatBs(voidTotal)}
              </p>
              <p className="text-muted-foreground">Todas con PIN de encargado</p>
            </div>
          </div>
          <ul className="mt-3 space-y-1">
            {[...state.voids].reverse().map((v) => (
              <li key={v.id} className="flex gap-3 rounded-xl px-1 py-2 text-[13px]">
                <span className="w-11 shrink-0 pt-px text-muted-foreground tabular">
                  {new Date(v.at).toLocaleTimeString("es-BO", { hour: "2-digit", minute: "2-digit", hourCycle: "h23" })}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-medium">
                    {v.qty}× {v.itemName} · Mesa {v.tableLabel}
                  </span>
                  <span className="block text-muted-foreground">
                    {staffById(v.waiterId)?.name} · “{v.reason}” · aprobó {staffById(v.approvedBy)?.name}
                  </span>
                </span>
                <span className="font-medium tabular">−{formatBs(v.amountMinor)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex items-center justify-between border-t pt-4 text-[13px]">
            <span className="text-muted-foreground">Efectivo esperado en caja</span>
            <span className="font-semibold tabular">{formatBs(expectedCash)}</span>
          </div>
        </Panel>

        {/* Payment mix */}
        <Panel className="animate-enter lg:col-span-4">
          <PanelHeader title="Cómo te pagaron" subtitle="Por método de cobro" />
          <PaymentMix slices={mix} />
        </Panel>

        {/* Top items */}
        <Panel className="animate-enter lg:col-span-4">
          <PanelHeader title="Lo más vendido" subtitle="Por ingresos de hoy" />
          <ol className="space-y-3">
            {top.map(([id, v]) => {
              const it = itemById(id)!;
              return (
                <li key={id} className="flex items-center gap-3">
                  <ItemImage item={it} className="size-10 shrink-0 rounded-xl" sizes="40px" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2 text-[13px]">
                      <span className="truncate font-medium">{it.name}</span>
                      <span className="font-medium tabular">{formatBsShort(v.totalMinor)}</span>
                    </div>
                    <div className="mt-1.5 flex items-center gap-2">
                      <div className="h-1.5 flex-1 rounded-full bg-muted">
                        <div className="h-full rounded-full bg-primary/80" style={{ width: `${(v.totalMinor / topMax) * 100}%` }} />
                      </div>
                      <span className="w-12 text-right text-xs text-muted-foreground tabular">{v.qty} u.</span>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        </Panel>

        {/* WhatsApp close preview */}
        <Panel className="animate-enter lg:col-span-12">
          <div className="grid gap-6 md:grid-cols-[1fr_minmax(0,420px)] md:items-center">
            <div>
              <span className="inline-flex size-10 items-center justify-center rounded-2xl bg-ember-soft text-primary">
                <MessageCircle className="size-5" aria-hidden />
              </span>
              <h2 className="mt-4 text-[22px] font-semibold">Tu cierre llega solo a WhatsApp</h2>
              <p className="mt-2 max-w-md text-[15px] leading-relaxed text-muted-foreground">
                Al cerrar el turno, el resumen del día llega a tu celular: ventas, cobros, propinas y cada anulación con nombre y
                hora. Sabes qué pasó sin estar en el local.
              </p>
              <Button
                className="mt-5"
                variant="outline"
                onClick={() => toast.success("Cierre enviado", { description: "Demo: en producción lo envía n8n a tu WhatsApp." })}
              >
                <Send /> Enviar cierre de prueba
              </Button>
            </div>
            <div className="rounded-[22px] bg-muted p-4">
              <div className="ml-auto max-w-[360px] rounded-2xl rounded-tr-md bg-card p-4 text-[13.5px] leading-relaxed shadow-card">
                <p className="font-semibold">Cierre · {RESTAURANT.name}</p>
                <p className="text-muted-foreground first-letter:uppercase">
                  {date.toLocaleDateString("es-BO", { weekday: "long", day: "numeric", month: "short" })}
                </p>
                <p className="mt-2">
                  Ventas: <b>{formatBs(sales)}</b> ({deltaPct >= 0 ? "+" : ""}
                  {deltaPct}%)
                </p>
                <p>
                  Cuentas: {orders} · Ticket prom.: {formatBsShort(avg)}
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
