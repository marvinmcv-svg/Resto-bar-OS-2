// Drizzle schema (typed queries). RLS policies live in supabase/migrations/*.sql.
// Rules: tenant_id on every row, money in integer minor units (centavos),
// client-generated UUIDs (offline), soft delete via deleted_at, append-only order_events.
import {
  pgTable, uuid, text, integer, bigint, timestamp, jsonb, pgEnum, boolean, unique, foreignKey, date,
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
export const roleEnum = pgEnum("member_role", ["owner", "manager", "cashier", "waiter", "bartender", "kitchen", "device"]);
export const orderStatusEnum = pgEnum("order_status", ["open", "paid", "voided"]);
export const paymentMethodEnum = pgEnum("payment_method", ["cash", "qr", "card_external", "transfer", "other"]);
export const payTypeEnum = pgEnum("pay_type", ["monthly", "hourly", "per_shift"]);
export const stockMovementKindEnum = pgEnum("stock_movement_kind", ["receive", "sale", "waste", "count"]);
export const reservationStatusEnum = pgEnum("reservation_status", ["confirmada", "sentada", "no-show", "cancelada"]);
export const cashMovementKindEnum = pgEnum("cash_movement_kind", ["in", "out"]);
export const invoiceStatusEnum = pgEnum("invoice_status", [
  "pending", "issued", "contingency", "failed", "cancel_requested", "cancelled",
]);

export const tenants = pgTable("tenants", {
  id: id(),
  name: text("name").notNull(),
  taxId: text("tax_id"), // NIT
  ...timestamps,
});

// Resto-bar OS staff (ADR-011). Not tenant-scoped: service role only, RLS on with no policies.
export const platformAdmins = pgTable("platform_admins", {
  userId: uuid("user_id").primaryKey(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
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
  description: text("description"),
  imageUrl: text("image_url"),
  popular: boolean("popular").notNull().default(false),
  ...timestamps,
}, (t) => [sameTenantLocation(t), unique("menu_items_tenant_id_key").on(t.tenantId, t.id)]);

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
  closedBy: uuid("closed_by"),
  expectedCashMinor: bigint("expected_cash_minor", { mode: "number" }),
  countBreakdown: jsonb("count_breakdown"), // denomination in centavos -> count
  ...timestamps,
}, (t) => [sameTenantLocation(t), unique("shifts_tenant_id_key").on(t.tenantId, t.id)]);

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
  shiftId: uuid("shift_id"),
  method: paymentMethodEnum("method").notNull(),
  amountMinor: bigint("amount_minor", { mode: "number" }).notNull(),
  tipMinor: bigint("tip_minor", { mode: "number" }).notNull().default(0),
  reference: text("reference"),
  ...timestamps,
}, (t) => [
  sameTenantLocation(t), sameTenantOrder(t),
  foreignKey({ name: "payments_shift_fk", columns: [t.tenantId, t.shiftId], foreignColumns: [shifts.tenantId, shifts.id] }),
]);

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

// ---------- Cash register and daily HR (ADR-012) ----------

const sameTenantShift = (t: { tenantId: AnyPgColumn; shiftId: AnyPgColumn }) =>
  foreignKey({ columns: [t.tenantId, t.shiftId], foreignColumns: [shifts.tenantId, shifts.id] });
const sameTenantStaff = (t: { tenantId: AnyPgColumn; staffId: AnyPgColumn }) =>
  foreignKey({ columns: [t.tenantId, t.staffId], foreignColumns: [staff.tenantId, staff.id] });

// Staff identify on paired devices with a PIN; stored hashed (ADR-010).
export const staff = pgTable("staff", {
  id: id(),
  tenantId: tenantId(),
  locationId: locationId(),
  name: text("name").notNull(),
  role: roleEnum("role").notNull(),
  pinHash: text("pin_hash").notNull(),
  active: boolean("active").notNull().default(true),
  ...timestamps,
}, (t) => [sameTenantLocation(t), unique().on(t.tenantId, t.id)]);

