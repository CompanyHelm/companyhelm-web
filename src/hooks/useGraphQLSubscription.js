import { useEffect, useMemo } from "react";
import { GRAPHQL_WS_URL } from "../utils/constants.js";

let nextGraphQLSubscriptionRequestId = 1;

export function subscribeGraphQL({
  query,
  variables,
  onData,
  onError,
}) {
  if (typeof window === "undefined" || typeof WebSocket === "undefined") {
    return () => {};
  }

  const endpoint = String(GRAPHQL_WS_URL || "").trim();
  if (!endpoint) {
    return () => {};
  }

  let isClosedByClient = false;
  let hasStartedOperation = false;
  const operationId = `sub-${nextGraphQLSubscriptionRequestId++}`;
  const socket = new WebSocket(endpoint, "graphql-transport-ws");

  const notifyError = (rawError) => {
    if (!onError || isClosedByClient) {
      return;
    }

    if (rawError instanceof Error) {
      onError(rawError);
      return;
    }

    if (Array.isArray(rawError) && rawError.length > 0) {
      const firstError = rawError[0];
      const message = typeof firstError?.message === "string"
        ? firstError.message
        : JSON.stringify(firstError);
      onError(new Error(message));
      return;
    }

    const message = typeof rawError === "string" && rawError.trim()
      ? rawError
      : "GraphQL subscription error.";
    onError(new Error(message));
  };

  socket.addEventListener("open", () => {
    socket.send(
      JSON.stringify({
        type: "connection_init",
      }),
    );
  });

  socket.addEventListener("message", (event) => {
    try {
      const payload = JSON.parse(event.data);
      switch (payload?.type) {
        case "connection_ack": {
          if (hasStartedOperation) {
            return;
          }
          hasStartedOperation = true;
          socket.send(
            JSON.stringify({
              id: operationId,
              type: "subscribe",
              payload: {
                query,
                variables: variables || {},
              },
            }),
          );
          return;
        }
        case "next":
          if (payload?.id === operationId) {
            onData?.(payload?.payload?.data || {});
          }
          return;
        case "error":
          if (payload?.id === operationId) {
            notifyError(payload?.payload);
          }
          return;
        case "ping":
          socket.send(JSON.stringify({ type: "pong" }));
          return;
        case "complete":
          return;
        default:
          return;
      }
    } catch (error) {
      notifyError(error);
    }
  });

  socket.addEventListener("error", () => {
    notifyError("Subscription socket error.");
  });

  socket.addEventListener("close", () => {
    if (!isClosedByClient) {
      notifyError("Subscription socket closed unexpectedly.");
    }
  });

  return () => {
    isClosedByClient = true;
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
      return;
    }
    if (socket.readyState === WebSocket.CONNECTING) {
      socket.close(1000);
    }
  };
}

export function useGraphQLSubscription({
  enabled,
  query,
  variables,
  onData,
  onError,
}) {
  const serializedVariables = useMemo(() => JSON.stringify(variables || {}), [variables]);

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }
    const unsubscribe = subscribeGraphQL({
      query,
      variables: JSON.parse(serializedVariables),
      onData,
      onError,
    });
    return () => {
      unsubscribe();
    };
  }, [enabled, onData, onError, query, serializedVariables]);
}
