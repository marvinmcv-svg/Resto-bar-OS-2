"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Minus, Plus, Users } from "lucide-react";
import { ShiftBanner } from "@/components/pos/shift-banner";
import { OCCASION } from "@/components/pos/ticket-panel";
import { WaitlistPanel } from "@/components/pos/waitlist-panel";
import { PosHeader } from "@/components/pos/pos-header";
import { StatusBadge } from "@/components/pos/status-badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TABLES, ZONES } from "@/modules/pos/demo-data";
import { formatBs, formatBsShort } from "@/modules/pos/money";
import { minutesOpen, orderTotalMinor } from "@/modules/pos/order";
import { useNow, useStore } from "@/modules/pos/store";
import { STATUS_LABEL, tableStatus, type TableStatus } from "@/modules/pos/table-status";
import type { DiningTable, Zone } from "@/modules/pos/types";
import { cn } from "@/lib/utils";

const TILE: Record<TableStatus, string> = {
  free: "bg-card border-border text-muted-foreground hover:border-white/20",
  occupied: "bg-status-info/14 border-status-info/50 text-foreground",
  bill: "bg-status-warning/14 border-status-warning/60 text-foreground",
  late: "bg-status-critical/14 border-status-critical/60 text-foreground pulse-critical",
};

const DOT: Record<TableStatus, string> = {
  free: "bg-muted-foreground/50",
  occupied: "bg-status-info",
  bill: "bg-status-warning",
  late: "bg-status-critical",
};

