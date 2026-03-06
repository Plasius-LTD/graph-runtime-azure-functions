import type { HttpHandler, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { isGraphQuery, type GraphQuery, type TelemetrySink, type WriteCommand } from "@plasius/graph-contracts";
import type { GraphGateway } from "@plasius/graph-gateway-core";
import type { WriteCoordinator } from "@plasius/graph-write-coordinator";

export interface HandlerAuthContext {
  operation: "read" | "write";
  request: HttpRequest;
  context: InvocationContext;
}

export type AuthorizeHandler = (context: HandlerAuthContext) => Promise<boolean> | boolean;

export interface GraphReadHandlerOptions {
  gateway: Pick<GraphGateway, "execute">;
  telemetry?: TelemetrySink;
  authorize?: AuthorizeHandler;
  maxBodyBytes?: number;
}

export interface GraphWriteHandlerOptions {
  coordinator: Pick<WriteCoordinator, "submit">;
  telemetry?: TelemetrySink;
  authorize?: AuthorizeHandler;
  maxBodyBytes?: number;
}

const DEFAULT_MAX_BODY_BYTES = 64 * 1024;

const isObject = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);

const isSafeKey = (value: string): boolean => /^[A-Za-z0-9:_-]+$/.test(value);

const isWriteCommandPayloadValid = (value: unknown): value is WriteCommand => {
  if (!isObject(value)) {
    return false;
  }

  if (
    typeof value.idempotencyKey !== "string"
    || value.idempotencyKey.length === 0
    || value.idempotencyKey.length > 128
    || !isSafeKey(value.idempotencyKey)
  ) {
    return false;
  }

  if (
    typeof value.partitionKey !== "string"
    || value.partitionKey.length === 0
    || value.partitionKey.length > 128
    || !isSafeKey(value.partitionKey)
  ) {
    return false;
  }

  if (
    typeof value.aggregateKey !== "string"
    || value.aggregateKey.length === 0
    || value.aggregateKey.length > 256
    || !isSafeKey(value.aggregateKey)
  ) {
    return false;
  }

  if (!isObject(value.payload)) {
    return false;
  }

  if (typeof value.submittedAtEpochMs !== "number" || !Number.isFinite(value.submittedAtEpochMs) || value.submittedAtEpochMs < 0) {
    return false;
  }

  return value.actorId === undefined || (typeof value.actorId === "string" && value.actorId.length > 0 && value.actorId.length <= 128);
};

class HandlerValidationError extends Error {
  public readonly status: number;
  public readonly code: string;

  public constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

const jsonResponse = (status: number, body: unknown): HttpResponseInit => ({
  status,
  jsonBody: body,
  headers: {
    "content-type": "application/json",
    "cache-control": "no-store",
  },
});

const getContentLength = (request: HttpRequest): number | null => {
  const raw = request.headers?.get?.("content-length");
  if (!raw) {
    return null;
  }

  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return null;
  }

  return parsed;
};

const enforceBodyLimit = (request: HttpRequest, maxBodyBytes: number): void => {
  const contentLength = getContentLength(request);
  if (contentLength !== null && contentLength > maxBodyBytes) {
    throw new HandlerValidationError(413, "GRAPH_REQUEST_BODY_TOO_LARGE", "Request payload exceeds allowed limit.");
  }
};

const enforceAuthorization = async (
  authorize: AuthorizeHandler | undefined,
  operation: "read" | "write",
  request: HttpRequest,
  context: InvocationContext,
): Promise<void> => {
  if (!authorize) {
    return;
  }

  const allowed = await authorize({ operation, request, context });
  if (!allowed) {
    throw new HandlerValidationError(403, "GRAPH_FORBIDDEN", "Forbidden");
  }
};

