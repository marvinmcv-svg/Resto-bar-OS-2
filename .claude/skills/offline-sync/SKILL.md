---
name: offline-sync
description: Offline-first storage and sync between POS devices and Supabase. Use when touching IndexedDB, the outbox, or /api/sync.
---
# Offline sync
- Strategy: ADR-002 (custom outbox, pending spike validation).
- Device: write the event locally first, then push in batches. Server inserts are idempotent on event `id` and unique on `(device_id, seq)`.
- Acceptance test: 30 minutes offline, 2 devices, 200 events → zero loss, zero duplicates, converged in < 2 minutes.
- Show sync state in the UI at all times (green/amber/red).
