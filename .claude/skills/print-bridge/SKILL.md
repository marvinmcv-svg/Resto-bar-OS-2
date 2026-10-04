---
name: print-bridge
description: ESC/POS printing to kitchen/bar thermal printers through the local print bridge. Use for ticket templates or printer setup.
---
# Print bridge
- Design: ADR-007 (ESC/POS over TCP 9100 through a LAN bridge with a pairing token).
- Supported hardware only (`docs/os-map.md` §5). Ticket width: 80mm, 48 columns.
- Station routing comes from `menu_categories.print_station`.
- If a print fails, the POS shows it, retries, and offers reprint. A failed print must never be silent.
