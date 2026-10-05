"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CalendarCheck, CalendarDays, CalendarX2, ChevronLeft, ChevronRight, Clock, Minus, Plus, StickyNote, Users } from "lucide-react";
import { toast } from "sonner";
import { Field, TextArea, TextInput } from "@/components/app/form";
import { PageBody, PageHeader } from "@/components/app/page-header";
import { StatTile } from "@/components/app/stat-tile";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { normalizePhone } from "@/modules/guests/guests";
import { dateKey } from "@/modules/hr/time";
import { TABLES } from "@/modules/pos/demo-data";
import { can } from "@/modules/pos/permissions";
import { newId, tableById, useNow, useStore } from "@/modules/pos/store";
import { conflicts, coversOf, freeTables, isLate, onDay, STATUS_LABEL, type Reservation } from "@/modules/reservations/reservations";
import { cn } from "@/lib/utils";

const hhmm = (t: number) => new Date(t).toLocaleTimeString("es-BO", { hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
const tableName = (id?: string) => {
  const t = id ? tableById(id) : undefined;
  return t ? (t.zone === "salon" ? `Mesa ${t.label}` : t.label) : "Sin mesa";
};

export default function ReservasPage() {
  const { state, dispatch, me, orderForTable, openTable } = useStore();
  const router = useRouter();
  const now = useNow(30000);
  const [day, setDay] = useState(() => new Date(new Date(now).setHours(0, 0, 0, 0)));
  const [editing, setEditing] = useState<Reservation | "new" | null>(null);

  const list = onDay(state.reservations, day);
  const isToday = dateKey(day) === dateKey(new Date(now));
  const pending = list.filter((r) => r.status === "confirmada");
  const shift = (n: number) => setDay(new Date(day.getFullYear(), day.getMonth(), day.getDate() + n));

  const seat = (r: Reservation) => {
    if (!r.tableId) {
      setEditing(r);
      toast("Asigna una mesa para sentarlos");
      return;
    }
    if (orderForTable(r.tableId)) {
      toast.error(`${tableName(r.tableId)} está ocupada`, { description: "Elige otra mesa en la reserva." });
      setEditing(r);
      return;
    }
    openTable(r.tableId, r.party);
    dispatch({ type: "setReservationStatus", id: r.id, status: "sentada" });
    dispatch({
      type: "setTableNote",
      tableId: r.tableId,
      note: { guestId: r.guestId, name: r.name, text: r.notes, occasion: /cumple/i.test(r.notes ?? "") ? "cumpleanos" : undefined },
    });
    toast.success(`${r.name} en ${tableName(r.tableId)}`);
    if (can(me?.role, "order.take")) router.push(`/pos/mesa/${r.tableId}`);
  };

  return (
    <PageBody>
      <PageHeader
        eyebrow={isToday ? "Hoy" : day.toLocaleDateString("es-BO", { weekday: "long", day: "numeric", month: "long" })}
        title="Reservas"
        description="Cada reserva tiene su mesa; el sistema no deja reservar dos veces la misma mesa a la misma hora."
        actions={
          <Button size="lg" onClick={() => setEditing("new")}>
            <Plus /> Nueva reserva
          </Button>
        }
      />

      <div className="mt-6 flex items-center gap-1.5">
        <Button variant="secondary" size="icon-sm" aria-label="Día anterior" onClick={() => shift(-1)}>
          <ChevronLeft />
        </Button>
        <span className="min-w-[170px] text-center text-[14px] font-semibold capitalize">
          {day.toLocaleDateString("es-BO", { weekday: "short", day: "numeric", month: "short" })}
        </span>
        <Button variant="secondary" size="icon-sm" aria-label="Día siguiente" onClick={() => shift(1)}>
          <ChevronRight />
        </Button>
        {!isToday && (
          <Button variant="ghost" size="sm" onClick={() => setDay(new Date(new Date(now).setHours(0, 0, 0, 0)))}>
            Hoy
          </Button>
        )}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatTile icon={CalendarDays} label="Reservas" value={String(list.filter((r) => r.status !== "cancelada").length)} />
        <StatTile icon={Users} label="Personas" value={String(coversOf(list))} note="Confirmadas y sentadas" />
        <StatTile icon={CalendarCheck} label="Por llegar" value={String(pending.length)} note={pending[0] ? `Próxima ${hhmm(pending[0].at)}` : "Nadie más"} />
        <StatTile icon={CalendarX2} label="No vinieron" value={String(list.filter((r) => r.status === "no-show").length)} tone={list.some((r) => r.status === "no-show") ? "warn" : undefined} />
      </div>

      <section className="mt-6 rounded-[22px] border bg-card shadow-card" aria-label="Reservas del día">
        {list.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-[15px] font-semibold">Sin reservas este día</p>
            <Button className="mt-4" onClick={() => setEditing("new")}>
              <Plus /> Nueva reserva
            </Button>
          </div>
        ) : (
          <ul className="divide-y">
            {list.map((r) => {
              const late = isLate(r, now);
              return (
                <li key={r.id} className={cn("flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-4", (r.status === "cancelada" || r.status === "no-show") && "opacity-60")}>
                  <span className="w-14 text-[17px] font-semibold tabular">{hhmm(r.at)}</span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="text-[15px] font-semibold">{r.name}</span>
                      <StatusPill r={r} late={late} />
                    </span>
                    <span className="block text-[12.5px] text-muted-foreground">
                      {r.party} pers. · {tableName(r.tableId)}
                      {r.phone && ` · ${r.phone}`}
                    </span>
                    {r.notes && (
                      <span className="mt-1 flex items-center gap-1.5 text-[12.5px]">
                        <StickyNote className="size-3.5 text-primary" aria-hidden /> {r.notes}
                      </span>
                    )}
                  </span>
                  {r.status === "confirmada" && (
                    <span className="flex gap-1.5">
                      <Button size="sm" onClick={() => seat(r)} disabled={!isToday}>
                        Sentar
                      </Button>
                      <Button size="sm" variant="secondary" onClick={() => setEditing(r)}>
                        Editar
                      </Button>
                      {late && (
                        <Button size="sm" variant="ghost" onClick={() => dispatch({ type: "setReservationStatus", id: r.id, status: "no-show" })}>
                          No vino
                        </Button>
                      )}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <ReservationSheet value={editing} day={day} onClose={() => setEditing(null)} />
    </PageBody>
  );
}

function StatusPill({ r, late }: { r: Reservation; late: boolean }) {
  if (late)
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-status-warning/18 px-2 py-0.5 text-[11px] font-semibold text-status-warning-ink">
        <Clock className="size-3" aria-hidden /> Atrasada
      </span>
    );
  const cls = {
    confirmada: "bg-status-info/12 text-status-info",
    sentada: "bg-status-good/14 text-status-good-ink",
    "no-show": "bg-status-critical/12 text-status-critical",
    cancelada: "bg-secondary text-muted-foreground",
  }[r.status];
  return <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold", cls)}>{STATUS_LABEL[r.status]}</span>;
}

function ReservationSheet({ value, day, onClose }: { value: Reservation | "new" | null; day: Date; onClose: () => void }) {
  const { state, dispatch, me } = useStore();
  const editing = value && value !== "new" ? value : null;
  const [name, setName] = useState("");
  const [guestId, setGuestId] = useState<string | undefined>();
  const [phone, setPhone] = useState("");
  const [party, setParty] = useState(2);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("20:00");
  const [tableId, setTableId] = useState<string | undefined>();
  const [notes, setNotes] = useState("");
  const [tried, setTried] = useState(false);

  useEffect(() => {
    if (!value) return;
    const at = editing ? new Date(editing.at) : day;
    setName(editing?.name ?? "");
    setGuestId(editing?.guestId);
    setPhone(editing?.phone ?? "");
    setParty(editing?.party ?? 2);
    setDate(dateKey(at));
    setTime(editing ? hhmm(editing.at) : "20:00");
    setTableId(editing?.tableId);
    setNotes(editing?.notes ?? "");
    setTried(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset when another booking opens
  }, [value]);

  if (!value) return null;
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  const at = new Date(y, (m || 1) - 1, d || 1, hh || 0, mm || 0).getTime();
  const options = freeTables(party, at, 120, TABLES, state.reservations, editing?.id);
  const clash = tableId ? conflicts({ id: editing?.id ?? "", at, durationMin: 120, tableId }, state.reservations) : [];
  const phoneNorm = phone.trim() ? normalizePhone(phone) : undefined;
  const matches = name.trim().length >= 2 && !guestId ? state.guests.filter((g) => g.name.toLowerCase().includes(name.trim().toLowerCase())).slice(0, 4) : [];
  const errors = {
    name: !name.trim() ? "¿A nombre de quién?" : undefined,
    phone: phoneNorm === null ? "Celular de 8 dígitos, ej. 70012345." : undefined,
    table: clash.length ? `${tableName(tableId)} ya está reservada a las ${hhmm(clash[0].at)}.` : undefined,
  };

  const save = () => {
    setTried(true);
    if (Object.values(errors).some(Boolean) || !me) return;
    const r: Reservation = {
      id: editing?.id ?? newId(), guestId, name: name.trim(), phone: phoneNorm ?? undefined, party, at, durationMin: 120, tableId,
      status: editing?.status ?? "confirmada", notes: notes.trim() || undefined, createdBy: editing?.createdBy ?? me.id,
    };
    dispatch({ type: "upsertReservation", reservation: r });
    toast.success(editing ? "Reserva actualizada" : "Reserva creada", { description: `${r.name} · ${r.party} pers. · ${hhmm(at)} · ${tableName(tableId)}` });
    onClose();
  };

  return (
    <Sheet open onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-[460px]" onOpenAutoFocus={(e) => e.preventDefault()}>
        <SheetHeader className="border-b px-6 pt-6 pb-4">
          <SheetTitle className="text-[20px]">{editing ? "Editar reserva" : "Nueva reserva"}</SheetTitle>
          <SheetDescription>Duración estimada: 2 horas.</SheetDescription>
        </SheetHeader>
        <form
          id="res-form"
          className="flex-1 space-y-5 overflow-y-auto px-6 py-5"
          onSubmit={(e) => {
            e.preventDefault();
            save();
          }}
        >
          <Field label="A nombre de" error={tried ? errors.name : undefined}>
            {(p) => (
              <TextInput
                {...p}
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setGuestId(undefined);
                }}
                placeholder="Nombre o cliente frecuente"
                autoComplete="off"
              />
            )}
          </Field>
          {matches.length > 0 && (
            <div className="-mt-3 flex flex-wrap gap-2" role="group" aria-label="Clientes encontrados">
              {matches.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => {
                    setName(g.name);
                    setGuestId(g.id);
                    setPhone(g.phone ?? "");
                    if (g.notes) setNotes(g.notes);
                  }}
                  className="press rounded-full border bg-secondary px-3 py-1.5 text-[12.5px] font-medium hover:border-primary/50"
                >
                  {g.name} · {g.visits} visitas
                </button>
              ))}
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Celular" error={tried ? errors.phone : undefined}>
              {(p) => <TextInput {...p} value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" placeholder="70012345" />}
            </Field>
            <div className="space-y-1.5">
              <p className="text-[13px] font-semibold">Personas</p>
              <div className="flex h-11 items-center justify-between rounded-xl border px-1.5">
                <Button type="button" variant="ghost" size="icon-sm" aria-label="Menos personas" onClick={() => setParty((x) => Math.max(1, x - 1))}>
                  <Minus />
                </Button>
                <span className="text-[16px] font-semibold tabular" aria-live="polite">{party}</span>
                <Button type="button" variant="ghost" size="icon-sm" aria-label="Más personas" onClick={() => setParty((x) => Math.min(40, x + 1))}>
                  <Plus />
                </Button>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Fecha">{(p) => <TextInput {...p} type="date" value={date} onChange={(e) => setDate(e.target.value)} />}</Field>
            <Field label="Hora">{(p) => <TextInput {...p} type="time" value={time} onChange={(e) => setTime(e.target.value)} />}</Field>
          </div>
          <div className="space-y-1.5">
            <p className="text-[13px] font-semibold">Mesa</p>
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Mesa">
              {[...(tableId && !options.some((t) => t.id === tableId) ? [tableById(tableId)!] : []), ...options].slice(0, 12).map((t) => (
                <button
                  key={t.id}
                  type="button"
                  role="radio"
                  aria-checked={tableId === t.id}
                  onClick={() => setTableId(t.id)}
                  className={cn(
                    "press h-10 rounded-xl border px-3 text-[13px] font-medium",
                    tableId === t.id ? "border-primary bg-primary/12" : "bg-secondary text-muted-foreground",
                  )}
                >
                  {tableName(t.id)} <span className="text-muted-foreground">· {t.seats}</span>
                </button>
              ))}
              {options.length === 0 && <p className="text-[13px] text-muted-foreground">No hay mesas libres para {party} a esa hora. Puedes guardarla sin mesa.</p>}
            </div>
            {tried && errors.table && <p className="text-[12px] text-status-critical">{errors.table}</p>}
          </div>
          <Field label="Notas" hint="Ocasión, alergias, pedidos especiales.">
            {(p) => <TextArea {...p} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Ej. Cumpleaños, traen torta" />}
          </Field>
        </form>
        <div className="flex items-center gap-2 border-t px-6 py-4">
          {editing && editing.status === "confirmada" && (
            <Button
              type="button"
              variant="ghost"
              className="text-status-critical hover:text-status-critical"
              onClick={() => {
                dispatch({ type: "setReservationStatus", id: editing.id, status: "cancelada" });
                toast(`Reserva de ${editing.name} cancelada`);
                onClose();
              }}
            >
              Cancelar reserva
            </Button>
          )}
          <span className="flex-1" />
          <Button type="button" variant="outline" onClick={onClose}>
            Cerrar
          </Button>
          <Button type="submit" form="res-form">
            {editing ? "Guardar" : "Reservar"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
