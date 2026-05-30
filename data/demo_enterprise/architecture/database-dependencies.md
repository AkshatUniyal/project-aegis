# Database Dependencies — db-prod-01

_Owner: Database Engineering • Reviewed: 2025-04-20_

## Critical tables

| Table | Charset | Written by | Read by | Notes |
|-------|---------|-----------|---------|-------|
| `orders` | latin1 | orders-service | shop-web, reporting | High write volume; frequent lock contention |
| `order_items` | latin1 | orders-service | reporting | FK to `orders` |
| `payments` | utf8mb4 | orders-service | admin-portal | Contains tokenized card refs (PII-adjacent) |
| `customers` | latin1 | shop-web | all | Email, name, address (PII) |
| `finance_reconciliation` | utf8mb4 | sp_nightly_settlement | reporting-service | Source of truth for daily revenue |

## Stored procedures & jobs

| Object | Purpose | Risk notes |
|--------|---------|-----------|
| `order_reconcile` | Matches orders to payments nightly | Uses `GROUP BY` without explicit columns and relies on implicit sort — **behavior changes in MySQL 8.0** (ONLY_FULL_GROUP_BY now default) |
| `sp_nightly_settlement` | Writes `finance_reconciliation` | Calls `order_reconcile`; runs 02:00 daily |
| `purge_old_sessions` | Cleans session table | Low risk |

## Known schema concerns for 8.0 upgrade

- `ONLY_FULL_GROUP_BY` is **enabled by default** in 8.0. `order_reconcile` will
  error or return different results.
- Several queries rely on implicit `GROUP BY` ordering (removed in 8.0).
- Mixed `latin1` / `utf8mb4` tables risk collation mismatch errors on JOINs
  (`Illegal mix of collations`).
- `mysql_native_password` auth plugin is deprecated; app connections may fail
  unless explicitly enabled.
