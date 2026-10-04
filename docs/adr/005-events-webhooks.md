# ADR-005: Event model and webhooks

- Status: Proposed
- Decision: `order_events` is append-only (`id uuid`, `tenant_id`, `location_id`, `device_id`, `seq`, `type`, `payload jsonb`, `occurred_at`, `received_at`). Domain events (`order.opened`, `item.added`, `item.voided`, `check.paid`, `shift.closed`, `invoice.issued`) fan out to `webhook_deliveries` with HMAC-SHA256 signatures, at-least-once delivery, and exponential retry (1m → 24h). n8n consumes these (daily close report).
