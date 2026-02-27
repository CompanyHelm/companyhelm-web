import { useEffect, useMemo } from "react";
import { subscribeRelayGraphQL } from "../relay/client.js";

export function subscribeGraphQL({
  query,
  variables,
  onData,
  onError,
}) {
  return subscribeRelayGraphQL({
    query,
    variables,
    onData,
    onError,
  });
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
