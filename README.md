# Resto-bar OS

POS + kitchen + SIN invoicing + owner reporting for restaurants and bars in Bolivia.

- Offer and pricing: [`docs/business/offer.md`](docs/business/offer.md)
- Go-to-market (20 clients by Dec 31, 2026): [`docs/business/go-to-market.md`](docs/business/go-to-market.md)
- System map and roadmap: [`docs/os-map.md`](docs/os-map.md)
- SIN research: [`docs/sin-spec-notes.md`](docs/sin-spec-notes.md)
- Architecture decisions: [`docs/adr/`](docs/adr)
- Agent conventions: [`CLAUDE.md`](CLAUDE.md)

```bash
pnpm install
pnpm dev        # http://localhost:3000
pnpm test       # unit + RLS isolation tests
pnpm test:e2e   # Playwright smoke
```
