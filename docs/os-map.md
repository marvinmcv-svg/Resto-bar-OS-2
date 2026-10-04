# Resto-bar OS: System Map

> Source of truth for **what we build and when**. Strategy context: `docs/HANDOFF.md`, `docs/business/offer.md`.

## 1. Big picture

```
┌──────────────────────────── LOCATION (restaurant) ────────────────────────────┐
│  POS PWA (tablet/PC)          KDS PWA (kitchen screen)     Print bridge       │
│  - local DB (offline)         - local DB                   - ESC/POS 80mm     │
│  - outbox → sync              - order events               - cash drawer      │
└──────────────┬───────────────────────────┬───────────────────────┬────────────┘
               │ sync (events)             │                       │ LAN
┌──────────────▼───────────────────────────▼───────────────────────▼────────────┐
│ CLOUD: Next.js 15 (back office + API) · Supabase (Postgres+RLS, Auth, Realtime)│
│  Core · Money · People · Back office · Growth · Platform (events/webhooks)     │
│                     │ country-module interface                                  │
│            ┌────────▼────────┐                                                 │
│            │ Compliance: BO  │──► Authorized SIN invoicing provider (v1)        │
│            │ (SIN adapter)   │──► In-house SIN (homologated, 2027)              │
│            └─────────────────┘                                                 │
│  Events ──► webhooks ──► n8n (WhatsApp daily close, alerts, accountant export) │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## 2. Modules × releases

| Module | **Wedge v1** (live wk 4-6) | **v1.x** (wk 7-12) | **2027** |
|---|---|---|---|
| Core POS | menu, categories, modifiers, tables/floor plan, orders, split/merge checks, tips, shift open/close | discounts, combos, happy-hour price lists, transfer table | multi-location, menu sync across locations |
| Kitchen | tickets printed per station (kitchen/bar) | KDS screen with bump/recall | prep-time analytics |
| Compliance (BO) | SIN invoice via authorized provider; queue + retry when offline; cancellation | IVA Transparente (Law 1733) format `[VERIFY]` | in-house homologated SIN module; 2nd country |
| Money | record payment by method: cash, QR, card (external terminal), transfer; cash count at close | QR payment reconciliation | payment adapters; optional take-rate |
| Owner intelligence | **WhatsApp daily close report** | weekly summary; real-time alerts (void > X, cash discrepancy) | AI margin and reorder suggestions |
| Back office | — | inventory of key items; recipes and cost for top 20 dishes; low-stock alert | purchasing, suppliers, supplier invoices |
| Growth | — | QR digital menu | QR ordering, delivery-app integration, loyalty |
| People | users with PIN, roles (owner/manager/cashier/waiter), audit log | — | scheduling, tip distribution |
| Platform | append-only order events; signed webhooks; n8n workflows | n8n templates published; accountant export | public REST API v1, self-serve keys |
| Support | remote device health (sync status, last seen, printer status) | remote log upload | in-app help |

## 3. Wedge v1 acceptance criteria (definition of "sellable")
1. A waiter can open a table, add items with modifiers, send to kitchen, and the ticket prints at the right station in < 3 s on LAN.
2. With the internet cut for 30 minutes, orders, tickets, and payments continue. Everything syncs within 2 minutes of reconnecting, with no duplicates or losses (scripted test).
3. Checks can be split by item and by equal parts. Tips recorded per payment.
4. A SIN invoice is issued for a paid check through the provider adapter. If offline, it's queued and issued on reconnect according to SIN contingency rules `[VERIFY]`.
5. Shift close shows expected vs counted cash per payment method.
6. The owner receives the daily close on WhatsApp within 10 minutes of closing the shift.
7. **3 design partners each run 2 full consecutive weeks** without going back to paper. (The handoff asks for 4 weeks; the deadline forces 2. Partners still run alongside paying clients.)

## 4. Data model (v1 tables)
`tenants, locations, users, memberships(role), devices, menu_categories, menu_items, modifier_groups, modifiers, menu_item_modifier_groups, tables, orders, order_items, order_events, checks, payments, shifts, cash_movements, invoices, invoice_events, webhook_endpoints, webhook_deliveries, audit_log`

Rules (from the handoff): `tenant_id` on every row + RLS, `location_id` where relevant, money in integer minor units (centavos), currency per location (BOB), soft delete only, append-only `order_events`, client-generated UUIDs (needed for offline).

## 5. Supported hardware kit (launch)
Keep the list short so support stays possible:
- **Tablet:** 1 recommended Android 10"+ model (pick in week 2 after testing) `[VERIFY local availability/price in Santa Cruz]`.
- **Printer:** 80mm thermal ESC/POS with Ethernet/WiFi (Epson TM-T20 class or a local equivalent) `[VERIFY]`.
- **Router:** the client's existing one. Printers get a static IP.
- Anything else: "it may work, but it's not supported yet".

## 6. Build order (critical path)
1. Repo scaffold + schema + RLS (wk 1)
2. Offline spike: local DB + outbox sync + network-kill test (wk 1-2) ← **reliability risk**
3. POS order flow + print bridge (wk 2-3)
4. SIN provider adapter (wk 3-4) ← **compliance risk; provider selected in wk 1**
5. Shift close + reports + WhatsApp n8n flow (wk 4-5)
6. Device health/support view (wk 5)
7. KDS, QR menu, inventory (wk 7-12)
