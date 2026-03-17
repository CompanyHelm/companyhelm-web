import {
  Environment,
  Network,
  Observable,
  QueryResponseCache,
  RecordSource,
  Store,
  type CacheConfig,
  type GraphQLResponse,
  type RequestParameters,
  type Variables,
} from "relay-runtime";
import { authProvider } from "../auth/runtime.ts";
import { GRAPHQL_URL, GRAPHQL_WS_URL } from "../utils/constants.ts";
import { getActiveCompanyId } from "../utils/company-context.ts";

// Keep cache short-lived so live chat/admin views remain fresh while still deduping bursts.
const QUERY_RESPONSE_CACHE_TTL_MS = 3_000;
const QUERY_RESPONSE_CACHE_SIZE = 200;

type OperationKind = RequestParameters["operationKind"];
type GraphQLPayload = {
  data?: Record<string, unknown> | null;
  errors?: Array<{ message?: string }>;
  [key: string]: unknown;
};

type SubscriptionSink = {
  next: (payload: GraphQLResponse) => void;
  error: (error: Error) => void;
  complete: () => void;
};

type SubscriptionOperation = {
  id: string;
  sink: SubscriptionSink;
  queryText: string;
  variables: Variables;
  started: boolean;
};

const queryResponseCache = new QueryResponseCache({
  size: QUERY_RESPONSE_CACHE_SIZE,
  ttl: QUERY_RESPONSE_CACHE_TTL_MS,
});

const inFlightQueryRequests = new Map<string, Promise<GraphQLResponse>>();
const JWT_EXPIRED_PATTERN = /\bjwt\b.*\bexpired\b/i;
const SUBSCRIPTION_RECONNECT_BASE_DELAY_MS = 300;
const SUBSCRIPTION_RECONNECT_MAX_DELAY_MS = 5000;
const SUBSCRIPTION_IDLE_CLOSE_DELAY_MS = 250;

function resolveActiveCompanyCacheScope(params: RequestParameters, operationKind: OperationKind) {
  const queryText = typeof params?.text === "string" ? params.text : "";
  if (!shouldAttachCompanyHeader(operationKind, queryText)) {
    return "";
  }
  return String(getActiveCompanyId() || "").trim();
}

function resolveOperationCacheKey(params: RequestParameters, operationKind: OperationKind) {
  const cacheID = "cacheID" in params ? params.cacheID : "";
  const baseKey = String(params.id || cacheID || params.text || params.name || "anonymous");
  const activeCompanyScope = resolveActiveCompanyCacheScope(params, operationKind);
  return activeCompanyScope ? `${baseKey}::company:${activeCompanyScope}` : baseKey;
}

function resolveInFlightQueryKey(
  params: RequestParameters,
  variables: Variables,
  operationKind: OperationKind,
) {
  return `${resolveOperationCacheKey(params, operationKind)}::${JSON.stringify(variables || {})}`;
}

