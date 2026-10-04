import type { Order, OrderLine, Payment } from "./types";

export function lineUnitMinor(line: Pick<OrderLine, "unitPriceMinor" | "modifiers">): number {
  return line.unitPriceMinor + line.modifiers.reduce((s, m) => s + m.priceMinor, 0);
}

export function lineTotalMinor(line: OrderLine): number {
  return line.voided ? 0 : lineUnitMinor(line) * line.qty;
}

export function activeLines(order: Order): OrderLine[] {
  return order.lines.filter((l) => !l.voided);
}

export function orderTotalMinor(order: Order): number {
  return order.lines.reduce((s, l) => s + lineTotalMinor(l), 0);
}

export function paidMinor(order: Order): number {
  return order.payments.reduce((s, p) => s + p.amountMinor, 0);
}

export function tipsMinor(payments: Payment[]): number {
  return payments.reduce((s, p) => s + p.tipMinor, 0);
}

export function balanceMinor(order: Order): number {
  return Math.max(0, orderTotalMinor(order) - paidMinor(order));
}

export function unsentLines(order: Order): OrderLine[] {
  return order.lines.filter((l) => !l.sentAt && !l.voided);
}

export function itemCount(order: Order): number {
  return activeLines(order).reduce((s, l) => s + l.qty, 0);
}

/**
 * Split an amount into n parts that add up exactly.
 * Remainder centavos go to the last part: 10000 / 3 -> [3333, 3333, 3334].
 */
export function splitEqually(amountMinor: number, parts: number): number[] {
  if (!Number.isInteger(parts) || parts < 1) throw new Error("parts must be a positive integer");
  const base = Math.floor(amountMinor / parts);
  const result = Array.from({ length: parts }, () => base);
  result[parts - 1] += amountMinor - base * parts;
  return result;
}

/** Sum of selected lines (by id), used for "split by items". */
export function selectedLinesMinor(order: Order, lineIds: string[]): number {
  const ids = new Set(lineIds);
  return order.lines.filter((l) => ids.has(l.id)).reduce((s, l) => s + lineTotalMinor(l), 0);
}

/** Percentage tip rounded to whole bolivianos (what cashiers actually collect). */
export function tipForPercent(amountMinor: number, percent: number): number {
  return Math.round((amountMinor * percent) / 100 / 100) * 100;
}

/** Change to give back for a cash payment; never negative. */
export function changeMinor(dueMinor: number, receivedMinor: number): number {
  return Math.max(0, receivedMinor - dueMinor);
}

/** Minutes an order has been open. */
export function minutesOpen(order: Order, now: number): number {
  return Math.max(0, Math.floor((now - order.openedAt) / 60000));
}
