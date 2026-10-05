import { describe, expect, it } from "vitest";
import { conflicts, coversOf, freeTables, isLate, onDay, overlaps, type Reservation } from "./reservations";
import type { DiningTable } from "../pos/types";

const h = (hour: number, min = 0) => new Date(2026, 9, 5, hour, min).getTime();
const r = (over: Partial<Reservation>): Reservation => ({ id: "r", name: "X", party: 4, at: h(20), durationMin: 120, status: "confirmada", createdBy: "s", ...over });
const t = (id: string, seats: number): DiningTable => ({ id, label: id, zone: "salon", seats, shape: "square", x: 1, y: 1 });

describe("reservations", () => {
  it("detects overlapping bookings on the same table only when active", () => {
    expect(overlaps(r({ at: h(20) }), r({ at: h(21, 59) }))).toBe(true);
    expect(overlaps(r({ at: h(20) }), r({ at: h(22) }))).toBe(false);
    const all = [r({ id: "a", tableId: "m1" }), r({ id: "b", tableId: "m1", status: "cancelada" }), r({ id: "c", tableId: "m2" })];
    expect(conflicts({ id: "new", at: h(21), durationMin: 90, tableId: "m1" }, all).map((x) => x.id)).toEqual(["a"]);
  });

  it("suggests free tables that fit, smallest first", () => {
    const tables = [t("m1", 4), t("m2", 2), t("m3", 6), t("m4", 4)];
    const all = [r({ id: "a", tableId: "m1" })];
    expect(freeTables(3, h(20, 30), 120, tables, all).map((x) => x.id)).toEqual(["m4", "m3"]);
    expect(freeTables(3, h(20, 30), 120, tables, all, "a").map((x) => x.id)).toEqual(["m1", "m4", "m3"]);
  });

  it("lists a day's bookings, counts covers and flags late arrivals", () => {
    const all = [r({ id: "b", at: h(21) }), r({ id: "a", at: h(13), party: 2 }), r({ id: "x", at: h(13) + 86400000 }), r({ id: "c", at: h(14), status: "no-show" })];
    const today = onDay(all, new Date(2026, 9, 5));
    expect(today.map((x) => x.id)).toEqual(["a", "c", "b"]);
    expect(coversOf(today)).toBe(6);
    expect(isLate(r({ at: h(20) }), h(20, 20))).toBe(true);
    expect(isLate(r({ at: h(20) }), h(20, 10))).toBe(false);
  });
});