// Personal and pay data: owner only (RLS).
export const staffProfiles = pgTable("staff_profiles", {
  staffId: uuid("staff_id").primaryKey(),
  tenantId: tenantId(),
  locationId: locationId(),
  nationalId: text("national_id"), // CI
  phone: text("phone"),
  emergencyContact: text("emergency_contact"),
  startedOn: date("started_on"),
  payType: payTypeEnum("pay_type"),
  payRateMinor: bigint("pay_rate_minor", { mode: "number" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [sameTenantLocation(t), sameTenantStaff(t)]);

// Append-only drawer movements.
export const cashMovements = pgTable("cash_movements", {
  id: uuid("id").primaryKey(),
  tenantId: tenantId(),
  locationId: locationId(),
  shiftId: uuid("shift_id").notNull(),
  kind: cashMovementKindEnum("kind").notNull(),
  amountMinor: bigint("amount_minor", { mode: "number" }).notNull(),
  reason: text("reason").notNull(),
  note: text("note"),
  createdBy: uuid("created_by").notNull(),
  approvedBy: uuid("approved_by"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [sameTenantLocation(t), sameTenantShift(t)]);

export const timeEntries = pgTable("time_entries", {
  id: uuid("id").primaryKey(),
  tenantId: tenantId(),
  locationId: locationId(),
  staffId: uuid("staff_id").notNull(),
  inAt: timestamp("in_at", { withTimezone: true }).notNull(),
  outAt: timestamp("out_at", { withTimezone: true }),
  editedBy: uuid("edited_by"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [sameTenantLocation(t), sameTenantStaff(t)]);

export const scheduleShifts = pgTable("schedule_shifts", {
  id: uuid("id").primaryKey(),
  tenantId: tenantId(),
  locationId: locationId(),
  staffId: uuid("staff_id").notNull(),
  startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
  endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
  ...timestamps,
}, (t) => [sameTenantLocation(t), sameTenantStaff(t)]);

export const tipDistributions = pgTable("tip_distributions", {
  id: uuid("id").primaryKey(),
  tenantId: tenantId(),
  locationId: locationId(),
  shiftId: uuid("shift_id").notNull(),
  staffId: uuid("staff_id").notNull(),
  amountMinor: bigint("amount_minor", { mode: "number" }).notNull(),
  method: text("method").notNull(), // 'equal' | 'hours'
  paidAt: timestamp("paid_at", { withTimezone: true }),
  createdBy: uuid("created_by").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [sameTenantLocation(t), sameTenantShift(t), sameTenantStaff(t)]);

// ---------- Inventory, guests, reservations, campaigns (ADR-013) ----------

export const suppliers = pgTable("suppliers", {
  id: id(),
  tenantId: tenantId(),
  locationId: locationId(),
  name: text("name").notNull(),
  phone: text("phone"),
  ...timestamps,
}, (t) => [sameTenantLocation(t), unique().on(t.tenantId, t.id)]);

// Quantities in integer thousandths of the unit; money in centavos.
export const ingredients = pgTable("ingredients", {
  id: id(),
  tenantId: tenantId(),
  locationId: locationId(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  unit: text("unit").notNull(), // 'kg' | 'l' | 'u'
  parMilli: bigint("par_milli", { mode: "number" }).notNull().default(0),
  unitCostMinor: bigint("unit_cost_minor", { mode: "number" }).notNull().default(0),
  supplierId: uuid("supplier_id"),
  ...timestamps,
}, (t) => [
  sameTenantLocation(t), unique().on(t.tenantId, t.id),
  foreignKey({ columns: [t.tenantId, t.supplierId], foreignColumns: [suppliers.tenantId, suppliers.id] }),
]);

export const recipeItems = pgTable("recipe_items", {
  id: id(),
  tenantId: tenantId(),
  locationId: locationId(),
  menuItemId: uuid("menu_item_id").notNull(),
  ingredientId: uuid("ingredient_id").notNull(),
  qtyMilli: bigint("qty_milli", { mode: "number" }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  sameTenantLocation(t), unique().on(t.menuItemId, t.ingredientId),
  foreignKey({ columns: [t.tenantId, t.menuItemId], foreignColumns: [menuItems.tenantId, menuItems.id] }),
  foreignKey({ columns: [t.tenantId, t.ingredientId], foreignColumns: [ingredients.tenantId, ingredients.id] }),
]);

// Append-only; stock on hand is the sum per ingredient (view ingredient_stock).
export const stockMovements = pgTable("stock_movements", {
  id: uuid("id").primaryKey(),
  tenantId: tenantId(),
  locationId: locationId(),
  ingredientId: uuid("ingredient_id").notNull(),
  kind: stockMovementKindEnum("kind").notNull(),
  deltaMilli: bigint("delta_milli", { mode: "number" }).notNull(),
  costMinor: bigint("cost_minor", { mode: "number" }),
  reason: text("reason"),
  orderId: uuid("order_id"),
  createdBy: uuid("created_by").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  sameTenantLocation(t),
  foreignKey({ columns: [t.tenantId, t.ingredientId], foreignColumns: [ingredients.tenantId, ingredients.id] }),
]);

export const guests = pgTable("guests", {
  id: uuid("id").primaryKey(),
  tenantId: tenantId(),
  locationId: locationId(),
  name: text("name").notNull(),
  phone: text("phone"),
  birthday: text("birthday"), // MM-DD
  tags: text("tags").array().notNull().default([]),
  notes: text("notes"),
  optIn: boolean("opt_in").notNull().default(false),
  ...timestamps,
}, (t) => [sameTenantLocation(t), unique().on(t.tenantId, t.id)]);

export const reservations = pgTable("reservations", {
  id: uuid("id").primaryKey(),
  tenantId: tenantId(),
  locationId: locationId(),
  guestId: uuid("guest_id"),
  name: text("name").notNull(),
  phone: text("phone"),
  party: integer("party").notNull(),
  startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
  durationMin: integer("duration_min").notNull().default(120),
  tableId: uuid("table_id").references(() => diningTables.id),
  status: reservationStatusEnum("status").notNull().default("confirmada"),
  notes: text("notes"),
  createdBy: uuid("created_by").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  sameTenantLocation(t),
  foreignKey({ columns: [t.tenantId, t.guestId], foreignColumns: [guests.tenantId, guests.id] }),
]);

export const campaigns = pgTable("campaigns", {
  id: uuid("id").primaryKey(),
  tenantId: tenantId(),
  locationId: locationId(),
  segment: text("segment").notNull(),
  message: text("message").notNull(),
  recipients: integer("recipients").notNull().default(0),
  createdBy: uuid("created_by").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [sameTenantLocation(t)]);
