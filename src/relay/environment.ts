import {
  Environment,
  Network,
  Observable,
  QueryResponseCache,
  RecordSource,
  Store,
} from "relay-runtime";
import { authProvider } from "../auth/runtime.ts";
import { GRAPHQL_URL, GRAPHQL_WS_URL } from "../utils/constants.ts";
import { getActiveCompanyId } from "../utils/company-context.ts";

// Keep cache short-lived so live chat/admin views remain fresh while still deduping bursts.
const QUERY_RESPONSE_CACHE_TTL_MS = 3_000;
const QUERY_RESPONSE_CACHE_SIZE = 200;

const queryResponseCache = new QueryResponseCache({
  size: QUERY_RESPONSE_CACHE_SIZE,
  ttl: QUERY_RESPONSE_CACHE_TTL_MS,
});

const inFlightQueryRequests = new Map<any, any>();
const JWT_EXPIRED_PATTERN = /\bjwt\b.*\bexpired\b/i;
const SUBSCRIPTION_RECONNECT_BASE_DELAY_MS = 300;
const SUBSCRIPTION_RECONNECT_MAX_DELAY_MS = 5000;
const SUBSCRIPTION_IDLE_CLOSE_DELAY_MS = 250;

function resolveOperationCacheKey(params: any) {
  return String(params?.id || params?.cacheID || params?.text || params?.name || "anonymous");
}

function resolveInFlightQueryKey(params: any, variables: any) {
  return `${resolveOperationCacheKey(params)}::${JSON.stringify(variables || {})}`;
}

