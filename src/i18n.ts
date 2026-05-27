import { graphRuntimeAzureFunctionsEnGbTranslations } from "./translations/en-GB.js";

export const graphRuntimeAzureFunctionsTranslationKeys = {
  requestBodyTooLargeMessage:
    "graphRuntimeAzureFunctions.error.requestBodyTooLarge.message",
  authorizerRequiredMessage:
    "graphRuntimeAzureFunctions.error.authorizerRequired.message",
  forbiddenMessage: "graphRuntimeAzureFunctions.error.forbidden.message",
  readRequestInvalidMessage:
    "graphRuntimeAzureFunctions.error.readRequestInvalid.message",
  readUpstreamFailedMessage:
    "graphRuntimeAzureFunctions.error.readUpstreamFailed.message",
  writeRequestInvalidMessage:
    "graphRuntimeAzureFunctions.error.writeRequestInvalid.message",
  writeUpstreamFailedMessage:
    "graphRuntimeAzureFunctions.error.writeUpstreamFailed.message",
} as const;

export type GraphRuntimeAzureFunctionsTranslationKey =
  (typeof graphRuntimeAzureFunctionsTranslationKeys)[keyof typeof graphRuntimeAzureFunctionsTranslationKeys];

export const graphRuntimeAzureFunctionsErrorCodes = {
  requestBodyTooLarge: "GRAPH_REQUEST_BODY_TOO_LARGE",
  authorizerRequired: "GRAPH_AUTHORIZER_REQUIRED",
  forbidden: "GRAPH_FORBIDDEN",
  readRequestInvalid: "GRAPH_READ_REQUEST_INVALID",
  readUpstreamFailed: "GRAPH_READ_UPSTREAM_FAILED",
  writeRequestInvalid: "GRAPH_WRITE_REQUEST_INVALID",
  writeUpstreamFailed: "GRAPH_WRITE_UPSTREAM_FAILED",
} as const;

export type GraphRuntimeAzureFunctionsErrorCode =
  (typeof graphRuntimeAzureFunctionsErrorCodes)[keyof typeof graphRuntimeAzureFunctionsErrorCodes];

export const graphRuntimeAzureFunctionsErrorMessageKeysByCode = {
  [graphRuntimeAzureFunctionsErrorCodes.requestBodyTooLarge]:
    graphRuntimeAzureFunctionsTranslationKeys.requestBodyTooLargeMessage,
  [graphRuntimeAzureFunctionsErrorCodes.authorizerRequired]:
    graphRuntimeAzureFunctionsTranslationKeys.authorizerRequiredMessage,
  [graphRuntimeAzureFunctionsErrorCodes.forbidden]:
    graphRuntimeAzureFunctionsTranslationKeys.forbiddenMessage,
  [graphRuntimeAzureFunctionsErrorCodes.readRequestInvalid]:
    graphRuntimeAzureFunctionsTranslationKeys.readRequestInvalidMessage,
  [graphRuntimeAzureFunctionsErrorCodes.readUpstreamFailed]:
    graphRuntimeAzureFunctionsTranslationKeys.readUpstreamFailedMessage,
  [graphRuntimeAzureFunctionsErrorCodes.writeRequestInvalid]:
    graphRuntimeAzureFunctionsTranslationKeys.writeRequestInvalidMessage,
  [graphRuntimeAzureFunctionsErrorCodes.writeUpstreamFailed]:
    graphRuntimeAzureFunctionsTranslationKeys.writeUpstreamFailedMessage,
} as const satisfies Record<
  GraphRuntimeAzureFunctionsErrorCode,
  GraphRuntimeAzureFunctionsTranslationKey
>;

export { graphRuntimeAzureFunctionsEnGbTranslations };

export const graphRuntimeAzureFunctionsTranslations = {
  "en-GB": graphRuntimeAzureFunctionsEnGbTranslations,
} as const;

export function getGraphRuntimeAzureFunctionsDefaultTranslation(
  key: GraphRuntimeAzureFunctionsTranslationKey,
): string {
  return graphRuntimeAzureFunctionsEnGbTranslations[key] ?? key;
}
