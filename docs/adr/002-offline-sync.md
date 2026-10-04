# ADR-002: Offline sync strategy

- Status: **Deferred to Jan 2027** (2026-10-04)
- Context: A full offline mode (local DB + outbox + conflict handling) can't be built and proven in time for the Oct-Dec launches. Shipping it half-done is worse than not shipping it.
- Decision for 2026: **online-first**. Reliability comes from operations: router failover to a hotspot/4G modem, plus a printable paper order pad. We don't promise offline mode in sales material.
- Kept for later: all device-created rows use client-generated UUIDs, and `order_events` is append-only with `(device_id, seq)` unique, so the outbox design below drops in without migrations.
- Jan 2027 design (to validate by spike): device writes events to IndexedDB, pushes batches to `/api/sync` (idempotent on event id), pulls by cursor. Compare against a managed sync layer `[VERIFY]`.
- Acceptance before announcing: 30 minutes offline, 2 devices, 200 events → zero loss, zero duplicates, converged in < 2 minutes.
