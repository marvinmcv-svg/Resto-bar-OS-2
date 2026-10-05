# Toast: what makes it win, and what we take from it

Researched 2026-10-05. Toast is the largest restaurant-only platform in the US (~130-170k locations). It doesn't operate in Bolivia. Sources at the end.

## 1. Why operators choose Toast
1. **Built only for restaurants.** Every screen assumes tables, courses, modifiers, stations and rushes. Generic POS tools (Square, Clover) feel bolted on by comparison.
2. **One connected system.** POS, kitchen screen (KDS), handhelds, online ordering, loyalty, payroll and reporting share one menu and one dataset. A price change or an "86" (sold out) reaches every device and channel at once.
3. **Handheld ordering at the table** (Toast Go). Servers fire orders and take payment without walking to a terminal. Faster turns and fewer errors.
4. **Kitchen display with timers.** Tickets route by station, show their age, and are marked started/done. Owners say it keeps the line organized in a rush.
5. **Remote management.** Owners change the menu and read sales from home (Toast Now app).
6. **Easy to learn.** New staff are productive after one shift.
7. **ToastIQ (AI layer, 2025):**
   - **Menu Upsells:** prompts the server with an add-on. About +6% average check in early use.
   - **Shift at a Glance:** managers push pre-shift notes (staffing, sold-out items) to staff devices.
   - **Digital Chits:** guest preferences and occasions from reservations or loyalty show on the ticket.
   - **AI marketing assistant:** drafts email/SMS/social campaigns.
8. **Ecosystem:** reservations (Toast Tables, plus OpenTable/Resy), loyalty, gift cards, email marketing, payroll and team management, inventory (xtraCHEF), and benchmarking against nearby restaurants.

## 2. Why operators complain about Toast
| Complaint | Our answer |
|---|---|
| 2-3 year contracts, auto-renewal, early-termination fees | Month to month, cancel by WhatsApp, 30-day refund |
| Locked to Toast payments; rates can rise with 30 days' notice | We record payments on any terminal or QR; no processing lock-in (ADR-006) |
| Proprietary hardware only, and it adds up per device | Waiters use their own phones; 1 printer + 1 Android device minimum |
| Add-ons push real cost to $150-300/month | One plan, Bs 350/month, everything included |
| Slow support at peak (40+ minutes on weekends) | WhatsApp support 11:00-24:00, 15-minute target during service |
| 4+ weeks to set up | Installed in one ~3-hour visit |
| Not in Bolivia, no SIN invoicing | SIN invoice from the same bill (provider adapter) |

## 3. What we build, and when
| Toast feature | Resto-bar OS version | Status |
|---|---|---|
| Handheld ordering | Waiters order on their own phones (`/pos`) | Built |
| Real-time owner reporting | `/resumen` + WhatsApp daily close | Built (WhatsApp send in wedge v1) |
| 86 synced everywhere | "Agotado" from the menu or straight from the POS | Built |
| Menu management | Menu editor: add, edit, remove (archived), photos, categories | Built |
| Roles and permissions | Owner, manager, cashier, waiter, bartender + platform admin, enforced in RLS | Built (demo PIN login; real auth next) |
| KDS with timers | `/cocina`: by station, age timer, start/ready, "listo" on the waiter's screen | Built as demo; printed tickets stay the opening-day path |
| Menu Upsells | "Sugerencia" on the ticket (rule-based pairings) | Built |
| Shift at a Glance | Nota del turno, shown on the POS at login | Built |
| Digital Chits | Guest note on the table (name, occasion, allergy) | Built |
| Waitlist / reservations | Lista de espera on the floor plan | Built (waitlist); reservations 2027 |
| Split checks + tips | Equal split, tip % per payment | Built |
| QR menu | — | Nov-Dec 2026 |
| Inventory + recipe cost | Top-20 recipe cost | Dec 2026 |
| Offline mode | — | Jan 2027 (ADR-002 test first) |
| Loyalty, gift cards, QR order-and-pay, delivery apps, AI marketing | — | 2027 |
| Payroll, scheduling | — | 2027 (tips distribution first) |

**Positioning line:** "Lo mejor de los sistemas grandes, sin contrato, en bolivianos, con factura SIN y soporte por WhatsApp."
Name Toast only factually in comparisons. No logos, no claims we can't source.

## Sources
- POSUSA, *Toast POS Review 2026*: https://www.posusa.com/toast-pos-review/
- Forbes Advisor, *Toast POS Review 2026*: https://www.forbes.com/advisor/business/toast-pos-review/
- Capterra, Toast POS reviews: https://www.capterra.com/p/136301/Toast-POS/reviews/
- Toast, *Toast launches ToastIQ*: https://pos.toasttab.com/news/toast-launches-toastiq-superpower-future-of-restaurants
- Toast, *Toast POS reviews*: https://pos.toasttab.com/blog/on-the-line/toast-pos-reviews
