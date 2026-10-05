# ADR-011: Platform admin, bartender and kitchen roles

- Status: Proposed (2026-10-05)
- Context: We need (1) a back office for Resto-bar OS itself (Marvin) to see and onboard client restaurants, (2) a bartender role: bars are our core client, and bartenders fire drink orders without handling the till, and (3) a kitchen role for the kitchen screen.
- Decision:
  - **Bartender** is a new `member_role`. Bartenders open and update orders like waiters, see the bar station on the kitchen screen, and never record payments or edit the menu. No new policies are needed: orders and `order_events` already allow any member; payments and config already require owner/manager(/cashier). `tests/rls` proves it.
  - **Kitchen** is a new `member_role` for the kitchen screen: it updates orders (marks lines started/ready) and nothing else.
  - **Platform admin** is not a tenant role. Membership roles are per restaurant; a platform admin spans all of them. It lives in `platform_admins (user_id)`, which has RLS enabled and **no policies**, so only server code using the service role can read it. Platform-admin screens call server routes that check the table, then use the service role. A client session can never see or grant platform admin.
  - The UI permission matrix lives in `src/modules/pos/permissions.ts`. It mirrors the RLS matrix; the database stays the source of truth.
  - Menu items gain `description`, `image_url`, `popular`. Removing an item sets `deleted_at` (soft delete), so past orders keep their references.
- Consequences: the demo uses a staff entry with role `admin` (PIN login). Real auth (build step 2) maps that to a `platform_admins` row.
