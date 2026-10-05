// Reservations: one table per booking; a table can't hold two active bookings that overlap.
import type { DiningTable } from "../pos/types";

export type ReservationStatus = "confirmada" | "sentada" | "no-show" | "cancelada";

export interface Reservation {
  id: string;
  guestId?: string;
  name: string;
  phone?: string;
  party: number;
  at: number;
  durationMin: number;
  tableId?: string;
  status: ReservationStatus;
  notes?: string;
  createdBy: string;
}

export const STATUS_LABEL: Record<ReservationStatus, string> = {
  confirmada: "Confirmada",
  sentada: "Sentada",
  "no-show": "No vino",
  cancelada: "Cancelada",
};

const active = (r: Reservation) => r.status === "confirmada" || r.status === "sentada";

export function overlaps(a: Pick<Reservation, "at" | "durationMin">, b: Pick<Reservation, "at" | "durationMin">): boolean {
  return a.at < b.at + b.durationMin * 60000 && b.at < a.at + a.durationMin * 60000;
}

/** Active bookings on the same table that overlap this one. */
export function conflicts(r: Pick<Reservation, "id" | "at" | "durationMin" | "tableId">, all: Reservation[]): Reservation[] {
  if (!r.tableId) return [];
  return all.filter((o) => o.id !== r.id && o.tableId === r.tableId && active(o) && overlaps(r, o));
}

/** Tables that fit the party and are free at that time, smallest first. */
export function freeTables(
  party: number, at: number, durationMin: number, tables: DiningTable[], all: Reservation[], ignoreId?: string,
): DiningTable[] {
  return tables
    .filter((t) => t.seats >= party)
    .filter((t) => conflicts({ id: ignoreId ?? "", at, durationMin, tableId: t.id }, all).length === 0)
    .sort((a, b) => a.seats - b.seats);
}

export function onDay(all: Reservation[], day: Date): Reservation[] {
  const from = new Date(day.getFullYear(), day.getMonth(), day.getDate()).getTime();
  const to = from + 24 * 3600_000;
  return all.filter((r) => r.at >= from && r.at < to).sort((a, b) => a.at - b.at);
}

export function coversOf(list: Reservation[]): number {
  return list.filter(active).reduce((s, r) => s + r.party, 0);
}

/** Confirmed bookings more than 15 minutes late. */
export function isLate(r: Reservation, now: number): boolean {
  return r.status === "confirmada" && now > r.at + 15 * 60000;
}
