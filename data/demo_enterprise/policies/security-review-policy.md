# Security Review Policy

_Owner: Information Security • v1.4_

Database changes touching systems with PII or payment data require:

1. Confirmation that **authentication mechanisms** are not weakened. Note:
   `caching_sha2_password` (8.0 default) is stronger than `mysql_native_password`;
   reverting to the legacy plugin for convenience must be risk-accepted.
2. No secrets (DB credentials) stored in plaintext application config. _Known
   finding: `shop-web` stores the DB password in a committed `config.php`._
3. Audit logging retained for access to `customers` and `payments` tables.
4. Verification that charset migration does not corrupt or expose PII fields.
