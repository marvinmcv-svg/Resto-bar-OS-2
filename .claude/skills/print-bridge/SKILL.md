---
name: print-bridge
description: ESC/POS printing from the Capacitor cashier hub to kitchen/bar thermal printers. Use for ticket templates or printer setup.
---
# Print bridge
- Design: ADR-007 (the Capacitor cashier hub sends ESC/POS over TCP 9100 through a native socket plugin). Waiters' phones never print directly.
- Supported hardware only (`docs/os-map.md` §5). Ticket width: 80mm, 48 columns.
- Station routing comes from `menu_categories.print_station`.
- If a print fails, the POS shows it, retries, and offers reprint. A failed print must never be silent.
