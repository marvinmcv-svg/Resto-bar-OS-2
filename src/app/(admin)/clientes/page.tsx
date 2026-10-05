"use client";

import { useMemo, useState } from "react";
import { Cake, ChevronRight, Crown, Search, UserPlus, Users, Wallet } from "lucide-react";
import { ChipSelect, TextInput } from "@/components/app/form";
import { PageBody, PageHeader } from "@/components/app/page-header";
import { StatTile } from "@/components/app/stat-tile";
import { GuestSheet } from "@/components/guests/guest-sheet";
import { Button } from "@/components/ui/button";
import { averageTicketMinor, inSegment, SEGMENT_LABEL, TAG_LABEL, type Guest, type Segment } from "@/modules/guests/guests";
import { formatBs } from "@/modules/pos/money";
import { useNow, useStore } from "@/modules/pos/store";
import { cn } from "@/lib/utils";

const DAY = 24 * 3600_000;

function ago(t: number | undefined, now: number) {
  if (!t) return "Sin visitas";
  const d = Math.floor((now - t) / DAY);
  return d <= 0 ? "Hoy" : d === 1 ? "Ayer" : `Hace ${d} días`;
}

export default function ClientesPage() {
  const { state } = useStore();
  const now = useNow(60000);
  const [query, setQuery] = useState("");
  const [segment, setSegment] = useState<Segment>("todos");
  const [editing, setEditing] = useState<Guest | "new" | null>(null);

  const guests = state.guests;
  const q = query.trim().toLowerCase();
  const list = useMemo(
    () =>
      guests
        .filter((g) => inSegment(g, segment, now) && (!q || g.name.toLowerCase().includes(q) || g.phone?.replace(/\D/g, "").includes(q.replace(/\D/g, "") || "~")))
        .sort((a, b) => (b.lastVisitAt ?? 0) - (a.lastVisitAt ?? 0)),
    [guests, segment, q, now],
  );
  const vip = guests.filter((g) => inSegment(g, "vip", now)).length;
  const bdays = guests.filter((g) => inSegment(g, "cumpleanos", now));
  const avg = guests.length ? Math.round(guests.reduce((s, g) => s + averageTicketMinor(g), 0) / guests.length) : 0;

  return (
    <PageBody>
      <PageHeader
        eyebrow={`${guests.length} clientes · ${guests.filter((g) => g.optIn).length} aceptan promociones`}
        title="Clientes"
        description="Quién viene, cada cuánto y cuánto consume. Se actualiza solo al cobrar una mesa asignada a un cliente."
        actions={
          <Button size="lg" onClick={() => setEditing("new")}>
            <UserPlus /> Nuevo cliente
          </Button>
        }
      />

      <div className="mt-7 grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatTile icon={Users} label="Clientes" value={String(guests.length)} note={`${guests.filter((g) => g.visits === 1).length} vinieron una vez`} />
        <StatTile icon={Crown} label="VIP y frecuentes" value={String(vip)} note="8+ visitas o etiqueta VIP" />
        <StatTile icon={Cake} label="Cumpleaños este mes" value={String(bdays.length)} note={bdays.map((g) => g.name.split(" ")[0]).join(", ") || "Ninguno"} />
        <StatTile icon={Wallet} label="Ticket promedio" value={formatBs(avg)} note="Por visita" />
      </div>

      <section className="mt-6 rounded-[22px] border bg-card shadow-card" aria-label="Lista de clientes">
        <div className="space-y-3 border-b px-5 py-4">
          <label className="relative block">
            <span className="sr-only">Buscar cliente</span>
            <Search className="pointer-events-none absolute top-1/2 left-3.5 size-[18px] -translate-y-1/2 text-muted-foreground" aria-hidden />
            <TextInput value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar por nombre o celular" className="pl-10" />
          </label>
          <div className="no-scrollbar -mx-5 overflow-x-auto px-5">
            <ChipSelect
              label="Segmento"
              className="flex-nowrap"
              value={segment}
              onChange={setSegment}
              options={(Object.keys(SEGMENT_LABEL) as Segment[]).map((s) => ({ value: s, label: s === "todos" ? "Todos" : SEGMENT_LABEL[s] }))}
            />
          </div>
        </div>
        {list.length === 0 ? (
          <p className="p-10 text-center text-[14px] text-muted-foreground">Nadie en este segmento.</p>
        ) : (
          <ul className="divide-y">
            {list.map((g) => (
              <li key={g.id}>
                <button
                  onClick={() => setEditing(g)}
                  className="press flex w-full items-center gap-3.5 px-5 py-3 text-left hover:bg-accent"
                  aria-label={`Ver ${g.name}`}
                >
                  <span className="grid size-11 shrink-0 place-items-center rounded-full bg-ember-soft text-[15px] font-semibold text-primary">
                    {g.name[0]}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-1.5">
                      <span className="truncate text-[15px] font-semibold">{g.name}</span>
                      {g.tags.map((t) => (
                        <span
                          key={t}
                          className={cn(
                            "rounded-full px-2 py-0.5 text-[11px] font-semibold",
                            t === "alergia" ? "bg-status-critical/12 text-status-critical" : t === "vip" ? "bg-primary/14 text-primary" : "bg-secondary text-muted-foreground",
                          )}
                        >
                          {TAG_LABEL[t]}
                        </span>
                      ))}
                      {inSegment(g, "cumpleanos", now) && <Cake className="size-4 text-primary" aria-label="Cumpleaños este mes" />}
                    </span>
                    <span className="block truncate text-[12.5px] text-muted-foreground">
                      {g.visits} {g.visits === 1 ? "visita" : "visitas"} · {ago(g.lastVisitAt, now)}
                      {g.phone && ` · ${g.phone}`}
                    </span>
                  </span>
                  <span className="text-right">
                    <span className="block text-[14px] font-semibold tabular">{formatBs(g.spentMinor)}</span>
                    <span className="block text-[11.5px] text-muted-foreground tabular">ticket {formatBs(averageTicketMinor(g))}</span>
                  </span>
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <GuestSheet guest={editing} onClose={() => setEditing(null)} />
    </PageBody>
  );
}
