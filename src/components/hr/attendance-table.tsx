"use client";

import { useState } from "react";
import { AlarmClock, Download, Pencil, UserCheck, UserX } from "lucide-react";
import { toast } from "sonner";
import { ROLE_TINT } from "@/components/app/role-tint";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { estimatedPayMinor, PAY_LABEL } from "@/modules/hr/pay";
import { attendanceFor, dateKey, formatHours, weekStartOf, weekSummary, type TimeEntry } from "@/modules/hr/time";
import { formatBs, minorToInput } from "@/modules/pos/money";
import { can, ROLE_LABEL } from "@/modules/pos/permissions";
import { useNow, useStore } from "@/modules/pos/store";
import type { Staff } from "@/modules/pos/types";
import { cn } from "@/lib/utils";
import { addDays, WeekNav } from "./week-nav";

const hhmm = (t: number) => new Date(t).toLocaleTimeString("es-BO", { hour: "2-digit", minute: "2-digit", hourCycle: "h23" });

/** Who came, who was late, hours per person, and the accountant's CSV. */
export function AttendanceTable({ team }: { team: Staff[] }) {
  const { state, me, dispatch } = useStore();
  const now = useNow(30000);
  const thisWeek = weekStartOf(new Date(now));
  const [monday, setMonday] = useState(thisWeek);
  const [fixing, setFixing] = useState<TimeEntry | null>(null);
  const seePay = can(me?.role, "hr.pay.view");

  const rows = weekSummary(team.map((t) => t.id), state.schedule, state.timeEntries, monday, now);
  const today = dateKey(new Date(now));
  const todayShifts = state.schedule.filter((s) => s.date === today && team.some((t) => t.id === s.staffId));
  const working = team.filter((t) => state.timeEntries.some((e) => e.staffId === t.id && !e.outAt));
  const totals = rows.reduce((a, r) => ({ late: a.late + r.late, absent: a.absent + r.absent, worked: a.worked + r.workedMin }), { late: 0, absent: 0, worked: 0 });
  const isThisWeek = monday.getTime() === thisWeek.getTime();

  const exportCsv = () => {
    const head = ["Nombre", "Rol", "Turnos", "Horas programadas", "Horas trabajadas", "Atrasos", "Faltas"];
    if (seePay) head.push("Tipo de pago", "Tarifa (Bs)", "Estimado (Bs)");
    const lines = rows.map((r) => {
      const p = team.find((t) => t.id === r.staffId)!;
      const cols: (string | number)[] = [p.name, ROLE_LABEL[p.role], r.shifts, (r.scheduledMin / 60).toFixed(2), (r.workedMin / 60).toFixed(2), r.late, r.absent];
      if (seePay) {
        const prof = state.profiles[p.id];
        const est = estimatedPayMinor(prof, r.workedMin, r.attended);
        cols.push(prof?.payType ? PAY_LABEL[prof.payType] : "", prof?.payRateMinor ? minorToInput(prof.payRateMinor) : "", est !== null ? minorToInput(est) : "");
      }
      return cols.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",");
    });
    const note = seePay ? ["", '"Estimado de horas, no es planilla. AFP, aguinaldo y aportes los calcula tu contador."'] : [];
    const blob = new Blob(["﻿" + [head.join(","), ...lines, ...note].join("\n")], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `asistencia-${dateKey(monday)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
    toast.success("Asistencia exportada", { description: "Lista para tu contador." });
  };

  return (
    <section aria-label="Asistencia" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <WeekNav monday={monday} onChange={setMonday} thisWeek={thisWeek} />
        <Button variant="outline" onClick={exportCsv}>
          <Download /> Exportar para el contador
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Tile icon={UserCheck} label="Trabajando ahora" value={String(working.length)} note={working.map((w) => w.name).join(", ") || "Nadie marcó entrada"} />
        <Tile icon={AlarmClock} label="Atrasos" value={String(totals.late)} note="Más de 10 min tarde" tone={totals.late ? "warn" : undefined} />
        <Tile icon={UserX} label="Faltas" value={String(totals.absent)} note="Turnos sin marcar entrada" tone={totals.absent ? "bad" : undefined} />
        <Tile icon={Download} label="Horas trabajadas" value={formatHours(totals.worked)} note="Toda la semana" />
      </div>

      {isThisWeek && todayShifts.length > 0 && (
        <div className="rounded-[22px] border bg-card p-5 shadow-card">
          <h3 className="text-[15px] font-semibold">Hoy</h3>
          <ul className="mt-3 divide-y">
            {todayShifts
              .sort((a, b) => a.start.localeCompare(b.start))
              .map((s) => {
                const p = team.find((t) => t.id === s.staffId)!;
                const att = attendanceFor(s, state.timeEntries, now);
                const entry = state.timeEntries.find((e) => e.staffId === s.staffId && "inAt" in att && e.inAt === att.inAt);
                return (
                  <li key={s.id} className="flex flex-wrap items-center gap-3 py-2.5">
                    <span className={cn("grid size-9 shrink-0 place-items-center rounded-full text-[13px] font-semibold", ROLE_TINT[p.role])}>{p.name[0]}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[14px] font-semibold">{p.name}</span>
                      <span className="block text-[12.5px] text-muted-foreground tabular">
                        Turno {s.start}–{s.end}
                        {entry && ` · entró ${hhmm(entry.inAt)}${entry.outAt ? ` · salió ${hhmm(entry.outAt)}` : ""}`}
                        {entry?.editedBy && " · corregido"}
                      </span>
                    </span>
                    <AttendanceBadge kind={att.kind} minutesLate={att.kind === "late" ? att.minutesLate : 0} />
                    {entry && can(me?.role, "hr.manage") && (
                      <Button variant="ghost" size="icon-sm" aria-label={`Corregir marcación de ${p.name}`} onClick={() => setFixing(entry)}>
                        <Pencil />
                      </Button>
                    )}
                  </li>
                );
              })}
          </ul>
        </div>
      )}

      <div className="overflow-x-auto rounded-[22px] border bg-card shadow-card">
        <table className="w-full min-w-[720px] text-[13px]">
          <thead>
            <tr className="border-b text-muted-foreground">
              <th scope="col" className="px-5 py-3 text-left font-medium">Persona</th>
              <th scope="col" className="px-3 py-3 text-right font-medium">Programado</th>
              <th scope="col" className="px-3 py-3 text-right font-medium">Trabajado</th>
              <th scope="col" className="px-3 py-3 text-right font-medium">Atrasos</th>
              <th scope="col" className="px-3 py-3 text-right font-medium">Faltas</th>
              {seePay && <th scope="col" className="px-5 py-3 text-right font-medium">Estimado</th>}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const p = team.find((t) => t.id === r.staffId)!;
              const est = seePay ? estimatedPayMinor(state.profiles[p.id], r.workedMin, r.attended) : null;
              return (
                <tr key={r.staffId} className="border-b last:border-0">
                  <th scope="row" className="px-5 py-3 text-left font-normal">
                    <span className="block text-[14px] font-semibold">{p.name}</span>
                    <span className="block text-[12px] text-muted-foreground">{ROLE_LABEL[p.role]} · {r.attended} de {r.shifts} turnos</span>
                  </th>
                  <td className="px-3 py-3 text-right tabular">{formatHours(r.scheduledMin)}</td>
                  <td className="px-3 py-3 text-right font-semibold tabular">{formatHours(r.workedMin)}</td>
                  <td className={cn("px-3 py-3 text-right tabular", r.late > 0 && "font-semibold text-status-warning-ink")}>{r.late}</td>
                  <td className={cn("px-3 py-3 text-right tabular", r.absent > 0 && "font-semibold text-status-critical")}>{r.absent}</td>
                  {seePay && (
                    <td className="px-5 py-3 text-right tabular">
                      {est !== null ? formatBs(est) : <span className="text-muted-foreground">Mensual</span>}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
        {seePay && (
          <p className="border-t px-5 py-3 text-[12px] text-muted-foreground">
            Estimado por horas o turnos trabajados. No es planilla: AFP, aguinaldo y aportes los calcula tu contador.
          </p>
        )}
      </div>

      <FixEntryDialog
        entry={fixing}
        onClose={() => setFixing(null)}
        onSave={(inAt, outAt) => {
          if (!fixing || !me) return;
          dispatch({ type: "correctEntry", entryId: fixing.id, inAt, outAt, editedBy: me.id });
          setFixing(null);
          toast.success("Marcación corregida", { description: "Queda registrado quién la corrigió." });
        }}
      />
    </section>
  );
}

export function AttendanceBadge({ kind, minutesLate }: { kind: "upcoming" | "absent" | "on-time" | "late"; minutesLate?: number }) {
  const map = {
    upcoming: ["Aún no empieza", "bg-secondary text-muted-foreground"],
    absent: ["No marcó entrada", "bg-status-critical/12 text-status-critical"],
    "on-time": ["A tiempo", "bg-status-good/14 text-status-good-ink"],
    late: [`${minutesLate} min tarde`, "bg-status-warning/18 text-status-warning-ink"],
  } as const;
  const [label, cls] = map[kind];
  return <span className={cn("inline-flex h-6 items-center rounded-full px-2.5 text-xs font-semibold", cls)}>{label}</span>;
}

function Tile({ icon: Icon, label, value, note, tone }: { icon: typeof UserCheck; label: string; value: string; note: string; tone?: "warn" | "bad" }) {
  return (
    <div className="rounded-[22px] border bg-card p-5 shadow-card">
      <div className="flex items-center gap-3">
        <span
          className={cn(
            "grid size-10 place-items-center rounded-[12px] bg-ember-soft text-primary",
            tone === "warn" && "bg-status-warning/18 text-status-warning-ink",
            tone === "bad" && "bg-status-critical/12 text-status-critical",
          )}
        >
          <Icon className="size-5" aria-hidden />
        </span>
        <h3 className="text-[13px] font-medium text-muted-foreground">{label}</h3>
      </div>
      <p className="mt-4 text-[28px] leading-none font-semibold tracking-[-0.025em] tabular">{value}</p>
      <p className="mt-2 truncate text-[12.5px] text-muted-foreground">{note}</p>
    </div>
  );
}

function FixEntryDialog({ entry, onClose, onSave }: { entry: TimeEntry | null; onClose: () => void; onSave: (inAt: number, outAt?: number) => void }) {
  const [inT, setIn] = useState("");
  const [outT, setOut] = useState("");
  const [key, setKey] = useState<string | null>(null);
  if ((entry?.id ?? null) !== key) {
    setKey(entry?.id ?? null);
    setIn(entry ? hhmm(entry.inAt) : "");
    setOut(entry?.outAt ? hhmm(entry.outAt) : "");
  }
  if (!entry) return null;
  const base = new Date(entry.inAt);
  const at = (t: string, ref: Date) => {
    const [h, m] = t.split(":").map(Number);
    return new Date(ref.getFullYear(), ref.getMonth(), ref.getDate(), h, m).getTime();
  };
  const inAt = /^\d{2}:\d{2}$/.test(inT) ? at(inT, base) : null;
  let outAt = /^\d{2}:\d{2}$/.test(outT) ? at(outT, base) : undefined;
  if (inAt !== null && outAt !== undefined && outAt <= inAt) outAt = at(outT, addDays(base, 1));

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-xl">Corregir marcación</DialogTitle>
          <DialogDescription>La corrección queda registrada con tu nombre.</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <label className="text-[13px] font-semibold">
            Entrada
            <input type="time" value={inT} onChange={(e) => setIn(e.target.value)} className="mt-1.5 h-11 w-full rounded-xl border bg-secondary px-3 text-[15px] tabular" />
          </label>
          <label className="text-[13px] font-semibold">
            Salida
            <input type="time" value={outT} onChange={(e) => setOut(e.target.value)} className="mt-1.5 h-11 w-full rounded-xl border bg-secondary px-3 text-[15px] tabular" />
          </label>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button disabled={inAt === null} onClick={() => inAt !== null && onSave(inAt, outAt)}>
            Guardar corrección
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
