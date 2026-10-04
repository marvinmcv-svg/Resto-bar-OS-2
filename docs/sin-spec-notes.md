# SIN (Bolivia) Compliance Notes

Status: **research task list**. Nothing here is verified yet. Every item must be checked against primary sources (impuestos.gob.bo, SIN technical docs, the provider's docs) before it drives design.

## 1. Strategy decision (Oct 2026)
Use the **fastest legal path**: integrate with an already-authorized invoicing provider (a provider/system already approved by SIN for online computerized invoicing) behind our `ComplianceProvider` interface (ADR-008). Pursue our own homologation in parallel, for 2027, to remove the per-invoice cost and dependency.

## 2. Questions to answer in week 1

| # | Question | Why it matters | Answer | Source |
|---|---|---|---|---|
| 1 | Did SIN extend the Oct 1, 2026 deadline for groups 9-12 again? | Sales urgency message | | |
| 2 | Which authorized providers expose an **API** that a third-party POS can call? | Our v1 depends on it | | |
| 3 | Provider pricing: per invoice, per month, per NIT? | **Blocks pricing** (margin at bar volumes) | | |
| 4 | Is there a sandbox / test environment? | Week 3-4 build | | |
| 5 | Does each restaurant need its own contract with the provider, or can we be a reseller/integrator? | Onboarding friction and our margin | | |
| 6 | Who holds the digital certificate (ADSIB) — the restaurant, the provider, or us? | Security and onboarding steps | | |
| 7 | Offline/contingency rules: how long can invoices be issued offline, and how are they regularized (CAFC/event packages)? | Offline mode design | | |
| 8 | CUIS/CUFD lifecycle: who requests the daily code (CUFD) — the provider or us? | Daily job design | | |
| 9 | Cancellation (anulación) rules and time limits | POS void flow | | |
| 10 | Law 1733 "IVA Transparente": what changes in the invoice and when | v1.x feature, sales message | | |
| 11 | Required invoice delivery to the customer (printed, email, WhatsApp, QR)? Time limits? | Receipt design | | |
| 12 | Which "modality" applies to restaurants in groups 9-12 (online computerized vs electronic)? | Signing requirements | | |
| 13 | Homologation process for our own system: steps, cost, duration | 2027 plan | | |

## 3. Provider comparison template

| Provider | Authorized? | API (REST?) | Sandbox | Price model | Est. cost / location / month at 1,500 invoices | Reseller program | Notes |
|---|---|---|---|---|---|---|---|
| | | | | | | | |
| | | | | | | | |
| | | | | | | | |

**Decision rule:** choose the provider with an API + sandbox whose cost at 1,500 invoices/month is ≤ 20% of our price (≤ Bs 70). If none qualify, pass the provider's fee through to the client as a separate line, and say so openly in the offer.

## 4. What Marvin must supply / do in person
- Calls to 2-3 providers (sales + technical).
- Ask a partner accountant how their restaurant clients invoice today.
- Confirm the current deadline at a SIN office or through the official SIN channel if the website is unclear.
