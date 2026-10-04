// Drizzle schema (typed queries). RLS policies live in supabase/migrations/*.sql.
// Rules: tenant_id on every row, money in integer minor units (centavos),
// client-generated UUIDs (offline), soft delete via deleted_at, append-only order_events.
import {
  pgTable, uuid, text, integer, bigint, timestamp, jsonb, pgEnum, boolean, unique, foreignKey,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";

const id = () => uuid("id").primaryKey().defaultRandom();
const tenantId = () => uuid("tenant_id").notNull().references(() => tenants.id);
const locationId = () => uuid("location_id").notNull();
// (tenant_id, location_id) must point at a location of the same tenant.
const sameTenantLocation = (t: { tenantId: AnyPgColumn; locationId: AnyPgColumn }) =>
  foreignKey({ columns: [t.tenantId, t.locationId], foreignColumns: [locations.tenantId, locations.id] });
const sameTenantOrder = (t: { tenantId: AnyPgColumn; orderId: AnyPgColumn }) =>
  foreignKey({ columns: [t.tenantId, t.orderId], foreignColumns: [orders.tenantId, orders.id] });
const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
};

// "device" = a POS tablet's own login (ADR-010). Staff identify on the device with a PIN.
export const roleEnum = pgEnum("member_role", ["owner", "manager", "cashier", "waiter", "device"]);
export const orderStatusEnum = pgEnum("order_status", ["open", "paid", "voided"]);
export const paymentMethodEnum = pgEnum("payment_method", ["cash", "qr", "card_external", "transfer", "other"]);
export const invoiceStatusEnum = pgEnum("invoice_status", [
  "pending", "issued", "contingency", "failed", "cancel_requested", "cancelled",
]);

export const tenants = pgTable("tenants", {
  id: id(),
  name: text("name").notNull(),
  taxId: text("tax_id"), // NIT
  ...timestamps,
});

export const locations = pgTable("locations", {
  id: id(),
  tenantId: tenantId(),
  name: text("name").notNull(),
  currency: text("currency").notNull().default("BOB"),
  countryCode: text("country_code").notNull().default("BO"),
  timezone: text("timezone").notNull().default("America/La_Paz"),
  ...timestamps,
}, (t) => [unique().on(t.tenantId, t.id)]);

export const memberships = pgTable("memberships", {
  id: id(),
  tenantId: tenantId(),
  userId: uuid("user_id").notNull(), // auth.users.id
  role: roleEnum("role").notNull(),
  ...timestamps,
}, (t) => [unique().on(t.tenantId, t.userId)]);

export const devices = pgTable("devices", {
  id: id(),
  tenantId: tenantId(),
  locationId: locationId(),
  name: text("name").notNull(),
  authUserId: uuid("auth_user_id").unique(),
  lastSeenAt: timestamp("last_seen_at", { withTimezone: true }),
  ...timestamps,
}, (t) => [sameTenantLocation(t)]);

export const menuCategories = pgTable("menu_categories", {
  id: id(),
  tenantId: tenantId(),
  locationId: locationId(),
  name: text("name").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  printStation: text("print_station").notNull().default("kitchen"),
  ...timestamps,
}, (t) => [sameTenantLocation(t)]);

export const menuItems = pgTable("menu_items", {
  id: id(),
  tenantId: tenantId(),
  locationId: locationId(),
  categoryId: uuid("category_id").notNull().references(() => menuCategories.id),
  name: text("name").notNull(),
  priceMinor: bigint("price_minor", { mode: "number" }).notNull(),
  active: boolean("active").notNull().default(true),
  ...timestamps,
}, (t) => [sameTenantLocation(t)]);

export const diningTables = pgTable("dining_tables", {
  id: id(),
  tenantId: tenantId(),
  locationId: locationId(),
  label: text("label").notNull(),
  seats: integer("seats").notNull().default(4),
  ...timestamps,
}, (t) => [sameTenantLocation(t)]);

export const shifts = pgTable("shifts", {
  id: id(),
  tenantId: tenantId(),
  locationId: locationId(),
  openedBy: uuid("opened_by").notNull(),
  openedAt: timestamp("opened_at", { withTimezone: true }).notNull().defaultNow(),
  closedAt: timestamp("closed_at", { withTimezone: true }),
  openingCashMinor: bigint("opening_cash_minor", { mode: "number" }).notNull().default(0),
  countedCashMinor: bigint("counted_cash_minor", { mode: "number" }),
  ...timestamps,
}, (t) => [sameTenantLocation(t)]);

export const orders = pgTable("orders", {
  id: id(), // client-generated when offline
  tenantId: tenantId(),
  locationId: locationId(),
  tableId: uuid("table_id").references(() => diningTables.id),
  shiftId: uuid("shift_id").references(() => shifts.id),
  status: orderStatusEnum("status").notNull().default("open"),
  totalMinor: bigint("total_minor", { mode: "number" }).notNull().default(0),
  ...timestamps,
}, (t) => [sameTenantLocation(t), unique().on(t.tenantId, t.id)]);

// Append-only; never updated or deleted. Source of truth for sync and audit.
export const orderEvents = pgTable("order_events", {
  id: uuid("id").primaryKey(), // client-generated, idempotency key
  tenantId: tenantId(),
  locationId: locationId(),
  orderId: uuid("order_id").notNull(),
  deviceId: uuid("device_id").notNull(),
  seq: bigint("seq", { mode: "number" }).notNull(),
  type: text("type").notNull(),
  payload: jsonb("payload").notNull(),
  occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(),
  receivedAt: timestamp("received_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [unique().on(t.deviceId, t.seq), sameTenantLocation(t)]);

export const payments = pgTable("payments", {
  id: id(),
  tenantId: tenantId(),
  locationId: locationId(),
  orderId: uuid("order_id").notNull(),
  method: paymentMethodEnum("method").notNull(),
  amountMinor: bigint("amount_minor", { mode: "number" }).notNull(),
  tipMinor: bigint("tip_minor", { mode: "number" }).notNull().default(0),
  reference: text("reference"),
  ...timestamps,
}, (t) => [sameTenantLocation(t), sameTenantOrder(t)]);

export const invoices = pgTable("invoices", {
  id: id(),
  tenantId: tenantId(),
  locationId: locationId(),
  orderId: uuid("order_id").notNull(),
  status: invoiceStatusEnum("status").notNull().default("pending"),
  provider: text("provider").notNull(),
  externalId: text("external_id"),
  customerTaxId: text("customer_tax_id"),
  customerName: text("customer_name"),
  totalMinor: bigint("total_minor", { mode: "number" }).notNull(),
  raw: jsonb("raw"),
  ...timestamps,
}, (t) => [sameTenantLocation(t), sameTenantOrder(t)]);
