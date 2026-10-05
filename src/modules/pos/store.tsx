"use client";

// Client-side demo store. Real deployments replace this with Supabase + order_events (ADR-005);
// the action names mirror the domain events so the swap is mechanical.
import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useState, type ReactNode } from "react";
import {
  CATEGORIES, CLIENTS, MENU, seedHistory, seedLiveOrders, STAFF, TABLES,
  type ClientRestaurant, type HistoricOrder, type VoidRecord,
} from "./demo-data";
import { balanceMinor, lineTotalMinor, orderTotalMinor } from "./order";
import { openShift } from "./cash";
import {
  PROFILES, seedLastNightShift, seedSchedule, seedTimeEntries,
  type ClosedCashShift, type StaffProfile, type TipSplit,
} from "../hr/demo-hr";
import type { ScheduleShift, TimeEntry } from "../hr/time";
import { consumption, costOfMinor, type Ingredient, type Recipes, type RecipeLine, type StockMovement, type Supplier } from "../inventory/inventory";
import { INGREDIENTS, RECIPES, seedStockMovements, SUPPLIERS } from "../inventory/demo-inventory";
import type { Guest } from "../guests/guests";
import { seedCampaigns, seedGuests, seedReservations, seedSalesDays, type Campaign } from "../guests/demo-guests";
import type { Reservation, ReservationStatus } from "../reservations/reservations";
import type { DaySales } from "../analytics/analytics";
import type {
  CashMovement, Category, ChosenModifier, GuestNote, MenuItem, Order, Payment, PaymentMethod, PaymentRecord, ShiftNote, Staff,
  WaitlistEntry,
} from "./types";

const STORAGE_KEY = "restobar-demo-v4";

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
  /** When this demo day was seeded; a new day reseeds the service. */
  shiftOpenedAt: number;
  shiftNote: ShiftNote | null;
  shiftNoteSeenBy: string[];
  tableNotes: Record<string, GuestNote>;
  waitlist: WaitlistEntry[];
  /** Cash-register shifts; the open one has no closedAt. */
  cashShifts: ClosedCashShift[];
  cashMovements: CashMovement[];
  /** Every charge, linked to its register shift. */
  payments: PaymentRecord[];
  profiles: Record<string, StaffProfile>;
  schedule: ScheduleShift[];
  timeEntries: TimeEntry[];
  tipSplits: TipSplit[];
  suppliers: Supplier[];
  /** stockMilli is the running total of the stock ledger. */
  ingredients: Ingredient[];
  recipes: Recipes;
  stockMovements: StockMovement[];
  guests: Guest[];
  reservations: Reservation[];
  campaigns: Campaign[];
  /** Closed days before today, for analytics. Today comes from `history`. */
  salesDays: DaySales[];
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
  | { type: "openRegister"; shift: ClosedCashShift }
  | { type: "addCashMovement"; movement: CashMovement }
  | { type: "closeRegister"; shiftId: string; patch: Pick<ClosedCashShift, "closedAt" | "closedBy" | "countedMinor" | "count" | "expectedMinor" | "summary"> }
  | { type: "clockIn"; entry: TimeEntry }
  | { type: "clockOut"; entryId: string; at: number }
  | { type: "correctEntry"; entryId: string; inAt: number; outAt?: number; editedBy: string }
  | { type: "upsertSchedule"; shift: ScheduleShift }
  | { type: "removeSchedule"; id: string }
  | { type: "replaceWeek"; weekStart: string; shifts: ScheduleShift[] }
  | { type: "saveTipSplit"; split: TipSplit }
  | { type: "markTipPaid"; splitId: string; staffId: string; at: number }
  | { type: "upsertProfile"; staffId: string; profile: StaffProfile }
  | { type: "stockMovement"; movement: StockMovement; unitCostMinor?: number }
  | { type: "upsertIngredient"; ingredient: Ingredient }
  | { type: "setRecipe"; itemId: string; lines: RecipeLine[] }
  | { type: "upsertGuest"; guest: Guest }
  | { type: "upsertReservation"; reservation: Reservation }
  | { type: "setReservationStatus"; id: string; status: ReservationStatus }
  | { type: "logCampaign"; campaign: Campaign }
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

