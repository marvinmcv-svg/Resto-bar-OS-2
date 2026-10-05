# Resto-bar OS: System Map

> Source of truth for **what we build and when**. Strategy context: `docs/HANDOFF.md`, `docs/business/offer.md`.
> Revised 2026-10-04: online-first v1, native Android cashier app for printing, offline mode moved to Jan 2027.
> Revised 2026-10-05 after the Toast study (`docs/research/toast.md`): bartender + kitchen roles and a platform admin (ADR-011); kitchen screen, upsell suggestions, shift note, guest notes and waitlist built in the demo (UI on the demo store; they go live with the Supabase wiring). Printed tickets stay the opening-day path.

## 1. Big picture

```
┌──────────────────────────── LOCATION (restaurant) ─────────────────────────────┐
│  Waiters' phones (web app)      Cashier "hub" (Android app, Capacitor)          │
│  - take orders with staff PIN   - payments, shift close                         │
│        │                        - receives orders in real time and prints ──┐   │
│        │                                                     ESC/POS TCP 9100│   │
│        │                                         Kitchen/bar printers ◄──────┘   │
│        │      Internet: main line + hotspot/4G failover                          │
└────────┼───────────────────────────────┬─────────────────────────────────────────┘
         │ HTTPS + Realtime              │
┌────────▼───────────────────────────────▼─────────────────────────────────────────┐
│ CLOUD: Next.js 15 (back office + API) · Supabase (Postgres+RLS, Auth, Realtime)   │
│  Core · Money · People · Back office · Growth · Platform (events/webhooks)        │
│                     │ country-module interface                                    │
│            ┌────────▼────────┐                                                    │
│            │ Compliance: BO  │──► Authorized SIN invoicing provider (v1)          │
│            │ (server worker) │──► In-house SIN (homologated, 2027)                │
│            └─────────────────┘                                                    │
│  Events ──► webhooks ──► n8n (WhatsApp daily close, alerts, accountant export)    │
└───────────────────────────────────────────────────────────────────────────────────┘
```

## 2. Modules × releases

