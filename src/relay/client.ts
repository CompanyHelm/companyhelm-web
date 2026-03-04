import type { GraphQLResponse, RequestParameters, Variables } from "relay-runtime";
import { relayEnvironment } from "./environment.ts";

type OperationKind = RequestParameters["operationKind"];

interface GraphQLPayloadError {
  message?: string;
}

interface GraphQLPayload {
  data?: Record<string, unknown> | null;
  errors?: GraphQLPayloadError[];
}

interface RelayExecuteOptions {
  query: string;
  variables?: Variables;
  operationKind?: OperationKind;
  force?: boolean;
}

interface RelaySubscribeOptions {
  query: string;
  variables?: Variables;
  onData?: (data: Record<string, unknown>) => void;
  onError?: (error: Error) => void;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}

function toRecord(value: unknown): Record<string, unknown> {
  return isRecord(value) ? value : {};
}

function inferOperationKind(query: string): OperationKind {
  const operationSource = String(query || "").trim();
  const match = operationSource.match(/^(query|mutation|subscription)\b/i);
  if (!match) {
    return "query";
  }
  const matchKind = match[1]?.toLowerCase();
  if (matchKind === "mutation") {
    return "mutation";
  }
  if (matchKind === "subscription") {
    return "subscription";
  }
  return "query";
}

function inferOperationName(query: string, operationKind: OperationKind): string {
  const operationSource = String(query || "").trim();
  const match = operationSource.match(/^(query|mutation|subscription)\s+([A-Za-z0-9_]+)/i);
  if (match?.[2]) {
    return match[2];
  }
  if (operationKind === "mutation") {
    return "AnonymousMutation";
  }
  if (operationKind === "subscription") {
    return "AnonymousSubscription";
  }
  return "AnonymousQuery";
}

function createRequestParameters(query: string, operationKind: OperationKind): RequestParameters {
  const operationName = inferOperationName(query, operationKind);
  return {
    id: null,
    cacheID: `${operationKind}:${operationName}`,
    metadata: {},
    name: operationName,
    operationKind,
    text: query,
  };
}

function toGraphQLError(errorPayload: unknown): Error {
  if (errorPayload instanceof Error) {
    return errorPayload;
  }
  const message = typeof errorPayload === "string" && errorPayload.trim()
    ? errorPayload
    : "GraphQL request failed.";
  return new Error(message);
}

function toGraphQLPayload(rawPayload: GraphQLResponse | null | undefined): GraphQLPayload {
  if (!rawPayload) {
    return {};
  }
  const singularPayload = Array.isArray(rawPayload) ? rawPayload[0] : rawPayload;
  if (!singularPayload || typeof singularPayload !== "object") {
    return {};
  }
  return singularPayload as GraphQLPayload;
}

function toGraphQLPayloadError(payload: GraphQLPayload): Error | null {
  const errors = Array.isArray(payload.errors) ? payload.errors : [];
  if (errors.length === 0) {
    return null;
  }
  const firstError = errors[0];
  const firstMessage = typeof firstError?.message === "string"
    ? firstError.message.trim()
    : "";
  return new Error(firstMessage || "GraphQL request failed.");
}

function executeRelayOperation({
  query,
  variables,
  operationKind,
  force,
}: RelayExecuteOptions): Promise<GraphQLPayload> {
  const kind = operationKind || inferOperationKind(query);
  const params = createRequestParameters(query, kind);

  return new Promise((resolve, reject) => {
    let latestPayload: GraphQLPayload | null = null;
    relayEnvironment
      .getNetwork()
      .execute(params, variables || {}, { force: Boolean(force) }, null)
      .subscribe({
        next: (payload) => {
          latestPayload = toGraphQLPayload(payload);
        },
        error: (error: unknown) => {
          reject(toGraphQLError(error));
        },
        complete: () => {
          resolve(latestPayload || { data: null });
        },
      });
  });
}

export async function executeRelayGraphQL({
  query,
  variables,
  operationKind,
  force = false,
}: RelayExecuteOptions): Promise<Record<string, unknown>> {
  const payload = await executeRelayOperation({
    query,
    variables,
    operationKind,
    force,
  });

  const payloadError = toGraphQLPayloadError(payload);
  if (payloadError) {
    throw payloadError;
  }

  return toRecord(payload.data);
}

export function subscribeRelayGraphQL({
  query,
  variables,
  onData,
  onError,
}: RelaySubscribeOptions): () => void {
  const params = createRequestParameters(query, "subscription");
  const subscription = relayEnvironment
    .getNetwork()
    .execute(params, variables || {}, { force: true }, null)
    .subscribe({
      next: (payload) => {
        const normalizedPayload = toGraphQLPayload(payload);
        const payloadError = toGraphQLPayloadError(normalizedPayload);
        if (payloadError) {
          onError?.(payloadError);
          return;
        }
        onData?.(toRecord(normalizedPayload.data));
      },
      error: (error: unknown) => {
        onError?.(toGraphQLError(error));
      },
    });

  return () => {
    subscription.unsubscribe();
  };
}
