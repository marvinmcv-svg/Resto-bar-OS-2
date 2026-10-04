# Resto-bar OS

Restaurant/bar operating system for Bolivia first (SIN e-invoicing), designed to repeat country by country.
Business goal: **20 paying locations at Bs 350/mo by 2026-12-31**. See `docs/business/`.

## Read first
- `docs/os-map.md` — modules, release scope, wedge v1 acceptance criteria. **Don't build outside the current release column.**
- `docs/HANDOFF.md` — research and non-negotiable principles (§4).
- `docs/adr/` — architecture decisions. Write a new ADR before changing one.
- `docs/sin-spec-notes.md` — open SIN questions. Never treat `[VERIFY]` items as facts.

## Stack (locked)
Next.js 15 App Router, TypeScript, Supabase (Postgres/Auth/Realtime), Drizzle, Tailwind, Shadcn UI, Playwright, Vitest, Vercel, n8n.

## Commands
- `pnpm dev` · `pnpm lint` · `pnpm typecheck` · `pnpm test` (Vitest, including RLS tests on PGlite) · `pnpm test:e2e` (Playwright; set `PW_CHROMIUM_PATH` if the bundled browser is missing)

## Rules
- Every table has `tenant_id` + RLS. A new table also needs a policy in `supabase/migrations/` and a case in `tests/rls/`.
- `src/db/schema.ts` and `supabase/migrations/*.sql` must stay in sync.
- Money: integer minor units (`*_minor`, centavos). Never floats.
- IDs: client-generated UUIDs for anything a device can create offline.
- `order_events` is append-only. Never update or delete.
- The core never imports country logic. Compliance goes through `src/modules/compliance/types.ts`.
- Payments are record-only in 2026 (ADR-006).
- UI copy is Spanish (Bolivia). Code, comments, and docs are English.
- Polished over MVP: ship less scope, never rough features.

## Domain skills
`.claude/skills/{pos,compliance-sin,offline-sync,print-bridge,n8n-automations}/SKILL.md`
