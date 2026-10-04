---
name: pos
description: Work on the POS order flow (tables, orders, modifiers, split checks, tips, shift close). Use for any change under the POS UI or order domain.
---
# POS domain
- Scope and acceptance criteria: `docs/os-map.md` §2-3 (Core POS, Kitchen, Money rows).
- Every user action becomes an `order_events` row (type, payload, device_id, seq). Derived tables (`orders`, `payments`) are projections.
- Money in centavos. Split checks: by item and by equal parts. Rounding remainders go to the last part.
- Online-first in 2026 (ADR-002). Waiters use the web app on their phones; the cashier hub is the Capacitor app (ADR-001).
- Staff act through PINs on paired devices; permissions follow ADR-010 and are enforced by RLS.
- Tablet-first UI: big targets (≥ 48px), one-hand use, Spanish copy.
