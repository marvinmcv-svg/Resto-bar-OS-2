// Kitchen display: groups fired lines into tickets per station (one ticket per "send").
import type { Category, MenuItem, Order, OrderLine, Station } from "./types";

export type TicketStatus = "new" | "started" | "ready";

export interface KdsTicket {
  key: string;
  orderId: string;
  tableId: string;
  waiterId: string;
  sentAt: number;
  lines: OrderLine[];
  status: TicketStatus;
  /** When the last line became ready (for hiding old "ready" tickets). */
  readyAt?: number;
}

export function lineStatus(l: OrderLine): TicketStatus {
  return l.readyAt ? "ready" : l.startedAt ? "started" : "new";
}

export function buildTickets(
  live: Order[], menu: MenuItem[], categories: Category[], station: Station | "all",
): KdsTicket[] {
  const stationOf = (itemId: string) => {
    const item = menu.find((m) => m.id === itemId);
    return categories.find((c) => c.id === item?.categoryId)?.station;
  };
  const tickets = new Map<string, KdsTicket>();
  for (const o of live) {
    for (const l of o.lines) {
      if (!l.sentAt || l.voided) continue;
      if (station !== "all" && stationOf(l.itemId) !== station) continue;
      const key = `${o.id}:${l.sentAt}`;
      const t = tickets.get(key) ?? { key, orderId: o.id, tableId: o.tableId, waiterId: o.waiterId, sentAt: l.sentAt, lines: [], status: "new" as TicketStatus };
      t.lines.push(l);
      tickets.set(key, t);
    }
  }
  return [...tickets.values()]
    .map((t) => {
      const statuses = t.lines.map(lineStatus);
      const status: TicketStatus = statuses.every((s) => s === "ready") ? "ready" : statuses.some((s) => s !== "new") ? "started" : "new";
      const readyAt = status === "ready" ? Math.max(...t.lines.map((l) => l.readyAt ?? 0)) : undefined;
      return { ...t, status, readyAt };
    })
    .sort((a, b) => a.sentAt - b.sentAt);
}

/** Minutes a ticket has been waiting, and how urgent that is. */
export function ticketUrgency(sentAt: number, now: number): { minutes: number; level: "ok" | "warn" | "late" } {
  const minutes = Math.max(0, Math.floor((now - sentAt) / 60000));
  return { minutes, level: minutes >= 15 ? "late" : minutes >= 10 ? "warn" : "ok" };
}
