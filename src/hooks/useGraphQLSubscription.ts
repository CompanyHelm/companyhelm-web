import { useEffect, useMemo, useRef } from "react";
import type { Variables } from "relay-runtime";
import { subscribeRelayGraphQL } from "../relay/client.ts";

interface GraphQLSubscriptionOptions {
  query: string;
  variables?: Variables;
  onData?: (payload: Record<string, unknown>) => void;
  onError?: (error: Error) => void;
}

export function subscribeGraphQL({
  query,
  variables,
  onData,
  onError,
}: GraphQLSubscriptionOptions) {
  return subscribeRelayGraphQL({
    query,
    variables,
    onData,
    onError,
  });
}

interface UseGraphQLSubscriptionOptions extends GraphQLSubscriptionOptions {
  enabled: boolean;
}

export function useGraphQLSubscription({
  enabled,
  query,
  variables,
  onData,
  onError,
}: UseGraphQLSubscriptionOptions) {
  const serializedVariables = useMemo(() => JSON.stringify(variables || {}), [variables]);
  const onDataRef = useRef<GraphQLSubscriptionOptions["onData"]>(onData);
  const onErrorRef = useRef<GraphQLSubscriptionOptions["onError"]>(onError);

  useEffect(() => {
    onDataRef.current = onData;
    onErrorRef.current = onError;
  }, [onData, onError]);

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }
    const unsubscribe = subscribeGraphQL({
      query,
      variables: JSON.parse(serializedVariables),
      onData: (payload: Record<string, unknown>) => {
        onDataRef.current?.(payload);
      },
      onError: (error: Error) => {
        onErrorRef.current?.(error);
      },
    });
    return () => {
      unsubscribe();
    };
  }, [enabled, query, serializedVariables]);
}
