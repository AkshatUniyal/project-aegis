# Production Release Policy

_Owner: Engineering Governance • v3.1_

All production changes classified **High Risk** must satisfy the following
before approval:

1. A documented and **rehearsed** rollback plan (restore tested within 30 days).
2. A named **rollback owner** present during the change window.
3. Compatibility testing for any database engine or major version change.
4. Monitoring and alerting covering the changed component's failure modes.
5. A post-deployment validation step proving business function (not just "DB up").
6. Sign-off from SRE, Security, and the owning engineering lead.

Database major-version upgrades on a single-primary system are **automatically
classified High Risk** and additionally require a staging dress rehearsal.