| Module | **Opening-day kit** (partner #1) | **Wedge v1** (sellable, ~Nov 2) | **v1.x** (Nov-Dec) | **2027** |
|---|---|---|---|---|
| Core POS | menu, modifiers, tables, orders from phones, shift close | split/merge checks, tips | discounts, combos, happy hour | multi-location |
| Kitchen | tickets printed per station (kitchen/bar) | reprint, print-failure alerts | KDS screen | prep analytics |
| Money | **cash register** (`/caja`): open with a count, bills queue, cash in/out with manager approval, close with expected vs counted; record cash/QR/card/transfer | — | QR reconciliation | payment adapters, take-rate |
| People | staff PINs, roles (owner/manager/cashier/waiter/bartender/kitchen), audit log, **clock in/out** | — | **schedules, attendance, tip split, accountant hours export** (built in demo, ADR-012) | payroll stays with the accountant |
| Owner intelligence | — | **WhatsApp daily close** | weekly summary; alerts (void > X, cash gap) | AI margin/reorder |
| Compliance (BO) | invoices in SIN's free tool (manual) | SIN invoice via provider adapter | IVA Transparente `[VERIFY]` | in-house homologation |
| Reliability | hotspot failover + printable paper order pad | device health view | offline spike passes | **offline mode (Jan)** |
| Back office | — | — | basic inventory + top-20 recipe cost | purchasing, suppliers |
| Growth | — | — | QR menu | QR ordering, delivery apps, loyalty |
| Platform | append-only events | signed webhooks → n8n | n8n templates, accountant export | public REST API v1 |

## 3. Acceptance criteria

**Opening-day kit (partner #1):**
1. A waiter opens a table on their own phone, adds items with modifiers, sends them; the ticket prints at the right station in < 3 s.
2. The cashier records payments by method and closes the shift with expected vs counted cash.
3. A waiter cannot delete payments, change prices, or void without a manager PIN (enforced in the database, `tests/rls`).
4. With the main internet unplugged, the router fails over to the hotspot and service continues (tested on site).
5. A full rehearsal dinner (≥ 30 orders) runs without help from us before opening day.

**Wedge v1 (sellable):** all of the above, plus
6. Checks split by item and by equal parts; tips recorded per payment.
7. A SIN invoice is issued for a paid check through the provider adapter, idempotently (retries never create duplicate invoices).
8. The owner receives the daily close on WhatsApp within 10 minutes of closing the shift.
9. **3 design partners each run 2 full consecutive weeks** without going back to paper.

## 4. Data model (v1 tables)
`tenants, locations, memberships(role), devices, staff (PIN), staff_profiles, menu_categories, menu_items, modifier_groups, modifiers, dining_tables, orders, order_items, order_events, payments, shifts, cash_movements, time_entries, schedule_shifts, tip_distributions, invoices, invoice_events, webhook_endpoints, webhook_deliveries, audit_log`

Rules: `tenant_id` + RLS on every row; `(tenant_id, location_id)` foreign keys so a row can't point at another tenant's location; money in integer centavos; currency per location (BOB); soft delete only; payments, invoices, orders and `order_events` are never deleted; client-generated UUIDs (ready for offline in 2027). Role permissions: ADR-010.

## 5. Supported hardware (launch)
- **Cashier hub:** 1 Android tablet or phone (Android 10+) running our app `[VERIFY recommended model + price in Santa Cruz]`.
- **Printer:** 80mm thermal ESC/POS with Ethernet/WiFi (Epson TM-T20 class or a local equivalent) `[VERIFY]`. Static IP.
- **Waiters:** any phone with a modern browser.
- **Internet:** existing line + failover to the owner's hotspot or a prepaid 4G modem.
- Anything else: "it may work, but it's not supported yet".

## 6. Build order (critical path)
1. Repo scaffold + schema + RLS + roles (**done**, week 1)
2. Auth: owner login, device login, staff PINs (ADR-010) (week 1-2)
3. Menu/tables admin + waiter order flow + realtime to the hub (week 2)
4. Capacitor cashier app + ESC/POS printing (week 2-3) ← **printing risk: test with the real printer early**
5. Payments + shift close + audit log (week 3) → **opening-day kit**
6. SIN provider adapter (week 3-4) ← **compliance risk; provider selected by Oct 11**
7. Split checks, tips, WhatsApp n8n flow, device health (week 4-5) → **wedge v1**
8. KDS, QR menu, inventory, offline spike (week 7-12)

## 7. Gap analysis (2026-10-05)
Everything in the app today runs on the browser demo store (`src/modules/pos/store.tsx`). The database schema and RLS exist and are tested, but nothing is wired to Supabase yet.

| Area | Built (demo) | Missing | When |
|---|---|---|---|
| Orders / tables / kitchen | Floor plan, orders, modifiers, send, void with PIN, kitchen screen, upsell, waitlist, guest notes | Transfer/merge tables, course firing, discounts | v1.x |
| Cash register | `/caja`: open, bills queue, cash in/out, count and close, shift report | Printed close ticket (ESC/POS) | With printing |
| HR | Files (owner-only pay), clock in/out, schedules, attendance, tip split, CSV for the accountant | Payroll (accountant), leave requests | 2027 |
| Owner | Dashboard, shift note, last close on the dashboard | Date-range reports, real WhatsApp send | Wedge v1 |
| **Going live (opening-day blocker)** | Schema + RLS (0001-0003) | Supabase project + auth (owner OTP, device pairing, server PIN check), replace the demo store with Supabase + Realtime, ESC/POS printing (Capacitor), SIN provider adapter, n8n WhatsApp | **Next** |
| Back office | — | Inventory, recipe cost, suppliers | Dec 2026 |
| Hotel | — | Rooms, reservations, charge to room | 2027 (out of scope; keep `tenant/location` model ready) |
