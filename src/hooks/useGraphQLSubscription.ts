import { useEffect, useMemo, useRef } from "react";
import { subscribeRelayGraphQL } from "../relay/client.ts";

export function subscribeGraphQL({
  query,
  variables,
  onData,
  onError,
}: any) {
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
}: any) {
  const serializedVariables = useMemo(() => JSON.stringify(variables || {}), [variables]);
  const onDataRef = useRef(onData);
  const onErrorRef = useRef(onError);

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
      onData: (payload: any) => {
        onDataRef.current?.(payload);
      },
      onError: (error: any) => {
        onErrorRef.current?.(error);
      },
    });
    return () => {
      unsubscribe();
    };
  }, [enabled, query, serializedVariables]);
}
