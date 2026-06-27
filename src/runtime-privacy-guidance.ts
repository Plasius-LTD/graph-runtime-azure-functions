export interface RuntimePrivacyGuidance {
  /**
   * Stable identifier for this guidance rule.
   */
  readonly id: string;
  /**
   * Adapter surface the rule applies to.
   */
  readonly surface: "telemetry" | "error-response" | "success-response";
  /**
   * Short description of the privacy boundary.
   */
  readonly summary: string;
  /**
   * Data that is safe for this adapter surface to emit.
   */
  readonly allowedData: readonly string[];
  /**
   * Data that must not be emitted by this adapter surface.
   */
  readonly disallowedData: readonly string[];
  /**
   * Follow-up responsibility for the host or upstream package.
   */
  readonly hostResponsibility: string;
}

/**
 * Baseline runtime privacy guidance for Azure Functions graph handlers.
 *
 * The adapter owns boundary validation, bounded error translation, and
 * telemetry minimization. Successful graph payloads remain an authorized data
 * surface from the upstream gateway/coordinator, so hosts still own domain
 * payload minimization before the response reaches this package.
 */
export const GRAPH_RUNTIME_AZURE_FUNCTIONS_PRIVACY_GUIDANCE: readonly RuntimePrivacyGuidance[] = [
  {
    id: "telemetry-minimization",
    surface: "telemetry",
    summary:
      "Emit only generic handler outcome data so operational telemetry never serializes graph request or response payloads.",
    allowedData: [
      "handler source",
      "stable error code",
      "generic translated message",
      "latency and outcome metrics",
    ],
    disallowedData: [
      "request bodies",
      "query resolver params",
      "write payloads",
      "graph result data",
      "upstream exception text",
      "raw identity or credential material",
    ],
    hostResponsibility:
      "Keep custom TelemetrySink implementations aligned with the same minimal schema and do not append request/response payload serialization downstream.",
  },
  {
    id: "bounded-error-responses",
    surface: "error-response",
    summary:
      "Validation, authorization, and upstream failure responses stay bounded to stable codes plus translated generic messages.",
    allowedData: [
      "HTTP status",
      "stable error code",
      "translation key",
      "generic default message",
    ],
    disallowedData: [
      "exception stack traces",
      "raw upstream failure messages",
      "graph payload fragments",
      "transport-specific diagnostics",
    ],
    hostResponsibility:
      "Map internal diagnostics to secure server-side evidence stores instead of attempting to return them through the public handler response body.",
  },
  {
    id: "authorized-success-payloads",
    surface: "success-response",
    summary:
      "Successful 200/202 responses pass through authorized graph data and operation state, so minimization must happen before the gateway/coordinator returns it.",
    allowedData: [
      "authorized graph query results",
      "authorized write operation state",
      "bounded cache-control headers",
    ],
    disallowedData: [
      "secret material",
      "raw auth/session tokens",
      "unredacted personal data that the caller should not receive",
    ],
    hostResponsibility:
      "Ensure upstream graph resolvers and write coordinators omit or redact sensitive fields before they hand results to the runtime adapter.",
  },
] as const;
