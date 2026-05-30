# Incident Report: INC-2024-1105 — Auth plugin connection failures (staging)

- **Severity**: SEV-3 (staging only)
- **Date**: 2024-11-05
- **Systems**: shop-web (staging), db-staging

## Summary

During an earlier 8.0 trial on **staging**, `shop-web` could not connect to the
database. Error: `Authentication plugin 'mysql_native_password' cannot be
loaded`. The 8.0 instance defaulted to `caching_sha2_password` and the app's
pinned plugin was not enabled.

## Resolution

Enabled `mysql_native_password` explicitly in the 8.0 config and restarted.
Connections recovered.

## Relevance to production upgrade

This exact failure will recur on production if checklist item #6 (confirm auth
plugin) is not completed before the window. It previously caused a **total
connection outage** in staging. The production change plan still lists this as
"TODO — not yet completed."
