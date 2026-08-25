# Stage-scoped partner execution workflow

CyberWeel uses the project stage as the operational source of truth for execution assignments.

- Projects are created centrally without assigning execution partners at project level.
- Each project stage is created with its client-facing amount and lifecycle.
- Execution partners are assigned to individual stages by administration.
- Partner tasks, deliverables, internal due date, and partner fee are private operational data.
- Partner progress updates the stage's visible execution progress, but only administration completes and approves the stage.
- The client sees stage execution progress, project status, and client billing data; partner identity and internal compensation are not exposed.
- Ambassador attribution remains derived from the referral and is independent of execution-partner assignment.
- Legacy `PartnerProject` records remain readable as a compatibility fallback for older projects.
