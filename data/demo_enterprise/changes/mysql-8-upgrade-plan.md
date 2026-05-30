# Change Plan: Upgrade MySQL 5.7.38 → 8.0.36 (db-prod-01)

- **Change ID**: CHG-2025-0412
- **Requested by**: Platform Engineering
- **Target environment**: Production (`db-prod-01` primary)
- **Planned window**: 2025-05-30, 23:00–01:00 (2h maintenance)
- **Affected systems**: orders-service, shop-web, reporting-service, admin-portal

## Motivation

5.7 reaches end of extended support; 8.0 brings performance, JSON, and security
improvements. Security has flagged 5.7 for remediation.

## Plan of record

1. Snapshot `db-prod-01` (filesystem snapshot) at 22:45.
2. Stop `orders-service` and `shop-web` write traffic (maintenance page).
3. Run `mysql_upgrade` / in-place upgrade to 8.0.36.
4. Restart MySQL, validate it starts.
5. Smoke test: login, place a test order, run a sample report.
6. Re-enable traffic.

## Compatibility notes (from DBA pre-check)

- `sql_mode` will change: `ONLY_FULL_GROUP_BY` becomes default. **TODO: review
  stored procedures** — not yet completed.
- Authentication plugin default changes to `caching_sha2_password`. App uses
  `mysql_native_password`. **TODO: confirm plugin enabled** — not yet completed.
- Mixed charset tables (latin1 / utf8mb4) — collation review **not started**.

## Open items

- [ ] Stored procedure compatibility test (`order_reconcile`, `sp_nightly_settlement`)
- [ ] Restore/rollback rehearsal in staging
- [ ] Confirm replication to `db-prod-02` survives upgrade
- [ ] Post-deploy business validation (revenue reconciliation)
