import { minutesOpen } from "./order";
import type { Order } from "./types";

export type TableStatus = "free" | "occupied" | "bill" | "late";

export const LATE_AFTER_MIN = 75;

export function tableStatus(order: Order | undefined, now: number): TableStatus {
  if (!order) return "free";
  if (order.billRequested) return "bill";
  if (minutesOpen(order, now) >= LATE_AFTER_MIN) return "late";
  return "occupied";
}

export const STATUS_LABEL: Record<TableStatus, string> = {
  free: "Libre",
  occupied: "Ocupada",
  bill: "Pidió la cuenta",
  late: "Más de 75 min",
};
