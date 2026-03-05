# @plasius/graph-runtime-azure-functions

[![npm version](https://img.shields.io/npm/v/@plasius/graph-runtime-azure-functions.svg)](https://www.npmjs.com/package/@plasius/graph-runtime-azure-functions)
[![Build Status](https://img.shields.io/github/actions/workflow/status/Plasius-LTD/graph-runtime-azure-functions/ci.yml?branch=main&label=build&style=flat)](https://github.com/Plasius-LTD/graph-runtime-azure-functions/actions/workflows/ci.yml)
[![coverage](https://img.shields.io/codecov/c/github/Plasius-LTD/graph-runtime-azure-functions)](https://codecov.io/gh/Plasius-LTD/graph-runtime-azure-functions)
[![License](https://img.shields.io/github/license/Plasius-LTD/graph-runtime-azure-functions)](./LICENSE)
[![Code of Conduct](https://img.shields.io/badge/code%20of%20conduct-yes-blue.svg)](./CODE_OF_CONDUCT.md)
[![Security Policy](https://img.shields.io/badge/security%20policy-yes-orange.svg)](./SECURITY.md)
[![Changelog](https://img.shields.io/badge/changelog-md-blue.svg)](./CHANGELOG.md)

[![CI](https://github.com/Plasius-LTD/graph-runtime-azure-functions/actions/workflows/ci.yml/badge.svg)](https://github.com/Plasius-LTD/graph-runtime-azure-functions/actions/workflows/ci.yml)
[![CD](https://github.com/Plasius-LTD/graph-runtime-azure-functions/actions/workflows/cd.yml/badge.svg)](https://github.com/Plasius-LTD/graph-runtime-azure-functions/actions/workflows/cd.yml)

Azure Functions runtime adapter for graph read and write HTTP handlers.

Apache-2.0. ESM + CJS builds. TypeScript types included.

---

## Requirements

- Node.js 24+ (matches `.nvmrc` and CI/CD)
- `@azure/functions` 4.x (`peerDependencies`)
- `@plasius/graph-gateway-core`
- `@plasius/graph-write-coordinator`

---

## Installation

```bash
npm install @plasius/graph-runtime-azure-functions @azure/functions
```

---

## Exports

```ts
import {
  createGraphReadHandler,
  createGraphWriteHandler,
  type GraphReadHandlerOptions,
  type GraphWriteHandlerOptions,
} from "@plasius/graph-runtime-azure-functions";
```

---

## Quick Start

```ts
import { app } from "@azure/functions";
import {
  createGraphReadHandler,
  createGraphWriteHandler,
} from "@plasius/graph-runtime-azure-functions";

app.http("graph-read", {
  methods: ["POST"],
  authLevel: "function",
  handler: createGraphReadHandler({ gateway }),
});

app.http("graph-write", {
  methods: ["POST"],
  authLevel: "function",
  handler: createGraphWriteHandler({ coordinator }),
});
```

---

## Development

```bash
npm run clean
npm install
npm run lint
npm run typecheck
npm run test:coverage
npm run build
```

---

## Architecture

- Package ADRs: [`docs/adrs`](./docs/adrs)
- Cross-package ADRs: `plasius-ltd-site/docs/adrs/adr-0020` to `adr-0024`

---

## License

Licensed under the [Apache-2.0 License](./LICENSE).