export default function FloorPage() {
  const { state, orderForTable, openTable, staffById } = useStore();
  const now = useNow(15000);
  const router = useRouter();
  const [zone, setZone] = useState<Zone>("salon");
  const [opening, setOpening] = useState<DiningTable | null>(null);
  const [guests, setGuests] = useState(2);

  const tables = TABLES.filter((t) => t.zone === zone);
  const live = state.live;
  const rows = Math.max(...tables.map((t) => t.y + (t.h ?? 2) - 1));

  const onTable = (t: DiningTable) => {
    if (orderForTable(t.id)) router.push(`/pos/mesa/${t.id}`);
    else {
      setGuests(Math.min(2, t.seats));
      setOpening(t);
    }
  };

  return (
    <div className="flex min-h-dvh flex-col">
      <PosHeader>
        <div className="flex rounded-full bg-secondary p-1" role="tablist" aria-label="Zonas">
          {ZONES.map((z) => {
            const busy = state.live.filter((o) => TABLES.find((t) => t.id === o.tableId)?.zone === z.id).length;
            return (
              <button
                key={z.id}
                role="tab"
                aria-selected={zone === z.id}
                onClick={() => setZone(z.id)}
                className={cn(
                  "press flex h-9 items-center gap-2 rounded-full px-3.5 text-[13px] font-semibold text-muted-foreground sm:px-4",
                  zone === z.id && "bg-card text-foreground shadow-card",
                )}
              >
                {z.name}
                {busy > 0 && <span className="rounded-full bg-primary/15 px-1.5 text-[11px] text-primary tabular">{busy}</span>}
              </button>
            );
          })}
        </div>
      </PosHeader>

      <div className="flex flex-1 flex-col lg:flex-row">
        <main className="flex-1 p-4 sm:p-6">
          <ShiftBanner />
          <div
            className="mx-auto grid max-w-[980px] grid-cols-12 gap-3 sm:gap-4"
            style={{ gridTemplateRows: `repeat(${rows}, minmax(44px, 1fr))` }}
          >
            {tables.map((t) => {
              const order = orderForTable(t.id);
              const status = tableStatus(order, now);
              return (
                <button
                  key={t.id}
                  onClick={() => onTable(t)}
                  aria-label={`Mesa ${t.label}, ${STATUS_LABEL[status]}`}
                  style={{ gridColumn: `${t.x} / span ${t.w ?? 2}`, gridRow: `${t.y} / span ${t.h ?? 2}` }}
                  className={cn(
                    "press relative flex min-h-[72px] flex-col sm:min-h-[96px] items-center justify-center gap-1 border-[1.5px] p-2 text-center hover:brightness-110",
                    t.shape === "round" ? "aspect-square max-w-full justify-self-center rounded-full" : "rounded-[22px]",
                    TILE[status],
                  )}
                >
                  <span className="text-[22px] leading-none font-semibold tracking-[-0.02em] text-foreground">{t.label}</span>
                  {order ? (
                    <>
                      <span className="text-[12px] font-semibold tabular">{formatBsShort(orderTotalMinor(order))}</span>
                      <span className="text-[11px] text-muted-foreground tabular">{minutesOpen(order, now)} min</span>
                    </>
                  ) : (
                    <span className="flex items-center gap-1 text-[11px]">
                      <Users className="size-3" aria-hidden /> {t.seats}
                    </span>
                  )}
                  <span className={cn("absolute top-2.5 right-2.5 size-2 rounded-full", t.shape === "round" && "top-[14%] right-[14%]", DOT[status])} />
                  {(() => {
                    const occ = state.tableNotes[t.id]?.occasion;
                    if (!occ) return null;
                    const Icon = OCCASION[occ].icon;
                    return (
                      <span
                        className={cn("absolute top-2 left-2 grid size-6 place-items-center rounded-full bg-primary text-primary-foreground", t.shape === "round" && "top-[10%] left-[10%]")}
                        title={OCCASION[occ].label}
                      >
                        <Icon className="size-3.5" aria-label={OCCASION[occ].label} />
                      </span>
                    );
                  })()}
                </button>
              );
            })}
          </div>
          <ArrivalsStrip />
          <ul className="mx-auto mt-6 flex max-w-[980px] flex-wrap gap-2" aria-label="Leyenda">
            {(["free", "occupied", "bill", "late"] as TableStatus[]).map((s) => (
              <li key={s}>
                <StatusBadge status={s} />
              </li>
            ))}
          </ul>
        </main>

        <aside className="border-t p-4 sm:p-5 lg:w-[340px] lg:border-t-0 lg:border-l">
          <WaitlistPanel onSeated={(id) => router.push(`/pos/mesa/${id}`)} />
          <div className="mt-7 flex items-baseline justify-between">
            <h2 className="text-[15px] font-semibold">En servicio</h2>
            <span className="text-[13px] text-muted-foreground tabular">
              {formatBs(state.live.reduce((s, o) => s + orderTotalMinor(o), 0))}
            </span>
          </div>
          <ul className="mt-3 space-y-2">
            {[...live]
              .sort((a, b) => {
                const rank = { bill: 0, late: 1, occupied: 2, free: 3 };
                return rank[tableStatus(a, now)] - rank[tableStatus(b, now)] || a.openedAt - b.openedAt;
              })
              .map((o) => {
                const t = TABLES.find((x) => x.id === o.tableId)!;
                const status = tableStatus(o, now);
                return (
                  <li key={o.id}>
                    <button
                      onClick={() => router.push(`/pos/mesa/${t.id}`)}
                      className="press flex w-full items-center gap-3 rounded-2xl bg-card p-3 text-left hover:bg-accent"
                    >
                      <span className="grid size-11 place-items-center rounded-xl bg-secondary text-[15px] font-semibold">{t.label}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[14px] font-semibold tabular">{formatBs(orderTotalMinor(o))}</span>
                        <span className="block text-xs text-muted-foreground">
                          {staffById(o.waiterId)?.name} · {o.guests} pers. · {minutesOpen(o, now)} min
                        </span>
                      </span>
                      {status !== "occupied" && <StatusBadge status={status} />}
                    </button>
                  </li>
                );
              })}
          </ul>
        </aside>
      </div>

      <Dialog open={!!opening} onOpenChange={(v) => !v && setOpening(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-xl">Abrir mesa {opening?.label}</DialogTitle>
            <DialogDescription>¿Cuántas personas?</DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center gap-6 py-4">
            <Button variant="secondary" size="icon-lg" aria-label="Menos" onClick={() => setGuests((g) => Math.max(1, g - 1))}>
              <Minus />
            </Button>
            <span className="w-16 text-center text-5xl font-semibold tracking-[-0.03em] tabular" aria-live="polite">
              {guests}
            </span>
            <Button variant="secondary" size="icon-lg" aria-label="Más" onClick={() => setGuests((g) => Math.min(20, g + 1))}>
              <Plus />
            </Button>
          </div>
          <Button
            size="xl"
            onClick={() => {
              if (!opening) return;
              openTable(opening.id, guests);
              router.push(`/pos/mesa/${opening.id}`);
            }}
          >
            Abrir mesa
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/** Accounts opened per hour today (closed + open), like a service timeline. */
function ArrivalsStrip() {
  const { state } = useStore();
  const now = useNow(60000);
  const hours = Array.from({ length: 13 }, (_, i) => 11 + i);
  const counts = hours.map(
    (h) =>
      state.history.filter((o) => new Date(o.closedAt).getHours() === h).length +
      state.live.filter((o) => new Date(o.openedAt).getHours() === h).length,
  );
  const max = Math.max(...counts, 1);
  const current = new Date(now).getHours();
  return (
    <section className="mx-auto mt-8 max-w-[980px] rounded-[22px] border bg-card p-4" aria-label="Cuentas por hora">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-[13px] font-semibold">Cuentas por hora</h2>
        <span className="text-xs text-muted-foreground tabular">{counts.reduce((a, b) => a + b, 0)} hoy</span>
      </div>
      <div className="grid grid-cols-13 items-end gap-1.5" style={{ gridTemplateColumns: `repeat(${hours.length}, minmax(0, 1fr))` }}>
        {hours.map((h, i) => (
          <div key={h} className="flex flex-col items-center gap-1.5" title={`${h}:00 · ${counts[i]} cuentas`}>
            <div className="flex h-12 w-full items-end">
              <div
                className={cn("w-full rounded-t-[4px]", h === current ? "bg-primary" : "bg-muted-foreground/30")}
                style={{ height: `${Math.max((counts[i] / max) * 100, counts[i] ? 8 : 2)}%` }}
              />
            </div>
            <span className={cn("text-[10.5px] tabular", h === current ? "font-semibold text-primary" : "text-muted-foreground")}>
              {h}h
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
