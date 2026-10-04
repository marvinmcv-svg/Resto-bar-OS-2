"use client";

// Client-side demo store. Real deployments replace this with Supabase + order_events (ADR-005);
// the action names mirror the domain events so the swap is mechanical.
import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useState, type ReactNode } from "react";
import { MENU, seedHistory, seedLiveOrders, STAFF, TABLES, type HistoricOrder, type VoidRecord } from "./demo-data";
import { balanceMinor, lineTotalMinor, orderTotalMinor } from "./order";
import type { ChosenModifier, MenuItem, Order, Payment, PaymentMethod } from "./types";

const STORAGE_KEY = "restobar-demo-v1";

export interface State {
  live: Order[];
  history: HistoricOrder[];
  voids: VoidRecord[];
  lastWeekTotalMinor: number;
  unavailable: string[]; // item ids marked "agotado"
  staffId: string;
  shiftOpenedAt: number;
  openingCashMinor: number;
}

type Action =
  | { type: "open"; order: Order }
  | { type: "addLine"; orderId: string; item: MenuItem; modifiers: ChosenModifier[]; qty: number; note?: string }
  | { type: "setQty"; orderId: string; lineId: string; qty: number }
  | { type: "removeUnsent"; orderId: string; lineId: string }
  | { type: "void"; orderId: string; lineId: string; approvedBy: string; reason: string; at: number }
  | { type: "send"; orderId: string; at: number }
  | { type: "requestBill"; orderId: string; value: boolean }
  | { type: "pay"; orderId: string; payment: Payment }
  | { type: "cancelEmpty"; orderId: string }
  | { type: "toggleAvailable"; itemId: string }
  | { type: "setStaff"; staffId: string }
  | { type: "replace"; state: State };

function seed(): State {
  const now = Date.now();
  const h = seedHistory(new Date(now));
  return {
    live: seedLiveOrders(now),
    history: h.orders,
    voids: h.voids,
    lastWeekTotalMinor: h.lastWeekTotalMinor,
    unavailable: ["helado"],
    staffId: "s-carla",
    shiftOpenedAt: new Date(new Date(now).setHours(11, 30, 0, 0)).getTime(),
    openingCashMinor: 50000,
  };
}

const uid = () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : String(Math.random()));

function mapOrder(state: State, orderId: string, fn: (o: Order) => Order): State {
  return { ...state, live: state.live.map((o) => (o.id === orderId ? fn(o) : o)) };
}

