import { describe, expect, it } from "vitest";
import { CATEGORIES, MENU } from "./demo-data";
import { buildTickets, ticketUrgency } from "./kds";
import type { Order, OrderLine } from "./types";

const l = (id: string, itemId: string, over: Partial<OrderLine> = {}): OrderLine => ({
  id, itemId, name: itemId, unitPriceMinor: 100, qty: 1, modifiers: [], ...over,
});
const order = (lines: OrderLine[]): Order => ({
  id: "o1", tableId: "m1", waiterId: "s-ana", guests: 2, openedAt: 0, lines, payments: [], status: "open",
});

describe("kitchen tickets", () => {
  it("groups lines by send and splits them by station", () => {
    const o = order([
      l("a", "pique", { sentAt: 1000 }),
      l("b", "pacena", { sentAt: 1000 }),
      l("c", "silpancho", { sentAt: 2000 }),
      l("d", "papas"), // not sent
      l("e", "majadito", { sentAt: 1000, voided: { by: "m", reason: "x", at: 1 } }),
    ]);
    const kitchen = buildTickets([o], MENU, CATEGORIES, "cocina");
    expect(kitchen.map((t) => t.lines.map((x) => x.id))).toEqual([["a"], ["c"]]);
    expect(buildTickets([o], MENU, CATEGORIES, "barra").map((t) => t.lines.map((x) => x.id))).toEqual([["b"]]);
    expect(buildTickets([o], MENU, CATEGORIES, "all")[0].lines).toHaveLength(2);
  });

  it("a ticket is ready only when every line is ready", () => {
    const o = order([l("a", "pique", { sentAt: 1, startedAt: 2, readyAt: 3 }), l("b", "silpancho", { sentAt: 1 })]);
    expect(buildTickets([o], MENU, CATEGORIES, "cocina")[0].status).toBe("started");
    o.lines[1] = { ...o.lines[1], startedAt: 2, readyAt: 9 };
    const [t] = buildTickets([o], MENU, CATEGORIES, "cocina");
    expect(t.status).toBe("ready");
    expect(t.readyAt).toBe(9);
  });

  it("flags tickets waiting 10+ and 15+ minutes", () => {
    expect(ticketUrgency(0, 9 * 60000).level).toBe("ok");
    expect(ticketUrgency(0, 10 * 60000).level).toBe("warn");
    expect(ticketUrgency(0, 15 * 60000).level).toBe("late");
  });
});
