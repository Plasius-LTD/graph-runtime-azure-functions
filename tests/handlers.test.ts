import { describe, expect, it, vi } from "vitest";

import { createGraphReadHandler, createGraphWriteHandler } from "../src/handlers.js";

describe("createGraphReadHandler", () => {
  it("maps request body to gateway execute", async () => {
    const telemetry = {
      metric: vi.fn(),
      error: vi.fn(),
      trace: vi.fn(),
    };
    const handler = createGraphReadHandler({
      gateway: {
        async execute(query) {
          return {
            queryId: query.id,
            partial: false,
            stale: false,
            generatedAtEpochMs: 1,
            results: {},
            errors: [],
          };
        },
      },
      telemetry,
    });

    const response = await handler(
      {
        async json() {
          return {
            id: "q1",
            requests: [],
          };
        },
      } as any,
      {
        traceContext: {
          traceParent: "trace-1",
        },
      } as any,
    );

    expect(response.status).toBe(200);
    expect((response as any).jsonBody.queryId).toBe("q1");
    expect(telemetry.metric).toHaveBeenCalledWith(
      expect.objectContaining({ name: "graph.runtime.read.request" }),
    );
    expect(telemetry.metric).toHaveBeenCalledWith(
      expect.objectContaining({ name: "graph.runtime.read.latency" }),
    );
  });

  it("returns 400 when read request is invalid", async () => {
    const telemetry = {
      metric: vi.fn(),
      error: vi.fn(),
      trace: vi.fn(),
    };
    const handler = createGraphReadHandler({
      gateway: {
        async execute() {
          throw new Error("should not run");
        },
      },
      telemetry,
    });

    const response = await handler(
      {
        async json() {
          throw new Error("bad payload");
        },
      } as any,
      {} as any,
    );

    expect(response.status).toBe(400);
    expect((response as any).jsonBody.code).toBe("GRAPH_READ_REQUEST_INVALID");
    expect(telemetry.metric).toHaveBeenCalledWith(
      expect.objectContaining({ name: "graph.runtime.read.error" }),
    );
    expect(telemetry.error).toHaveBeenCalledWith(
      expect.objectContaining({ code: "GRAPH_READ_REQUEST_INVALID" }),
    );
  });

  it("returns 403 when read authorization fails", async () => {
    const handler = createGraphReadHandler({
      gateway: {
        async execute() {
          throw new Error("should not run");
        },
      },
      authorize: () => false,
    });

    const response = await handler(
      {
        async json() {
          return {
            requests: [],
          };
        },
      } as any,
      {} as any,
    );

    expect(response.status).toBe(403);
    expect((response as any).jsonBody.code).toBe("GRAPH_FORBIDDEN");
  });

  it("returns 413 when read payload exceeds configured limit", async () => {
    const handler = createGraphReadHandler({
      gateway: {
        async execute() {
          throw new Error("should not run");
        },
      },
      maxBodyBytes: 8,
    });

    const response = await handler(
      {
        headers: {
          get(name: string) {
            return name === "content-length" ? "100" : null;
          },
        },
        async json() {
          return {
            requests: [],
          };
        },
      } as any,
      {} as any,
    );

    expect(response.status).toBe(413);
    expect((response as any).jsonBody.code).toBe("GRAPH_REQUEST_BODY_TOO_LARGE");
  });

  it("returns 502 when gateway execution fails", async () => {
    const handler = createGraphReadHandler({
      gateway: {
        async execute() {
          throw new Error("dependency down");
        },
      },
    });

    const response = await handler(
      {
        async json() {
          return {
            requests: [{ resolver: "user.profile", key: "user_1" }],
          };
        },
      } as any,
      {} as any,
    );

    expect(response.status).toBe(502);
    expect((response as any).jsonBody.code).toBe("GRAPH_READ_UPSTREAM_FAILED");
  });
});

