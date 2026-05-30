# Incident Report: INC-2025-0203 — Stale finance reconciliation

- **Severity**: SEV-3
- **Date**: 2025-02-03
- **Systems**: reporting-service, sp_nightly_settlement

## Summary

The nightly settlement job failed silently. `finance_reconciliation` was not
updated, and leadership's morning revenue report showed the **prior day's**
numbers without any error indication. The discrepancy was noticed manually four
hours later by a finance analyst.

## Root cause

`order_reconcile` hit an edge case and exited non-zero; the job had **no failure
alerting** and no retry. Reporting consumed stale data.

## Relevance to MySQL 8.0 upgrade

This is the precise failure mode the upgrade could trigger at scale: if
`order_reconcile` behaves differently under `ONLY_FULL_GROUP_BY`, settlement
could fail or produce wrong numbers — and the gap in alerting means **no one
would know**. Required action: add settlement failure alerting before upgrade.
