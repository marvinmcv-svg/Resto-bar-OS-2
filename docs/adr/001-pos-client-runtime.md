# ADR-001: POS client runtime

- Status: Proposed (2026-10-04)
- Context: The POS must run on cheap Android tablets, iPads, and Windows PCs; work offline; print to network thermal printers; and be installable in a 3-hour onsite visit.
- Decision: **Installable PWA** (Next.js route group `/pos`, with a service worker and local IndexedDB storage) for v1. Printing goes through a **local print bridge** (ADR-007), not the browser. Re-evaluate a Capacitor shell only if we need USB/Bluetooth printers or real kiosk mode.
- Consequences: one codebase, instant updates, no app-store review. Browser storage can be evicted, so we request persistent storage and sync aggressively. iOS PWA limits are acceptable because Android is the recommended kit.
