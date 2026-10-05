"use client";

import { useState } from "react";
import { ArrowDownLeft, ArrowUpRight, Banknote, Lock, Receipt, Wallet, type LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { CountDialog } from "@/components/cash/count-dialog";
import { MovementDialog, REASON_LABEL } from "@/components/cash/movement-dialog";
import { METHOD_NAME, ShiftSummaryDialog } from "@/components/cash/shift-summary";
import { CheckoutDialog } from "@/components/pos/checkout-dialog";
import { PosHeader } from "@/components/pos/pos-header";
import { usePay } from "@/components/pos/use-pay";
import { Button } from "@/components/ui/button";
import {
  cashDifference, expectedCashMinor, movementsNetMinor, salesByMethod, shiftMovements, shiftPayments,
} from "@/modules/pos/cash";
import { formatBs } from "@/modules/pos/money";
import { activeLines, balanceMinor, minutesOpen } from "@/modules/pos/order";
import { newId, tableById, useNow, useStore } from "@/modules/pos/store";
import type { Order, PaymentMethod } from "@/modules/pos/types";
import type { ClosedCashShift } from "@/modules/hr/demo-hr";
import { cn } from "@/lib/utils";

const time = (t: number) => new Date(t).toLocaleTimeString("es-BO", { hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
const tableName = (id: string) => {
  const t = tableById(id);
  return t ? (t.zone === "salon" ? `Mesa ${t.label}` : t.label) : "Cuenta";
};

export default function CajaPage() {
  const { state, dispatch, register, me, staffById } = useStore();
  const now = useNow(15000);
  const pay = usePay();
  const [opening, setOpening] = useState(false);
  const [closing, setClosing] = useState(false);
  const [movement, setMovement] = useState<"in" | "out" | null>(null);
  const [charging, setCharging] = useState<Order | null>(null);
  const [summary, setSummary] = useState<ClosedCashShift | null>(null);

  const lastClosed = [...state.cashShifts].filter((s) => s.closedAt).sort((a, b) => (b.closedAt ?? 0) - (a.closedAt ?? 0))[0];
  const open = state.live.filter((o) => activeLines(o).length > 0 && balanceMinor(o) > 0);
  const queue = [...open].sort((a, b) => Number(!!b.billRequested) - Number(!!a.billRequested) || a.openedAt - b.openedAt);

  if (!register) {
    return (
      <div className="flex min-h-dvh flex-col">
        <PosHeader>
          <h1 className="text-[15px] font-semibold">Caja</h1>
        </PosHeader>
        <main className="grid flex-1 place-items-center p-6">
          <section className="animate-enter w-full max-w-md text-center">
            <span className="mx-auto grid size-16 place-items-center rounded-[20px] bg-secondary">
              <Lock className="size-7 text-muted-foreground" aria-hidden />
            </span>
            <h2 className="mt-5 text-[28px] font-semibold tracking-[-0.02em]">La caja está cerrada</h2>
            <p className="mt-2 text-[15px] text-muted-foreground">
              Cuenta el efectivo inicial para abrir el turno. Mientras esté cerrada, solo se puede cobrar con QR, tarjeta o transferencia.
            </p>
            <Button size="xl" className="mt-7 w-full" onClick={() => setOpening(true)}>
              <Wallet /> Abrir caja
            </Button>
            {lastClosed && (
              <button
                onClick={() => setSummary(lastClosed)}
                className="press mt-4 w-full rounded-2xl border bg-card px-4 py-3 text-left text-[13px] hover:bg-accent"
              >
                <span className="block font-semibold">Último cierre · {new Date(lastClosed.closedAt!).toLocaleDateString("es-BO", { weekday: "long", day: "numeric" })}</span>
                <span className="text-muted-foreground">
                  Contado {formatBs(lastClosed.countedMinor ?? 0)} · {diffText(lastClosed)}
                </span>
              </button>
            )}
          </section>
        </main>
        <CountDialog
          open={opening}
          title="Abrir caja"
          description="Cuenta el efectivo con el que empiezas el turno."
          confirmLabel="Abrir caja"
          suggestedMinor={lastClosed?.openingMinor}
          onClose={() => setOpening(false)}
          onConfirm={(total) => {
            if (!me) return;
            dispatch({ type: "openRegister", shift: { id: newId(), openedBy: me.id, openedAt: Date.now(), openingMinor: total } });
            setOpening(false);
            toast.success("Caja abierta", { description: `Fondo inicial ${formatBs(total)}` });
          }}
        />
        <ShiftSummaryDialog shift={summary} onClose={() => setSummary(null)} />
      </div>
    );
  }

  const payments = shiftPayments(state.payments, register.id);
  const movements = shiftMovements(state.cashMovements, register.id);
  const byMethod = salesByMethod(payments);
  const sales = payments.reduce((s, p) => s + p.amountMinor, 0);
  const tips = payments.reduce((s, p) => s + p.tipMinor, 0);
  const expected = expectedCashMinor(register, state.payments, state.cashMovements);
  const net = movementsNetMinor(movements);
  const methods = (Object.keys(METHOD_NAME) as PaymentMethod[]).filter((m) => byMethod[m].count > 0 || m === "cash");
  const maxMethod = Math.max(...methods.map((m) => byMethod[m].amountMinor), 1);

  const close = (counted: number, count?: Record<number, number>) => {
    if (!me) return;
    const patch: Pick<ClosedCashShift, "closedAt" | "closedBy" | "countedMinor" | "count" | "expectedMinor" | "summary"> = {
      closedAt: Date.now(),
      closedBy: me.id,
      countedMinor: counted,
      count,
      expectedMinor: expected,
      summary: {
        salesMinor: sales,
        tipsMinor: tips,
        byMethod: Object.fromEntries(methods.map((m) => [m, byMethod[m].amountMinor])),
        payments: payments.length,
      },
    };
    dispatch({ type: "closeRegister", shiftId: register.id, patch });
    setClosing(false);
    setSummary({ ...register, ...patch });
  };

  return (
    <div className="flex min-h-dvh flex-col">
      <PosHeader>
        <div className="min-w-0">
          <h1 className="truncate text-[15px] font-semibold">Caja abierta</h1>
          <p className="truncate text-[12px] text-muted-foreground">
            Desde {time(register.openedAt)} · {staffById(register.openedBy)?.name} · fondo {formatBs(register.openingMinor)}
          </p>
        </div>
        <Button variant="secondary" className="ml-auto" onClick={() => setClosing(true)} aria-label="Cerrar caja">
          <Lock /> <span className="hidden sm:inline">Cerrar caja</span>
        </Button>
      </PosHeader>

      <main className="mx-auto w-full max-w-[1240px] flex-1 space-y-4 p-4 sm:p-5">
        <section className="grid grid-cols-2 gap-3 xl:grid-cols-4" aria-label="Resumen del turno">
          <Stat icon={Banknote} label="Efectivo esperado en caja" value={formatBs(expected)} note="Fondo + ventas en efectivo + movimientos" accent />
          <Stat icon={Receipt} label="Ventas del turno" value={formatBs(sales)} note={`${payments.length} cobros`} />
          <Stat icon={Wallet} label="Propinas" value={formatBs(tips)} note={`En efectivo ${formatBs(byMethod.cash.tipMinor)}`} />
          <Stat
            icon={net.outMinor > net.inMinor ? ArrowUpRight : ArrowDownLeft}
            label="Entradas y salidas"
            value={`${net.inMinor - net.outMinor >= 0 ? "+" : "−"}${formatBs(Math.abs(net.inMinor - net.outMinor))}`}
            note={`${movements.length} movimientos`}
          />
        </section>

        <div className="grid gap-4 lg:grid-cols-12">
          <section className="rounded-[22px] border bg-card p-4 lg:col-span-7" aria-labelledby="queue-title">
            <div className="flex items-baseline justify-between px-1">
              <h2 id="queue-title" className="text-[15px] font-semibold">Por cobrar</h2>
              <span className="text-[13px] text-muted-foreground tabular">{formatBs(open.reduce((s, o) => s + balanceMinor(o), 0))}</span>
            </div>
            {queue.length === 0 ? (
              <p className="mt-3 rounded-2xl border border-dashed p-8 text-center text-[14px] text-muted-foreground">No hay cuentas abiertas.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {queue.map((o) => (
                  <li key={o.id}>
                    <button
                      onClick={() => setCharging(o)}
                      className={cn(
                        "press flex w-full items-center gap-3 rounded-2xl border p-3 text-left hover:bg-accent",
                        o.billRequested && "border-status-warning/60 bg-status-warning/10",
                      )}
                      aria-label={`Cobrar ${tableName(o.tableId)}, ${formatBs(balanceMinor(o))}`}
                    >
                      <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-secondary text-[15px] font-semibold">
                        {tableById(o.tableId)?.label}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                          <span className="text-[15px] font-semibold whitespace-nowrap">{tableName(o.tableId)}</span>
                          {o.billRequested && (
                            <span className="rounded-full bg-status-warning/20 px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap text-status-warning-ink">
                              Pidió la cuenta
                            </span>
                          )}
                        </span>
                        <span className="block truncate text-[12.5px] text-muted-foreground">
                          {staffById(o.waiterId)?.name} · {o.guests} pers. · {minutesOpen(o, now)} min
                        </span>
                      </span>
                      <span className="text-[17px] font-semibold tabular">{formatBs(balanceMinor(o))}</span>
                      <span className="hidden rounded-full bg-primary px-3.5 py-2 text-[13px] font-semibold text-primary-foreground sm:inline">Cobrar</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <div className="space-y-4 lg:col-span-5">
            <section className="rounded-[22px] border bg-card p-5" aria-labelledby="method-title">
              <h2 id="method-title" className="text-[15px] font-semibold">Cobros por método</h2>
              <ul className="mt-4 space-y-3">
                {methods.map((m) => (
                  <li key={m}>
                    <div className="flex items-baseline justify-between text-[13px]">
                      <span className="font-medium">{METHOD_NAME[m]}</span>
                      <span className="tabular">
                        {formatBs(byMethod[m].amountMinor)} <span className="text-muted-foreground">· {byMethod[m].count}</span>
                      </span>
                    </div>
                    <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-secondary">
                      <div
                        className={cn("h-full rounded-full", m === "cash" ? "bg-primary" : "bg-muted-foreground/40")}
                        style={{ width: `${(byMethod[m].amountMinor / maxMethod) * 100}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </section>

            <section className="rounded-[22px] border bg-card p-5" aria-labelledby="mov-title">
              <div className="flex items-center justify-between gap-2">
                <h2 id="mov-title" className="text-[15px] font-semibold">Entradas y salidas</h2>
                <span className="flex gap-1.5">
                  <Button size="sm" variant="secondary" onClick={() => setMovement("in")}>
                    <ArrowDownLeft /> Entrada
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => setMovement("out")}>
                    <ArrowUpRight /> Salida
                  </Button>
                </span>
              </div>
              {movements.length === 0 ? (
                <p className="mt-3 text-[13px] text-muted-foreground">Sin movimientos en este turno.</p>
              ) : (
                <ul className="mt-3 divide-y">
                  {[...movements].reverse().map((m) => (
                    <li key={m.id} className="flex items-center gap-3 py-2.5 text-[13px]">
                      <span
                        className={cn(
                          "grid size-8 shrink-0 place-items-center rounded-lg",
                          m.kind === "in" ? "bg-status-good/14 text-status-good-ink" : "bg-status-critical/12 text-status-critical",
                        )}
                      >
                        {m.kind === "in" ? <ArrowDownLeft className="size-4" aria-hidden /> : <ArrowUpRight className="size-4" aria-hidden />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium">{m.note ?? REASON_LABEL[m.reason]}</span>
                        <span className="block truncate text-muted-foreground">
                          {time(m.at)} · {staffById(m.by)?.name}
                          {m.approvedBy && m.approvedBy !== m.by && ` · aprobó ${staffById(m.approvedBy)?.name}`}
                        </span>
                      </span>
                      <span className="font-semibold tabular">
                        {m.kind === "in" ? "+" : "−"}
                        {formatBs(m.amountMinor)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="rounded-[22px] border bg-card p-5" aria-labelledby="last-title">
              <h2 id="last-title" className="text-[15px] font-semibold">Últimos cobros</h2>
              <ul className="mt-3 divide-y">
                {[...payments]
                  .sort((a, b) => b.at - a.at)
                  .slice(0, 6)
                  .map((p) => (
                    <li key={p.id} className="flex items-center justify-between gap-3 py-2 text-[13px]">
                      <span className="text-muted-foreground tabular">{time(p.at)}</span>
                      <span className="min-w-0 flex-1 truncate">
                        {p.tableId ? tableName(p.tableId) : "Cuenta"} · {METHOD_NAME[p.method]}
                      </span>
                      <span className="font-medium tabular">{formatBs(p.amountMinor + p.tipMinor)}</span>
                    </li>
                  ))}
              </ul>
            </section>
          </div>
        </div>
      </main>

      {charging && (
        <CheckoutDialog
          order={state.live.find((o) => o.id === charging.id) ?? charging}
          tableLabel={tableById(charging.tableId)?.label ?? ""}
          open
          cashAllowed
          onClose={() => setCharging(null)}
          onPay={(r) => {
            const o = state.live.find((x) => x.id === charging.id) ?? charging;
            const remaining = pay(o, tableById(o.tableId)?.label ?? "", r);
            if (remaining <= 0) setCharging(null);
          }}
        />
      )}
      <MovementDialog
        open={!!movement}
        kind={movement ?? "in"}
        shiftId={register.id}
        onClose={() => setMovement(null)}
        onSaved={(m) => {
          setMovement(null);
          toast.success(`${m.kind === "in" ? "Entrada" : "Salida"} de ${formatBs(m.amountMinor)} registrada`);
        }}
      />
      <CountDialog
        open={closing}
        title="Cerrar caja"
        description="Cuenta todo el efectivo de la caja. El sistema lo compara con lo esperado."
        confirmLabel="Cerrar caja"
        expectedMinor={expected}
        warning={open.length ? `Hay ${open.length} ${open.length === 1 ? "cuenta abierta" : "cuentas abiertas"}: se cobrarán en el próximo turno.` : undefined}
        onClose={() => setClosing(false)}
        onConfirm={(total, count) => close(total, count)}
      />
      <ShiftSummaryDialog shift={summary} onClose={() => setSummary(null)} />
    </div>
  );
}

function diffText(s: ClosedCashShift) {
  if (s.countedMinor === undefined || s.expectedMinor === undefined) return "";
  const d = cashDifference(s.countedMinor, s.expectedMinor);
  return d.status === "ok" ? "cuadró exacto" : `${d.status === "over" ? "sobró" : "faltó"} ${formatBs(Math.abs(d.diffMinor))}`;
}

function Stat({ icon: Icon, label, value, note, accent }: { icon: LucideIcon; label: string; value: string; note: string; accent?: boolean }) {
  return (
    <section className={cn("animate-enter rounded-[22px] border bg-card p-4 sm:p-5", accent && "border-primary/40 bg-primary/8")}>
      <div className="flex items-center gap-2.5 sm:gap-3">
        <span
          className={cn(
            "grid size-8 shrink-0 place-items-center rounded-[10px] sm:size-10 sm:rounded-[12px]",
            accent ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground",
          )}
        >
          <Icon className="size-4 sm:size-5" aria-hidden />
        </span>
        <h3 className="text-[12px] leading-tight font-medium text-muted-foreground sm:text-[13px]">{label}</h3>
      </div>
      <p className="mt-3 text-[20px] leading-none font-semibold tracking-[-0.025em] tabular sm:mt-4 sm:text-[28px]">{value}</p>
      <p className="mt-2 hidden text-[12.5px] text-muted-foreground sm:block">{note}</p>
    </section>
  );
}
