import type { HttpHandler, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import type { GraphQuery, TelemetrySink, WriteCommand } from "@plasius/graph-contracts";
import type { GraphGateway } from "@plasius/graph-gateway-core";
import type { WriteCoordinator } from "@plasius/graph-write-coordinator";

export interface GraphReadHandlerOptions {
  gateway: Pick<GraphGateway, "execute">;
  telemetry?: TelemetrySink;
}

export interface GraphWriteHandlerOptions {
  coordinator: Pick<WriteCoordinator, "submit">;
  telemetry?: TelemetrySink;
}

const jsonResponse = (status: number, body: unknown): HttpResponseInit => ({
  status,
  jsonBody: body,
  headers: {
    "content-type": "application/json",
    "cache-control": "no-store",
  },
});

export const createGraphReadHandler = (options: GraphReadHandlerOptions): HttpHandler => {
  return async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
    const startedAt = Date.now();
    options.telemetry?.metric({
      name: "graph.runtime.read.request",
      value: 1,
      unit: "count",
    });
    try {
      const query = (await request.json()) as GraphQuery;
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
      const message = error instanceof Error ? error.message : "Invalid read request";
      options.telemetry?.metric({
        name: "graph.runtime.read.error",
        value: 1,
        unit: "count",
      });
      options.telemetry?.error({
        message,
        source: "graph-runtime-azure-functions.read",
        code: "GRAPH_READ_REQUEST_INVALID",
      });
      return jsonResponse(400, {
        code: "GRAPH_READ_REQUEST_INVALID",
        message,
      });
    }
  };
};

export const createGraphWriteHandler = (options: GraphWriteHandlerOptions): HttpHandler => {
  return async (request: HttpRequest): Promise<HttpResponseInit> => {
    const startedAt = Date.now();
    options.telemetry?.metric({
      name: "graph.runtime.write.request",
      value: 1,
      unit: "count",
    });
    try {
      const command = (await request.json()) as WriteCommand;
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
      const message = error instanceof Error ? error.message : "Invalid write request";
      options.telemetry?.metric({
        name: "graph.runtime.write.error",
        value: 1,
        unit: "count",
      });
      options.telemetry?.error({
        message,
        source: "graph-runtime-azure-functions.write",
        code: "GRAPH_WRITE_REQUEST_INVALID",
      });
      return jsonResponse(400, {
        code: "GRAPH_WRITE_REQUEST_INVALID",
        message,
      });
    }
  };
};
