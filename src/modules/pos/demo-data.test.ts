import { describe, expect, it } from "vitest";
import { MENU, seedHistory, seedLiveOrders } from "./demo-data";

describe("demo seed", () => {
  it("only references menu items that exist", () => {
    const ids = new Set(MENU.map((m) => m.id));
    const live = seedLiveOrders(Date.now());
    const hist = seedHistory(new Date());
    for (const o of live) for (const l of o.lines) expect(ids.has(l.itemId)).toBe(true);
    for (const o of hist.orders) for (const i of o.items) expect(ids.has(i.itemId)).toBe(true);
  });
});
