# ADR-0003: Runtime Handler Telemetry Baseline

## Status

- Accepted
- Date: 2026-03-06
- Version: 1.0

## Context

The Azure Functions adapter is the runtime ingress for graph operations. Request/latency/error telemetry is required to identify handler and payload failures quickly.

## Decision

- Add optional telemetry sink to read/write handler options.
- Emit request, latency, and error metrics for both read and write handlers.
- Emit structured errors for invalid request handling paths.

## Consequences

- Runtime edge failures are observable and correlate with gateway/coordinator metrics.
- Host teams can wire platform analytics without modifying package internals.
