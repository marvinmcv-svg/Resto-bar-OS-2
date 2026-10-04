# ADR-002: Offline sync strategy

- Status: Proposed. **Must be validated by a spike with scripted network kills before Phase 1 work.**
- Context: A busy service night with no internet must not stop orders, tickets, or payments.
- Decision (default): a **custom outbox over Supabase**. The device writes `order_events` (client-generated UUIDv7 + device sequence number) to IndexedDB, then pushes the batch to `/api/sync` (idempotent on event id). It pulls changes by cursor. The server is the source of truth for menu and config; the device is the source of truth for events it created. Conflicts on mutable rows: last-writer-wins by server time, except for money (append-only, never overwritten).
- Alternative to evaluate in the spike: a managed sync layer (e.g. PowerSync/ElectricSQL) `[VERIFY: fit, cost, offline guarantees]`.
- Acceptance: 30 minutes offline, 200 events across 2 devices, reconnect → zero loss, zero duplicates, < 2 minutes to converge.
