import {
  Environment,
  Network,
  Observable,
  QueryResponseCache,
  RecordSource,
  Store,
} from "relay-runtime";
import { authProvider } from "../auth/runtime.js";
import { GRAPHQL_URL, GRAPHQL_WS_URL } from "../utils/constants.js";
import { getActiveCompanyId } from "../utils/company-context.js";

// Keep cache short-lived so live chat/admin views remain fresh while still deduping bursts.
const QUERY_RESPONSE_CACHE_TTL_MS = 3_000;
const QUERY_RESPONSE_CACHE_SIZE = 200;

const queryResponseCache = new QueryResponseCache({
  size: QUERY_RESPONSE_CACHE_SIZE,
  ttl: QUERY_RESPONSE_CACHE_TTL_MS,
});

const inFlightQueryRequests = new Map();
const JWT_EXPIRED_PATTERN = /\bjwt\b.*\bexpired\b/i;
const SUBSCRIPTION_RECONNECT_BASE_DELAY_MS = 300;
const SUBSCRIPTION_RECONNECT_MAX_DELAY_MS = 5000;

let sharedSubscriptionSocket = null;
let sharedSubscriptionSocketEndpoint = "";
let sharedSubscriptionSocketAcked = false;
let sharedSubscriptionReconnectAttempt = 0;
let sharedSubscriptionReconnectTimerId = null;
let sharedSubscriptionClosedByClient = false;
let nextSubscriptionOperationId = 0;
const activeSubscriptionOperations = new Map();

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

function getGraphQLErrorMessages(payload) {
  const errors = Array.isArray(payload?.errors) ? payload.errors : [];
  return errors
    .map((errorItem) => {
      const message = errorItem?.message;
      return typeof message === "string" ? message.trim() : "";
    })
    .filter(Boolean);
}

function isJwtExpiredErrorMessage(message) {
  return JWT_EXPIRED_PATTERN.test(String(message || ""));
}

function isJwtExpiredPayload(payload) {
  return getGraphQLErrorMessages(payload).some((message) => isJwtExpiredErrorMessage(message));
}

