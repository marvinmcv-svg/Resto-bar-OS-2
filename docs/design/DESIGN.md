# RestoBar OS: Design System

Built with the ECC skills `frontend-design-direction`, `design-system`, `make-interfaces-feel-better`, and `frontend-a11y`, plus the dataviz method for charts. Tokens live in `src/app/globals.css`.

## Direction
- **Purpose:** take orders fast under pressure (POS), and let the owner see the night at a glance (back office).
- **Audience:** waiters and cashiers in a dim, noisy bar, on cheap Android tablets and their own phones; owners on a phone or laptop.
- **Tone:** refined utilitarian, "Apple finish". Calm surfaces, one warm accent, food photos carry the color.
- **Memorable detail:** the owner's **WhatsApp close preview**, plus tables that change state (blue occupied, amber bill requested, red pulse after 75 min).
- **Two modes by job:** the back office follows the owner's theme (light by default). The POS is **always dark**: dim bars at night, less glare, and longer OLED battery life.

## Color
| Token | Light | Dark | Use |
|---|---|---|---|
| background | `#f5f5f7` | `#0b0b0d` | page plane |
| card | `#ffffff` | `#161618` | surfaces |
| foreground | `#1d1d1f` | `#f5f5f7` | primary ink |
| muted-foreground | `#6e6e73` | `#98989f` | secondary ink |
| **primary (Ember)** | `#cf4a0a` (white text 4.5:1) | `#ff7a2e` (dark text 7.6:1) | primary actions, brand, active state |
| status good / warning / serious / critical | `#0ca30c` `#fab219` `#ec835a` `#d03b3b` | same | always paired with an icon and a label |
| status info | `#2a78d6` | `#3987e5` | occupied table |
| chart 1–4 | dataviz reference slots (blue, orange, aqua, yellow) | dark steps | categorical; validated with `validate_palette.js` (all checks pass; light-mode contrast relief = direct labels) |

Rules:
- One accent. Never purple gradients, decorative blobs, or glass cards.
- Status color never carries meaning alone: there is always an icon and a label.
- Text never wears a chart color.

## Type
- **Inter** (consistent on Android, where most of our hardware is), with the `cv11`/`ss01` features.
- Titles 28–34px semibold with −0.02em tracking. Hero number 44–56px. Body 14–15px. Captions 12–13px.
- Use `tabular` for prices in lists and for counters, and `text-wrap: balance` on headings.

## Shape & depth
- Radius: controls 12–14px; cards 22px; dialogs 26px; sheets 28px (concentric with their padding).
- Depth comes from a hairline border plus a soft layered shadow (`--shadow-card`, `--shadow-float`). No heavy drop shadows.
- **Glass** (the web translation of Liquid Glass) is used **only** on floating chrome: the top bars, the mobile tab bar, and the phone order bar.

## Motion
- Durations 160–320ms with `--ease-out`. Never `transition: all`.
- Press feedback: `scale(0.97)`.
- Entrances: a short fade + 6px rise + blur.
- `prefers-reduced-motion` disables entrances, pulses, and press scaling.

## Touch & accessibility
- Hit targets ≥ 40px, and 44–56px on the POS. Primary POS buttons are 56px.
- Every control has an accessible name; segmented controls use `tablist`/`tab`; toggles use `aria-pressed`.
- Dialogs come from Radix (focus trap, Escape to close, focus restored).
- UI copy is Spanish (Bolivia). Money is formatted with `es-BO` ("Bs 1.234,50"). Times are 24h.

## Charts (dataviz method)
- Hourly sales: a single-series area chart (2px line, ~10% wash, hairline grid), a crosshair tooltip, and the peak labelled directly. No legend, because the title names the series.
- Payment mix: a stacked bar with a 2px surface gap, plus a legend that has direct values and percentages.
- Top items: a bar list in the accent color, with the value at the tip.

## Images
- Menu photos are square crops with a neutral 1px inset outline.
- Items without a photo get a calm category-icon tile, never a broken image. Real restaurants will often have no photos.
- The demo photos come from Wikimedia Commons; credits are at `/creditos` and in `public/menu/CREDITS.md`.
