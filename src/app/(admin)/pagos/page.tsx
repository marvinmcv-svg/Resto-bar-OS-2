"use client";

import { useState } from "react";
import { Download, HandCoins, Receipt, TriangleAlert, Wallet } from "lucide-react";
import { toast } from "sonner";
import { ChipSelect } from "@/components/app/form";
import { PageBody, PageHeader } from "@/components/app/page-header";
import { StatTile } from "@/components/app/stat-tile";
import { METHOD_NAME } from "@/components/cash/shift-summary";
import { Button } from "@/components/ui/button";
import { cashDifference } from "@/modules/pos/cash";
import { formatBs, minorToInput } from "@/modules/pos/money";
import { tableById, useStore } from "@/modules/pos/store";
import type { PaymentMethod } from "@/modules/pos/types";
import { cn } from "@/lib/utils";

const when = (t: number) => new Date(t).toLocaleTimeString("es-BO", { hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
const day = (t: number) => new Date(t).toLocaleDateString("es-BO", { weekday: "short", day: "numeric", month: "short" });

/** Every charge, by method, with the register closes. Payments are records only (ADR-006): nothing to refund here. */
export default function PagosPage() {
  const { state, staffById } = useStore();
  const [method, setMethod] = useState<PaymentMethod | "todos">("todos");
  const payments = [...state.payments].sort((a, b) => b.at - a.at);
  const list = payments.filter((p) => method === "todos" || p.method === method);
  const total = list.reduce((s, p) => s + p.amountMinor, 0);
  const tips = list.reduce((s, p) => s + p.tipMinor, 0);
  const closes = state.cashShifts.filter((s) => s.closedAt).sort((a, b) => (b.closedAt ?? 0) - (a.closedAt ?? 0));
  const flagged = closes.filter((s) => s.countedMinor !== undefined && s.expectedMinor !== undefined && cashDifference(s.countedMinor, s.expectedMinor).flagged);
  const table = (id: string) => {
    const t = tableById(id);
    return t ? (t.zone === "salon" ? `Mesa ${t.label}` : t.label) : "Cuenta";
  };

  const exportCsv = () => {
    const rows = [
      ["Fecha", "Hora", "Mesa", "Método", "Monto (Bs)", "Propina (Bs)", "Cobró"],
      ...list.map((p) => [new Date(p.at).toLocaleDateString("es-BO"), when(p.at), table(p.tableId), METHOD_NAME[p.method], minorToInput(p.amountMinor), minorToInput(p.tipMinor), staffById(p.by)?.name ?? ""]),
    ];
    const blob = new Blob(["﻿" + rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n")], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `pagos-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
    toast.success("Pagos exportados");
  };

  return (
    <PageBody>
      <PageHeader
        eyebrow="Turno de hoy"
        title="Pagos"
        description="Todos los cobros con su método y quién cobró. Los pagos se registran; el dinero lo procesa tu banco o tu POS de tarjetas."
        actions={
          <Button variant="outline" size="lg" onClick={exportCsv}>
            <Download /> Exportar
          </Button>
        }
      />

      <div className="mt-7 grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatTile icon={Receipt} label="Cobrado" value={formatBs(total)} note={`${list.length} cobros`} />
        <StatTile icon={HandCoins} label="Propinas" value={formatBs(tips)} />
        <StatTile icon={Wallet} label="Ticket promedio" value={formatBs(list.length ? Math.round(total / list.length) : 0)} />
        <StatTile
          icon={TriangleAlert}
          label="Cierres con diferencia"
          value={String(flagged.length)}
          note={flagged.length ? "Más de Bs 10" : "Todo cuadra"}
          tone={flagged.length ? "bad" : "good"}
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-12">
        <section className="rounded-[22px] border bg-card shadow-card xl:col-span-8" aria-label="Cobros">
          <div className="no-scrollbar overflow-x-auto border-b px-5 py-4">
            <ChipSelect
              label="Método"
              className="flex-nowrap"
              value={method}
              onChange={setMethod}
              options={[{ value: "todos" as const, label: "Todos" }, ...(Object.keys(METHOD_NAME) as PaymentMethod[]).map((m) => ({ value: m, label: METHOD_NAME[m] }))]}
            />
          </div>
          {list.length === 0 ? (
            <p className="p-10 text-center text-[14px] text-muted-foreground">Sin cobros con este método.</p>
          ) : (
            <ul className="max-h-[640px] divide-y overflow-y-auto">
              {list.map((p) => (
                <li key={p.id} className="flex items-center gap-3 px-5 py-3 text-[13.5px]">
                  <span className="w-12 text-muted-foreground tabular">{when(p.at)}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium">{table(p.tableId)}</span>
                    <span className="block text-[12px] text-muted-foreground">
                      {METHOD_NAME[p.method]} · {staffById(p.by)?.name}
                    </span>
                  </span>
                  <span className="text-right">
                    <span className="block font-semibold tabular">{formatBs(p.amountMinor)}</span>
                    {p.tipMinor > 0 && <span className="block text-[11.5px] text-muted-foreground tabular">+{formatBs(p.tipMinor)} propina</span>}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-[22px] border bg-card p-5 shadow-card xl:col-span-4" aria-label="Cierres de caja">
          <h2 className="text-[15px] font-semibold">Cierres de caja</h2>
          {closes.length === 0 ? (
            <p className="mt-3 text-[13px] text-muted-foreground">Todavía no hay cierres.</p>
          ) : (
            <ul className="mt-3 divide-y">
              {closes.map((s) => {
                const d = s.countedMinor !== undefined && s.expectedMinor !== undefined ? cashDifference(s.countedMinor, s.expectedMinor) : null;
                return (
                  <li key={s.id} className="py-3 text-[13px]">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-medium capitalize">{day(s.closedAt!)}</span>
                      {d && (
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-[12px] font-semibold tabular",
                            d.flagged ? "bg-status-critical/12 text-status-critical" : "bg-status-good/14 text-status-good-ink",
                          )}
                        >
                          {d.status === "ok" ? "Cuadró" : `${d.status === "over" ? "Sobró" : "Faltó"} ${formatBs(Math.abs(d.diffMinor))}`}
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-muted-foreground">
                      Ventas {formatBs(s.summary?.salesMinor ?? 0)} · cerró {staffById(s.closedBy ?? "")?.name}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </PageBody>
  );
}
