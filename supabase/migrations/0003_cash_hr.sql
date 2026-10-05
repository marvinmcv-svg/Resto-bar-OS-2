-- 0003: cash register (movements, shift close) and daily HR (staff, profiles, time, schedule, tips). ADR-012.

-- Composite targets so child rows can't point at another tenant's shift or staff member.
alter table shifts add constraint shifts_tenant_id_key unique (tenant_id, id);
alter table shifts add column closed_by uuid;
alter table shifts add column expected_cash_minor bigint;
alter table shifts add column count_breakdown jsonb; -- {"20000": 2, "50": 3}: denomination in centavos -> count

alter table payments add column shift_id uuid;
alter table payments add constraint payments_shift_fk foreign key (tenant_id, shift_id) references shifts(tenant_id, id);

-- Staff identify on paired devices with a PIN (ADR-010). PINs are stored hashed, never in clear.
create table staff (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id),
  location_id uuid not null,
  name text not null,
  role member_role not null,
  pin_hash text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  deleted_at timestamptz,
  foreign key (tenant_id, location_id) references locations(tenant_id, id),
  unique (tenant_id, id)
);

-- Personal and pay data. Owner only (ADR-012).
create type pay_type as enum ('monthly', 'hourly', 'per_shift');
create table staff_profiles (
  staff_id uuid primary key,
  tenant_id uuid not null references tenants(id),
  location_id uuid not null,
  national_id text,          -- CI
  phone text,
  emergency_contact text,
  started_on date,
  pay_type pay_type,
  pay_rate_minor bigint,     -- per month, hour or shift depending on pay_type
  created_at timestamptz not null default now(),
  foreign key (tenant_id, location_id) references locations(tenant_id, id),
  foreign key (tenant_id, staff_id) references staff(tenant_id, id)
);

-- Cash put into or taken out of the drawer. Append-only: a correction is an opposite movement.
create type cash_movement_kind as enum ('in', 'out');
create table cash_movements (
  id uuid primary key,
  tenant_id uuid not null references tenants(id),
  location_id uuid not null,
  shift_id uuid not null,
  kind cash_movement_kind not null,
  amount_minor bigint not null check (amount_minor > 0),
  reason text not null,
  note text,
  created_by uuid not null,
  approved_by uuid,
  created_at timestamptz not null default now(),
  foreign key (tenant_id, location_id) references locations(tenant_id, id),
  foreign key (tenant_id, shift_id) references shifts(tenant_id, id)
);

-- Clock in/out. Staff close their own open entry; managers correct with their name on it.
create table time_entries (
  id uuid primary key,
  tenant_id uuid not null references tenants(id),
  location_id uuid not null,
  staff_id uuid not null,
  in_at timestamptz not null,
  out_at timestamptz,
  edited_by uuid,
  created_at timestamptz not null default now(),
  foreign key (tenant_id, location_id) references locations(tenant_id, id),
  foreign key (tenant_id, staff_id) references staff(tenant_id, id)
);

create table schedule_shifts (
  id uuid primary key,
  tenant_id uuid not null references tenants(id),
  location_id uuid not null,
  staff_id uuid not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null check (ends_at > starts_at),
  created_at timestamptz not null default now(),
  deleted_at timestamptz,
  foreign key (tenant_id, location_id) references locations(tenant_id, id),
  foreign key (tenant_id, staff_id) references staff(tenant_id, id)
);

create table tip_distributions (
  id uuid primary key,
  tenant_id uuid not null references tenants(id),
  location_id uuid not null,
  shift_id uuid not null,
  staff_id uuid not null,
  amount_minor bigint not null check (amount_minor >= 0),
  method text not null, -- 'equal' | 'hours'
  paid_at timestamptz,
  created_by uuid not null,
  created_at timestamptz not null default now(),
  foreign key (tenant_id, location_id) references locations(tenant_id, id),
  foreign key (tenant_id, shift_id) references shifts(tenant_id, id),
  foreign key (tenant_id, staff_id) references staff(tenant_id, id)
);

-- Policies --------------------------------------------------------------------

alter table staff enable row level security;
create policy staff_read on staff for select using (public.is_member(tenant_id));
create policy staff_mgr_insert on staff for insert with check (public.has_role(tenant_id, '{owner,manager}'));
create policy staff_mgr_update on staff for update
  using (public.has_role(tenant_id, '{owner,manager}')) with check (public.has_role(tenant_id, '{owner,manager}'));

alter table staff_profiles enable row level security;
create policy staff_profiles_owner_all on staff_profiles for all
  using (public.has_role(tenant_id, '{owner}')) with check (public.has_role(tenant_id, '{owner}'));

alter table cash_movements enable row level security;
create policy cash_movements_read on cash_movements for select using (public.is_member(tenant_id));
create policy cash_movements_cash_insert on cash_movements for insert
  with check (public.has_role(tenant_id, '{owner,manager,cashier}'));

alter table time_entries enable row level security;
create policy time_entries_read on time_entries for select using (public.is_member(tenant_id));
create policy time_entries_insert on time_entries for insert with check (public.is_member(tenant_id));
-- Staff never update rows directly: clocking out goes through clock_out(), which only stamps out_at.
-- (UPDATE policies OR their checks, so a broad member policy would also let unsigned edits through.)
create policy time_entries_mgr_correct on time_entries for update
  using (public.has_role(tenant_id, '{owner,manager}'))
  with check (public.has_role(tenant_id, '{owner,manager}') and edited_by is not null);

alter table schedule_shifts enable row level security;
create policy schedule_read on schedule_shifts for select using (public.is_member(tenant_id));
create policy schedule_mgr_insert on schedule_shifts for insert with check (public.has_role(tenant_id, '{owner,manager}'));
create policy schedule_mgr_update on schedule_shifts for update
  using (public.has_role(tenant_id, '{owner,manager}')) with check (public.has_role(tenant_id, '{owner,manager}'));

alter table tip_distributions enable row level security;
create policy tips_read on tip_distributions for select using (public.is_member(tenant_id));
create policy tips_mgr_insert on tip_distributions for insert with check (public.has_role(tenant_id, '{owner,manager}'));
create policy tips_mgr_update on tip_distributions for update
  using (public.has_role(tenant_id, '{owner,manager}')) with check (public.has_role(tenant_id, '{owner,manager}'));

create or replace function public.clock_out(entry uuid) returns boolean
language sql volatile security definer set search_path = public as $$
  with done as (
    update time_entries set out_at = now()
    where id = entry and out_at is null and public.is_member(tenant_id)
    returning 1
  )
  select exists (select 1 from done);
$$;
