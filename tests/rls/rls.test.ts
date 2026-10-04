// Proves tenant isolation (ADR-004) against the real migration, using in-process Postgres (PGlite).
import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";

const A = { tenant: "00000000-0000-0000-0000-00000000000a", user: "10000000-0000-0000-0000-00000000000a", loc: "20000000-0000-0000-0000-00000000000a" };
const B = { tenant: "00000000-0000-0000-0000-00000000000b", user: "10000000-0000-0000-0000-00000000000b", loc: "20000000-0000-0000-0000-00000000000b" };
const WAITER_A = "10000000-0000-0000-0000-0000000000a1";
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
  await db.exec(readFileSync(join(__dirname, "../../supabase/migrations/0001_core.sql"), "utf8"));
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
});
