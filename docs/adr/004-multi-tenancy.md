# ADR-004: Multi-tenancy

- Status: Accepted
- Decision: a single Postgres database, **`tenant_id` on every table + RLS** policies based on the user's membership. `location_id` on operational rows. Devices authenticate as a device user scoped to one location.
- Tests: an RLS test suite proves that tenant A cannot read or write tenant B (`tests/rls`).
