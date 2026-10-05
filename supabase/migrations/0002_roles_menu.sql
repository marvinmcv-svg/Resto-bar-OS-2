-- 0002: bartender and kitchen roles, platform admins, and menu fields the back-office editor needs (ADR-011).

-- Bartenders take and fire drink orders like waiters; kitchen staff mark tickets ready on the
-- kitchen screen. Neither records payments nor edits the menu. Existing policies already give
-- them that: orders/order_events allow any member, payments and config require owner/manager(/cashier).
alter type member_role add value if not exists 'bartender';
alter type member_role add value if not exists 'kitchen';

-- Platform admins (Resto-bar OS staff) are not tenant members. The table is only
-- reachable with the service role; RLS is on with no policies, so client sessions see nothing.
create table platform_admins (
  user_id uuid primary key,
  created_at timestamptz not null default now()
);
alter table platform_admins enable row level security;

-- Menu editor fields. Removing an item from the menu sets deleted_at (soft delete).
alter table menu_items add column description text;
alter table menu_items add column image_url text;
alter table menu_items add column popular boolean not null default false;
