import {
  Environment,
  Network,
  Observable,
  QueryResponseCache,
  RecordSource,
  Store,
} from "relay-runtime";
import { GRAPHQL_URL, GRAPHQL_WS_URL } from "../utils/constants.js";

// Keep cache short-lived so live chat/admin views remain fresh while still deduping bursts.
const QUERY_RESPONSE_CACHE_TTL_MS = 3_000;
const QUERY_RESPONSE_CACHE_SIZE = 200;

const queryResponseCache = new QueryResponseCache({
  size: QUERY_RESPONSE_CACHE_SIZE,
  ttl: QUERY_RESPONSE_CACHE_TTL_MS,
});

const inFlightQueryRequests = new Map();

function resolveOperationCacheKey(params) {
  return String(params?.id || params?.cacheID || params?.text || params?.name || "anonymous");
}

function resolveInFlightQueryKey(params, variables) {
  return `${resolveOperationCacheKey(params)}::${JSON.stringify(variables || {})}`;
}

function toGraphQLErrorMessage(payload, fallbackMessage) {
  const errors = Array.isArray(payload?.errors) ? payload.errors : [];
  if (errors.length === 0) {
    return fallbackMessage;
  }
  const firstError = errors[0];
  const firstMessage = typeof firstError?.message === "string"
    ? firstError.message.trim()
    : "";
  return firstMessage || fallbackMessage;
}

function normalizeOperationKind(rawKind) {
  const normalized = String(rawKind || "").trim().toLowerCase();
  if (normalized === "query" || normalized === "mutation" || normalized === "subscription") {
    return normalized;
  }
  return "query";
}

async function performHttpGraphQLRequest(params, variables, operationKind, cacheKey) {
  const queryText = typeof params?.text === "string" ? params.text : "";
  if (!queryText.trim()) {
    throw new Error(`Relay operation '${String(params?.name || "anonymous")}' is missing GraphQL query text.`);
  }

  const response = await fetch(GRAPHQL_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: queryText,
      variables: variables || {},
    }),
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(toGraphQLErrorMessage(payload, `GraphQL request failed (${response.status}).`));
  }

  if (operationKind === "query" && !Array.isArray(payload?.errors)) {
    queryResponseCache.set(cacheKey, variables || {}, payload);
  }

  if (operationKind === "mutation") {
    // Mutation responses can invalidate many list queries; clear query cache eagerly.
    queryResponseCache.clear();
  }

  return payload;
}

function fetchGraphQL(params, variables, cacheConfig) {
  const operationKind = normalizeOperationKind(params?.operationKind);
  const isQuery = operationKind === "query";
  const forceFetch = Boolean(cacheConfig?.force);
  const cacheKey = resolveOperationCacheKey(params);

  if (isQuery && !forceFetch) {
    const cachedResponse = queryResponseCache.get(cacheKey, variables || {});
    if (cachedResponse) {
      return Promise.resolve(cachedResponse);
    }

    const inFlightKey = resolveInFlightQueryKey(params, variables || {});
    const existingInFlightRequest = inFlightQueryRequests.get(inFlightKey);
    if (existingInFlightRequest) {
      return existingInFlightRequest;
    }

    const requestPromise = performHttpGraphQLRequest(params, variables, operationKind, cacheKey)
      .finally(() => {
        inFlightQueryRequests.delete(inFlightKey);
      });
    inFlightQueryRequests.set(inFlightKey, requestPromise);
    return requestPromise;
  }

  return performHttpGraphQLRequest(params, variables, operationKind, cacheKey);
}

function subscribeGraphQL(params, variables) {
  return Observable.create((sink) => {
    if (typeof window === "undefined" || typeof WebSocket === "undefined") {
      sink.error(new Error("WebSocket subscriptions are unavailable in this environment."));
      return () => {};
    }

    const endpoint = String(GRAPHQL_WS_URL || "").trim();
    if (!endpoint) {
      sink.error(new Error("Missing GraphQL WebSocket endpoint."));
      return () => {};
    }

    const queryText = typeof params?.text === "string" ? params.text : "";
    if (!queryText.trim()) {
      sink.error(new Error("Subscription request is missing GraphQL query text."));
      return () => {};
    }

    const operationId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const socket = new WebSocket(endpoint, "graphql-transport-ws");
    let isClosedByClient = false;
    let hasStartedOperation = false;

    const toError = (rawError) => {
      if (rawError instanceof Error) {
        return rawError;
      }
      if (Array.isArray(rawError) && rawError.length > 0) {
        const firstError = rawError[0];
        const message = typeof firstError?.message === "string"
          ? firstError.message
          : JSON.stringify(firstError);
        return new Error(message || "GraphQL subscription error.");
      }
      const message = typeof rawError === "string" && rawError.trim()
        ? rawError
        : "GraphQL subscription error.";
      return new Error(message);
    };

    const handleOpen = () => {
      socket.send(JSON.stringify({ type: "connection_init" }));
    };

    const handleMessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        switch (payload?.type) {
          case "connection_ack":
            if (hasStartedOperation) {
              return;
            }
            hasStartedOperation = true;
            socket.send(
              JSON.stringify({
                id: operationId,
                type: "subscribe",
                payload: {
                  query: queryText,
                  variables: variables || {},
                },
              }),
            );
            return;
          case "next":
            if (payload?.id === operationId) {
              sink.next(payload?.payload || {});
            }
            return;
          case "error":
            if (payload?.id === operationId) {
              sink.error(toError(payload?.payload));
            }
            return;
          case "ping":
            socket.send(JSON.stringify({ type: "pong" }));
            return;
          case "complete":
            if (payload?.id === operationId) {
              sink.complete();
            }
            return;
          default:
            return;
        }
      } catch (error) {
        sink.error(toError(error));
      }
    };

    const handleSocketError = () => {
      sink.error(new Error("Subscription socket error."));
    };

    const handleClose = () => {
      if (!isClosedByClient) {
        sink.error(new Error("Subscription socket closed unexpectedly."));
      }
    };

    socket.addEventListener("open", handleOpen);
    socket.addEventListener("message", handleMessage);
    socket.addEventListener("error", handleSocketError);
    socket.addEventListener("close", handleClose);

    return () => {
      isClosedByClient = true;

      socket.removeEventListener("open", handleOpen);
      socket.removeEventListener("message", handleMessage);
      socket.removeEventListener("error", handleSocketError);
      socket.removeEventListener("close", handleClose);

      if (socket.readyState === WebSocket.OPEN) {
        if (hasStartedOperation) {
          socket.send(
            JSON.stringify({
              id: operationId,
              type: "complete",
            }),
          );
        }
        socket.close(1000);
      } else if (socket.readyState === WebSocket.CONNECTING) {
        socket.close(1000);
      }
    };
  });
}

export const relayEnvironment = new Environment({
  network: Network.create(fetchGraphQL, subscribeGraphQL),
  store: new Store(new RecordSource(), {
    gcReleaseBufferSize: 25,
  }),
});

export function clearRelayQueryCache() {
  queryResponseCache.clear();
}
