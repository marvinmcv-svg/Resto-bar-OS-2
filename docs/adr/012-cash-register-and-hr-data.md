# ADR-012: Cash register and HR data

- Status: Proposed (2026-10-05)
- Context: Restaurants need the cashier to own the drawer (open with a count, record cash in/out, close with expected vs counted) and need daily HR (files, clock in/out, schedules, attendance, tip split). Both touch money and personal data, so the rules must hold in the database, not only in the UI.
- Decision:
  - **Shifts** are the cash-register shifts. Every payment carries `shift_id`. Expected cash = opening + cash sales + cash tips + movements in − movements out (`src/modules/pos/cash.ts`). The close stores `counted_cash_minor`, `expected_cash_minor`, `count_breakdown` and `closed_by`.
  - **`cash_movements` are append-only.** Owner/manager/cashier insert; nobody updates or deletes. A correction is an opposite movement. Withdrawals need a manager's approval (`approved_by`, PIN checked in server code).
  - **`staff`** holds who works there (name, role, hashed PIN, active). Staff are deactivated, never deleted.
  - **`staff_profiles`** (CI, phone, emergency contact, start date, pay type and rate) is **owner-only** for read and write. Managers schedule people without seeing pay or ID numbers.
  - **`time_entries`**: members insert their own clock-in. Staff never update rows directly; `clock_out(entry)` (SECURITY DEFINER) only stamps `out_at` on an open entry. Owners/managers correct entries, and the policy requires `edited_by`. No deletes. (Postgres ORs the checks of UPDATE policies, so a broad member update policy would let unsigned edits through; hence the function.)
  - **`schedule_shifts`** and **`tip_distributions`**: owner/manager write, members read. Tip splits always sum to the shift's tips (`src/modules/hr/tips.ts`).
  - **No payroll.** Bolivian payroll (AFP, RC-IVA, aguinaldo, planillas) is legal work for the accountant. We export hours and estimated pay as CSV, labelled as an estimate.
- Tests: `tests/rls/rls.test.ts` ("Cash register and HR").
- Consequences: personal data is limited to what daily operation needs. A "delete my data" request is handled by clearing the profile row; attendance stays for the legal record.
