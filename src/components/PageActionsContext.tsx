import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

interface PageActionsContextValue {
  actions: ReactNode | null;
  setActions: (nextActions: ReactNode | null) => void;
}

const PageActionsContext = createContext<PageActionsContextValue | null>(null);

interface PageActionsProviderProps {
  children: ReactNode;
}

export function PageActionsProvider({ children }: PageActionsProviderProps) {
  const [actions, setActions] = useState<ReactNode | null>(null);
  return (
    <PageActionsContext.Provider value={{ actions, setActions }}>
      {children}
    </PageActionsContext.Provider>
  );
}

export function usePageActions() {
  return useContext(PageActionsContext);
}

export function useSetPageActions(actionsNode: ReactNode | null) {
  const ctx = useContext(PageActionsContext);
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
