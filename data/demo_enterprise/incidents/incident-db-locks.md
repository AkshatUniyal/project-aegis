# Incident Report: INC-2024-0917 — Checkout lock-wait timeouts

- **Severity**: SEV-2
- **Date**: 2024-09-17, 19:40–20:55
- **Systems**: orders-service, shop-web, db-prod-01

## Summary

During an evening sales peak, the `orders` table experienced sustained
lock-wait timeouts. Checkout error rate rose to 12% for 75 minutes. Root cause
was long-running transactions in the settlement path holding row locks on
`orders` while high write volume competed for the same rows.

## Contributing factors

- `orders` is `latin1`; JOINs against `utf8mb4` tables forced collation
  conversion and full scans on some queries.
- No statement timeout configured; runaway transactions were not auto-killed.

## Relevance to MySQL 8.0 upgrade

8.0 changes default isolation behavior and lock handling. Without load testing,
the upgrade could **change lock contention characteristics on `orders`** — the
exact table involved in this SEV-2. This risk is not addressed in the change plan.
