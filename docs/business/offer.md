# The Offer: "Plan Fundador"

> Goal: 20 paying restaurants/bars by **Dec 31, 2026**, at ~USD 50/month priced in **bolivianos**.
> Anything marked `[VERIFY]` is an assumption to confirm before it goes into sales material.

## 1. One plan, one price

| | Plan Fundador |
|---|---|
| Price | **Bs 350 / month** per location (≈ USD 50 at the official rate of 6.96 `[VERIFY current rate + whether to anchor to parallel rate]`) |
| Annual prepay | **Bs 3,500 / year** (pay 10 months, get 12) |
| Contract | None. Month-to-month, cancel anytime, **no termination fee** |
| Setup | **Free, in person**: menu load, printer setup, staff training (1 visit) |
| Guarantee | **30 days: if it doesn't fit, you don't pay** |
| Price lock | Founder price **locked for life** for the first 20 locations only |
| Payment methods | QR (bank QR), bank transfer; annual can also be paid in USD/USDT |

Why one plan: a solo founder can't support pricing complexity, and "todo incluido" removes the "which plan do I need?" objection. Add tiers in 2027 once we know usage.

Rules:
- Re-price the Bs amount for **new** clients every 12 months (FX hedge). Founders stay locked.
- Annual prepay is pushed hardest in December: it gives cash before peak season and removes FX risk.
- Extra locations: same price. Extra devices: free (hardware-agnostic is a selling point, not a cost to us).

## 2. What's included (the value stack)

| # | Feature | Owner's pain it kills | Ships |
|---|---|---|---|
| 1 | **SIN invoicing inside the POS** | Deadline pressure, double entry, accountant chasing invoices | Wedge v1 |
| 2 | POS: tables, orders, modifiers, split checks, tips, shift close | Notebook/paper orders, wrong bills, slow service | Wedge v1 |
| 3 | Tickets to kitchen and bar printers | Waiters running to the kitchen, lost orders | Wedge v1 |
| 4 | **Daily close report on the owner's WhatsApp** | "I don't know what happened tonight unless I'm there"; theft, voids | Wedge v1 |
| 5 | Works offline | Internet outages in the middle of service | Wedge v1 |
| 6 | Any tablet / PC / phone | Having to buy expensive proprietary hardware | Wedge v1 |
| 7 | Kitchen screen (KDS) | Paper tickets lost in the kitchen | v1.x (Nov) |
| 8 | QR digital menu | Printing menus every time prices go up | v1.x (Nov-Dec) |
| 9 | Basic inventory + recipe cost of the top 20 items | Stock leakage ("merma"), not knowing the margin per dish | v1.x (Dec) |
| 10 | WhatsApp support during service hours | Incumbents' #1 complaint is support | Always |

**The killer demo** is #4. Send the owner a sample report from their own test night on WhatsApp during the demo. Nobody else in the market does this at this price.

## 3. Why it's a no-brainer (value math)

Fill in with the prospect's numbers during the demo:

| Saving / gain | Conservative monthly value |
|---|---|
| Current invoicing software or provider they'd replace | Bs ___ `[VERIFY typical price]` |
| One avoided unrecorded sale/void per week (e.g. Bs 80 × 4) | Bs 320 |
| 2 hours/week of the owner's or cashier's time on closing and invoicing | Bs ___ |
| Avoided SIN fines/closures from non-compliance | (risk; don't quantify, name it) |

**Line for the pitch:** "If the system catches one missing beer bucket a week, it has already paid for itself."

## 4. Objection handling

| Objection | Answer |
|---|---|
| "Ya tengo sistema." | "Perfect. Does it send you the close report on WhatsApp and invoice to the SIN without retyping? Try us 30 days for free alongside it." |
| "Es caro." | "It's less than one drink per day. And if after 30 days it didn't pay for itself, you don't pay." |
| "Me da miedo cambiar." | "We do the whole setup and train your staff ourselves. If anything fails, you can go back to paper the same night. No contract." |
| "¿Y si se cae el internet?" | "It keeps taking orders and printing tickets. It syncs when the connection returns." |
| "¿Y si ustedes desaparecen?" | "You can export your data at any time, and there's no contract that ties you to us." |
| "No necesito facturar todavía." | "The owner report and the control of waiters already pay for it. Invoicing is included for when you need it." |
| "Necesito pensarlo." | "Of course. There are only 20 founder places at this price for life; currently N are left." (Keep the counter real.) |

## 5. Spanish one-pager / WhatsApp script

**Mensaje inicial (warm lead / referido):**
> Hola [Nombre], soy Marvin. Estoy lanzando un sistema para restaurantes y bares de Santa Cruz: toma pedidos por mesa, manda la comanda a cocina, factura directo al SIN y te llega el cierre del día a tu WhatsApp. Sin contrato, sin equipos caros, Bs 350 al mes, instalación gratis. Estoy buscando a los primeros 20 locales con precio fundador de por vida. ¿Te muestro 15 minutos en tu local esta semana?

**Guion de demo (15 minutos):**
1. (2 min) Pregunta: ¿cómo toman pedidos hoy? ¿cómo facturan? ¿cómo saben cuánto vendieron anoche?
2. (5 min) Toma un pedido en mesa → imprime en cocina → divide la cuenta → cobra con QR → factura.
3. (3 min) Desconecta el WiFi y sigue tomando pedidos.
4. (3 min) **Envía el reporte de cierre a su WhatsApp, ahí mismo.**
5. (2 min) Oferta: precio fundador, instalación gratis, 30 días de garantía. "¿Lo instalamos el martes o el jueves?"

**Cierre:** always propose a concrete installation date. Never end with "te mando la información".

## 6. What we do NOT promise (protect trust)
- No promise of features that aren't shipped. The roadmap is shown as "coming", with a month.
- No hardware resale margin. We recommend a kit (`docs/os-map.md` §5), and the client buys it.
- No card processing in 2026. We record card payments made on their existing terminal.
