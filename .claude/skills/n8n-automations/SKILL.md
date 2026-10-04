---
name: n8n-automations
description: n8n workflows fed by Resto-bar OS webhooks (WhatsApp daily close, alerts, accountant export, sales scoreboard).
---
# n8n automations
- Events and webhooks: ADR-005 (HMAC-signed, at-least-once). Verify signatures and dedupe by event id in n8n.
- Flagship flow: `shift.closed` → build the close report (sales, payment mix, voids, top items) → WhatsApp to the owner within 10 minutes.
- Version workflow JSON exports in `automations/n8n/`. Never include credentials.
