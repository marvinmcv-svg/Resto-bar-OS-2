"use client";

import { useState } from "react";
import { Copy, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ROLE_DOT, ROLE_TINT } from "@/components/app/role-tint";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SHIFT_TEMPLATES } from "@/modules/hr/demo-hr";
import { dateKey, formatHours, scheduledMinutes, weekStartOf, type ScheduleShift } from "@/modules/hr/time";
import { ROLE_LABEL } from "@/modules/pos/permissions";
import { newId, useNow, useStore } from "@/modules/pos/store";
import type { Staff } from "@/modules/pos/types";
import { cn } from "@/lib/utils";
import { addDays, DAY_SHORT, WeekNav } from "./week-nav";

/** Who works when: staff × days, with shift blocks from templates or custom times. */
export function ScheduleGrid({ team }: { team: Staff[] }) {
  const { state, dispatch } = useStore();
  const now = useNow(60000);
  const thisWeek = weekStartOf(new Date(now));
  const [monday, setMonday] = useState(thisWeek);
  const [editing, setEditing] = useState<{ staff: Staff; date: string; shift?: ScheduleShift } | null>(null);
  const days = Array.from({ length: 7 }, (_, i) => addDays(monday, i));
  const keys = days.map(dateKey);
  const inWeek = state.schedule.filter((s) => keys.includes(s.date));
  const today = dateKey(new Date(now));

  const copyLastWeek = () => {
    const prevKeys = days.map((d) => dateKey(addDays(d, -7)));
    const prev = state.schedule.filter((s) => prevKeys.includes(s.date));
    if (prev.length === 0) {
      toast("La semana anterior no tiene turnos");
      return;
    }
    const shifts = prev.map((s) => ({ ...s, id: newId(), date: keys[prevKeys.indexOf(s.date)] }));
    dispatch({ type: "replaceWeek", weekStart: keys[0], shifts });
    toast.success(`${shifts.length} turnos copiados de la semana anterior`);
  };

  return (
    <section aria-label="Horarios de la semana">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <WeekNav monday={monday} onChange={setMonday} thisWeek={thisWeek} />
        <Button variant="outline" onClick={copyLastWeek}>
          <Copy /> Copiar semana anterior
        </Button>
      </div>

      <div className="mt-4 overflow-x-auto rounded-[22px] border bg-card shadow-card">
        <table className="w-full min-w-[920px] table-fixed text-[13px]">
          <thead>
            <tr className="border-b">
              <th scope="col" className="w-[180px] px-4 py-3 text-left font-medium text-muted-foreground">Persona</th>
              {days.map((d, i) => (
                <th
                  key={i}
                  scope="col"
                  className={cn("px-1.5 py-3 text-center font-medium text-muted-foreground", keys[i] === today && "text-primary")}
                >
                  {DAY_SHORT[i]} <span className="tabular">{d.getDate()}</span>
                </th>
              ))}
              <th scope="col" className="w-[84px] px-3 py-3 text-right font-medium text-muted-foreground">Horas</th>
            </tr>
          </thead>
          <tbody>
            {team.map((p) => {
              const mine = inWeek.filter((s) => s.staffId === p.id);
              const total = mine.reduce((sum, s) => sum + scheduledMinutes(s), 0);
              return (
                <tr key={p.id} className="border-b last:border-0">
                  <th scope="row" className="px-4 py-2 text-left font-normal">
                    <span className="flex items-center gap-2.5">
                      <span className={cn("grid size-8 shrink-0 place-items-center rounded-full text-[12px] font-semibold", ROLE_TINT[p.role])}>{p.name[0]}</span>
                      <span className="min-w-0">
                        <span className="block truncate text-[14px] font-semibold">{p.name}</span>
                        <span className="block truncate text-[12px] text-muted-foreground">{ROLE_LABEL[p.role]}</span>
                      </span>
                    </span>
                  </th>
                  {keys.map((k) => {
                    const s = mine.find((x) => x.date === k);
                    return (
                      <td key={k} className={cn("px-1 py-2", k === today && "bg-primary/5")}>
                        {s ? (
                          <button
                            onClick={() => setEditing({ staff: p, date: k, shift: s })}
                            className="press flex w-full flex-col items-center rounded-xl border bg-secondary/70 px-1 py-1.5 hover:border-primary/50"
                            aria-label={`${p.name}, ${k}, ${s.start} a ${s.end}. Editar`}
                          >
                            <span className={cn("mb-1 h-1 w-6 rounded-full", ROLE_DOT[p.role])} aria-hidden />
                            <span className="font-semibold tabular">{s.start}</span>
                            <span className="text-[11.5px] text-muted-foreground tabular">{s.end}</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => setEditing({ staff: p, date: k })}
                            className="press grid h-[54px] w-full place-items-center rounded-xl border border-dashed text-muted-foreground/60 hover:border-primary/50 hover:text-primary"
                            aria-label={`Agregar turno a ${p.name} el ${k}`}
                          >
                            <Plus className="size-4" aria-hidden />
                          </button>
                        )}
                      </td>
                    );
                  })}
                  <td className="px-3 py-2 text-right font-semibold tabular">{formatHours(total)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <ShiftDialog
        value={editing}
        onClose={() => setEditing(null)}
        onSave={(shift) => {
          dispatch({ type: "upsertSchedule", shift });
          setEditing(null);
        }}
        onDelete={(id) => {
          dispatch({ type: "removeSchedule", id });
          setEditing(null);
        }}
      />
    </section>
  );
}

function ShiftDialog({
  value, onClose, onSave, onDelete,
}: {
  value: { staff: Staff; date: string; shift?: ScheduleShift } | null;
  onClose: () => void;
  onSave: (s: ScheduleShift) => void;
  onDelete: (id: string) => void;
}) {
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [key, setKey] = useState<string | null>(null);
  const k = value ? `${value.staff.id}-${value.date}-${value.shift?.id ?? "new"}` : null;
  if (k !== key) {
    setKey(k);
    setStart(value?.shift?.start ?? SHIFT_TEMPLATES[1].start);
    setEnd(value?.shift?.end ?? SHIFT_TEMPLATES[1].end);
  }
  if (!value) return null;
  const [y, m, d] = value.date.split("-").map(Number);
  const dayName = new Date(y, m - 1, d).toLocaleDateString("es-BO", { weekday: "long", day: "numeric", month: "long" });
  const valid = /^\d{2}:\d{2}$/.test(start) && /^\d{2}:\d{2}$/.test(end) && start !== end;
  const minutes = valid ? scheduledMinutes({ id: "", staffId: "", date: value.date, start, end }) : 0;

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-xl">Turno de {value.staff.name}</DialogTitle>
          <DialogDescription className="capitalize">{dayName}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Turnos frecuentes">
          {SHIFT_TEMPLATES.map((t) => (
            <button
              key={t.label}
              type="button"
              aria-pressed={start === t.start && end === t.end}
              onClick={() => {
                setStart(t.start);
                setEnd(t.end);
              }}
              className={cn(
                "press h-9 rounded-full border px-3.5 text-[13px] font-medium",
                start === t.start && end === t.end ? "border-primary bg-primary/12" : "bg-secondary text-muted-foreground",
              )}
            >
              {t.label} <span className="tabular">{t.start}–{t.end}</span>
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <label className="text-[13px] font-semibold">
            Entra
            <input type="time" value={start} onChange={(e) => setStart(e.target.value)} className="mt-1.5 h-11 w-full rounded-xl border bg-secondary px-3 text-[15px] tabular" />
          </label>
          <label className="text-[13px] font-semibold">
            Sale
            <input type="time" value={end} onChange={(e) => setEnd(e.target.value)} className="mt-1.5 h-11 w-full rounded-xl border bg-secondary px-3 text-[15px] tabular" />
          </label>
        </div>
        <p className="text-[13px] text-muted-foreground">
          {valid ? `${formatHours(minutes)}${end <= start ? " · termina al día siguiente" : ""}` : "Elige la hora de entrada y de salida."}
        </p>
        <DialogFooter>
          {value.shift && (
            <Button variant="ghost" className="mr-auto text-status-critical hover:text-status-critical" onClick={() => onDelete(value.shift!.id)}>
              <Trash2 /> Quitar
            </Button>
          )}
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            disabled={!valid}
            onClick={() => onSave({ id: value.shift?.id ?? newId(), staffId: value.staff.id, date: value.date, start, end })}
          >
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
