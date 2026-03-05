import type { HttpHandler, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import type { GraphQuery, WriteCommand } from "@plasius/graph-contracts";
import type { GraphGateway } from "@plasius/graph-gateway-core";
import type { WriteCoordinator } from "@plasius/graph-write-coordinator";

export interface GraphReadHandlerOptions {
  gateway: Pick<GraphGateway, "execute">;
}

export interface GraphWriteHandlerOptions {
  coordinator: Pick<WriteCoordinator, "submit">;
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
    try {
      const query = (await request.json()) as GraphQuery;
      const result = await options.gateway.execute({
        ...query,
        traceId: query.traceId ?? context.traceContext?.traceParent,
      });
      return jsonResponse(200, result);
    } catch (error) {
      return jsonResponse(400, {
        code: "GRAPH_READ_REQUEST_INVALID",
        message: error instanceof Error ? error.message : "Invalid read request",
      });
    }
  };
};

export const createGraphWriteHandler = (options: GraphWriteHandlerOptions): HttpHandler => {
  return async (request: HttpRequest): Promise<HttpResponseInit> => {
    try {
      const command = (await request.json()) as WriteCommand;
      const operation = await options.coordinator.submit(command);
      const status = operation.state === "succeeded" ? 200 : 202;
      return jsonResponse(status, operation);
    } catch (error) {
      return jsonResponse(400, {
        code: "GRAPH_WRITE_REQUEST_INVALID",
        message: error instanceof Error ? error.message : "Invalid write request",
      });
    }
  };
};
