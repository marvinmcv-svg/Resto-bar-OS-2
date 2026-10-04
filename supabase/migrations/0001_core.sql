-- Core multi-tenant schema + RLS baseline (ADR-004).
-- Mirrors src/db/schema.ts. Keep both in sync until migrations are generated from Drizzle.

create type member_role as enum ('owner','manager','cashier','waiter');
create type order_status as enum ('open','paid','voided');
create type payment_method as enum ('cash','qr','card_external','transfer','other');
create type invoice_status as enum ('pending','issued','contingency','failed','cancel_requested','cancelled');

create table tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  tax_id text,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table locations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id),
  name text not null,
  currency text not null default 'BOB',
  country_code text not null default 'BO',
  timezone text not null default 'America/La_Paz',
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table memberships (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id),
  user_id uuid not null,
  role member_role not null,
  created_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (tenant_id, user_id)
);

create table devices (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id),
  location_id uuid not null references locations(id),
  name text not null,
  last_seen_at timestamptz,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table menu_categories (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id),
  location_id uuid not null references locations(id),
  name text not null,
  sort_order integer not null default 0,
  print_station text not null default 'kitchen',
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table menu_items (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id),
  location_id uuid not null references locations(id),
  category_id uuid not null references menu_categories(id),
  name text not null,
  price_minor bigint not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table dining_tables (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id),
  location_id uuid not null references locations(id),
  label text not null,
  seats integer not null default 4,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table shifts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id),
  location_id uuid not null references locations(id),
  opened_by uuid not null,
  opened_at timestamptz not null default now(),
  closed_at timestamptz,
  opening_cash_minor bigint not null default 0,
  counted_cash_minor bigint,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table orders (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id),
  location_id uuid not null references locations(id),
  table_id uuid references dining_tables(id),
  shift_id uuid references shifts(id),
  status order_status not null default 'open',
  total_minor bigint not null default 0,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table order_events (
  id uuid primary key,
  tenant_id uuid not null references tenants(id),
  location_id uuid not null references locations(id),
  order_id uuid not null,
  device_id uuid not null,
  seq bigint not null,
  type text not null,
  payload jsonb not null,
  occurred_at timestamptz not null,
  received_at timestamptz not null default now(),
  unique (device_id, seq)
);

create table payments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id),
  location_id uuid not null references locations(id),
  order_id uuid not null references orders(id),
  method payment_method not null,
  amount_minor bigint not null,
  tip_minor bigint not null default 0,
  reference text,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table invoices (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id),
  location_id uuid not null references locations(id),
  order_id uuid not null references orders(id),
  status invoice_status not null default 'pending',
  provider text not null,
  external_id text,
  customer_tax_id text,
  customer_name text,
  total_minor bigint not null,
  raw jsonb,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- Membership lookup. SECURITY DEFINER avoids RLS recursion on memberships.
create or replace function public.is_member(t uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from memberships m
    where m.tenant_id = t and m.user_id = auth.uid() and m.deleted_at is null
  );
$$;

alter table tenants enable row level security;
create policy tenant_member_read on tenants for select using (public.is_member(id));

alter table memberships enable row level security;
create policy membership_read on memberships for select using (public.is_member(tenant_id));

-- Same policy shape for every tenant-scoped operational table.
do $$
declare t text;
begin
  foreach t in array array[
    'locations','devices','menu_categories','menu_items','dining_tables',
    'shifts','orders','payments','invoices'
  ] loop
    execute format('alter table %I enable row level security', t);
    execute format(
      'create policy %I on %I for all using (public.is_member(tenant_id)) with check (public.is_member(tenant_id))',
      t || '_tenant_isolation', t);
  end loop;
end $$;

-- order_events: append-only. Members can read and insert; no update/delete policy exists.
alter table order_events enable row level security;
create policy order_events_read on order_events for select using (public.is_member(tenant_id));
create policy order_events_insert on order_events for insert with check (public.is_member(tenant_id));
