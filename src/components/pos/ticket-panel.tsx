"use client";

import { ChefHat, Minus, Plus, Receipt, Send, Trash2, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatBs } from "@/modules/pos/money";
import { itemById } from "@/modules/pos/store";
import { activeLines, balanceMinor, itemCount, lineTotalMinor, orderTotalMinor, paidMinor, unsentLines } from "@/modules/pos/order";
import type { Order, OrderLine } from "@/modules/pos/types";
import { cn } from "@/lib/utils";
import { ItemImage } from "./item-image";

function Line({
  line, onQty, onRemove, onVoid,
}: {
  line: OrderLine;
  onQty?: (q: number) => void;
  onRemove?: () => void;
  onVoid?: () => void;
}) {
  const mods = [...line.modifiers.map((m) => m.name), line.note && `“${line.note}”`].filter(Boolean).join(" · ");
  const item = itemById(line.itemId);
  return (
    <li className={cn("group flex gap-3 py-3", line.voided && "opacity-50")}>
      <span className="relative shrink-0">
        {item ? (
          <ItemImage item={item} className="size-12 rounded-[12px]" sizes="48px" />
        ) : (
          <span className="block size-12 rounded-[12px] bg-secondary" />
        )}
        <span className="absolute -top-1.5 -right-1.5 grid min-w-6 place-items-center rounded-full border-2 border-card bg-foreground px-1.5 text-[11px] leading-5 font-bold text-background tabular">
          {line.qty}
        </span>
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <span className={cn("text-[14px] font-medium", line.voided && "line-through")}>{line.name}</span>
          <span className="text-[14px] font-medium tabular">{formatBs(line.voided ? 0 : lineTotalMinor(line))}</span>
        </div>
        {mods && <p className="mt-0.5 text-[12.5px] text-muted-foreground">{mods}</p>}
        {line.voided && <p className="mt-0.5 text-[12.5px] text-status-critical">Anulado · {line.voided.reason}</p>}
        {onQty && (
          <div className="mt-2 flex items-center gap-1.5">
            <Button variant="secondary" size="icon-sm" aria-label="Menos" onClick={() => (line.qty > 1 ? onQty(line.qty - 1) : onRemove?.())}>
              {line.qty > 1 ? <Minus /> : <Trash2 />}
            </Button>
            <Button variant="secondary" size="icon-sm" aria-label="Más" onClick={() => onQty(line.qty + 1)}>
              <Plus />
            </Button>
          </div>
        )}
      </div>
      {onVoid && !line.voided && (
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={`Anular ${line.name}`}
          className="text-muted-foreground opacity-60 group-hover:opacity-100"
          onClick={onVoid}
        >
          <Undo2 />
        </Button>
      )}
    </li>
  );
}

export function TicketPanel({
  order, tableLabel, waiter, onQty, onRemove, onVoid, onSend, onToggleBill, onCheckout,
}: {
  order: Order;
  tableLabel: string;
  waiter: string;
  onQty: (lineId: string, qty: number) => void;
  onRemove: (lineId: string) => void;
  onVoid: (line: OrderLine) => void;
  onSend: () => void;
  onToggleBill: () => void;
  onCheckout: () => void;
}) {
  const pending = unsentLines(order);
  const sent = order.lines.filter((l) => l.sentAt);
  const total = orderTotalMinor(order);
  const paid = paidMinor(order);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <div>
          <h2 className="text-lg font-semibold">Mesa {tableLabel}</h2>
          <p className="text-[13px] text-muted-foreground">
            {waiter} · {order.guests} pers. · {itemCount(order)} ítems
          </p>
        </div>
        <Button
          variant={order.billRequested ? "default" : "secondary"}
          size="sm"
          onClick={onToggleBill}
          aria-pressed={!!order.billRequested}
          className={cn(order.billRequested && "bg-status-warning text-black hover:bg-status-warning/90")}
        >
          <Receipt /> {order.billRequested ? "Pidió la cuenta" : "Pide la cuenta"}
        </Button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-5">
        {order.lines.length === 0 && (
          <div className="grid h-full min-h-48 place-items-center text-center text-[14px] text-muted-foreground">
            <div>
              <ChefHat className="mx-auto mb-3 size-8 opacity-50" aria-hidden />
              Toca un producto para agregarlo
            </div>
          </div>
        )}
        {pending.length > 0 && (
          <section aria-label="Por enviar">
            <p className="mt-2 text-xs font-semibold tracking-wide text-primary uppercase">Por enviar</p>
            <ul className="divide-y">
              {pending.map((l) => (
                <Line key={l.id} line={l} onQty={(q) => onQty(l.id, q)} onRemove={() => onRemove(l.id)} />
              ))}
            </ul>
          </section>
        )}
        {sent.length > 0 && (
          <section aria-label="Enviado">
            <p className="mt-4 text-xs font-semibold tracking-wide text-muted-foreground uppercase">En cocina y barra</p>
            <ul className="divide-y">
              {sent.map((l) => (
                <Line key={l.id} line={l} onVoid={() => onVoid(l)} />
              ))}
            </ul>
          </section>
        )}
      </div>

      <div className="space-y-3 border-t p-5">
        {paid > 0 && (
          <div className="flex justify-between text-[13px] text-muted-foreground">
            <span>Pagado</span>
            <span className="tabular">−{formatBs(paid)}</span>
          </div>
        )}
        <div className="flex items-end justify-between">
          <span>
            <span className="block text-[15px] font-medium text-muted-foreground">{paid > 0 ? "Falta" : "Total"}</span>
            <span className="block text-[11px] text-muted-foreground">IVA incluido</span>
          </span>
          <span className="text-[30px] leading-none font-semibold tracking-[-0.025em] tabular">
            {formatBs(paid > 0 ? balanceMinor(order) : total)}
          </span>
        </div>
        {pending.length > 0 ? (
          <Button size="xl" className="w-full" onClick={onSend}>
            <Send /> Enviar a cocina ({pending.reduce((s, l) => s + l.qty, 0)})
          </Button>
        ) : (
          <Button size="xl" className="w-full justify-between" disabled={activeLines(order).length === 0} onClick={onCheckout}>
            <span>Cobrar</span>
            <span className="tabular">{formatBs(paid > 0 ? balanceMinor(order) : total)}</span>
          </Button>
        )}
      </div>
    </div>
  );
}
