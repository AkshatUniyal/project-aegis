# Rollback Plan: CHG-2025-0412

_Status: DRAFT — not rehearsed_

## Strategy

In-place upgrades to MySQL 8.0 are **not reversible** by downgrade. Rollback
relies on restoring the pre-upgrade snapshot taken at 22:45.

## Steps

1. Stop MySQL 8.0.
2. Restore the filesystem snapshot of the 5.7 data directory.
3. Start MySQL 5.7.
4. Re-point application traffic.

## Gaps and assumptions

- The snapshot **restore procedure has never been tested** against `db-prod-01`.
- Estimated restore time is "about 30 minutes" — **not measured**.
- No designated **rollback owner** is named for the maintenance window.
- Any orders written after the snapshot but before rollback would be **lost**;
  there is no plan to reconcile them.
- Backup integrity (snapshot is restorable) has **not been validated**.

> NOTE: Rollback policy requires a tested restore within the last 30 days. No
> restore test is on record.
