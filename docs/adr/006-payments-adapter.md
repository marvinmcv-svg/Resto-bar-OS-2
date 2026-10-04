# ADR-006: Payments adapter

- Status: Proposed
- Decision (v1): **record-only** payments: `method ∈ {cash, qr, card_external, transfer, other}`, amount, tip, reference. No processing. The interface `PaymentAdapter { authorize, capture, refund, reconcile }` is defined now so we can add Bolivian QR/card rails in 2027 without changing the core `[VERIFY rails in research]`.
