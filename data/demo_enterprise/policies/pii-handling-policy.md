# PII Handling Policy

_Owner: Data Protection • v2.2_

- The `customers` table (email, name, address) and `payments` table (tokenized
  card references) are classified **PII / sensitive**.
- Any migration that rewrites these tables (e.g. charset conversion latin1 →
  utf8mb4) must be validated to ensure no truncation or mojibake of stored data.
- Access to PII tables must remain audit-logged across the upgrade.
- Synthetic data only in non-production. Production PII must never leave the
  production environment — including for AI-assisted review (local-only).