export const createGraphReadHandler = (options: GraphReadHandlerOptions): HttpHandler => {
  return async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
    const startedAt = Date.now();
    options.telemetry?.metric({
      name: "graph.runtime.read.request",
      value: 1,
      unit: "count",
    });
    try {
      const maxBodyBytes = options.maxBodyBytes ?? DEFAULT_MAX_BODY_BYTES;
      enforceBodyLimit(request, maxBodyBytes);
      await enforceAuthorization(options.authorize, "read", request, context);

      let rawBody: unknown;
      try {
        rawBody = await request.json();
      } catch {
        throw new HandlerValidationError(400, "GRAPH_READ_REQUEST_INVALID", "Invalid graph read request.");
      }
      if (!isGraphQuery(rawBody)) {
        throw new HandlerValidationError(400, "GRAPH_READ_REQUEST_INVALID", "Invalid graph read request.");
      }

      const query = rawBody as GraphQuery;
      const result = await options.gateway.execute({
        ...query,
        traceId: query.traceId ?? context.traceContext?.traceParent,
      });
      options.telemetry?.metric({
        name: "graph.runtime.read.latency",
        value: Date.now() - startedAt,
        unit: "ms",
        tags: { status: "200" },
      });
      return jsonResponse(200, result);
    } catch (error) {
      if (error instanceof HandlerValidationError) {
        options.telemetry?.metric({
          name: "graph.runtime.read.error",
          value: 1,
          unit: "count",
          tags: { code: error.code },
        });
        options.telemetry?.error({
          message: error.message,
          source: "graph-runtime-azure-functions.read",
          code: error.code,
        });
        return jsonResponse(error.status, {
          code: error.code,
          message: error.message,
        });
      }

      options.telemetry?.metric({
        name: "graph.runtime.read.error",
        value: 1,
        unit: "count",
        tags: { code: "GRAPH_READ_UPSTREAM_FAILED" },
      });
      options.telemetry?.error({
        message: "Graph read failed",
        source: "graph-runtime-azure-functions.read",
        code: "GRAPH_READ_UPSTREAM_FAILED",
      });
      return jsonResponse(502, {
        code: "GRAPH_READ_UPSTREAM_FAILED",
        message: "Graph read failed.",
      });
    }
  };
};

export const createGraphWriteHandler = (options: GraphWriteHandlerOptions): HttpHandler => {
  return async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
    const startedAt = Date.now();
    options.telemetry?.metric({
      name: "graph.runtime.write.request",
      value: 1,
      unit: "count",
    });
    try {
      const maxBodyBytes = options.maxBodyBytes ?? DEFAULT_MAX_BODY_BYTES;
      enforceBodyLimit(request, maxBodyBytes);
      await enforceAuthorization(options.authorize, "write", request, context);

      let rawBody: unknown;
      try {
        rawBody = await request.json();
      } catch {
        throw new HandlerValidationError(400, "GRAPH_WRITE_REQUEST_INVALID", "Invalid graph write request.");
      }
      if (!isWriteCommandPayloadValid(rawBody)) {
        throw new HandlerValidationError(400, "GRAPH_WRITE_REQUEST_INVALID", "Invalid graph write request.");
      }

      const command = rawBody as WriteCommand;
      const operation = await options.coordinator.submit(command);
      const status = operation.state === "succeeded" ? 200 : 202;
      options.telemetry?.metric({
        name: "graph.runtime.write.latency",
        value: Date.now() - startedAt,
        unit: "ms",
        tags: {
          status: String(status),
          state: operation.state,
        },
      });
      return jsonResponse(status, operation);
    } catch (error) {
      if (error instanceof HandlerValidationError) {
        options.telemetry?.metric({
          name: "graph.runtime.write.error",
          value: 1,
          unit: "count",
          tags: { code: error.code },
        });
        options.telemetry?.error({
          message: error.message,
          source: "graph-runtime-azure-functions.write",
          code: error.code,
        });
        return jsonResponse(error.status, {
          code: error.code,
          message: error.message,
        });
      }

      options.telemetry?.metric({
        name: "graph.runtime.write.error",
        value: 1,
        unit: "count",
        tags: { code: "GRAPH_WRITE_UPSTREAM_FAILED" },
      });
      options.telemetry?.error({
        message: "Graph write failed",
        source: "graph-runtime-azure-functions.write",
        code: "GRAPH_WRITE_UPSTREAM_FAILED",
      });
      return jsonResponse(503, {
        code: "GRAPH_WRITE_UPSTREAM_FAILED",
        message: "Graph write failed.",
      });
    }
  };
};