/** Today's register: opened 11:30 with Bs 500; today's closed orders are its payments. */
function seedCash(now: number, history: HistoricOrder[]): Pick<State, "cashShifts" | "cashMovements" | "payments"> {
  const day = (h: number, m: number) => new Date(new Date(now).setHours(h, m, 0, 0)).getTime();
  const shiftId = "shift-today";
  return {
    cashShifts: [seedLastNightShift(new Date(now)), { id: shiftId, openedBy: "s-carla", openedAt: day(11, 30), openingMinor: 50000 }],
    cashMovements: [
      { id: "cm-1", shiftId, kind: "out", amountMinor: 12000, reason: "compra", note: "Hielo y limones", at: day(12, 40), by: "s-carla", approvedBy: "s-daniela" },
      { id: "cm-2", shiftId, kind: "in", amountMinor: 20000, reason: "cambio", note: "Cambio del banco", at: day(13, 5), by: "s-carla" },
    ],
    payments: history.filter((o) => o.closedAt <= now).map((o) => ({
      id: `p-${o.id}`, shiftId, orderId: o.id, tableId: TABLES[(Number(o.id.split("-")[1]) * 7 + Number(o.id.split("-")[2])) % TABLES.length].id, method: o.method, amountMinor: o.totalMinor, tipMinor: o.tipMinor, at: o.closedAt,
      by: "s-carla",
    })),
  };
}

