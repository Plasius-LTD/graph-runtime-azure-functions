import type { GraphRuntimeAzureFunctionsTranslationKey } from "../i18n.js";

export const graphRuntimeAzureFunctionsEnGbTranslations = {
  "graphRuntimeAzureFunctions.error.requestBodyTooLarge.message":
    "Request payload exceeds allowed limit.",
  "graphRuntimeAzureFunctions.error.authorizerRequired.message":
    "Graph handler authorization is not configured.",
  "graphRuntimeAzureFunctions.error.forbidden.message": "Forbidden",
  "graphRuntimeAzureFunctions.error.readRequestInvalid.message":
    "Invalid graph read request.",
  "graphRuntimeAzureFunctions.error.readUpstreamFailed.message":
    "Graph read failed.",
  "graphRuntimeAzureFunctions.error.writeRequestInvalid.message":
    "Invalid graph write request.",
  "graphRuntimeAzureFunctions.error.writeUpstreamFailed.message":
    "Graph write failed.",
} as const satisfies Record<GraphRuntimeAzureFunctionsTranslationKey, string>;
