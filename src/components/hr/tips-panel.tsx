"use client";

import { useState } from "react";
import { Check, HandCoins } from "lucide-react";
import { toast } from "sonner";
import { ChipSelect } from "@/components/app/form";
import { ROLE_TINT } from "@/components/app/role-tint";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { splitTips } from "@/modules/hr/tips";
import { formatHours, minutesWorked } from "@/modules/hr/time";
import { shiftPayments } from "@/modules/pos/cash";
import { formatBs } from "@/modules/pos/money";
import { ROLE_LABEL } from "@/modules/pos/permissions";
import { newId, useNow, useStore } from "@/modules/pos/store";
import type { Staff } from "@/modules/pos/types";
import { cn } from "@/lib/utils";

const when = (t: number) =>
  new Date(t).toLocaleString("es-BO", { weekday: "short", day: "numeric", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });

/** Split a register shift's tips among the people who worked it: equally or by hours. */
export function TipsPanel({ team }: { team: Staff[] }) {
  const { state, dispatch, me, staffById } = useStore();
  const now = useNow(30000);
  const shifts = [...state.cashShifts].sort((a, b) => b.openedAt - a.openedAt);
  const [shiftId, setShiftId] = useState(shifts.find((s) => s.closedAt)?.id ?? shifts[0]?.id ?? "");
  const [mode, setMode] = useState<"equal" | "hours">("hours");
  const [includeKitchen, setIncludeKitchen] = useState(true);

  const shift = shifts.find((s) => s.id === shiftId);
  if (!shift) return <p className="text-[14px] text-muted-foreground">Todavía no hay turnos de caja.</p>;

  const live = !shift.closedAt;
  const total = live
    ? shiftPayments(state.payments, shift.id).reduce((s, p) => s + p.tipMinor, 0)
    : (shift.summary?.tipsMinor ?? 0);
  const from = shift.openedAt;
  const to = shift.closedAt ?? now;
  const people = team
    .filter((p) => p.role !== "owner" && (includeKitchen || p.role !== "kitchen"))
    .map((p) => ({ staff: p, minutes: minutesWorked(state.timeEntries, p.id, from, to, now) }))
    .filter((x) => x.minutes > 0);
  const preview = splitTips(total, people.map((x) => ({ staffId: x.staff.id, weight: mode === "hours" ? x.minutes : 1 })));
  const saved = state.tipSplits.find((t) => t.shiftId === shift.id);

  return (
    <section aria-label="Propinas" className="grid gap-4 xl:grid-cols-12">
      <div className="space-y-4 xl:col-span-5">
        <div className="rounded-[22px] border bg-card p-5 shadow-card">
          <h3 className="text-[15px] font-semibold">Turno de caja</h3>
          <ul className="mt-3 space-y-2">
            {shifts.slice(0, 5).map((s) => (
              <li key={s.id}>
                <button
                  aria-pressed={s.id === shiftId}
                  onClick={() => setShiftId(s.id)}
                  className={cn(
                    "press flex w-full items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left text-[13px]",
                    s.id === shiftId ? "border-primary bg-primary/10" : "bg-secondary/50 hover:bg-accent",
                  )}
                >
                  <span>
                    <span className="block font-semibold capitalize">{when(s.openedAt)}</span>
                    <span className="block text-muted-foreground">
                      {s.closedAt ? `Cerró ${staffById(s.closedBy ?? "")?.name}` : "En curso"}
                      {state.tipSplits.some((t) => t.shiftId === s.id) && " · repartido"}
                    </span>
                  </span>
                  <span className="font-semibold tabular">
                    {formatBs(s.closedAt ? (s.summary?.tipsMinor ?? 0) : shiftPayments(state.payments, s.id).reduce((a, p) => a + p.tipMinor, 0))}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-4 rounded-[22px] border bg-card p-5 shadow-card">
          <h3 className="text-[15px] font-semibold">Cómo repartir</h3>
          <ChipSelect
            label="Forma de reparto"
            value={mode}
            onChange={setMode}
            options={[
              { value: "hours", label: "Por horas trabajadas" },
              { value: "equal", label: "Partes iguales" },
            ]}
          />
          <label className="flex items-center justify-between gap-4">
            <span>
              <span className="block text-[14px] font-medium">Incluir a cocina</span>
              <span className="block text-[12px] text-muted-foreground">Muchos locales reparten también con la cocina.</span>
            </span>
            <Switch checked={includeKitchen} onCheckedChange={setIncludeKitchen} />
          </label>
        </div>
      </div>

      <div className="rounded-[22px] border bg-card p-5 shadow-card xl:col-span-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-[15px] font-semibold">{saved ? "Reparto guardado" : "Vista previa"}</h3>
            <p className="text-[13px] text-muted-foreground">
              {live ? "Turno en curso: el total puede subir hasta el cierre." : "Propinas del turno cerrado."}
            </p>
          </div>
          <p className="text-right">
            <span className="block text-[12px] text-muted-foreground">Total</span>
            <span data-testid="tips-total" className="block text-[26px] leading-none font-semibold tracking-[-0.02em] tabular">
              {formatBs(saved?.totalMinor ?? total)}
            </span>
          </p>
        </div>

        {(saved ? saved.shares.length : people.length) === 0 ? (
          <p className="mt-6 rounded-2xl border border-dashed p-8 text-center text-[14px] text-muted-foreground">
            Nadie marcó entrada en este turno.
          </p>
        ) : (
          <ul className="mt-4 divide-y">
            {(saved
              ? saved.shares.map((x) => ({ staff: staffById(x.staffId)!, minutes: x.minutes, amount: x.amountMinor, paidAt: x.paidAt }))
              : people.map((x, i) => ({ staff: x.staff, minutes: x.minutes, amount: preview[i].amountMinor, paidAt: undefined as number | undefined }))
            ).map((row) => (
              <li key={row.staff.id} className="flex items-center gap-3 py-3">
                <span className={cn("grid size-9 shrink-0 place-items-center rounded-full text-[13px] font-semibold", ROLE_TINT[row.staff.role])}>
                  {row.staff.name[0]}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[14px] font-semibold">{row.staff.name}</span>
                  <span className="block text-[12px] text-muted-foreground">
                    {ROLE_LABEL[row.staff.role]} · {formatHours(row.minutes)}
                  </span>
                </span>
                <span data-testid="tip-share" className="text-[15px] font-semibold tabular">{formatBs(row.amount)}</span>
                {saved &&
                  (row.paidAt ? (
                    <span className="inline-flex h-8 items-center gap-1 rounded-full bg-status-good/14 px-3 text-[12px] font-semibold text-status-good-ink">
                      <Check className="size-3.5" aria-hidden /> Pagado
                    </span>
                  ) : (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => dispatch({ type: "markTipPaid", splitId: saved.id, staffId: row.staff.id, at: Date.now() })}
                    >
                      Marcar pagado
                    </Button>
                  ))}
              </li>
            ))}
          </ul>
        )}

        {!saved && people.length > 0 && (
          <Button
            size="lg"
            className="mt-4 w-full"
            disabled={total <= 0 || !me}
            onClick={() => {
              if (!me) return;
              dispatch({
                type: "saveTipSplit",
                split: {
                  id: newId(), shiftId: shift.id, method: mode, includeKitchen, totalMinor: total, createdBy: me.id, at: Date.now(),
                  shares: people.map((x, i) => ({ staffId: x.staff.id, amountMinor: preview[i].amountMinor, minutes: x.minutes })),
                },
              });
              toast.success("Reparto guardado", { description: `${formatBs(total)} entre ${people.length} personas` });
            }}
          >
            <HandCoins /> Guardar reparto
          </Button>
        )}
        {saved && (
          <p className="mt-3 text-[12px] text-muted-foreground">
            Guardado por {staffById(saved.createdBy)?.name} · {saved.method === "hours" ? "por horas" : "partes iguales"}
            {saved.includeKitchen ? " · con cocina" : " · sin cocina"}
          </p>
        )}
      </div>
    </section>
  );
}
