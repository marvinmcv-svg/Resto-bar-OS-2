"use client";

// Client-side demo store. Real deployments replace this with Supabase + order_events (ADR-005);
// the action names mirror the domain events so the swap is mechanical.
import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useState, type ReactNode } from "react";
import {
  CATEGORIES, CLIENTS, MENU, seedHistory, seedLiveOrders, STAFF, TABLES,
  type ClientRestaurant, type HistoricOrder, type VoidRecord,
} from "./demo-data";
import { balanceMinor, lineTotalMinor, orderTotalMinor } from "./order";
import type {
  Category, ChosenModifier, GuestNote, MenuItem, Order, Payment, PaymentMethod, ShiftNote, Staff, WaitlistEntry,
} from "./types";

const STORAGE_KEY = "restobar-demo-v2";

export interface State {
  live: Order[];
  history: HistoricOrder[];
  voids: VoidRecord[];
  lastWeekTotalMinor: number;
  unavailable: string[]; // item ids marked "agotado"
  menu: MenuItem[];
  categories: Category[];
  staff: Staff[];
  clients: ClientRestaurant[];
  /** Who is using this device. null = signed out (shows /entrar). */
  sessionStaffId: string | null;
  staffId: string; // last signed-in staff; orders opened on this device belong to them
  shiftOpenedAt: number;
  openingCashMinor: number;
  shiftNote: ShiftNote | null;
  shiftNoteSeenBy: string[];
  tableNotes: Record<string, GuestNote>;
  waitlist: WaitlistEntry[];
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
  | { type: "signIn"; staffId: string }
  | { type: "signOut" }
  | { type: "upsertItem"; item: MenuItem }
  | { type: "archiveItem"; itemId: string; archived: boolean }
  | { type: "upsertCategory"; category: Category }
  | { type: "upsertStaff"; staff: Staff }
  | { type: "setStaffActive"; staffId: string; active: boolean }
  | { type: "addClient"; client: ClientRestaurant }
  | { type: "setShiftNote"; note: ShiftNote | null }
  | { type: "seenShiftNote"; staffId: string }
  | { type: "setTableNote"; tableId: string; note: GuestNote | null }
  | { type: "addWaitlist"; entry: WaitlistEntry }
  | { type: "removeWaitlist"; id: string }
  | { type: "kdsAdvance"; orderId: string; lineIds: string[]; at: number }
  | { type: "kdsRecall"; orderId: string; lineIds: string[] }
  | { type: "replace"; state: State };

/** Seeded tickets look like a real rush: old ones served, recent ones on the line. */
function withKitchenProgress(orders: Order[], now: number): Order[] {
  return orders.map((o) => ({
    ...o,
    lines: o.lines.map((l) => {
      if (!l.sentAt) return l;
      const age = (now - l.sentAt) / 60000;
      if (age > 16) return { ...l, startedAt: l.sentAt + 2 * 60000, readyAt: l.sentAt + 12 * 60000 };
      if (age > 5) return { ...l, startedAt: l.sentAt + 2 * 60000 };
      return l;
    }),
  }));
}

function seed(): State {
  const now = Date.now();
  const h = seedHistory(new Date(now));
  return {
    live: withKitchenProgress(seedLiveOrders(now), now),
    history: h.orders,
    voids: h.voids,
    lastWeekTotalMinor: h.lastWeekTotalMinor,
    unavailable: ["helado"],
    menu: MENU,
    categories: CATEGORIES,
    staff: STAFF,
    clients: CLIENTS,
    sessionStaffId: null,
    staffId: "s-carla",
    shiftOpenedAt: new Date(new Date(now).setHours(11, 30, 0, 0)).getTime(),
    openingCashMinor: 50000,
    shiftNote: {
      text: "Mesa 7 reservada 21:00 (cumpleaños, 8 pers.). Recomendar Chuflay con Rujero. Helado agotado.",
      by: "s-daniela",
      at: new Date(new Date(now).setHours(11, 20, 0, 0)).getTime(),
    },
    shiftNoteSeenBy: [],
    tableNotes: { m7: { name: "Familia Rojas", occasion: "cumpleanos", text: "Torta propia, traer velas" } },
    waitlist: [
      { id: "w1", name: "Gabriela", party: 4, addedAt: now - 12 * 60000, quotedMin: 20 },
      { id: "w2", name: "Andrés", party: 2, addedAt: now - 4 * 60000, quotedMin: 10 },
    ],
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
      const tableNotes = { ...state.tableNotes };
      delete tableNotes[order.tableId];
      return { ...state, live: state.live.filter((o) => o.id !== a.orderId), history: [...state.history, hist], tableNotes };
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
    case "signIn":
      return { ...state, sessionStaffId: a.staffId, staffId: a.staffId };
    case "signOut":
      return { ...state, sessionStaffId: null };
    case "upsertItem":
      return {
        ...state,
        menu: state.menu.some((m) => m.id === a.item.id)
          ? state.menu.map((m) => (m.id === a.item.id ? a.item : m))
          : [...state.menu, a.item],
      };
    case "archiveItem":
      return { ...state, menu: state.menu.map((m) => (m.id === a.itemId ? { ...m, archived: a.archived } : m)) };
    case "upsertCategory":
      return {
        ...state,
        categories: state.categories.some((c) => c.id === a.category.id)
          ? state.categories.map((c) => (c.id === a.category.id ? a.category : c))
          : [...state.categories, a.category],
      };
    case "upsertStaff":
      return {
        ...state,
        staff: state.staff.some((x) => x.id === a.staff.id)
          ? state.staff.map((x) => (x.id === a.staff.id ? a.staff : x))
          : [...state.staff, a.staff],
      };
    case "setStaffActive":
      return {
        ...state,
        staff: state.staff.map((x) => (x.id === a.staffId ? { ...x, active: a.active } : x)),
        sessionStaffId: !a.active && state.sessionStaffId === a.staffId ? null : state.sessionStaffId,
      };
    case "addClient":
      return { ...state, clients: [...state.clients, a.client] };
    case "setShiftNote":
      return { ...state, shiftNote: a.note, shiftNoteSeenBy: [] };
    case "seenShiftNote":
      return state.shiftNoteSeenBy.includes(a.staffId) ? state : { ...state, shiftNoteSeenBy: [...state.shiftNoteSeenBy, a.staffId] };
    case "setTableNote": {
      const tableNotes = { ...state.tableNotes };
      if (a.note) tableNotes[a.tableId] = a.note;
      else delete tableNotes[a.tableId];
      return { ...state, tableNotes };
    }
    case "addWaitlist":
      return { ...state, waitlist: [...state.waitlist, a.entry] };
    case "removeWaitlist":
      return { ...state, waitlist: state.waitlist.filter((w) => w.id !== a.id) };
    case "kdsAdvance":
      // new → started → ready
      return mapOrder(state, a.orderId, (o) => ({
        ...o,
        lines: o.lines.map((l) => {
          if (!a.lineIds.includes(l.id) || l.readyAt) return l;
          return l.startedAt ? { ...l, readyAt: a.at } : { ...l, startedAt: a.at };
        }),
      }));
    case "kdsRecall":
      return mapOrder(state, a.orderId, (o) => ({
        ...o,
        lines: o.lines.map((l) => (a.lineIds.includes(l.id) ? { ...l, readyAt: undefined } : l)),
      }));
  }
}

interface StoreValue {
  state: State;
  dispatch: React.Dispatch<Action>;
  reset: () => void;
  openTable: (tableId: string, guests: number) => Order;
  orderForTable: (tableId: string) => Order | undefined;
  verifyManagerPin: (pin: string) => string | null;
  /** The signed-in staff member, if any. */
  me: Staff | null;
  itemById: (id: string) => MenuItem | undefined;
  staffById: (id: string) => Staff | undefined;
  categoryById: (id: string) => Category | undefined;
  /** Items on sale (not archived), in menu order. */
  activeMenu: MenuItem[];
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
    // A new day reseeds the service (orders, history), but keeps what the owner configured.
    const fresh = loaded && new Date(loaded.shiftOpenedAt).toDateString() === new Date().toDateString();
    const next = fresh
      ? loaded!
      : loaded
        ? { ...seed(), menu: loaded.menu, categories: loaded.categories, staff: loaded.staff, clients: loaded.clients, sessionStaffId: loaded.sessionStaffId }
        : seed();
    dispatch({ type: "replace", state: next });
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

  const reset = useCallback(
    () => dispatch({ type: "replace", state: { ...seed(), sessionStaffId: state?.sessionStaffId ?? null } }),
    [state?.sessionStaffId],
  );

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
      verifyManagerPin: (pin) =>
        state.staff.find((s) => s.active !== false && s.pin === pin && (s.role === "manager" || s.role === "owner"))?.id ?? null,
      me: state.sessionStaffId ? (state.staff.find((s) => s.id === state.sessionStaffId) ?? null) : null,
      itemById: (id) => state.menu.find((m) => m.id === id),
      staffById: (id) => state.staff.find((s) => s.id === id),
      categoryById: (id) => state.categories.find((c) => c.id === id),
      activeMenu: state.menu.filter((m) => !m.archived),
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

/** For components that also render outside the app (e.g. marketing pages). */
export function useOptionalStore(): StoreValue | null {
  return useContext(StoreContext);
}

export function useNow(intervalMs = 30000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return now;
}

export const newId = uid;
export const tableById = (id: string) => TABLES.find((t) => t.id === id);
