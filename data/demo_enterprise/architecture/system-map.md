# Northwind Commerce — System Map

_Last updated: 2025-04-18 • Owner: Enterprise Architecture_

Northwind Commerce runs a PHP 8.1 monolith (`shop-web`) fronted by Nginx and
backed by a single primary **MySQL 5.7.38** instance (`db-prod-01`) with one
asynchronous replica (`db-prod-02`) used for reporting.

## Service topology

| Service | Runtime | Depends on | Notes |
|---------|---------|-----------|-------|
| `shop-web` | PHP 8.1 / Nginx | `db-prod-01` (writes), Redis | Customer storefront + checkout |
| `orders-service` | PHP 8.1 | `db-prod-01` | Order capture, payment settlement |
| `reporting-service` | Python 3.10 | `db-prod-02` (replica) | Nightly finance + ops reports |
| `admin-portal` | PHP 8.1 | `db-prod-01` | Internal ops, refunds, support |

## Data flow

```
Customer → Nginx → shop-web → orders-service → db-prod-01 (primary)
                                                   │ async replication
                                                   ▼
                              reporting-service ← db-prod-02 (replica)
```

## Key facts relevant to change review

- **Single primary**: all writes go to `db-prod-01`. There is no multi-primary or
  proxy layer. A failed upgrade on the primary is a full checkout outage.
- The reporting replica (`db-prod-02`) lags the primary by 30–90s under load.
- `orders-service` and `reporting-service` both read the `finance_reconciliation`
  table; the nightly settlement job writes it via a stored procedure.
- Application DB connections use the **`mysql_native_password`** auth plugin
  (configured in `shop-web` connection string), which is deprecated in MySQL 8.0.
- Character set on legacy tables is **`latin1`**; newer tables use `utf8mb4`.
  This mixed-charset state is a known source of collation issues.