function seed(): State {
  const now = Date.now();
  const h = seedHistory(new Date(now));
  const schedule = seedSchedule(new Date(now));
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
    ...seedCash(now, h.orders),
    profiles: PROFILES,
    schedule,
    timeEntries: seedTimeEntries(schedule, now),
    tipSplits: [],
    suppliers: SUPPLIERS,
    ingredients: INGREDIENTS,
    recipes: RECIPES,
    stockMovements: seedStockMovements(now),
    guests: seedGuests(now),
    reservations: seedReservations(now),
    campaigns: seedCampaigns(now),
    salesDays: seedSalesDays(now),
    shiftNote: {
      text: "Mesa 7 reservada 21:00 (cumpleaños, 8 pers.). Recomendar Chuflay con Rujero. Helado agotado.",
      by: "s-daniela",
      at: new Date(new Date(now).setHours(11, 20, 0, 0)).getTime(),
    },
    shiftNoteSeenBy: [],
    tableNotes: {
      m7: { guestId: "g-rojas", name: "Familia Rojas", occasion: "cumpleanos", text: "Torta propia, traer velas" },
    },
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

/** Appends to the stock ledger and moves each ingredient's running total. Waste gets its cost. */
function applyStock(state: State, moves: StockMovement[]): State {
  const delta = new Map<string, number>();
  for (const m of moves) delta.set(m.ingredientId, (delta.get(m.ingredientId) ?? 0) + m.deltaMilli);
  const priced = moves.map((m) => {
    if (m.kind !== "waste" || m.costMinor !== undefined) return m;
    const ing = state.ingredients.find((i) => i.id === m.ingredientId);
    return ing ? { ...m, costMinor: costOfMinor(ing, -m.deltaMilli) } : m;
  });
  return {
    ...state,
    stockMovements: [...state.stockMovements, ...priced],
    ingredients: state.ingredients.map((i) => (delta.has(i.id) ? { ...i, stockMilli: i.stockMilli + delta.get(i.id)! } : i)),
  };
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
    case "send": {
      // Firing lines consumes their recipes from stock (server-side 'sale' movements in production).
      const order = state.live.find((o) => o.id === a.orderId);
      const fired = order?.lines.filter((l) => !l.sentAt && !l.voided) ?? [];
      const used = consumption(fired.map((l) => ({ itemId: l.itemId, qty: l.qty })), state.recipes);
      const moves: StockMovement[] = [...used].map(([ingredientId, qty]) => ({
        id: uid(), ingredientId, kind: "sale", deltaMilli: -qty, at: a.at, by: state.staffId, orderId: a.orderId,
      }));
      const next = mapOrder(state, a.orderId, (o) => ({
        ...o,
        lines: o.lines.map((l) => (l.sentAt || l.voided ? l : { ...l, sentAt: a.at })),
      }));
      return moves.length ? applyStock(next, moves) : next;
    }
    case "requestBill":
      return mapOrder(state, a.orderId, (o) => ({ ...o, billRequested: a.value }));
    case "pay": {
      const order = state.live.find((o) => o.id === a.orderId);
      if (!order) return state;
      const record: PaymentRecord = {
        id: a.payment.id, shiftId: openShift(state.cashShifts)?.id ?? null, orderId: order.id, tableId: order.tableId,
        method: a.payment.method, amountMinor: a.payment.amountMinor, tipMinor: a.payment.tipMinor, at: a.payment.at, by: a.payment.by,
      };
      state = { ...state, payments: [...state.payments, record] };
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
      const guestId = tableNotes[order.tableId]?.guestId;
      delete tableNotes[order.tableId];
      const guests = guestId
        ? state.guests.map((g) =>
            g.id === guestId ? { ...g, visits: g.visits + 1, spentMinor: g.spentMinor + hist.totalMinor, lastVisitAt: a.payment.at } : g,
          )
        : state.guests;
      return { ...state, live: state.live.filter((o) => o.id !== a.orderId), history: [...state.history, hist], tableNotes, guests };
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
    case "openRegister":
      return openShift(state.cashShifts) ? state : { ...state, cashShifts: [...state.cashShifts, a.shift] };
    case "addCashMovement":
      return { ...state, cashMovements: [...state.cashMovements, a.movement] };
    case "closeRegister":
      return { ...state, cashShifts: state.cashShifts.map((s) => (s.id === a.shiftId && !s.closedAt ? { ...s, ...a.patch } : s)) };
    case "clockIn":
      return state.timeEntries.some((e) => e.staffId === a.entry.staffId && !e.outAt)
        ? state
        : { ...state, timeEntries: [...state.timeEntries, a.entry] };
    case "clockOut":
      return { ...state, timeEntries: state.timeEntries.map((e) => (e.id === a.entryId && !e.outAt ? { ...e, outAt: a.at } : e)) };
    case "correctEntry":
      return {
        ...state,
        timeEntries: state.timeEntries.map((e) => (e.id === a.entryId ? { ...e, inAt: a.inAt, outAt: a.outAt, editedBy: a.editedBy } : e)),
      };
    case "upsertSchedule":
      return {
        ...state,
        schedule: state.schedule.some((s) => s.id === a.shift.id)
          ? state.schedule.map((s) => (s.id === a.shift.id ? a.shift : s))
          : [...state.schedule, a.shift],
      };
    case "removeSchedule":
      return { ...state, schedule: state.schedule.filter((s) => s.id !== a.id) };
    case "replaceWeek": {
      const [y, m, d] = a.weekStart.split("-").map(Number);
      const from = new Date(y, m - 1, d).getTime();
      const to = from + 7 * 24 * 3600_000;
      const inWeek = (s: ScheduleShift) => {
        const [yy, mm, dd] = s.date.split("-").map(Number);
        const t = new Date(yy, mm - 1, dd).getTime();
        return t >= from && t < to;
      };
      return { ...state, schedule: [...state.schedule.filter((s) => !inWeek(s)), ...a.shifts] };
    }
    case "saveTipSplit":
      return { ...state, tipSplits: [...state.tipSplits.filter((t) => t.shiftId !== a.split.shiftId), a.split] };
    case "markTipPaid":
      return {
        ...state,
        tipSplits: state.tipSplits.map((t) =>
          t.id === a.splitId ? { ...t, shares: t.shares.map((x) => (x.staffId === a.staffId ? { ...x, paidAt: a.at } : x)) } : t,
        ),
      };
    case "upsertProfile":
      return { ...state, profiles: { ...state.profiles, [a.staffId]: a.profile } };
    case "stockMovement": {
      const next = applyStock(state, [a.movement]);
      return a.unitCostMinor === undefined
        ? next
        : { ...next, ingredients: next.ingredients.map((i) => (i.id === a.movement.ingredientId ? { ...i, unitCostMinor: a.unitCostMinor! } : i)) };
    }
    case "upsertIngredient":
      return {
        ...state,
        ingredients: state.ingredients.some((i) => i.id === a.ingredient.id)
          ? state.ingredients.map((i) => (i.id === a.ingredient.id ? { ...a.ingredient, stockMilli: i.stockMilli } : i))
          : [...state.ingredients, a.ingredient],
      };
    case "setRecipe": {
      const recipes = { ...state.recipes };
      if (a.lines.length) recipes[a.itemId] = a.lines;
      else delete recipes[a.itemId];
      return { ...state, recipes };
    }
    case "upsertGuest":
      return {
        ...state,
        guests: state.guests.some((g) => g.id === a.guest.id)
          ? state.guests.map((g) => (g.id === a.guest.id ? a.guest : g))
          : [a.guest, ...state.guests],
      };
    case "upsertReservation":
      return {
        ...state,
        reservations: state.reservations.some((x) => x.id === a.reservation.id)
          ? state.reservations.map((x) => (x.id === a.reservation.id ? a.reservation : x))
          : [...state.reservations, a.reservation],
      };
    case "setReservationStatus":
      return { ...state, reservations: state.reservations.map((x) => (x.id === a.id ? { ...x, status: a.status } : x)) };
    case "logCampaign":
      return { ...state, campaigns: [a.campaign, ...state.campaigns] };
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
  /** The open cash-register shift, if any. */
  register: ClosedCashShift | undefined;
  /** The signed-in person's open clock-in, if any. */
  myClockIn: TimeEntry | undefined;
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
        ? {
            ...seed(), menu: loaded.menu, categories: loaded.categories, staff: loaded.staff, clients: loaded.clients,
            sessionStaffId: loaded.sessionStaffId, profiles: loaded.profiles,
            suppliers: loaded.suppliers ?? SUPPLIERS, recipes: loaded.recipes ?? RECIPES, guests: loaded.guests ?? seedGuests(Date.now()),
          }
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
      register: openShift(state.cashShifts),
      myClockIn: state.sessionStaffId ? state.timeEntries.find((e) => e.staffId === state.sessionStaffId && !e.outAt) : undefined,
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