describe("createGraphWriteHandler", () => {
  it("returns 202 for queued write operation", async () => {
    const telemetry = {
      metric: vi.fn(),
      error: vi.fn(),
      trace: vi.fn(),
    };
    const handler = createGraphWriteHandler({
      coordinator: {
        async submit() {
          return {
            operationId: "op_1",
            state: "queued",
            partitionKey: "pk",
            aggregateKey: "agg",
            acceptedAtEpochMs: 1,
            updatedAtEpochMs: 1,
          };
        },
      },
      telemetry,
    });

    const response = await handler(
      {
        async json() {
          return {
            idempotencyKey: "idk",
            partitionKey: "pk",
            aggregateKey: "agg",
            payload: {},
            submittedAtEpochMs: 1,
          };
        },
      } as any,
      {} as any,
    );

    expect(response.status).toBe(202);
    expect((response as any).jsonBody.operationId).toBe("op_1");
    expect(telemetry.metric).toHaveBeenCalledWith(
      expect.objectContaining({ name: "graph.runtime.write.request" }),
    );
    expect(telemetry.metric).toHaveBeenCalledWith(
      expect.objectContaining({ name: "graph.runtime.write.latency" }),
    );
  });

  it("returns 200 for succeeded write operation", async () => {
    const handler = createGraphWriteHandler({
      coordinator: {
        async submit() {
          return {
            operationId: "op_2",
            state: "succeeded",
            partitionKey: "pk",
            aggregateKey: "agg",
            acceptedAtEpochMs: 1,
            updatedAtEpochMs: 1,
            resultVersion: 2,
          };
        },
      },
    });

    const response = await handler(
      {
        async json() {
          return {
            idempotencyKey: "idk",
            partitionKey: "pk",
            aggregateKey: "agg",
            payload: {},
            submittedAtEpochMs: 1,
          };
        },
      } as any,
      {} as any,
    );

    expect(response.status).toBe(200);
    expect((response as any).jsonBody.operationId).toBe("op_2");
  });

  it("returns 503 when write submit fails", async () => {
    const telemetry = {
      metric: vi.fn(),
      error: vi.fn(),
      trace: vi.fn(),
    };
    const handler = createGraphWriteHandler({
      coordinator: {
        async submit() {
          throw new Error("write failed");
        },
      },
      telemetry,
    });

    const response = await handler(
      {
        async json() {
          return {
            idempotencyKey: "idk",
            partitionKey: "pk",
            aggregateKey: "agg",
            payload: {},
            submittedAtEpochMs: 1,
          };
        },
      } as any,
      {} as any,
    );

    expect(response.status).toBe(503);
    expect((response as any).jsonBody.code).toBe("GRAPH_WRITE_UPSTREAM_FAILED");
    expect(telemetry.metric).toHaveBeenCalledWith(
      expect.objectContaining({ name: "graph.runtime.write.error" }),
    );
    expect(telemetry.error).toHaveBeenCalledWith(
      expect.objectContaining({ code: "GRAPH_WRITE_UPSTREAM_FAILED" }),
    );
  });

  it("returns 400 when write request schema is invalid", async () => {
    const handler = createGraphWriteHandler({
      coordinator: {
        async submit() {
          throw new Error("should not run");
        },
      },
    });

    const response = await handler(
      {
        async json() {
          return {
            idempotencyKey: "bad key",
            partitionKey: "pk",
            aggregateKey: "agg",
            payload: {},
            submittedAtEpochMs: 1,
          };
        },
      } as any,
      {} as any,
    );

    expect(response.status).toBe(400);
    expect((response as any).jsonBody.code).toBe("GRAPH_WRITE_REQUEST_INVALID");
  });

  it("returns 403 when write authorization fails", async () => {
    const handler = createGraphWriteHandler({
      coordinator: {
        async submit() {
          throw new Error("should not run");
        },
      },
      authorize: () => false,
    });

    const response = await handler(
      {
        async json() {
          return {
            idempotencyKey: "idk",
            partitionKey: "pk",
            aggregateKey: "agg",
            payload: {},
            submittedAtEpochMs: 1,
          };
        },
      } as any,
      {} as any,
    );

    expect(response.status).toBe(403);
    expect((response as any).jsonBody.code).toBe("GRAPH_FORBIDDEN");
  });

  it("returns 413 when write payload exceeds configured limit", async () => {
    const handler = createGraphWriteHandler({
      coordinator: {
        async submit() {
          throw new Error("should not run");
        },
      },
      maxBodyBytes: 8,
    });

    const response = await handler(
      {
        headers: {
          get(name: string) {
            return name === "content-length" ? "100" : null;
          },
        },
        async json() {
          return {
            idempotencyKey: "idk",
            partitionKey: "pk",
            aggregateKey: "agg",
            payload: {},
            submittedAtEpochMs: 1,
          };
        },
      } as any,
      {} as any,
    );

    expect(response.status).toBe(413);
    expect((response as any).jsonBody.code).toBe("GRAPH_REQUEST_BODY_TOO_LARGE");
  });

  it("returns 400 when write body cannot be parsed", async () => {
    const handler = createGraphWriteHandler({
      coordinator: {
        async submit() {
          throw new Error("should not run");
        },
      },
    });

    const response = await handler(
      {
        async json() {
          throw new Error("bad payload");
        },
      } as any,
      {} as any,
    );

    expect(response.status).toBe(400);
    expect((response as any).jsonBody.code).toBe("GRAPH_WRITE_REQUEST_INVALID");
  });

  it("returns 400 when read schema is invalid", async () => {
    const handler = createGraphReadHandler({
      gateway: {
        async execute() {
          throw new Error("should not run");
        },
      },
    });

    const response = await handler(
      {
        async json() {
          return {
            requests: "bad",
          };
        },
      } as any,
      {} as any,
    );

    expect(response.status).toBe(400);
    expect((response as any).jsonBody.code).toBe("GRAPH_READ_REQUEST_INVALID");
  });

  it("returns 400 when read body cannot be parsed", async () => {
    const handler = createGraphReadHandler({
      gateway: {
        async execute() {
          throw new Error("should not run");
        },
      },
    });

    const response = await handler(
      {
        async json() {
          throw new Error("bad payload");
        },
      } as any,
      {} as any,
    );

    expect(response.status).toBe(400);
    expect((response as any).jsonBody.code).toBe("GRAPH_READ_REQUEST_INVALID");
  });

  it("passes context to authorization callback", async () => {
    const authorize = vi.fn(() => true);
    const handler = createGraphWriteHandler({
      coordinator: {
        async submit() {
          return {
            operationId: "op_3",
            state: "queued",
            partitionKey: "pk",
            aggregateKey: "agg",
            acceptedAtEpochMs: 1,
            updatedAtEpochMs: 1,
          };
        },
      },
      authorize,
    });

    await handler(
      {
        async json() {
          return {
            idempotencyKey: "idk",
            partitionKey: "pk",
            aggregateKey: "agg",
            payload: {},
            submittedAtEpochMs: 1,
          };
        },
      } as any,
      { invocationId: "inv_1" } as any,
    );

    expect(authorize).toHaveBeenCalledWith(
      expect.objectContaining({
        operation: "write",
        context: expect.objectContaining({ invocationId: "inv_1" }),
      }),
    );
  });
});
