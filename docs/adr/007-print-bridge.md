# ADR-007: Print bridge

- Status: Proposed
- Decision: v1 sends **ESC/POS over TCP 9100** to network printers. Browsers can't open raw TCP, so we ship a tiny local bridge (a Node service on a shop PC or Android device, or later a Capacitor plugin) that exposes `POST /print` on the LAN with a pairing token. Ticket templates are rendered server-agnostic in shared TS (`packages/tickets`). Each station maps to a printer IP. If the bridge is down, the POS shows a red status and the device-health view alerts us.
- Spike in week 2: test the bridge with the recommended printer `[VERIFY model]`.
