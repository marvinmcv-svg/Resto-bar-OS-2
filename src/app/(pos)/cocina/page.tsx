"use client";

import { useState } from "react";
import { BellRing, ChefHat, Flame, Martini, RotateCcw, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { PosHeader } from "@/components/pos/pos-header";
import { OCCASION } from "@/components/pos/ticket-panel";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { buildTickets, ticketUrgency, type KdsTicket, type TicketStatus } from "@/modules/pos/kds";
import { can } from "@/modules/pos/permissions";
import { tableById, useNow, useStore } from "@/modules/pos/store";
import type { Station } from "@/modules/pos/types";
import { cn } from "@/lib/utils";

const COLUMNS: { status: TicketStatus; title: string; empty: string }[] = [
  { status: "new", title: "Nuevos", empty: "Sin comandas nuevas" },
  { status: "started", title: "Preparando", empty: "Nada en preparación" },
  { status: "ready", title: "Listos para servir", empty: "Nada esperando al mesero" },
];

/** Ready tickets stay visible this long so the waiter can see them, then they leave the screen. */
const READY_VISIBLE_MS = 10 * 60000;

export default function KitchenPage() {
  const { state, dispatch, me, activeMenu, staffById } = useStore();
  const now = useNow(5000);
  const [station, setStation] = useState<Station | "all">(
    me?.role === "bartender" ? "barra" : me?.role === "kitchen" ? "cocina" : "all",
  );

  const tickets = buildTickets(state.live, state.menu, state.categories, station).filter(
    (t) => t.status !== "ready" || now - (t.readyAt ?? 0) < READY_VISIBLE_MS,
  );
  const byStatus = (s: TicketStatus) => tickets.filter((t) => t.status === s);
  const waiting = tickets.filter((t) => t.status !== "ready");
  const oldest = waiting.length ? ticketUrgency(Math.min(...waiting.map((t) => t.sentAt)), now).minutes : 0;

  const advance = (t: KdsTicket) => {
    dispatch({ type: "kdsAdvance", orderId: t.orderId, lineIds: t.lines.map((l) => l.id), at: Date.now() });
    if (t.status === "started") {
      toast.success(`Mesa ${tableById(t.tableId)?.label} lista`, { description: `Avisamos a ${staffById(t.waiterId)?.name} en su celular` });
    }
  };

  const stationItems = activeMenu.filter((m) => station === "all" || state.categories.find((c) => c.id === m.categoryId)?.station === station);

  return (
    <div className="flex min-h-dvh flex-col">
      <PosHeader>
        <div className="flex rounded-full bg-secondary p-1" role="tablist" aria-label="Estación">
          {([
            { id: "cocina", label: "Cocina", icon: ChefHat },
            { id: "barra", label: "Barra", icon: Martini },
            { id: "all", label: "Todo", icon: null },
          ] as const).map((s) => (
            <button
              key={s.id}
              role="tab"
              aria-selected={station === s.id}
              onClick={() => setStation(s.id)}
              className={cn(
                "press flex h-9 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-semibold text-muted-foreground sm:px-4",
                station === s.id && "bg-card text-foreground shadow-card",
              )}
            >
              {s.icon && <s.icon className="size-4" aria-hidden />}
              {s.label}
            </button>
          ))}
        </div>
        <p className="hidden text-[13px] text-muted-foreground md:block tabular">
          {waiting.length} en cola · la más antigua {oldest} min
        </p>
      </PosHeader>

      <div className="flex flex-1 flex-col xl:flex-row">
        <main className="grid flex-1 gap-4 p-4 sm:p-5 md:grid-cols-3">
          {COLUMNS.map((col) => {
            const list = byStatus(col.status);
            return (
              <section key={col.status} aria-labelledby={`col-${col.status}`} className="flex min-w-0 flex-col">
                <h2 id={`col-${col.status}`} className="mb-3 flex items-center gap-2 px-1 text-[14px] font-semibold">
                  {col.status === "new" && <span className="size-2 rounded-full bg-status-info" aria-hidden />}
                  {col.status === "started" && <Flame className="size-4 text-status-warning" aria-hidden />}
                  {col.status === "ready" && <BellRing className="size-4 text-status-good" aria-hidden />}
                  {col.title}
                  <span className="rounded-full bg-secondary px-2 text-[12px] text-muted-foreground tabular">{list.length}</span>
                </h2>
                <ul className="space-y-3">
                  {list.length === 0 && (
                    <li className="rounded-[20px] border border-dashed p-6 text-center text-[13px] text-muted-foreground">{col.empty}</li>
                  )}
                  {list.map((t) => (
                    <TicketCard key={t.key} ticket={t} now={now} onAdvance={() => advance(t)} />
                  ))}
                </ul>
              </section>
            );
          })}
        </main>

        {can(me?.role, "menu.86") && (
          <aside className="border-t p-4 sm:p-5 xl:w-[300px] xl:border-t-0 xl:border-l" aria-labelledby="out-title">
            <h2 id="out-title" className="text-[15px] font-semibold">Agotados</h2>
            <p className="mt-0.5 text-[13px] text-muted-foreground">Se quita al instante de la caja y de los celulares.</p>
            <ul className="mt-3 divide-y rounded-[18px] border bg-card px-3">
              {stationItems.map((m) => {
                const out = state.unavailable.includes(m.id);
                return (
                  <li key={m.id} className="flex items-center gap-3 py-2.5">
                    <span className={cn("min-w-0 flex-1 truncate text-[14px]", out && "text-muted-foreground line-through")}>{m.name}</span>
                    <Switch
                      checked={!out}
                      aria-label={`${m.name} disponible`}
                      onCheckedChange={() => {
                        dispatch({ type: "toggleAvailable", itemId: m.id });
                        toast(out ? `${m.name} disponible otra vez` : `${m.name} agotado`);
                      }}
                    />
                  </li>
                );
              })}
            </ul>
          </aside>
        )}
      </div>
    </div>
  );
}

function TicketCard({ ticket: t, now, onAdvance }: { ticket: KdsTicket; now: number; onAdvance: () => void }) {
  const { state, dispatch, staffById } = useStore();
  const table = tableById(t.tableId);
  const order = state.live.find((o) => o.id === t.orderId);
  const note = state.tableNotes[t.tableId];
  const { minutes, level } = ticketUrgency(t.sentAt, now);
  const tableName = table?.zone === "salon" ? `Mesa ${table.label}` : (table?.label ?? "?");

  return (
    <li
      className={cn(
        "animate-enter overflow-hidden rounded-[20px] border bg-card",
        t.status !== "ready" && level === "late" && "border-status-critical/70",
        t.status !== "ready" && level === "warn" && "border-status-warning/70",
        t.status === "ready" && "border-status-good/50",
      )}
    >
      <div
        className={cn(
          "flex items-center justify-between px-4 py-3",
          t.status === "ready" ? "bg-status-good/12" : level === "late" ? "bg-status-critical/14" : level === "warn" ? "bg-status-warning/14" : "bg-secondary/60",
        )}
      >
        <span>
          <span className="block text-[18px] leading-tight font-semibold">{tableName}</span>
          <span className="block text-[12px] text-muted-foreground">
            {staffById(t.waiterId)?.name} · {order?.guests} pers.
          </span>
        </span>
        <span
          className={cn(
            "text-[22px] font-semibold tracking-[-0.02em] tabular",
            t.status !== "ready" && level === "late" && "text-status-critical",
            t.status !== "ready" && level === "warn" && "text-status-warning",
          )}
          aria-label={`${minutes} minutos`}
        >
          {minutes}′
        </span>
      </div>
      {note && (note.occasion === "alergia" || note.text) && (
        <p className="flex items-start gap-2 border-b bg-primary/10 px-4 py-2 text-[13px]">
          {note.occasion === "alergia" ? (
            <TriangleAlert className="mt-0.5 size-4 shrink-0 text-status-critical" aria-hidden />
          ) : (
            (() => {
              const Icon = note.occasion ? OCCASION[note.occasion].icon : TriangleAlert;
              return <Icon className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />;
            })()
          )}
          <span>{note.text ?? OCCASION[note.occasion!].label}</span>
        </p>
      )}
      <ul className="space-y-2 px-4 py-3">
        {t.lines.map((l) => (
          <li key={l.id} className="flex gap-3">
            <span className="w-7 shrink-0 text-[17px] font-bold tabular">{l.qty}×</span>
            <span className="min-w-0">
              <span className="block text-[16px] leading-snug font-semibold">{l.name}</span>
              {l.modifiers.length > 0 && <span className="block text-[13px] text-muted-foreground">{l.modifiers.map((m) => m.name).join(" · ")}</span>}
              {l.note && <span className="mt-0.5 block text-[13px] font-semibold text-status-warning">“{l.note}”</span>}
            </span>
          </li>
        ))}
      </ul>
      <div className="px-3 pb-3">
        {t.status === "new" && (
          <Button size="lg" variant="secondary" className="w-full" onClick={onAdvance}>
            <Flame /> Empezar
          </Button>
        )}
        {t.status === "started" && (
          <Button size="lg" className="w-full bg-status-good text-black hover:bg-status-good/90" onClick={onAdvance}>
            <BellRing /> Listo para servir
          </Button>
        )}
        {t.status === "ready" && (
          <Button
            size="lg"
            variant="ghost"
            className="w-full text-muted-foreground"
            onClick={() => dispatch({ type: "kdsRecall", orderId: t.orderId, lineIds: t.lines.map((l) => l.id) })}
          >
            <RotateCcw /> Devolver a preparación
          </Button>
        )}
      </div>
    </li>
  );
}
