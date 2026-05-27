# Changelog

All notable changes to this project will be documented in this file.

The format is based on **[Keep a Changelog](https://keepachangelog.com/en/1.1.0/)**, and this project adheres to **[Semantic Versioning](https://semver.org/spec/v2.0.0.html)**.

---

## [Unreleased]

- **Added**
  - Added `en-GB` translation keys/defaults for graph runtime error response messages.

- **Changed**
  - Graph error responses now include `messageKey` and `messageDefault` alongside the existing `code` and `message` fields.

- **Fixed**
  - (placeholder)

- **Security**
  - Changed graph read/write handler authorization to fail closed unless an `authorize` guard is configured or `allowAnonymous: true` is explicitly set.

## [0.1.6] - 2026-05-13

- **Added**
  - (placeholder)

- **Changed**
  - Refreshed dependencies to the latest stable published versions.
  - (placeholder)

- **Fixed**
  - (placeholder)

- **Security**
  - (placeholder)

## [0.1.5] - 2026-05-13

- **Added**
  - (placeholder)

- **Changed**
  - (placeholder)

- **Fixed**
  - (placeholder)

- **Security**
  - (placeholder)

## [0.1.4] - 2026-04-21

- **Added**
  - (placeholder)

- **Changed**
  - (placeholder)

- **Fixed**
  - (placeholder)

- **Security**
  - (placeholder)

## [0.1.3] - 2026-04-02

- **Added**
  - (placeholder)

- **Changed**
  - (placeholder)

- **Fixed**
  - (placeholder)

- **Security**
  - (placeholder)

## [0.1.2] - 2026-03-06

- **Added**
  - Optional telemetry sink support on read/write handler factories.
  - Request schema validation (`isGraphQuery` + strict write-command validator) at runtime boundary.
  - Optional authorization callback and request-body size guard (`maxBodyBytes`).
  - Runtime metrics/errors for handler request, latency, and failure paths.
  - Tests validating telemetry emission, validation failures, auth guards, and upstream failure mapping.

- **Changed**
  - README now documents runtime adapter telemetry surface.

- **Fixed**
  - N/A

- **Security**
  - N/A

## [0.1.1] - 2026-03-05

### Added

- Initial package scaffolding.
- Initial source implementation and baseline tests.
- CI/CD workflow baseline for GitHub Actions and npm publish path.


[0.1.1]: https://github.com/Plasius-LTD/graph-runtime-azure-functions/releases/tag/v0.1.1
[0.1.2]: https://github.com/Plasius-LTD/graph-runtime-azure-functions/releases/tag/v0.1.2
[0.1.3]: https://github.com/Plasius-LTD/graph-runtime-azure-functions/releases/tag/v0.1.3
[0.1.4]: https://github.com/Plasius-LTD/graph-runtime-azure-functions/releases/tag/v0.1.4
[0.1.5]: https://github.com/Plasius-LTD/graph-runtime-azure-functions/releases/tag/v0.1.5
[0.1.6]: https://github.com/Plasius-LTD/graph-runtime-azure-functions/releases/tag/v0.1.6
