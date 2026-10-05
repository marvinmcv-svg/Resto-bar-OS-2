// Proves tenant isolation (ADR-004) against the real migration, using in-process Postgres (PGlite).
import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";

const A = { tenant: "00000000-0000-0000-0000-00000000000a", user: "10000000-0000-0000-0000-00000000000a", loc: "20000000-0000-0000-0000-00000000000a" };
const B = { tenant: "00000000-0000-0000-0000-00000000000b", user: "10000000-0000-0000-0000-00000000000b", loc: "20000000-0000-0000-0000-00000000000b" };
const WAITER_A = "10000000-0000-0000-0000-0000000000a1";
const BARTENDER_A = "10000000-0000-0000-0000-0000000000a2";
const CASHIER_A = "10000000-0000-0000-0000-0000000000a3";
const MANAGER_A = "10000000-0000-0000-0000-0000000000a4";
const SHIFT_A = "40000000-0000-0000-0000-00000000000a";
const STAFF_A = "50000000-0000-0000-0000-00000000000a";
const KITCHEN_A = "10000000-0000-0000-0000-0000000000a5";
const ING_A = "60000000-0000-0000-0000-00000000000a";
const ORDER_A = "30000000-0000-0000-0000-00000000000a";

let db: PGlite;

// Minimal stand-in for Supabase's auth schema and authenticated role.
const SUPABASE_SHIM = `
  create schema auth;
  create function auth.uid() returns uuid language sql stable as
    $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  create role authenticated;
`;

async function asUser(userId: string, sql: string, params: unknown[] = []) {
  return db.transaction(async (tx) => {
    await tx.query(`select set_config('request.jwt.claim.sub', $1, true)`, [userId]);
    await tx.exec("set local role authenticated");
    return tx.query(sql, params);
  });
}

beforeAll(async () => {
  db = new PGlite();
  await db.exec(SUPABASE_SHIM);
  for (const m of ["0001_core.sql", "0002_roles_menu.sql", "0003_cash_hr.sql", "0004_inventory_guests.sql"]) {
    await db.exec(readFileSync(join(__dirname, "../../supabase/migrations", m), "utf8"));
  }
  await db.exec(`
    grant usage on schema public, auth to authenticated;
    grant select, insert, update, delete on all tables in schema public to authenticated;
  `);
  for (const t of [A, B]) {
    await db.query(`insert into tenants (id, name) values ($1, 'T')`, [t.tenant]);
    await db.query(`insert into memberships (tenant_id, user_id, role) values ($1, $2, 'owner')`, [t.tenant, t.user]);
    await db.query(`insert into locations (id, tenant_id, name) values ($1, $2, 'L')`, [t.loc, t.tenant]);
    await db.query(`insert into orders (tenant_id, location_id, total_minor) values ($1, $2, 1000)`, [t.tenant, t.loc]);
  }
  await db.query(`insert into memberships (tenant_id, user_id, role) values ($1, $2, 'waiter')`, [A.tenant, WAITER_A]);
  await db.query(`insert into memberships (tenant_id, user_id, role) values ($1, $2, 'bartender')`, [A.tenant, BARTENDER_A]);
  await db.query(`insert into platform_admins (user_id) values ($1)`, [A.user]);
  await db.query(`insert into memberships (tenant_id, user_id, role) values ($1, $2, 'cashier')`, [A.tenant, CASHIER_A]);
  await db.query(`insert into memberships (tenant_id, user_id, role) values ($1, $2, 'manager')`, [A.tenant, MANAGER_A]);
  await db.query(`insert into shifts (id, tenant_id, location_id, opened_by, opening_cash_minor) values ($1, $2, $3, $4, 50000)`,
    [SHIFT_A, A.tenant, A.loc, CASHIER_A]);
  await db.query(`insert into staff (id, tenant_id, location_id, name, role, pin_hash) values ($1, $2, $3, 'Ana', 'waiter', 'x')`,
    [STAFF_A, A.tenant, A.loc]);
  await db.query(`insert into staff_profiles (staff_id, tenant_id, location_id, national_id, pay_type, pay_rate_minor)
    values ($1, $2, $3, '1234567', 'monthly', 300000)`, [STAFF_A, A.tenant, A.loc]);
  await db.query(`insert into cash_movements (id, tenant_id, location_id, shift_id, kind, amount_minor, reason, created_by)
    values (gen_random_uuid(), $1, $2, $3, 'out', 12000, 'compra', $4)`, [A.tenant, A.loc, SHIFT_A, CASHIER_A]);
  await db.query(`insert into memberships (tenant_id, user_id, role) values ($1, $2, 'kitchen')`, [A.tenant, KITCHEN_A]);
  await db.query(`insert into ingredients (id, tenant_id, location_id, name, category, unit, unit_cost_minor) values ($1, $2, $3, 'Papa', 'verduras', 'kg', 600)`,
    [ING_A, A.tenant, A.loc]);
  await db.query(`insert into stock_movements (id, tenant_id, location_id, ingredient_id, kind, delta_milli, created_by)
    values (gen_random_uuid(), $1, $2, $3, 'receive', 10000, $4)`, [A.tenant, A.loc, ING_A, A.user]);
  await db.query(`insert into time_entries (id, tenant_id, location_id, staff_id, in_at) values (gen_random_uuid(), $1, $2, $3, now())`,
    [A.tenant, A.loc, STAFF_A]);
  await db.query(`insert into orders (id, tenant_id, location_id, total_minor) values ($1, $2, $3, 5000)`, [ORDER_A, A.tenant, A.loc]);
  await db.query(
    `insert into payments (tenant_id, location_id, order_id, method, amount_minor) values ($1, $2, $3, 'cash', 5000)`,
    [A.tenant, A.loc, ORDER_A]);
  await db.query(
    `insert into invoices (tenant_id, location_id, order_id, provider, total_minor) values ($1, $2, $3, 'fake', 5000)`,
    [A.tenant, A.loc, ORDER_A]);
});