function reducer(state: State, a: Action): State {
  switch (a.type) {
    case "replace":
      return a.state;
    case "open":
      return { ...state, live: [...state.live, a.order] };
    case "addLine":
      return mapOrder(state, a.orderId, (o) => {
        // Merge with an identical unsent line (same item, same modifiers, no note).
        const key = (m: ChosenModifier[]) => m.map((x) => x.optionId).sort().join("|");
        const same = o.lines.find(
          (l) => !l.sentAt && !l.voided && !l.note && !a.note && l.itemId === a.item.id && key(l.modifiers) === key(a.modifiers),
        );
        if (same) return { ...o, lines: o.lines.map((l) => (l === same ? { ...l, qty: l.qty + a.qty } : l)) };
        return {
          ...o,
          lines: [...o.lines, {
            id: uid(), itemId: a.item.id, name: a.item.name, unitPriceMinor: a.item.priceMinor,
            qty: a.qty, modifiers: a.modifiers, note: a.note,
          }],
        };
      });
    case "setQty":
      return mapOrder(state, a.orderId, (o) => ({
        ...o,
        lines: o.lines.map((l) => (l.id === a.lineId && !l.sentAt ? { ...l, qty: Math.max(1, a.qty) } : l)),
      }));
    case "removeUnsent":
      return mapOrder(state, a.orderId, (o) => ({ ...o, lines: o.lines.filter((l) => !(l.id === a.lineId && !l.sentAt)) }));
    case "void": {
      const order = state.live.find((o) => o.id === a.orderId);
      const ln = order?.lines.find((l) => l.id === a.lineId);
      if (!order || !ln) return state;
      const table = TABLES.find((t) => t.id === order.tableId);
      const rec: VoidRecord = {
        id: uid(), at: a.at, itemName: ln.name, qty: ln.qty, amountMinor: lineTotalMinor(ln), waiterId: order.waiterId,
        approvedBy: a.approvedBy, reason: a.reason, tableLabel: table?.label ?? "?",
      };
      return {
        ...mapOrder(state, a.orderId, (o) => ({
          ...o,
          lines: o.lines.map((l) => (l.id === a.lineId ? { ...l, voided: { by: a.approvedBy, reason: a.reason, at: a.at } } : l)),
        })),
        voids: [...state.voids, rec],
      };
    }
    case "send":
      return mapOrder(state, a.orderId, (o) => ({
        ...o,
        lines: o.lines.map((l) => (l.sentAt || l.voided ? l : { ...l, sentAt: a.at })),
      }));
    case "requestBill":
      return mapOrder(state, a.orderId, (o) => ({ ...o, billRequested: a.value }));
    case "pay": {
      const order = state.live.find((o) => o.id === a.orderId);
      if (!order) return state;
      const updated: Order = { ...order, payments: [...order.payments, a.payment] };
      if (balanceMinor(updated) > 0) return mapOrder(state, a.orderId, () => updated);
      // Fully paid: archive into today's history and free the table.
      const byMethod = new Map<PaymentMethod, number>();
      for (const p of updated.payments) byMethod.set(p.method, (byMethod.get(p.method) ?? 0) + p.amountMinor);
      const method = [...byMethod.entries()].sort((x, y) => y[1] - x[1])[0][0];
      const hist: HistoricOrder = {
        id: updated.id,
        closedAt: a.payment.at,
        totalMinor: orderTotalMinor(updated),
        tipMinor: updated.payments.reduce((s, p) => s + p.tipMinor, 0),
        method,
        items: updated.lines.filter((l) => !l.voided).map((l) => ({ itemId: l.itemId, qty: l.qty, totalMinor: lineTotalMinor(l) })),
        waiterId: updated.waiterId,
      };
      return { ...state, live: state.live.filter((o) => o.id !== a.orderId), history: [...state.history, hist] };
    }
    case "cancelEmpty":
      return { ...state, live: state.live.filter((o) => !(o.id === a.orderId && o.lines.length === 0)) };
    case "toggleAvailable":
      return {
        ...state,
        unavailable: state.unavailable.includes(a.itemId)
          ? state.unavailable.filter((i) => i !== a.itemId)
          : [...state.unavailable, a.itemId],
      };
    case "setStaff":
      return { ...state, staffId: a.staffId };
  }
}

interface StoreValue {
  state: State;
  dispatch: React.Dispatch<Action>;
  reset: () => void;
  openTable: (tableId: string, guests: number) => Order;
  orderForTable: (tableId: string) => Order | undefined;
  verifyManagerPin: (pin: string) => string | null;
}

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, null as unknown as State);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let loaded: State | null = null;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) loaded = JSON.parse(raw) as State;
    } catch {
      loaded = null;
    }
    // Reseed when the stored demo is from a previous day.
    const fresh = loaded && new Date(loaded.shiftOpenedAt).toDateString() === new Date().toDateString();
    dispatch({ type: "replace", state: fresh ? loaded! : seed() });
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Storage unavailable (private mode): the demo still works in memory.
    }
  }, [state, ready]);

  const reset = useCallback(() => dispatch({ type: "replace", state: seed() }), []);

  const value = useMemo<StoreValue | null>(() => {
    if (!ready) return null;
    return {
      state,
      dispatch,
      reset,
      orderForTable: (tableId) => state.live.find((o) => o.tableId === tableId),
      openTable: (tableId, guests) => {
        const order: Order = {
          id: uid(), tableId, waiterId: state.staffId, guests, openedAt: Date.now(), lines: [], payments: [], status: "open",
        };
        dispatch({ type: "open", order });
        return order;
      },
      verifyManagerPin: (pin) => STAFF.find((s) => s.pin === pin && (s.role === "manager" || s.role === "owner"))?.id ?? null,
    };
  }, [state, ready, reset]);

  if (!value) return <>{fallback ?? null}</>;
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const v = useContext(StoreContext);
  if (!v) throw new Error("useStore must be used inside <StoreProvider>");
  return v;
}

export function useNow(intervalMs = 30000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return now;
}

export const itemById = (id: string) => MENU.find((m) => m.id === id);
export const staffById = (id: string) => STAFF.find((s) => s.id === id);
export const tableById = (id: string) => TABLES.find((t) => t.id === id);
