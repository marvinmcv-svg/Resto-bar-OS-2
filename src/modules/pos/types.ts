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

export type Role = "owner" | "manager" | "cashier" | "waiter";

export interface Staff {
  id: string;
  name: string;
  role: Role;
  pin: string; // demo only; real PINs are hashed server-side (ADR-010)
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
