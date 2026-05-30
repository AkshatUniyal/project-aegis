# reporting-service

_Owner: Data & Reporting team_

Python 3.10 service that reads from the replica `db-prod-02` to produce daily
finance and operations reports for leadership.

## Dependencies

- Reads `finance_reconciliation` (written nightly by `sp_nightly_settlement`).
- Reads `orders` and `order_items` for revenue breakdowns.
- Replication from `db-prod-01` lags 30–90s under load.

## Upgrade-relevant risks

- If the upgrade is applied to the primary while replication is active, a
  replication format mismatch (statement vs row) can break the replica feed.
- Reports consume the output of `order_reconcile`; if that procedure behaves
  differently under 8.0, **daily revenue numbers reported to leadership may be
  silently wrong**.
- No automated reconciliation check compares reported revenue against the
  payment gateway totals.