describe("RLS tenant isolation", () => {
  it("a user only sees their own tenant's orders", async () => {
    const res = await asUser(A.user, "select distinct tenant_id from orders");
    expect(res.rows).toEqual([{ tenant_id: A.tenant }]);
  });

  it("a user cannot insert rows into another tenant", async () => {
    await expect(
      asUser(A.user, "insert into orders (tenant_id, location_id) values ($1, $2)", [B.tenant, B.loc]),
    ).rejects.toThrow(/row-level security/);
  });

  it("a user cannot update another tenant's rows", async () => {
    const res = await asUser(A.user, "update orders set total_minor = 0 where tenant_id = $1", [B.tenant]);
    expect(res.affectedRows).toBe(0);
  });

  it("order_events are append-only for members", async () => {
    const ev = [crypto.randomUUID(), A.tenant, A.loc, crypto.randomUUID(), crypto.randomUUID()];
    await asUser(A.user,
      `insert into order_events (id, tenant_id, location_id, order_id, device_id, seq, type, payload, occurred_at)
       values ($1, $2, $3, $4, $5, 1, 'order.opened', '{}', now())`, ev);
    const upd = await asUser(A.user, "update order_events set type = 'x'");
    const del = await asUser(A.user, "delete from order_events");
    expect(upd.affectedRows).toBe(0);
    expect(del.affectedRows).toBe(0);
  });

  it("anonymous sessions see nothing", async () => {
    const res = await asUser("", "select * from orders");
    expect(res.rows).toHaveLength(0);
  });

  it("a row cannot point at another tenant's location, even with its own tenant_id", async () => {
    await expect(
      asUser(A.user, "insert into orders (tenant_id, location_id) values ($1, $2)", [A.tenant, B.loc]),
    ).rejects.toThrow(/foreign key/);
  });
});

