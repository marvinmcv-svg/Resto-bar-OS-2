---
name: pos
description: Work on the POS order flow (tables, orders, modifiers, split checks, tips, shift close). Use for any change under the POS UI or order domain.
---
# POS domain
- Scope and acceptance criteria: `docs/os-map.md` §2-3 (Core POS, Kitchen, Money rows).
- Every user action becomes an `order_events` row (type, payload, device_id, seq). Derived tables (`orders`, `payments`) are projections.
- Money in centavos. Split checks: by item and by equal parts. Rounding remainders go to the last part.
- Must work offline (see the `offline-sync` skill). Never block the waiter on a network call.
- Tablet-first UI: big targets (≥ 48px), one-hand use, Spanish copy.
