"use client";

import { toast } from "sonner";
import { formatBs } from "@/modules/pos/money";
import { balanceMinor } from "@/modules/pos/order";
import { newId, useStore } from "@/modules/pos/store";
import type { Order } from "@/modules/pos/types";
import type { CheckoutResult } from "./checkout-dialog";

/** Records a payment (linked to the open register) and tells the cashier what's left. Returns the remaining balance. */
export function usePay() {
  const { state, dispatch } = useStore();
  return (order: Order, tableLabel: string, r: CheckoutResult): number => {
    const remaining = balanceMinor(order) - r.amountMinor;
    dispatch({
      type: "pay",
      orderId: order.id,
      payment: { id: newId(), method: r.method, amountMinor: r.amountMinor, tipMinor: r.tipMinor, at: Date.now(), by: state.staffId },
    });
    if (remaining > 0) {
      toast.success(`Cobrado ${formatBs(r.amountMinor + r.tipMinor)}`, { description: `Falta ${formatBs(remaining)}` });
    } else {
      toast.success(`Mesa ${tableLabel} cobrada`, {
        description: r.nit ? `Factura para NIT ${r.nit} en cola para el SIN` : "Factura en cola para el SIN",
      });
    }
    return remaining;
  };
}
