# ADR-013: Inventory, guests, reservations and marketing

- Status: Proposed (2026-10-05)
- Context: Owners want the full back office in one place: stock with recipe cost and waste, a guest book, reservations, WhatsApp campaigns and analytics. Each one touches money or personal data, so the rules live in the database.
- Decision:
  - **Units and money:** ingredient quantities are integer thousandths of the unit (`*_milli`: grams for kg, ml for l). Money is centavos. No floats anywhere (`src/modules/inventory/inventory.ts`).
  - **Stock is a ledger.** `stock_movements` is append-only (receive, sale, waste, count); stock on hand is `ingredient_stock` (a security-invoker view summing the ledger). A physical count writes the difference it found. Sales are written by the server when lines are fired, from `recipe_items`; staff can't write 'sale' rows. Waste is logged by owner/manager and by the kitchen and the bar; receiving and counts are owner/manager. Checks keep waste negative and receipts positive.
  - **Recipes** link menu items to ingredients with a portion size; recipe cost, margin and "portions left" are derived, never stored.
  - **Guests** are personal data (name, phone, birthday). Front of house (owner, manager, cashier, waiter) records them; the kitchen and the bar only read. Never deleted (soft delete); `opt_in` is required before any marketing message.
  - **Reservations** belong to one table; the app blocks overlapping active bookings on a table (`src/modules/reservations/reservations.ts`). Status changes instead of deletes (cancelada, no-show).
  - **Marketing** sends nothing by itself in 2026: it prepares a WhatsApp message per guest (wa.me link) and logs the campaign. Automated sending goes through n8n and WhatsApp Business later, with opt-in already enforced.
  - **Analytics** are computed from closed sales and recipes (menu engineering per Kasavana & Smith; `src/modules/analytics/analytics.ts`).
- Tests: `tests/rls/rls.test.ts` ("Inventory, guests and reservations").
- Consequences: inventory accuracy depends on recipes being loaded; dishes without a recipe don't move stock and show "sin receta".
