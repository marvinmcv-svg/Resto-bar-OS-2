-- 0004: inventory (suppliers, ingredients, recipes, stock ledger), guests, reservations, campaigns. ADR-013.

create table suppliers (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id),
  location_id uuid not null,
  name text not null,
  phone text,
  created_at timestamptz not null default now(),
  deleted_at timestamptz,
  foreign key (tenant_id, location_id) references locations(tenant_id, id),
  unique (tenant_id, id)
);

-- Quantities are integer thousandths of the unit (g for kg, ml for l). Money in centavos.
create table ingredients (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id),
  location_id uuid not null,
  name text not null,
  category text not null,
  unit text not null check (unit in ('kg', 'l', 'u')),
  par_milli bigint not null default 0 check (par_milli >= 0),
  unit_cost_minor bigint not null default 0 check (unit_cost_minor >= 0),
  supplier_id uuid,
  created_at timestamptz not null default now(),
  deleted_at timestamptz,
  foreign key (tenant_id, location_id) references locations(tenant_id, id),
  foreign key (tenant_id, supplier_id) references suppliers(tenant_id, id),
  unique (tenant_id, id)
);

alter table menu_items add constraint menu_items_tenant_id_key unique (tenant_id, id);

create table recipe_items (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id),
  location_id uuid not null,
  menu_item_id uuid not null,
  ingredient_id uuid not null,
  qty_milli bigint not null check (qty_milli > 0),
  created_at timestamptz not null default now(),
  foreign key (tenant_id, location_id) references locations(tenant_id, id),
  foreign key (tenant_id, menu_item_id) references menu_items(tenant_id, id),
  foreign key (tenant_id, ingredient_id) references ingredients(tenant_id, id),
  unique (menu_item_id, ingredient_id)
);

-- Append-only stock ledger. Stock on hand = sum(delta_milli) per ingredient (view below).
-- 'sale' rows are written by the server when lines are fired; staff never write them.
create type stock_movement_kind as enum ('receive', 'sale', 'waste', 'count');
create table stock_movements (
  id uuid primary key,
  tenant_id uuid not null references tenants(id),
  location_id uuid not null,
  ingredient_id uuid not null,
  kind stock_movement_kind not null,
  delta_milli bigint not null,
  cost_minor bigint,
  reason text,
  order_id uuid,
  created_by uuid not null,
  created_at timestamptz not null default now(),
  foreign key (tenant_id, location_id) references locations(tenant_id, id),
  foreign key (tenant_id, ingredient_id) references ingredients(tenant_id, id),
  check (kind <> 'waste' or delta_milli < 0),
  check (kind <> 'receive' or delta_milli > 0)
);

create view ingredient_stock with (security_invoker = true) as
  select tenant_id, ingredient_id, sum(delta_milli)::bigint as stock_milli
  from stock_movements group by tenant_id, ingredient_id;

-- Guests: personal data (name, phone, birthday). Marketing only with opt_in.
create table guests (
  id uuid primary key,
  tenant_id uuid not null references tenants(id),
  location_id uuid not null,
  name text not null,
  phone text,
  birthday text check (birthday is null or birthday ~ '^(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$'),
  tags text[] not null default '{}',
  notes text,
  opt_in boolean not null default false,
  created_at timestamptz not null default now(),
  deleted_at timestamptz,
  foreign key (tenant_id, location_id) references locations(tenant_id, id),
  unique (tenant_id, id)
);

create type reservation_status as enum ('confirmada', 'sentada', 'no-show', 'cancelada');
create table reservations (
  id uuid primary key,
  tenant_id uuid not null references tenants(id),
  location_id uuid not null,
  guest_id uuid,
  name text not null,
  phone text,
  party int not null check (party between 1 and 100),
  starts_at timestamptz not null,
  duration_min int not null default 120 check (duration_min between 15 and 600),
  table_id uuid references dining_tables(id),
  status reservation_status not null default 'confirmada',
  notes text,
  created_by uuid not null,
  created_at timestamptz not null default now(),
  foreign key (tenant_id, location_id) references locations(tenant_id, id),
  foreign key (tenant_id, guest_id) references guests(tenant_id, id)
);

create table campaigns (
  id uuid primary key,
  tenant_id uuid not null references tenants(id),
  location_id uuid not null,
  segment text not null,
  message text not null,
  recipients int not null default 0,
  created_by uuid not null,
  created_at timestamptz not null default now(),
  foreign key (tenant_id, location_id) references locations(tenant_id, id)
);

-- Policies --------------------------------------------------------------------

-- Inventory configuration and recipes: owner/manager write, members read.
do $$
declare t text;
begin
  foreach t in array array['suppliers','ingredients','recipe_items','campaigns'] loop
    execute format('alter table %I enable row level security', t);
    execute format('create policy %I on %I for select using (public.is_member(tenant_id))', t || '_read', t);
    execute format('create policy %I on %I for insert with check (public.has_role(tenant_id, ''{owner,manager}''))', t || '_mgr_insert', t);
    execute format('create policy %I on %I for update using (public.has_role(tenant_id, ''{owner,manager}'')) with check (public.has_role(tenant_id, ''{owner,manager}''))', t || '_mgr_update', t);
  end loop;
end $$;

alter table stock_movements enable row level security;
create policy stock_movements_read on stock_movements for select using (public.is_member(tenant_id));
-- Receiving and counts: owner/manager. Waste: also the kitchen and the bar. Sales: server only.
create policy stock_movements_mgr_insert on stock_movements for insert
  with check (kind in ('receive', 'count', 'waste') and public.has_role(tenant_id, '{owner,manager}'));
create policy stock_movements_waste_insert on stock_movements for insert
  with check (kind = 'waste' and public.has_role(tenant_id, '{kitchen,bartender}'));

alter table guests enable row level security;
create policy guests_read on guests for select using (public.is_member(tenant_id));
create policy guests_front_insert on guests for insert with check (public.has_role(tenant_id, '{owner,manager,cashier,waiter}'));
create policy guests_front_update on guests for update
  using (public.has_role(tenant_id, '{owner,manager,cashier,waiter}'))
  with check (public.has_role(tenant_id, '{owner,manager,cashier,waiter}'));

alter table reservations enable row level security;
create policy reservations_read on reservations for select using (public.is_member(tenant_id));
create policy reservations_front_insert on reservations for insert with check (public.has_role(tenant_id, '{owner,manager,cashier,waiter}'));
create policy reservations_front_update on reservations for update
  using (public.has_role(tenant_id, '{owner,manager,cashier,waiter}'))
  with check (public.has_role(tenant_id, '{owner,manager,cashier,waiter}'));
