# Restaurant OS: Agent Handoff

Date: 2026-10-04
Owner: Marvin (Santa Cruz de la Sierra, Bolivia)
Status: Research complete, nothing built. Your job: plan, then start dev.

---

## 0. How to use this document

1. Read sections 1-4 (context, findings, thesis, principles). Do not skip them; they define what NOT to build.
2. Section 9 lists decisions you must resolve as ADRs BEFORE writing feature code.
3. Section 10 is the phased plan with acceptance criteria. Start at Phase 0.
4. Section 11 lists what is UNVERIFIED. Do not treat those as facts. Surface them as research tasks.
5. Anything marked `[VERIFY]` must be checked against primary sources (SIN docs, vendor docs) before it drives a design decision.

---

## 1. Mission

Build an all-in-one restaurant operating system (POS, kitchen display, tables, inventory/recipe costing, invoicing, online/QR ordering, API) that beats incumbents on **openness, pricing transparency, support, and local compliance**, starting with **Bolivia (SIN e-invoicing)** and designed to repeat country by country.

"Take over the industry" is the long-term ambition. The realistic path is: win one country's compliance + payment rails, then expand to neighbors. Do not plan a head-on US fight with Toast.

---

## 2. Research findings (condensed)

Research covered the 10 platforms from a Google list: Toast, Square, Lightspeed, TouchBistro, Shift4 SkyTab, SpotOn, Restaurant365, NCR Aloha, Clover, Revel. Weakness evidence comes largely from review sites, BBB complaints, and competitor blogs (some are affiliates or rivals). Trust the **patterns**, not individual numbers.

### 2.1 Corrections to the source list
- Revel and SkyTab are the same company. Shift4 acquired Revel (June 2024, ~$245.3M net of cash) and said it would fold Revel's best capabilities into SkyTab. SkyTab may be rebranded "Shift4 Dine" `[VERIFY]`.
- Clover = Fiserv. Aloha = NCR Voyix.
- Toast "$69/mo" is stale: Toast's pricing page showed "as low as $79/month per terminal" (June 2026 review). Typical single-location bills: $150-$500/month software+add-ons, plus ~2.49%-2.99% + $0.15 processing.
- Revel's advertised ~$99/terminal requires a 3-year contract, Revel's own processing, and at least 2 terminals.

### 2.2 Core insight
These are payments companies wearing POS clothes.
- Toast Q2 2026: ARR $2.4B, ~180,000 locations, record 9,500 net new locations in the quarter. SaaS ARR $1.2B, Payments ARR $1.2B (50/50). Quarterly revenue was $1.91B, so ARR is evidently a gross-profit-style measure. Roughly ~$13K recurring profit per location per year (average across whole base).
- Shift4 bought Revel explicitly to capture its unmonetized payment volume.
- Common model: subsidized or proprietary hardware + captive payment processing + 2-3 year contracts.

### 2.3 Platform summary

| Platform | Why operators pick it | Where it hurts |
|---|---|---|
| Toast | Deepest restaurant-only feature set (KDS, tableside, multi-location); strong sales engine | Proprietary hardware, mandatory Toast Payments, 2-yr auto-renew, rate changes on 30 days' notice, early-termination fees reported from ~$495 + remaining value to $5-10K (sources conflict) |
| Square | Free tier, $49/$149 plans, fast setup | Weak tip/shift handling and restaurant-specific integrations (source is Toast-authored, biased), reported fund holds, support complaints |
| Lightspeed | $69-$399/location, complex/high-volume fit, reporting | One review site cites BBB F rating, 45 complaints/3 yrs (billing, cancellation) |
| TouchBistro | iPad tableside, quick staff training | Support is a top complaint, iPad-only, $600-900+/station |
| Shift4 SkyTab | Free hardware in exchange for processing; used by large chains | Flat ~2.75% + $0.15, SkyTab >40% of Shift4 merchants, hidden-contract complaints, ~$525 ETF cited |
| SpotOn | $55/station + 2.45% + $0.15 on Essentials | 2-yr minimum, mandatory in-house processing, billing mismatches, developer waited 26 days for an API key |
| Restaurant365 | Recipe-level food costing, centralized finance for multi-unit | Hard implementation, expensive for small restaurants, accounting-first |
| NCR Aloha | Largest POS software installed base, IDC Leader | SMB segment contested by Toast/Square, enterprise-sold |
| Clover | Hardware variety, app marketplace | Locked to Fiserv processing, add-on apps $29-$229+/mo, Trustpilot ~2.4/5 over 2,065 reviews |
| Revel | Chain/enterprise features | 3-yr contract, ETFs in BBB complaints ~$2,700-$28,000, being absorbed into SkyTab |

