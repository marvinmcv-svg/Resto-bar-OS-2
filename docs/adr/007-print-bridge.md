# ADR-007: Printing

- Status: **Revised** (2026-10-04)
- Decision: the **Capacitor cashier hub** (ADR-001) sends ESC/POS over TCP 9100 to network printers through a native socket plugin `[VERIFY plugin choice in week 2]`. No separate print-bridge service in 2026.
- Ticket templates are shared TypeScript (80mm, 48 columns). Station routing comes from `menu_categories.print_station`. Each station maps to a printer IP.
- A failed print is never silent: the hub retries, shows a red banner, and offers reprint. Device health reports printer status to the cloud.
- Spike in week 2 with the real printer model partner #1 will use.
