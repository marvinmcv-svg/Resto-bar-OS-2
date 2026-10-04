-- Core multi-tenant schema + RLS baseline (ADR-004).
-- Mirrors src/db/schema.ts. Keep both in sync until migrations are generated from Drizzle.

-- 'device' = a POS tablet's own login (ADR-010). Staff identify on the device with a PIN.
create type member_role as enum ('owner','manager','cashier','waiter','device');
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
  deleted_at timestamptz,
  unique (tenant_id, id)
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
  location_id uuid not null,
  name text not null,
  auth_user_id uuid unique, -- the device's own auth user (ADR-010)
  last_seen_at timestamptz,
  created_at timestamptz not null default now(),
  deleted_at timestamptz,
  foreign key (tenant_id, location_id) references locations(tenant_id, id)
);

create table menu_categories (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id),
  location_id uuid not null,
  name text not null,
  sort_order integer not null default 0,
  print_station text not null default 'kitchen',
  created_at timestamptz not null default now(),
  deleted_at timestamptz,
  foreign key (tenant_id, location_id) references locations(tenant_id, id)
);

create table menu_items (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id),
  location_id uuid not null,
  category_id uuid not null references menu_categories(id),
  name text not null,
  price_minor bigint not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  deleted_at timestamptz,
  foreign key (tenant_id, location_id) references locations(tenant_id, id)
);

create table dining_tables (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id),
  location_id uuid not null,
  label text not null,
  seats integer not null default 4,
  created_at timestamptz not null default now(),
  deleted_at timestamptz,
  foreign key (tenant_id, location_id) references locations(tenant_id, id)
);

create table shifts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id),
  location_id uuid not null,
  opened_by uuid not null,
  opened_at timestamptz not null default now(),
  closed_at timestamptz,
  opening_cash_minor bigint not null default 0,
  counted_cash_minor bigint,
  created_at timestamptz not null default now(),
  deleted_at timestamptz,
  foreign key (tenant_id, location_id) references locations(tenant_id, id)
);

create table orders (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id),
  location_id uuid not null,
  table_id uuid references dining_tables(id),
  shift_id uuid references shifts(id),
  status order_status not null default 'open',
  total_minor bigint not null default 0,
  created_at timestamptz not null default now(),
  deleted_at timestamptz,
  foreign key (tenant_id, location_id) references locations(tenant_id, id),
  unique (tenant_id, id)
);

create table order_events (
  id uuid primary key,
  tenant_id uuid not null references tenants(id),
  location_id uuid not null,
  order_id uuid not null,
  device_id uuid not null,
  seq bigint not null,
  type text not null,
  payload jsonb not null,
  occurred_at timestamptz not null,
  received_at timestamptz not null default now(),
  unique (device_id, seq),
  foreign key (tenant_id, location_id) references locations(tenant_id, id)
);

create table payments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id),
  location_id uuid not null,
  order_id uuid not null,
  method payment_method not null,
  amount_minor bigint not null,
  tip_minor bigint not null default 0,
  reference text,
  created_at timestamptz not null default now(),
  deleted_at timestamptz,
  foreign key (tenant_id, location_id) references locations(tenant_id, id),
  foreign key (tenant_id, order_id) references orders(tenant_id, id)
);

create table invoices (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id),
  location_id uuid not null,
  order_id uuid not null,
  status invoice_status not null default 'pending',
  provider text not null,
  external_id text,
  customer_tax_id text,
  customer_name text,
  total_minor bigint not null,
  raw jsonb,
  created_at timestamptz not null default now(),
  deleted_at timestamptz,
  foreign key (tenant_id, location_id) references locations(tenant_id, id),
  foreign key (tenant_id, order_id) references orders(tenant_id, id)
);

-- Membership/role lookups. SECURITY DEFINER avoids RLS recursion on memberships.
create or replace function public.is_member(t uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from memberships m
    where m.tenant_id = t and m.user_id = auth.uid() and m.deleted_at is null
  );
$$;

create or replace function public.has_role(t uuid, roles member_role[]) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from memberships m
    where m.tenant_id = t and m.user_id = auth.uid() and m.deleted_at is null
      and m.role = any(roles)
  );
$$;

-- Policy matrix (ADR-010). Members read their tenant. Writes depend on role.
-- Nothing fiscal or financial is deletable: no DELETE policy on orders, payments,
-- invoices, order_events, or shifts. Soft delete only, and only where allowed.
-- Invoices are written exclusively by the server worker (service role bypasses RLS).

alter table tenants enable row level security;
create policy tenants_read on tenants for select using (public.is_member(id));
create policy tenants_owner_update on tenants for update
  using (public.has_role(id, '{owner}')) with check (public.has_role(id, '{owner}'));

alter table memberships enable row level security;
create policy memberships_read on memberships for select using (public.is_member(tenant_id));
create policy memberships_owner_insert on memberships for insert with check (public.has_role(tenant_id, '{owner}'));
create policy memberships_owner_update on memberships for update
  using (public.has_role(tenant_id, '{owner}')) with check (public.has_role(tenant_id, '{owner}'));

-- Configuration: owners and managers manage; everyone reads.
do $$
declare t text;
begin
  foreach t in array array['locations','devices','menu_categories','menu_items','dining_tables'] loop
    execute format('alter table %I enable row level security', t);
    execute format('create policy %I on %I for select using (public.is_member(tenant_id))', t || '_read', t);
    execute format('create policy %I on %I for insert with check (public.has_role(tenant_id, ''{owner,manager}''))', t || '_mgr_insert', t);
    execute format('create policy %I on %I for update using (public.has_role(tenant_id, ''{owner,manager}'')) with check (public.has_role(tenant_id, ''{owner,manager}''))', t || '_mgr_update', t);
    execute format('create policy %I on %I for delete using (public.has_role(tenant_id, ''{owner,manager}''))', t || '_mgr_delete', t);
  end loop;
end $$;

-- Orders: any member opens and updates; nobody deletes.
alter table orders enable row level security;
create policy orders_read on orders for select using (public.is_member(tenant_id));
create policy orders_insert on orders for insert with check (public.is_member(tenant_id));
create policy orders_update on orders for update
  using (public.is_member(tenant_id)) with check (public.is_member(tenant_id));

-- Shifts: cash handlers open and close; nobody deletes.
alter table shifts enable row level security;
create policy shifts_read on shifts for select using (public.is_member(tenant_id));
create policy shifts_cash_insert on shifts for insert with check (public.has_role(tenant_id, '{owner,manager,cashier}'));
create policy shifts_cash_update on shifts for update
  using (public.has_role(tenant_id, '{owner,manager,cashier}'))
  with check (public.has_role(tenant_id, '{owner,manager,cashier}'));

-- Payments: cash handlers insert; append-only (corrections are new rows).
alter table payments enable row level security;
create policy payments_read on payments for select using (public.is_member(tenant_id));
create policy payments_cash_insert on payments for insert with check (public.has_role(tenant_id, '{owner,manager,cashier}'));

-- Invoices: read-only for members.
alter table invoices enable row level security;
create policy invoices_read on invoices for select using (public.is_member(tenant_id));

-- order_events: append-only. Members read and insert.
alter table order_events enable row level security;
create policy order_events_read on order_events for select using (public.is_member(tenant_id));
create policy order_events_insert on order_events for insert with check (public.is_member(tenant_id));
