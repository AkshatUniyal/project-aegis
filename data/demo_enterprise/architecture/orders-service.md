# orders-service

_Owner: Payments & Orders team_

PHP 8.1 service responsible for order capture, payment settlement, and writing
the `orders`, `order_items`, and `payments` tables on `db-prod-01`.

## Database interaction

- Connects to `db-prod-01` using a pooled connection (`mysql_native_password`).
- Runs the nightly settlement at 02:00 via `sp_nightly_settlement`, which calls
  the `order_reconcile` stored procedure.
- Heavy transactional writes to `orders`; historically the source of lock-wait
  timeouts during peak (see incident-db-locks).

## Upgrade-relevant risks

- Connection string hardcodes `mysql_native_password`. If the 8.0 instance does
  not enable this plugin, **all order writes fail** → checkout outage.
- The settlement job depends on `order_reconcile` returning rows in a specific
  implicit order. MySQL 8.0 removes implicit `GROUP BY` sorting.
- No application-level retry/backoff on settlement failure; a failed nightly run
  silently leaves `finance_reconciliation` stale.
