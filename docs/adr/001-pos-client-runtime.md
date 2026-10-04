# ADR-001: POS client runtime

- Status: **Revised** (2026-10-04)
- Context: The POS must run on cheap Android devices and waiters' own phones, print to network thermal printers, and be installable in a 3-hour visit. Browsers can't open raw TCP connections to printers, and the recommended kit has no PC to run a separate print helper.
- Decision:
  - **Waiters:** web app (Next.js route group `/pos`) on any phone browser. Nothing installed.
  - **Cashier hub:** the same web code wrapped in a **Capacitor Android app**. A native plugin opens TCP 9100 to the printers (ADR-007). The hub receives orders in real time and prints them.
  - **Back office:** plain web.
- Consequences: one codebase. Only the hub needs an install (APK side-load or Play Store internal testing). iPad hubs are not supported in 2026. If the hub is down, nothing prints. Mitigation: print-failure alerts and a second Android device as a backup hub.
