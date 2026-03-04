import { relayEnvironment } from "./environment.ts";

function inferOperationKind(query) {
  const operationSource = String(query || "").trim();
  const match = operationSource.match(/^(query|mutation|subscription)\b/i);
  if (!match) {
    return "query";
  }
  return match[1].toLowerCase();
}

function inferOperationName(query, operationKind) {
  const operationSource = String(query || "").trim();
  const match = operationSource.match(/^(query|mutation|subscription)\s+([A-Za-z0-9_]+)/i);
  if (match?.[2]) {
    return match[2];
  }
  const kind = operationKind || inferOperationKind(query);
  if (kind === "mutation") {
    return "AnonymousMutation";
  }
  if (kind === "subscription") {
    return "AnonymousSubscription";
  }
  return "AnonymousQuery";
}

function createRequestParameters(query, operationKind) {
  return {
    id: null,
    cacheID: null,
    metadata: {},
    name: inferOperationName(query, operationKind),
    operationKind,
    text: query,
  };
}

function toGraphQLError(errorPayload) {
  if (errorPayload instanceof Error) {
    return errorPayload;
  }
  const message = typeof errorPayload === "string" && errorPayload.trim()
    ? errorPayload
    : "GraphQL request failed.";
  return new Error(message);
}

function toGraphQLPayloadError(payload) {
  const errors = Array.isArray(payload?.errors) ? payload.errors : [];
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
}) {
  const kind = operationKind || inferOperationKind(query);
  const params = createRequestParameters(query, kind);

  return new Promise((resolve, reject) => {
    let latestPayload = null;
    relayEnvironment
      .getNetwork()
      .execute(params, variables || {}, { force: Boolean(force) }, null)
      .subscribe({
        next: (payload) => {
          latestPayload = payload;
        },
        error: (error) => {
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
}) {
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

  return payload?.data || {};
}

export function subscribeRelayGraphQL({
  query,
  variables,
  onData,
  onError,
}) {
  const params = createRequestParameters(query, "subscription");
  const subscription = relayEnvironment
    .getNetwork()
    .execute(params, variables || {}, { force: true }, null)
    .subscribe({
      next: (payload) => {
        const payloadError = toGraphQLPayloadError(payload);
        if (payloadError) {
          onError?.(payloadError);
          return;
        }
        onData?.(payload?.data || {});
      },
      error: (error) => {
        onError?.(toGraphQLError(error));
      },
    });

  return () => {
    subscription.unsubscribe();
  };
}