describe("Role-based writes (ADR-010)", () => {
  it("nobody can delete or edit payments, not even the owner", async () => {
    for (const user of [A.user, WAITER_A]) {
      expect((await asUser(user, "delete from payments")).affectedRows).toBe(0);
      expect((await asUser(user, "update payments set amount_minor = 0")).affectedRows).toBe(0);
    }
  });

  it("nobody can delete or edit invoices from a client session", async () => {
    expect((await asUser(A.user, "delete from invoices")).affectedRows).toBe(0);
    expect((await asUser(A.user, "update invoices set status = 'cancelled'")).affectedRows).toBe(0);
  });

  it("nobody can delete orders", async () => {
    expect((await asUser(A.user, "delete from orders")).affectedRows).toBe(0);
  });

  it("a waiter cannot record payments", async () => {
    await expect(
      asUser(WAITER_A,
        "insert into payments (tenant_id, location_id, order_id, method, amount_minor) values ($1, $2, $3, 'cash', 1)",
        [A.tenant, A.loc, ORDER_A]),
    ).rejects.toThrow(/row-level security/);
  });

  it("a waiter cannot change the menu", async () => {
    await expect(
      asUser(WAITER_A, "insert into menu_categories (tenant_id, location_id, name) values ($1, $2, 'X')", [A.tenant, A.loc]),
    ).rejects.toThrow(/row-level security/);
  });

  it("a waiter can open orders", async () => {
    const res = await asUser(WAITER_A,
      "insert into orders (tenant_id, location_id) values ($1, $2) returning id", [A.tenant, A.loc]);
    expect(res.rows).toHaveLength(1);
  });

  it("an owner can record a payment", async () => {
    const res = await asUser(A.user,
      "insert into payments (tenant_id, location_id, order_id, method, amount_minor) values ($1, $2, $3, 'qr', 100) returning id",
      [A.tenant, A.loc, ORDER_A]);
    expect(res.rows).toHaveLength(1);
  });

  it("a bartender can open orders but cannot record payments or change the menu", async () => {
    const res = await asUser(BARTENDER_A,
      "insert into orders (tenant_id, location_id) values ($1, $2) returning id", [A.tenant, A.loc]);
    expect(res.rows).toHaveLength(1);
    await expect(
      asUser(BARTENDER_A,
        "insert into payments (tenant_id, location_id, order_id, method, amount_minor) values ($1, $2, $3, 'cash', 1)",
        [A.tenant, A.loc, ORDER_A]),
    ).rejects.toThrow(/row-level security/);
    await expect(
      asUser(BARTENDER_A, "insert into menu_categories (tenant_id, location_id, name) values ($1, $2, 'X')", [A.tenant, A.loc]),
    ).rejects.toThrow(/row-level security/);
  });
});

describe("Platform admins (ADR-011)", () => {
  it("are invisible to every client session, including the admin's own", async () => {
    for (const user of [A.user, B.user, WAITER_A]) {
      expect((await asUser(user, "select * from platform_admins")).rows).toHaveLength(0);
    }
  });

  it("cannot be self-granted from a client session", async () => {
    await expect(
      asUser(B.user, "insert into platform_admins (user_id) values ($1)", [B.user]),
    ).rejects.toThrow(/row-level security/);
  });
});

describe("Cash register and HR (ADR-012)", () => {
  const movement = (user: string) =>
    asUser(user,
      `insert into cash_movements (id, tenant_id, location_id, shift_id, kind, amount_minor, reason, created_by)
       values (gen_random_uuid(), $1, $2, $3, 'in', 500, 'cambio', $4) returning id`,
      [A.tenant, A.loc, SHIFT_A, user]);

  it("a cashier records cash movements; a waiter can't", async () => {
    expect((await movement(CASHIER_A)).rows).toHaveLength(1);
    await expect(movement(WAITER_A)).rejects.toThrow(/row-level security/);
  });

  it("nobody edits or deletes cash movements or clock-ins", async () => {
    for (const user of [A.user, MANAGER_A, CASHIER_A]) {
      expect((await asUser(user, "update cash_movements set amount_minor = 1")).affectedRows).toBe(0);
      expect((await asUser(user, "delete from cash_movements")).affectedRows).toBe(0);
      expect((await asUser(user, "delete from time_entries")).affectedRows).toBe(0);
    }
  });

  it("only the owner sees personal and pay data", async () => {
    expect((await asUser(A.user, "select pay_rate_minor from staff_profiles")).rows).toHaveLength(1);
    for (const user of [MANAGER_A, CASHIER_A, WAITER_A]) {
      expect((await asUser(user, "select * from staff_profiles")).rows).toHaveLength(0);
    }
    expect((await asUser(B.user, "select * from staff_profiles")).rows).toHaveLength(0);
  });

  it("staff clock out once through clock_out(); corrections need a manager's name on them", async () => {
    // Direct edits by staff do nothing; clock_out() stamps the open entry once.
    expect((await asUser(WAITER_A, "update time_entries set out_at = now()")).affectedRows).toBe(0);
    const open = await asUser(WAITER_A, "select id from time_entries where out_at is null");
    const entry = (open.rows[0] as { id: string }).id;
    expect((await asUser(WAITER_A, "select public.clock_out($1) as ok", [entry])).rows).toEqual([{ ok: true }]);
    expect((await asUser(WAITER_A, "select public.clock_out($1) as ok", [entry])).rows).toEqual([{ ok: false }]);
    expect((await asUser(B.user, "select public.clock_out($1) as ok", [entry])).rows).toEqual([{ ok: false }]);
    await expect(asUser(MANAGER_A, "update time_entries set in_at = now() - interval '1 hour'")).rejects.toThrow(/row-level security/);
    const fixed = await asUser(MANAGER_A, "update time_entries set in_at = now() - interval '1 hour', edited_by = $1", [MANAGER_A]);
    expect(fixed.affectedRows).toBe(1);
  });

  it("a payment can't point at another tenant's shift", async () => {
    await expect(
      db.query(`insert into payments (tenant_id, location_id, order_id, shift_id, method, amount_minor)
        select $1, $2, id, $3, 'cash', 1 from orders where tenant_id = $1 limit 1`, [B.tenant, B.loc, SHIFT_A]),
    ).rejects.toThrow(/foreign key/);
  });
});

