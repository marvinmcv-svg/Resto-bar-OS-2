// POS domain types (client-side demo store for now; mirrors the DB model in src/db/schema.ts).
// Money is always integer centavos (minor units).

export type Station = "cocina" | "barra";

export interface ModifierOption {
  id: string;
  name: string;
  priceMinor: number;
}

export interface ModifierGroup {
  id: string;
  name: string;
  required: boolean;
  multi: boolean;
  options: ModifierOption[];
}

export interface Category {
  id: string;
  name: string;
  icon: string; // lucide icon key, see components/pos/category-icon.tsx
  station: Station;
  /** Desserts get their own upsell moment, after the mains. */
  dessert?: boolean;
}

export interface MenuItem {
  id: string;
  categoryId: string;
  name: string;
  description?: string;
  priceMinor: number;
  image?: string;
  modifierGroups: ModifierGroup[];
  available: boolean;
  popular?: boolean;
  /** Removed from the menu. Soft delete: past orders still reference it. */
  archived?: boolean;
}

export type Zone = "salon" | "terraza" | "barra";

export interface DiningTable {
  id: string;
  label: string;
  zone: Zone;
  seats: number;
  shape: "round" | "square" | "rect";
  x: number; // grid column (1-based)
  y: number; // grid row (1-based)
  w?: number;
  h?: number;
}

/** "admin" is the platform admin (Resto-bar OS staff), not a restaurant role (ADR-011). */
export type Role = "admin" | "owner" | "manager" | "cashier" | "waiter" | "bartender" | "kitchen";

export interface Staff {
  id: string;
  name: string;
  role: Role;
  pin: string; // demo only; real PINs are hashed server-side (ADR-010)
  /** Deactivated staff can't sign in. Never deleted: the audit trail references them. */
  active?: boolean;
}

/** Guest context on a table, Toast's "digital chit". */
export interface GuestNote {
  name?: string;
  occasion?: "cumpleanos" | "aniversario" | "alergia" | "vip";
  text?: string;
}

export interface WaitlistEntry {
  id: string;
  name: string;
  party: number;
  phone?: string;
  addedAt: number;
  quotedMin: number;
}

export interface ShiftNote {
  text: string;
  by: string;
  at: number;
}

export interface ChosenModifier {
  groupId: string;
  optionId: string;
  name: string;
  priceMinor: number;
}

export interface OrderLine {
  id: string;
  itemId: string;
  name: string;
  unitPriceMinor: number;
  qty: number;
  modifiers: ChosenModifier[];
  note?: string;
  sentAt?: number;
  /** Kitchen screen progress. */
  startedAt?: number;
  readyAt?: number;
  voided?: { by: string; reason: string; at: number };
}

export type PaymentMethod = "cash" | "qr" | "card_external" | "transfer";

export interface Payment {
  id: string;
  method: PaymentMethod;
  amountMinor: number;
  tipMinor: number;
  at: number;
  by: string;
}

export interface Order {
  id: string;
  tableId: string;
  waiterId: string;
  guests: number;
  openedAt: number;
  lines: OrderLine[];
  payments: Payment[];
  status: "open" | "paid";
  closedAt?: number;
  billRequested?: boolean;
}

/** A charge as the till sees it: belongs to one cash-register shift. */
export interface PaymentRecord {
  id: string;
  shiftId: string | null;
  orderId: string;
  tableId: string;
  method: PaymentMethod;
  amountMinor: number;
  tipMinor: number;
  at: number;
  by: string;
}

export type CashMovementReason = "compra" | "retiro" | "cambio" | "otro";

/** Cash put into or taken out of the drawer. Append-only: a correction is an opposite movement. */
export interface CashMovement {
  id: string;
  shiftId: string;
  kind: "in" | "out";
  amountMinor: number;
  reason: CashMovementReason;
  note?: string;
  at: number;
  by: string;
  approvedBy?: string;
}

/** Bill/coin count: denomination in centavos -> how many. */
export type CashCount = Record<number, number>;

export interface CashShift {
  id: string;
  openedBy: string;
  openedAt: number;
  openingMinor: number;
  closedAt?: number;
  closedBy?: string;
  countedMinor?: number;
  count?: CashCount;
  expectedMinor?: number;
}
