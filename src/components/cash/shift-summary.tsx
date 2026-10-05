"use client";

import { CircleCheck, Printer, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { cashDifference } from "@/modules/pos/cash";
import { formatBs } from "@/modules/pos/money";
import { useStore } from "@/modules/pos/store";
import type { PaymentMethod } from "@/modules/pos/types";
import type { ClosedCashShift } from "@/modules/hr/demo-hr";
import { cn } from "@/lib/utils";

export const METHOD_NAME: Record<PaymentMethod, string> = { cash: "Efectivo", qr: "QR", card_external: "Tarjeta", transfer: "Transferencia" };

const time = (t?: number) => (t ? new Date(t).toLocaleTimeString("es-BO", { hour: "2-digit", minute: "2-digit", hourCycle: "h23" }) : "—");

/** The close report ("cierre de caja"): what the cashier hands over and the owner receives. */
export function ShiftSummaryDialog({ shift, onClose }: { shift: ClosedCashShift | null; onClose: () => void }) {
  const { staffById } = useStore();
  if (!shift || shift.countedMinor === undefined || shift.expectedMinor === undefined) return null;
  const diff = cashDifference(shift.countedMinor, shift.expectedMinor);
  const s = shift.summary;

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <div className="text-center">
          <span
            className={cn(
              "mx-auto grid size-14 place-items-center rounded-[18px]",
              diff.flagged ? "bg-status-critical/12 text-status-critical" : "bg-status-good/14 text-status-good-ink",
            )}
          >
            {diff.flagged ? <TriangleAlert className="size-7" aria-hidden /> : <CircleCheck className="size-7" aria-hidden />}
          </span>
          <DialogTitle className="mt-4 text-[22px]">Caja cerrada</DialogTitle>
          <DialogDescription className="mt-1">
            {time(shift.openedAt)} a {time(shift.closedAt)} · abrió {staffById(shift.openedBy)?.name}, cerró {staffById(shift.closedBy ?? "")?.name}
          </DialogDescription>
        </div>

        <dl className="mt-2 divide-y rounded-[18px] border text-[14px]">
          <Row label="Esperado en caja" value={formatBs(shift.expectedMinor)} />
          <Row label="Contado" value={formatBs(shift.countedMinor)} />
          <Row
            label="Diferencia"
            value={diff.status === "ok" ? "Cuadra exacto" : `${diff.status === "over" ? "Sobra" : "Falta"} ${formatBs(Math.abs(diff.diffMinor))}`}
            strong
            tone={diff.flagged ? "bad" : diff.status === "ok" ? "good" : undefined}
          />
        </dl>

        {s && (
          <dl className="divide-y rounded-[18px] border text-[14px]">
            <Row label={`Ventas · ${s.payments} cobros`} value={formatBs(s.salesMinor)} strong />
            {(Object.keys(METHOD_NAME) as PaymentMethod[])
              .filter((m) => s.byMethod[m])
              .map((m) => (
                <Row key={m} label={METHOD_NAME[m]} value={formatBs(s.byMethod[m] ?? 0)} />
              ))}
            <Row label="Propinas" value={formatBs(s.tipsMinor)} />
          </dl>
        )}

        <p className="text-center text-[12.5px] text-muted-foreground">
          {diff.flagged ? "La diferencia supera Bs 10: el dueño la verá en su resumen." : "El dueño recibe este cierre en su resumen."}
        </p>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" size="lg" onClick={() => window.print()}>
            <Printer /> Imprimir
          </Button>
          <Button size="lg" onClick={onClose}>
            Listo
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Row({ label, value, strong, tone }: { label: string; value: string; strong?: boolean; tone?: "good" | "bad" }) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-2.5">
      <dt className="text-muted-foreground">{label}</dt>
      <dd
        className={cn(
          "tabular",
          strong && "font-semibold",
          tone === "good" && "text-status-good-ink",
          tone === "bad" && "font-semibold text-status-critical",
        )}
      >
        {value}
      </dd>
    </div>
  );
}
