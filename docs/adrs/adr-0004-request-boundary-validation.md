# ADR-0004: Runtime Request Boundary Validation

## Status

- Accepted
- Date: 2026-03-06
- Version: 1.0

## Context

Runtime handlers accept untrusted HTTP input. NFR security requirements require explicit validation, bounded payloads, and safe failure responses at this boundary.

## Decision

- Validate read bodies with `isGraphQuery`.
- Validate write bodies with `isWriteCommand`.
- Enforce configurable request body size limits (`maxBodyBytes`).
- Support optional authorization callback at handler boundary.
- Return bounded/sanitized error responses with explicit status mapping.

## Consequences

- Invalid or oversized requests are rejected before core orchestration is invoked.
- Host applications can inject auth policy without coupling adapter logic to identity SDKs.