describe("Inventory, guests and reservations (ADR-013)", () => {
  const move = (user: string, kind: string, delta: number) =>
    asUser(user,
      `insert into stock_movements (id, tenant_id, location_id, ingredient_id, kind, delta_milli, created_by)
       values (gen_random_uuid(), $1, $2, $3, $4, $5, $6) returning id`,
      [A.tenant, A.loc, ING_A, kind, delta, user]);

  it("the kitchen logs waste but can't receive stock, change costs or fake sales", async () => {
    expect((await move(KITCHEN_A, "waste", -500)).rows).toHaveLength(1);
    await expect(move(KITCHEN_A, "receive", 1000)).rejects.toThrow(/row-level security/);
    await expect(move(MANAGER_A, "sale", -100)).rejects.toThrow(/row-level security/);
    expect((await asUser(KITCHEN_A, "update ingredients set unit_cost_minor = 1")).affectedRows).toBe(0);
  });

  it("the stock ledger is append-only and the view sums it", async () => {
    expect((await asUser(A.user, "update stock_movements set delta_milli = 0")).affectedRows).toBe(0);
    expect((await asUser(A.user, "delete from stock_movements")).affectedRows).toBe(0);
    const stock = await asUser(A.user, "select stock_milli from ingredient_stock where ingredient_id = $1", [ING_A]);
    expect(stock.rows).toEqual([{ stock_milli: 9500 }]);
    expect((await asUser(B.user, "select * from ingredient_stock")).rows).toHaveLength(0);
  });

  it("waste must reduce stock and receipts must add to it", async () => {
    await expect(move(A.user, "waste", 500)).rejects.toThrow(/check constraint/);
    await expect(move(A.user, "receive", -500)).rejects.toThrow(/check constraint/);
  });

  it("front of house books tables and records guests; the kitchen can't; nobody deletes them", async () => {
    const guest = (user: string) =>
      asUser(user, `insert into guests (id, tenant_id, location_id, name, phone) values (gen_random_uuid(), $1, $2, 'Gabriela', '+591 70000009') returning id`,
        [A.tenant, A.loc]);
    expect((await guest(WAITER_A)).rows).toHaveLength(1);
    await expect(guest(KITCHEN_A)).rejects.toThrow(/row-level security/);
    const booking = await asUser(CASHIER_A,
      `insert into reservations (id, tenant_id, location_id, name, party, starts_at, created_by)
       values (gen_random_uuid(), $1, $2, 'Gabriela', 4, now() + interval '1 day', $3) returning id`, [A.tenant, A.loc, CASHIER_A]);
    expect(booking.rows).toHaveLength(1);
    expect((await asUser(A.user, "delete from reservations")).affectedRows).toBe(0);
    expect((await asUser(A.user, "delete from guests")).affectedRows).toBe(0);
  });
});