function toGraphQLErrorMessage(payload: GraphQLPayload | null, fallbackMessage: string) {
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

function getGraphQLErrorMessages(payload: GraphQLPayload | null) {
  const errors = Array.isArray(payload?.errors) ? payload.errors : [];
  return errors
    .map((errorItem: { message?: string }) => {
      const message = errorItem?.message;
      return typeof message === "string" ? message.trim() : "";
    })
    .filter(Boolean);
}

function isJwtExpiredErrorMessage(message: string) {
  return JWT_EXPIRED_PATTERN.test(String(message || ""));
}

function isJwtExpiredPayload(payload: GraphQLPayload | null) {
  return getGraphQLErrorMessages(payload).some((message) => isJwtExpiredErrorMessage(message));
}

function handleAuthenticationFailure() {
  queryResponseCache.clear();
  if (typeof authProvider?.signOut === "function") {
    authProvider.signOut();
  }
}

function normalizeOperationKind(rawKind: unknown): OperationKind {
  const normalized = String(rawKind || "").trim().toLowerCase();
  if (normalized === "query" || normalized === "mutation" || normalized === "subscription") {
    return normalized;
  }
  return "query";
}

function shouldAttachCompanyHeader(operationKind: OperationKind, queryText: string) {
  if (operationKind !== "query") {
    return true;
  }
  // Company directory queries must stay unscoped so users can list/select companies.
  return !/\b(?:companies|company)\s*\(/.test(queryText);
}

function toGraphQLPayload(value: unknown): GraphQLPayload | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as GraphQLPayload;
}

async function performHttpGraphQLRequest(
  params: RequestParameters,
  variables: Variables,
  operationKind: OperationKind,
  cacheKey: string,
): Promise<GraphQLResponse> {
  const queryText = typeof params?.text === "string" ? params.text : "";
  if (!queryText.trim()) {
    throw new Error(`Relay operation '${String(params?.name || "anonymous")}' is missing GraphQL query text.`);
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const authorization = authProvider.getAuthorizationHeaderValue();
  if (authorization) {
    headers.Authorization = authorization;
  }
  const activeCompanyId = getActiveCompanyId();
  if (activeCompanyId && shouldAttachCompanyHeader(operationKind, queryText)) {
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

  let payload: GraphQLPayload | null = null;
  try {
    payload = toGraphQLPayload(await response.json());
  } catch {
    payload = null;
  }

  if (response.status === 401 || isJwtExpiredPayload(payload)) {
    handleAuthenticationFailure();
  }

  if (!response.ok) {
    throw new Error(toGraphQLErrorMessage(payload, `GraphQL request failed (${response.status}).`));
  }
  if (!payload) {
    throw new Error("GraphQL request failed: invalid response payload.");
  }

  if (operationKind === "query" && !Array.isArray(payload?.errors)) {
    queryResponseCache.set(cacheKey, variables || {}, payload as GraphQLResponse);
  }

  if (operationKind === "mutation") {
    // Mutation responses can invalidate many list queries; clear query cache eagerly.
    queryResponseCache.clear();
  }

  return payload as GraphQLResponse;
}

function fetchGraphQL(
  params: RequestParameters,
  variables: Variables,
  cacheConfig: CacheConfig,
): Promise<GraphQLResponse> {
  const operationKind = normalizeOperationKind(params?.operationKind);
  const isQuery = operationKind === "query";
  const forceFetch = Boolean(cacheConfig?.force);
  const cacheKey = resolveOperationCacheKey(params, operationKind);

  if (isQuery && !forceFetch) {
    const cachedResponse = queryResponseCache.get(cacheKey, variables || {});
    if (cachedResponse) {
      return Promise.resolve(cachedResponse);
    }

    const inFlightKey = resolveInFlightQueryKey(params, variables || {}, operationKind);
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

function toSubscriptionError(rawError: unknown): Error {
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
  const headers: Record<string, string> = {};
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

function resolveConnectionScopeKey() {
  return JSON.stringify(buildConnectionInitPayload() || {});
}
let graphQLSubscriptionServiceSingleton: GraphQLSubscriptionService | null = null;

class GraphQLSubscriptionService {
  activeOperations: Map<string, SubscriptionOperation>;
  closedByClient: boolean;
  idleCloseTimerId: ReturnType<typeof setTimeout> | null;
  nextOperationId: number;
  reconnectAttempt: number;
  reconnectTimerId: ReturnType<typeof setTimeout> | null;
  socket: WebSocket | null;
  socketAcked: boolean;
  socketEndpoint: string;
  socketScopeKey: string;

  static getInstance(): GraphQLSubscriptionService {
    if (!graphQLSubscriptionServiceSingleton) {
      graphQLSubscriptionServiceSingleton = new GraphQLSubscriptionService();
    }
    return graphQLSubscriptionServiceSingleton;
  }

  constructor() {
    this.socket = null;
    this.socketEndpoint = "";
    this.socketScopeKey = "";
    this.socketAcked = false;
    this.reconnectAttempt = 0;
    this.reconnectTimerId = null;
    this.idleCloseTimerId = null;
    this.closedByClient = false;
    this.nextOperationId = 0;
    this.activeOperations = new Map<string, SubscriptionOperation>();
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

  closeSocket({ closeCode = 1000 }: { closeCode?: number } = {}) {
    this.clearIdleCloseTimer();
    this.clearReconnectTimer();
    this.socketAcked = false;

    const socket = this.socket;
    this.socket = null;
    this.socketEndpoint = "";
    this.socketScopeKey = "";
    if (!socket) {
      return;
    }
    this.closedByClient = true;
    if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
      socket.close(closeCode);
    }
  }

  sendSubscriptionStart(operation: SubscriptionOperation) {
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

  scheduleReconnect(endpoint: string) {
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

  handleSocketPayload(payload: Record<string, unknown>) {
    switch (payload?.type) {
      case "connection_ack":
        this.socketAcked = true;
        this.reconnectAttempt = 0;
        this.sendPendingSubscriptionStarts();
        return;
      case "next": {
        const operation = this.activeOperations.get(String(payload?.id || ""));
        if (operation) {
          const nextPayload = toGraphQLPayload(payload?.payload) || {};
          operation.sink.next(nextPayload as GraphQLResponse);
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

  ensureSocket(endpoint: string) {
    if (typeof window === "undefined" || typeof WebSocket === "undefined") {
      return;
    }

    const connectionScopeKey = resolveConnectionScopeKey();

    if (this.socket) {
      if (
        this.socketEndpoint === endpoint
        && this.socketScopeKey === connectionScopeKey
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
    this.socketScopeKey = connectionScopeKey;
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

    socket.addEventListener("message", (event: MessageEvent) => {
      if (this.socket !== socket) {
        return;
      }
      try {
        const payload = JSON.parse(String(event.data || "")) as Record<string, unknown>;
        this.handleSocketPayload(payload);
      } catch (error: unknown) {
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
  }: {
    endpoint: string;
    queryText: string;
    variables: Variables;
    sink: SubscriptionSink;
  }): () => void {
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

const graphQLSubscriptionService = GraphQLSubscriptionService.getInstance();

function subscribeGraphQL(params: RequestParameters, variables: Variables) {
  return Observable.create<GraphQLResponse>((sink) => {
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
      sink: {
        next: (payload) => sink.next(payload),
        error: (error) => sink.error(error),
        complete: () => sink.complete(),
      },
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
