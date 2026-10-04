---
name: compliance-sin
description: Bolivian SIN invoicing through the ComplianceProvider interface. Use when touching invoices, the BO adapter, or tax logic.
---
# Compliance (Bolivia / SIN)
- Interface: `src/modules/compliance/types.ts` (ADR-008). Lifecycle and boundary: ADR-003.
- v1 uses an authorized third-party provider. Selection is pending in `docs/sin-spec-notes.md`. Use `FakeComplianceProvider` until then.
- Invoices are issued server-side only. Certificates and credentials never reach devices.
- Idempotency key = our `invoices.id`. Retries must never create duplicate fiscal documents.
- Do not implement contingency or IVA Transparente rules until they are verified in `docs/sin-spec-notes.md`.