### 2.4 Why restaurants pick them anyway
1. One vendor for POS + KDS + payments + online ordering + payroll (avoids integration work).
2. Low upfront cost (subsidized hardware, $0 starter plans), cost moves into processing.
3. Field sales distribution (inference from business model, not measured).

### 2.5 Gaps that appear across 4+ platforms (our opening)

| Gap | Our answer |
|---|---|
| Lock-in (contracts, forced processor, proprietary hardware) | Month-to-month, processor-neutral, any-tablet |
| Fee opacity, mid-contract hikes | Published flat pricing, no termination fee |
| Support is top complaint (TouchBistro, Clover, Shift4, Toast) | Support as a product |
| Closed ecosystems | API + webhooks from day one |
| Back office split from POS | Recipe-level costing built in at SMB price |
| AI bolted on (Toast IQ is the incumbent's push, agentic AI planned for scheduling, payroll, inventory, accounting) | AI-native data model |

### 2.6 Tradeoff to respect
Processor-neutral and hardware-agnostic forfeit the subsidy that funds incumbents. We cannot give away hardware, and SaaS revenue must carry the business. Payments take-rate is an optional later layer, not the foundation.

---

## 3. Strategic thesis

- Wedge: **Bolivia SIN compliance.** Regulatory timing is live:
  - SIN e-invoicing (SFE) launched 2021, rolled out by taxpayer groups. Final wave = groups 9-12 (~27,973 taxpayers, SMEs) must use their assigned online invoicing modality from **1 Oct 2026**. `[VERIFY: another extension may exist; newest source ~20 days old]`
  - **Law 1733 of 2026 "IVA Transparente"** changes how 13% VAT is presented/calculated on invoices. SIN is releasing a new invoicing-system version; authorisation window **1 Oct - 16 Nov 2026**. `[VERIFY]`
- Regional competitor reference: Fudo (Buenos Aires, 2017, $25-$50/mo, 10,000+ businesses, $7.5M seed incl. a16z). Its listed countries do not include Bolivia. Parrot Software (Mexico focus) is another. Price floor in LatAm is roughly $25-$50/mo.
- Illustrative ceiling: 1,000 Bolivian restaurants x $40/mo = ~$480K/yr. This is arithmetic, NOT a market-size finding. Bolivian restaurant count is unknown (see section 11).
- Expansion thesis: compliance engine + local payment rails as a repeatable per-country module.

---

## 4. Product principles (non-negotiable)

1. **Month-to-month. Published pricing. No termination fees.**
2. **Hardware-agnostic.** Runs on iPad, Android tablets, Windows. BYO printers.
3. **Processor-neutral.** Payments are an adapter interface, never a hard dependency.
4. **API/webhook-first.** Every domain event emits a webhook. Public API ships with the product, not after. n8n is a first-class integration surface (Marvin runs an n8n automation business).
5. **Offline-first POS.** A restaurant must keep taking orders and printing tickets when internet drops. This is the hardest engineering problem and the biggest reliability risk.
6. **Compliance is a pluggable country module.** SIN is module #1; the core must not hardcode Bolivian tax logic.
7. **Recipe-level costing in the core**, not an add-on.
8. **Polished over MVP.** Marvin delivers fully polished products to protect client trust. Scope phases tightly instead of shipping rough features.

---

## 5. Constraints and locked stack

Locked (do not re-litigate):
- Next.js 15 (App Router), TypeScript, Supabase (Postgres, Auth, Realtime), Drizzle ORM, Tailwind CSS, Shadcn UI, Playwright, Vercel
- n8n for automations
- Marvin orchestrates dev through a "Hermes" multi-agent system using SKILL.md / CLAUDE.md conventions. Produce a `CLAUDE.md` and per-domain `SKILL.md` files as you go.

Known tension to resolve via ADR (section 9): Vercel/serverless is a poor home for long-lived device connections, printer bridges, and offline sync. The back office and admin fit the stack; the POS terminal client needs a different runtime strategy.

---

## 6. Architecture (proposed, validate via ADRs)

### 6.1 Layers / modules
- **Core:** menu, modifiers, orders, tables/floor plan, checks (split/merge), tips, KDS routing
- **Money:** payment adapter interface (cash, QR, card, transfer, per-country rails), cash drawer/shift close
- **Compliance:** per-country module; SIN first (invoice generation, signing, submission, daily code, cancellation, reporting)
- **Back office:** inventory, recipes, purchasing, supplier invoices, food cost, accounting export
- **People:** staff, roles/permissions, scheduling, tip distribution
- **Growth:** QR table ordering, online ordering, delivery-app integration, loyalty, CRM
- **Intelligence:** margin analysis, reorder suggestions, forecasting (later phase)
- **Platform:** event bus, webhooks, public REST API, n8n nodes/templates, multi-tenant admin

### 6.2 Suggested runtime split
- **Cloud (Next.js 15 + Supabase + Drizzle):** admin/back office, reporting, tenant management, API, webhooks. Multi-tenancy via Postgres RLS, tenant_id on every table.
- **POS/KDS client:** installable web app (PWA) or thin native shell with a **local database + sync**, so it works offline. Candidate sync approaches to evaluate: managed sync layer vs custom outbox/inbox over Supabase. `[VERIFY: compare options hands-on; none are verified in this research]`
- **Print bridge:** small local service for ESC/POS thermal printers and cash drawers.
- **Compliance service (SIN):** isolate as its own deployable service. Reasons: certificate handling, XML signing, daily code lifecycle, and offline contingency logic are separate concerns from the order flow.

### 6.3 SIN integration facts known so far (`[VERIFY]` all against SIN technical docs)
- Online invoicing requires a daily unique code (CUFD) that is valid for 24 hours.
- Electronic tax documents are XML, validated against SIN-provided XSD schemas, and electronically signed with digital certificates issued by ADSIB.
- Documents are sent to SIN, which returns receipt codes. Retention reportedly 10 years (XML). Customer delivery within 24 hours reportedly required.
- POS/ERP mass-invoicing integrations require a SIN-certified/homologated system. Certification process and timelines are UNKNOWN. This is a Phase 0 research task and potentially the critical path.
- Offline/contingency invoicing rules: UNKNOWN. Must be read from SIN spec before designing offline mode.

### 6.4 Core data model sketch (starting point, refine in Phase 0)
`tenants, locations, users, roles, devices, menu_categories, menu_items, modifier_groups, modifiers, price_lists, tables, floor_plans, orders, order_items, order_events, checks, payments, shifts, cash_movements, invoices (compliance), invoice_events, ingredients, recipes, recipe_lines, stock_movements, suppliers, purchase_orders, webhook_endpoints, webhook_deliveries, audit_log`

Design rules: append-only `order_events` (sync-friendly, audit-friendly), money as integer minor units, currency per location, every row carries `tenant_id` + `location_id` where relevant, soft-delete only.

---

## 7. Competitive intel to design against

- Square weak spots: tips/shifts, restaurant-specific integrations. Our Core must treat tips and split checks as first-class.
- SpotOn's slow API access: our developer experience (API keys self-serve, docs, sandbox) is a differentiator.
- Restaurant365's moat is recipe-level food costing for multi-unit. Match the depth at SMB price/complexity.
- TouchBistro/Clover/Shift4/Toast support complaints: define support SLAs and in-product diagnostics early (device health, sync status, remote log upload).
- Toast IQ signals incumbents are moving to agentic AI over scheduling, payroll, inventory, accounting. Our event model should make those datasets queryable from day one even if AI features ship later.

---

## 8. Risks (ranked)

1. **Support scale.** Solo founder, winning on the exact dimension incumbents fail at.
2. **Offline reliability.** Failure on a busy service night kills trust.
3. **SIN certification/homologation unknowns.** May gate launch.
4. **Hardware and printer diversity.** Mitigate with a short supported-hardware list at launch.
5. **No payments revenue.** Higher CAC and no subsidy. Pricing must cover costs from SaaS alone.
6. **Revel precedent.** Features alone do not protect an installed base.
7. **Regulatory churn.** SIN deadlines have been postponed repeatedly; specs for IVA Transparente are still being finalized.

---

## 9. Decisions to resolve first (write each as an ADR in `/docs/adr/`)

| ADR | Question | Notes |
|---|---|---|
| 001 | POS client runtime: PWA vs native shell (e.g., Capacitor/Tauri) | Need USB/network printer access, offline storage, kiosk mode |
| 002 | Offline sync strategy | Evaluate managed sync vs custom outbox over Supabase; prototype and test failure modes |
| 003 | SIN service boundary and hosting | Separate service; decide where it runs given certificate handling |
| 004 | Multi-tenancy model | RLS single-DB (default assumption) vs schema-per-tenant |
| 005 | Event model and webhook contract | Append-only events; delivery guarantees, retries, signing |
| 006 | Payments adapter interface | Define before any rail is implemented; research Bolivian rails first |
| 007 | Print bridge design | Protocols, discovery, ticket templates |
| 008 | Country-module interface | What the core exposes so SIN is a plugin, not a fork |
| 009 | Pricing model | Per-location flat fee; no hardware subsidy; test against Fudo's $25-$50 reference |

---

## 10. Phased plan

### Phase 0: Discovery and foundations (Weeks 0-3)
Deliverables:
- Read SIN technical documentation end to end. Produce `docs/sin-spec-notes.md` with: certification/homologation process, offline contingency rules, cancellation/credit-note rules, IVA Transparente changes, sandbox availability.
- ADRs 001-009 drafted.
- Repo scaffold on the locked stack, CI, Playwright harness, RLS multi-tenant baseline, `CLAUDE.md` + domain `SKILL.md` files.
- Spike: offline order entry + sync round trip on one tablet, with deliberate network kills.
- Spike: signed test invoice against SIN sandbox (if one exists).
- Interview 3-5 existing restaurant clients of Marvin as design partners. Capture: current POS, pain points, hardware, printers, payment mix, monthly volume.

Exit criteria: SIN path is understood and feasible (or blocked with a known blocker), offline spike survives scripted network failures, design partners committed.

### Phase 1: Compliant core (Weeks 3-12)
- Menu/modifiers, tables/floor plan, orders, KDS, split/merge checks, tips, cash shift close
- SIN invoicing end to end (issue, cancel, daily code, retention)
- Offline mode for orders, KDS, printing
- Staff roles/permissions, audit log
- Basic reports (sales, tips, shift)

Acceptance: 3 design-partner restaurants each complete **four consecutive weeks of full service nights** without falling back to their old system or paper. If not met, do not expand scope; fix reliability first.

### Phase 2: Back office and growth (Weeks 12-24)
- Inventory, recipes, food cost, purchasing
- QR table ordering, delivery-app integration
- Webhooks + public API v1 + n8n templates
- Self-serve onboarding, support tooling (device health, remote logs)

### Phase 3: Money and intelligence (Weeks 24-48)
- Payment adapters for researched local rails; optional take-rate payments
- Scheduling, tip distribution
- AI: margin analysis, reorder suggestions

### Phase 4: Expansion
- Second country via the country-module interface; repeat compliance + rails playbook.

---

## 11. Unverified / unknown (research tasks, not facts)

1. Whether SIN extended the 1 Oct 2026 groups 9-12 deadline again.
2. SIN POS homologation/certification process, cost, and timeline.
3. SIN offline/contingency invoicing rules.
4. Bolivian payment rails (QR, bank transfer, cards, cash share) and integration options.
5. Number of restaurants in Bolivia and willingness to pay.
6. Whether any existing vendor already offers SIN-compliant restaurant POS in Bolivia (none found, not proven absent).
7. Whether SkyTab has been renamed Shift4 Dine.
8. Toast early-termination fee range (sources disagree).
9. Toast's international footprint beyond US/UK.

---

## 12. First actions for the agent

1. Confirm you've read sections 1-11. List any assumptions you intend to challenge.
2. Produce `docs/sin-spec-notes.md` (see Phase 0). If SIN docs can't be fetched, say so and list what Marvin must supply.
3. Draft ADR-001, 002, 003 and propose spike plans for offline sync and SIN signing.
4. Scaffold the repo on the locked stack with tenant-aware schema (Drizzle) and RLS tests.
5. Propose the `CLAUDE.md` and initial `SKILL.md` structure for Hermes integration.
6. Report back with a risk-adjusted timeline for Phase 0 before starting Phase 1.

Do not start Phase 1 feature work until Phase 0 exit criteria are met.

---

## 13. Key sources (for re-verification)

- Toast Q2 2026 results (Aug 4, 2026): businesswire.com/news/home/20260804267340/en/
- Toast Q2 earnings call: webull.com/news/15386954068485120, marketbeat.com/instant-alerts/toast-q2-earnings-call-highlights-2026-08-09/
- Shift4 / Revel: restaurantbusinessonline.com/technology/payment-processor-shift4-acquire-revel-systems-250m, sec.gov Shift4 FY2024 10-K
- Toast pricing/contract: whichwos.com/toast-pos-review, posusa.com/toast-pos-pricing/
- SpotOn: merchantmaverick.com/reviews/spoton-pos-review, capterra.com/p/197473/SpotOn-Restaurant/reviews/
- SkyTab: merchantcostconsulting.com/lower-credit-card-processing-fees/skytab-pos-review/
- Revel: posusa.com/revel-systems-pos-review/
- Clover: startupowl.com/reviews/clover, bmc-pos.com/clover-pos-review/
- Bolivia IVA Transparente: vatcalc.com/bolivia/bolivia-e-invoicing-sfe-new-participants/
- Bolivia e-invoicing: banqup.com (Bolivia e-invoicing guide), sharedserviceslink.com/news/bolivia-delays-waves-9-through-12, gosocket.net, SIN RND 102500000036 (impuestos.gob.bo)
- Fudo: app.dealroom.co/companies/fudo