function handleAuthenticationFailure() {
  queryResponseCache.clear();
  if (typeof authProvider?.signOut === "function") {
    authProvider.signOut();
  }
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

  const headers = {
    "Content-Type": "application/json",
  };
  const authorization = authProvider.getAuthorizationHeaderValue();
  if (authorization) {
    headers.Authorization = authorization;
  }
  const activeCompanyId = getActiveCompanyId();
  if (activeCompanyId) {
    headers["x-company-id"] = activeCompanyId;
  }

  const response = await fetch(GRAPHQL_URL, {
    method: "POST",
    headers,
    body: JSON.stringify({
      query: queryText,
      variables: variables || {},
    }),
  });

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (response.status === 401 || isJwtExpiredPayload(payload)) {
    handleAuthenticationFailure();
  }

  if (!response.ok) {
    throw new Error(toGraphQLErrorMessage(payload, `GraphQL request failed (${response.status}).`));
  }
  if (!payload || typeof payload !== "object") {
    throw new Error("GraphQL request failed: invalid response payload.");
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

function toSubscriptionError(rawError) {
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
}

function clearSubscriptionReconnectTimer() {
  if (sharedSubscriptionReconnectTimerId !== null) {
    clearTimeout(sharedSubscriptionReconnectTimerId);
    sharedSubscriptionReconnectTimerId = null;
  }
}

function closeSharedSubscriptionSocket({ closeCode = 1000 } = {}) {
  clearSubscriptionReconnectTimer();
  sharedSubscriptionSocketAcked = false;

  const socket = sharedSubscriptionSocket;
  sharedSubscriptionSocket = null;
  sharedSubscriptionSocketEndpoint = "";
  if (!socket) {
    return;
  }
  sharedSubscriptionClosedByClient = true;
  if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
    socket.close(closeCode);
  }
}

function buildConnectionInitPayload() {
  const authorization = authProvider.getAuthorizationHeaderValue();
  const activeCompanyId = getActiveCompanyId();
  const headers = {};
  if (authorization) {
    headers.authorization = authorization;
  }
  if (activeCompanyId) {
    headers["x-company-id"] = activeCompanyId;
  }
  if (!authorization && !activeCompanyId) {
    return undefined;
  }
  return authorization
    ? {
        authorization,
        ...(activeCompanyId ? { "x-company-id": activeCompanyId } : {}),
        headers,
      }
    : {
        ...(activeCompanyId ? { "x-company-id": activeCompanyId } : {}),
        headers,
      };
}

function sendSubscriptionStart(operation) {
  if (!sharedSubscriptionSocket || sharedSubscriptionSocket.readyState !== WebSocket.OPEN || !sharedSubscriptionSocketAcked) {
    return;
  }
  sharedSubscriptionSocket.send(
    JSON.stringify({
      id: operation.id,
      type: "subscribe",
      payload: {
        query: operation.queryText,
        variables: operation.variables,
      },
    }),
  );
  operation.started = true;
}

function sendPendingSubscriptionStarts() {
  for (const operation of activeSubscriptionOperations.values()) {
    if (!operation.started) {
      sendSubscriptionStart(operation);
    }
  }
}

function scheduleSubscriptionReconnect(endpoint) {
  if (activeSubscriptionOperations.size === 0 || sharedSubscriptionReconnectTimerId !== null) {
    return;
  }

  const reconnectDelay = Math.min(
    SUBSCRIPTION_RECONNECT_BASE_DELAY_MS * (2 ** sharedSubscriptionReconnectAttempt),
    SUBSCRIPTION_RECONNECT_MAX_DELAY_MS,
  );
  sharedSubscriptionReconnectTimerId = setTimeout(() => {
    sharedSubscriptionReconnectTimerId = null;
    ensureSharedSubscriptionSocket(endpoint);
  }, reconnectDelay);
  sharedSubscriptionReconnectAttempt += 1;
}

function handleSocketPayload(payload) {
  switch (payload?.type) {
    case "connection_ack":
      sharedSubscriptionSocketAcked = true;
      sharedSubscriptionReconnectAttempt = 0;
      sendPendingSubscriptionStarts();
      return;
    case "next": {
      const operation = activeSubscriptionOperations.get(String(payload?.id || ""));
      if (operation) {
        operation.sink.next(payload?.payload || {});
      }
      return;
    }
    case "error": {
      const operationId = String(payload?.id || "");
      if (!operationId) {
        const socketError = toSubscriptionError(payload?.payload);
        for (const operation of activeSubscriptionOperations.values()) {
          operation.sink.error(socketError);
        }
        activeSubscriptionOperations.clear();
        closeSharedSubscriptionSocket();
        return;
      }
      const operation = activeSubscriptionOperations.get(operationId);
      if (!operation) {
        return;
      }
      const operationError = toSubscriptionError(payload?.payload);
      if (isJwtExpiredErrorMessage(operationError.message)) {
        handleAuthenticationFailure();
      }
      operation.sink.error(operationError);
      activeSubscriptionOperations.delete(operationId);
      if (activeSubscriptionOperations.size === 0) {
        closeSharedSubscriptionSocket();
      }
      return;
    }
    case "complete": {
      const operationId = String(payload?.id || "");
      const operation = activeSubscriptionOperations.get(operationId);
      if (!operation) {
        return;
      }
      operation.sink.complete();
      activeSubscriptionOperations.delete(operationId);
      if (activeSubscriptionOperations.size === 0) {
        closeSharedSubscriptionSocket();
      }
      return;
    }
    case "ping":
      if (sharedSubscriptionSocket?.readyState === WebSocket.OPEN) {
        sharedSubscriptionSocket.send(JSON.stringify({ type: "pong" }));
      }
      return;
    default:
      return;
  }
}

function ensureSharedSubscriptionSocket(endpoint) {
  if (typeof window === "undefined" || typeof WebSocket === "undefined") {
    return;
  }

  if (sharedSubscriptionSocket) {
    if (
      sharedSubscriptionSocketEndpoint === endpoint
      && (
        sharedSubscriptionSocket.readyState === WebSocket.CONNECTING
        || sharedSubscriptionSocket.readyState === WebSocket.OPEN
      )
    ) {
      return;
    }
    closeSharedSubscriptionSocket({ closeCode: 1012 });
  }

  sharedSubscriptionClosedByClient = false;
  sharedSubscriptionSocketEndpoint = endpoint;
  sharedSubscriptionSocketAcked = false;

  const socket = new WebSocket(endpoint, "graphql-transport-ws");
  sharedSubscriptionSocket = socket;

  socket.addEventListener("open", () => {
    if (sharedSubscriptionSocket !== socket) {
      return;
    }
    const payload = buildConnectionInitPayload();
    socket.send(JSON.stringify({
      type: "connection_init",
      ...(payload ? { payload } : {}),
    }));
  });

  socket.addEventListener("message", (event) => {
    if (sharedSubscriptionSocket !== socket) {
      return;
    }
    try {
      const payload = JSON.parse(event.data);
      handleSocketPayload(payload);
    } catch (error) {
      const parseError = toSubscriptionError(error);
      for (const operation of activeSubscriptionOperations.values()) {
        operation.sink.error(parseError);
      }
      activeSubscriptionOperations.clear();
      closeSharedSubscriptionSocket({ closeCode: 1002 });
    }
  });

  socket.addEventListener("error", () => {
    if (sharedSubscriptionSocket !== socket) {
      return;
    }
    // The close handler drives reconnect behavior.
  });

  socket.addEventListener("close", () => {
    const wasClosedByClient = sharedSubscriptionClosedByClient;
    if (wasClosedByClient) {
      sharedSubscriptionClosedByClient = false;
    }

    if (sharedSubscriptionSocket === socket) {
      sharedSubscriptionSocket = null;
      sharedSubscriptionSocketAcked = false;
      sharedSubscriptionSocketEndpoint = "";
    } else if (sharedSubscriptionSocket) {
      // Ignore close events from stale sockets after a newer socket is active.
      return;
    }

    if (wasClosedByClient) {
      return;
    }

    for (const operation of activeSubscriptionOperations.values()) {
      operation.started = false;
    }
    scheduleSubscriptionReconnect(endpoint);
  });
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

    const operationId = `sub-${Date.now()}-${nextSubscriptionOperationId++}`;
    activeSubscriptionOperations.set(operationId, {
      id: operationId,
      sink,
      queryText,
      variables: variables || {},
      started: false,
    });

    ensureSharedSubscriptionSocket(endpoint);
    const activeOperation = activeSubscriptionOperations.get(operationId);
    if (activeOperation) {
      sendSubscriptionStart(activeOperation);
    }

    return () => {
      const operation = activeSubscriptionOperations.get(operationId);
      if (!operation) {
        return;
      }

      activeSubscriptionOperations.delete(operationId);

      if (
        sharedSubscriptionSocket
        && sharedSubscriptionSocket.readyState === WebSocket.OPEN
        && sharedSubscriptionSocketAcked
        && operation.started
      ) {
        sharedSubscriptionSocket.send(
          JSON.stringify({
            id: operationId,
            type: "complete",
          }),
        );
      }

      if (activeSubscriptionOperations.size === 0) {
        closeSharedSubscriptionSocket();
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
