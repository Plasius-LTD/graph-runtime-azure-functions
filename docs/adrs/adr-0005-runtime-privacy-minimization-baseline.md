# ADR-0005: Runtime Privacy Minimization Baseline

## Status

- Accepted
- Date: 2026-06-27
- Version: 1.0

## Context

`@plasius/graph-runtime-azure-functions` already validates untrusted HTTP input and
returns bounded generic error responses for failure cases. The remaining gap for
the cached-graph rollout is that the runtime privacy contract is implicit:

- telemetry minimization rules are enforced by implementation convention,
- bounded error responses are not documented as a package-level privacy rule,
- and callers need an explicit reminder that successful graph payloads must
  already be minimized before the adapter returns them.

The cross-repo privacy/accessibility feature requires a stable statement of those
runtime expectations for review, regression testing, and operational audit.

## Decision

- Publish a package-level `GRAPH_RUNTIME_AZURE_FUNCTIONS_PRIVACY_GUIDANCE` export.
- Define three runtime privacy rules:
  - telemetry minimization,
  - bounded error responses,
  - authorized success payload handling.
- Keep telemetry and public error bodies generic and free of raw upstream
  exception text or request/response payload fragments.
- Document that successful graph payload minimization remains the responsibility
  of the upstream gateway/coordinator and host application.

## Consequences

- Hosts get a stable, testable contract for telemetry and response minimization.
- The adapter remains generic and does not attempt unsafe domain-specific payload
  inspection.
- Regression tests can lock in the no-leak behavior for telemetry and bounded
  error responses.
