# ADR-010: Authentication, devices and roles

- Status: Proposed (2026-10-04)
- Context: Tablets can't run on the owner's account, and waiters shouldn't each need an email login. Theft control requires that waiters can't delete or edit money records.
- Decision:
  - **Owners/managers** log in with Supabase Auth (email or phone OTP).
  - **Devices** (cashier hub, waiter phones) are paired by an owner/manager with a one-time code. Each device gets its own auth user with membership role `device`, bound to one location (`devices.auth_user_id`).
  - **Staff** identify on a paired device with a 4-6 digit **PIN** (hashed, stored server-side). PIN checks and role checks for staff actions happen in server code; every action is written to `order_events` / `audit_log` with the staff id.
  - **Database rules (RLS):** members read their tenant. Config is written by owner/manager. Orders: any member inserts/updates; nobody deletes. Payments: owner/manager/cashier insert; nobody updates or deletes (corrections are new rows). Invoices: written only by the server worker. `order_events`: insert-only.
  - All operational rows use `(tenant_id, location_id)` foreign keys so a row can never point at another tenant's location.
- Tests: `tests/rls/rls.test.ts` covers isolation, cross-tenant references, and the role matrix.
- Open: restricting a `device` membership to its own location in RLS (today it's enforced in server code).
