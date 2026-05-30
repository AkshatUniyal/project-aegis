# Rollback Policy

_Owner: SRE • v2.0_

- Every High Risk change must have a rollback path validated by an **actual
  restore test** within the **last 30 days**.
- "We have a snapshot" is **not** an accepted rollback plan unless the restore
  has been timed and verified end-to-end.
- A rollback owner must be named and on-call for the full change window.
- Maximum acceptable restore time for Tier-1 systems (checkout) is **20 minutes**.
- Data written between snapshot and rollback must have a documented reconciliation
  procedure.
