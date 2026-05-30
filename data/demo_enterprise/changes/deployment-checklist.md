# Deployment Checklist: CHG-2025-0412

| # | Item | Status | Owner |
|---|------|--------|-------|
| 1 | Maintenance window approved | ✅ Done | Platform |
| 2 | Customer comms / status page | ✅ Done | Support |
| 3 | Filesystem snapshot before upgrade | ✅ Planned | DBA |
| 4 | Stored procedure 8.0 compatibility test | ❌ Not done | DBA |
| 5 | Restore/rollback rehearsal in staging | ❌ Not done | SRE |
| 6 | Auth plugin (`mysql_native_password`) confirmed | ❌ Not done | Platform |
| 7 | Charset/collation review | ❌ Not done | DBA |
| 8 | Replication continuity validated | ⚠️ Partial | DBA |
| 9 | Monitoring/alerting on settlement job | ❌ Not done | SRE |
| 10 | Post-deploy revenue reconciliation check | ❌ Not done | Reporting |
| 11 | Rollback owner assigned | ❌ Not done | — |

## Monitoring readiness

- Standard host + MySQL up/down alerts exist.
- **No alert** exists for nightly settlement job failure or for
  `finance_reconciliation` going stale.
- No dashboard tracks `order_reconcile` row counts night-over-night.
