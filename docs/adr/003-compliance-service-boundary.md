# ADR-003: Compliance service boundary

- Status: Proposed
- Decision: Compliance runs as a **server-side job/worker** (not in the POS client). The POS emits `check.paid`, and the worker creates an `invoices` row (status `pending`) and calls the active `ComplianceProvider` (ADR-008). Statuses: `pending → issued | contingency → issued | failed`, plus `cancel_requested → cancelled`. Credentials/certificates live in server secrets only and never reach devices.
- v1 host: Supabase Edge Function or a small Railway/Vercel cron worker with retry and backoff. Once in-house SIN signing (with certificates) arrives in 2027, move it to a dedicated service.
- If the provider is unreachable: the hub prints a pre-ticket immediately, and the invoice stays `pending` and is retried. SIN contingency rules `[VERIFY in sin-spec-notes]` decide how long we may wait.