function toGraphQLErrorMessage(payload: any, fallbackMessage: any) {
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

function getGraphQLErrorMessages(payload: any) {
  const errors = Array.isArray(payload?.errors) ? payload.errors : [];
  return errors
    .map((errorItem: any) => {
      const message = errorItem?.message;
      return typeof message === "string" ? message.trim() : "";
    })
    .filter(Boolean);
}

function isJwtExpiredErrorMessage(message: any) {
  return JWT_EXPIRED_PATTERN.test(String(message || ""));
}

function isJwtExpiredPayload(payload: any) {
  return getGraphQLErrorMessages(payload).some((message: any) => isJwtExpiredErrorMessage(message));
}

function handleAuthenticationFailure() {
  queryResponseCache.clear();
  if (typeof authProvider?.signOut === "function") {
    authProvider.signOut();
  }
}

function normalizeOperationKind(rawKind: any) {
  const normalized = String(rawKind || "").trim().toLowerCase();
  if (normalized === "query" || normalized === "mutation" || normalized === "subscription") {
    return normalized;
  }
  return "query";
}

async function performHttpGraphQLRequest(params: any, variables: any, operationKind: any, cacheKey: any) {
  const queryText = typeof params?.text === "string" ? params.text : "";
  if (!queryText.trim()) {
    throw new Error(`Relay operation '${String(params?.name || "anonymous")}' is missing GraphQL query text.`);
  }

  const headers: any = {
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

  let payload: any = null;
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

function fetchGraphQL(params: any, variables: any, cacheConfig: any) {
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

function toSubscriptionError(rawError: any) {
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

function buildConnectionInitPayload() {
  const authorization = authProvider.getAuthorizationHeaderValue();
  const activeCompanyId = getActiveCompanyId();
  const headers: any = {};
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
let graphQLSubscriptionServiceSingleton: any = null;

class GraphQLSubscriptionService {
  activeOperations: any;
  closedByClient: any;
  idleCloseTimerId: any;
  nextOperationId: any;
  reconnectAttempt: any;
  reconnectTimerId: any;
  socket: any;
  socketAcked: any;
  socketEndpoint: any;
  static getInstance() {
    if (!graphQLSubscriptionServiceSingleton) {
      graphQLSubscriptionServiceSingleton = new GraphQLSubscriptionService();
    }
    return graphQLSubscriptionServiceSingleton;
  }

  constructor() {
    this.socket = null;
    this.socketEndpoint = "";
    this.socketAcked = false;
    this.reconnectAttempt = 0;
    this.reconnectTimerId = null;
    this.idleCloseTimerId = null;
    this.closedByClient = false;
    this.nextOperationId = 0;
    this.activeOperations = new Map<any, any>();
  }

  clearReconnectTimer() {
    if (this.reconnectTimerId !== null) {
      clearTimeout(this.reconnectTimerId);
      this.reconnectTimerId = null;
    }
  }

  clearIdleCloseTimer() {
    if (this.idleCloseTimerId !== null) {
      clearTimeout(this.idleCloseTimerId);
      this.idleCloseTimerId = null;
    }
  }

  scheduleIdleClose() {
    if (this.idleCloseTimerId !== null) {
      return;
    }
    this.idleCloseTimerId = setTimeout(() => {
      this.idleCloseTimerId = null;
      if (this.activeOperations.size > 0) {
        return;
      }
      this.closeSocket();
    }, SUBSCRIPTION_IDLE_CLOSE_DELAY_MS);
  }

  closeSocket({ closeCode = 1000 }: any = {}) {
    this.clearIdleCloseTimer();
    this.clearReconnectTimer();
    this.socketAcked = false;

    const socket = this.socket;
    this.socket = null;
    this.socketEndpoint = "";
    if (!socket) {
      return;
    }
    this.closedByClient = true;
    if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
      socket.close(closeCode);
    }
  }

  sendSubscriptionStart(operation: any) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN || !this.socketAcked) {
      return;
    }
    this.socket.send(
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

  sendPendingSubscriptionStarts() {
    for (const operation of this.activeOperations.values()) {
      if (!operation.started) {
        this.sendSubscriptionStart(operation);
      }
    }
  }

  scheduleReconnect(endpoint: any) {
    if (this.activeOperations.size === 0 || this.reconnectTimerId !== null) {
      return;
    }

    const reconnectDelay = Math.min(
      SUBSCRIPTION_RECONNECT_BASE_DELAY_MS * (2 ** this.reconnectAttempt),
      SUBSCRIPTION_RECONNECT_MAX_DELAY_MS,
    );
    this.reconnectTimerId = setTimeout(() => {
      this.reconnectTimerId = null;
      this.ensureSocket(endpoint);
    }, reconnectDelay);
    this.reconnectAttempt += 1;
  }

  handleSocketPayload(payload: any) {
    switch (payload?.type) {
      case "connection_ack":
        this.socketAcked = true;
        this.reconnectAttempt = 0;
        this.sendPendingSubscriptionStarts();
        return;
      case "next": {
        const operation = this.activeOperations.get(String(payload?.id || ""));
        if (operation) {
          operation.sink.next(payload?.payload || {});
        }
        return;
      }
      case "error": {
        const operationId = String(payload?.id || "");
        if (!operationId) {
          const socketError = toSubscriptionError(payload?.payload);
          for (const operation of this.activeOperations.values()) {
            operation.sink.error(socketError);
          }
          this.activeOperations.clear();
          this.closeSocket();
          return;
        }
        const operation = this.activeOperations.get(operationId);
        if (!operation) {
          return;
        }
        const operationError = toSubscriptionError(payload?.payload);
        if (isJwtExpiredErrorMessage(operationError.message)) {
          handleAuthenticationFailure();
        }
        operation.sink.error(operationError);
        this.activeOperations.delete(operationId);
        if (this.activeOperations.size === 0) {
          this.scheduleIdleClose();
        }
        return;
      }
      case "complete": {
        const operationId = String(payload?.id || "");
        const operation = this.activeOperations.get(operationId);
        if (!operation) {
          return;
        }
        operation.sink.complete();
        this.activeOperations.delete(operationId);
        if (this.activeOperations.size === 0) {
          this.scheduleIdleClose();
        }
        return;
      }
      case "ping":
        if (this.socket?.readyState === WebSocket.OPEN) {
          this.socket.send(JSON.stringify({ type: "pong" }));
        }
        return;
      default:
        return;
    }
  }

  ensureSocket(endpoint: any) {
    if (typeof window === "undefined" || typeof WebSocket === "undefined") {
      return;
    }

    if (this.socket) {
      if (
        this.socketEndpoint === endpoint
        && (
          this.socket.readyState === WebSocket.CONNECTING
          || this.socket.readyState === WebSocket.OPEN
        )
      ) {
        return;
      }
      this.closeSocket({ closeCode: 1012 });
    }

    this.closedByClient = false;
    this.socketEndpoint = endpoint;
    this.socketAcked = false;

    const socket = new WebSocket(endpoint, "graphql-transport-ws");
    this.socket = socket;

    socket.addEventListener("open", () => {
      if (this.socket !== socket) {
        return;
      }
      const payload = buildConnectionInitPayload();
      socket.send(JSON.stringify({
        type: "connection_init",
        ...(payload ? { payload } : {}),
      }));
    });

    socket.addEventListener("message", (event: any) => {
      if (this.socket !== socket) {
        return;
      }
      try {
        const payload = JSON.parse(event.data);
        this.handleSocketPayload(payload);
      } catch (error: any) {
        const parseError = toSubscriptionError(error);
        for (const operation of this.activeOperations.values()) {
          operation.sink.error(parseError);
        }
        this.activeOperations.clear();
        this.closeSocket({ closeCode: 1002 });
      }
    });

    socket.addEventListener("error", () => {
      if (this.socket !== socket) {
        return;
      }
      // The close handler drives reconnect behavior.
    });

    socket.addEventListener("close", () => {
      const wasClosedByClient = this.closedByClient;
      if (wasClosedByClient) {
        this.closedByClient = false;
      }

      if (this.socket === socket) {
        this.socket = null;
        this.socketAcked = false;
        this.socketEndpoint = "";
      } else if (this.socket) {
        // Ignore close events from stale sockets after a newer socket is active.
        return;
      }

      if (wasClosedByClient) {
        return;
      }

      for (const operation of this.activeOperations.values()) {
        operation.started = false;
      }
      this.scheduleReconnect(endpoint);
    });
  }

  subscribe({
    endpoint,
    queryText,
    variables,
    sink,
  }: any) {
    const operationId = `sub-${Date.now()}-${this.nextOperationId++}`;
    this.activeOperations.set(operationId, {
      id: operationId,
      sink,
      queryText,
      variables: variables || {},
      started: false,
    });
    this.clearIdleCloseTimer();

    this.ensureSocket(endpoint);
    const activeOperation = this.activeOperations.get(operationId);
    if (activeOperation) {
      this.sendSubscriptionStart(activeOperation);
    }

    return () => {
      const operation = this.activeOperations.get(operationId);
      if (!operation) {
        return;
      }

      this.activeOperations.delete(operationId);

      if (
        this.socket
        && this.socket.readyState === WebSocket.OPEN
        && this.socketAcked
        && operation.started
      ) {
        this.socket.send(
          JSON.stringify({
            id: operationId,
            type: "complete",
          }),
        );
      }

      if (this.activeOperations.size === 0) {
        this.scheduleIdleClose();
      }
    };
  }
}

const graphQLSubscriptionService: any = GraphQLSubscriptionService.getInstance();

function subscribeGraphQL(params: any, variables: any) {
  return Observable.create((sink: any) => {
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

    return graphQLSubscriptionService.subscribe({
      endpoint,
      queryText,
      variables: variables || {},
      sink,
    });
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
