import { createContext, useContext, useEffect, useState } from "react";

const PageActionsContext = createContext<any>(null);

export function PageActionsProvider({ children }: any) {
  const [actions, setActions] = useState<any>(null);
  return (
    <PageActionsContext.Provider value={{ actions, setActions }}>
      {children}
    </PageActionsContext.Provider>
  );
}

export function usePageActions() {
  return useContext<any>(PageActionsContext);
}

export function useSetPageActions(actionsNode: any) {
  const ctx = useContext<any>(PageActionsContext);
  useEffect(() => {
    if (ctx) {
      ctx.setActions(actionsNode);
    }
    return () => {
      if (ctx) {
        ctx.setActions(null);
      }
    };
  }, [ctx, actionsNode]);
}
