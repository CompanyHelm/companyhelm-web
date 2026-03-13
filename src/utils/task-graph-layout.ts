export class TaskGraphLayoutTimeoutError extends Error {
  constructor(timeoutMs: number) {
    super(`Task graph layout exceeded ${timeoutMs}ms.`);
    this.name = "TaskGraphLayoutTimeoutError";
  }
}

interface TaskGraphLayoutEngineParams<TNode, TEdge> {
  timeoutMs: number;
  computeLayout: (nodes: TNode[], edges: TEdge[]) => Promise<TNode[]>;
  computeFallbackLayout: (nodes: TNode[], edges: TEdge[]) => TNode[];
}

interface TaskGraphLayoutResult<TNode> {
  nodes: TNode[];
  didUseFallback: boolean;
  error: Error | null;
}

export class TaskGraphLayoutEngine<TNode, TEdge> {
  private readonly timeoutMs: number;
  private readonly computeLayoutFn: (nodes: TNode[], edges: TEdge[]) => Promise<TNode[]>;
  private readonly computeFallbackLayoutFn: (nodes: TNode[], edges: TEdge[]) => TNode[];

  constructor(params: TaskGraphLayoutEngineParams<TNode, TEdge>) {
    this.timeoutMs = Math.max(1, Number(params.timeoutMs) || 1);
    this.computeLayoutFn = params.computeLayout;
    this.computeFallbackLayoutFn = params.computeFallbackLayout;
  }

  async layout(nodes: TNode[], edges: TEdge[]): Promise<TaskGraphLayoutResult<TNode>> {
    let timeoutHandle: ReturnType<typeof setTimeout> | null = null;

    try {
      const layoutNodes = await Promise.race([
        this.computeLayoutFn(nodes, edges),
        new Promise<TNode[]>((_, reject) => {
          timeoutHandle = setTimeout(() => {
            reject(new TaskGraphLayoutTimeoutError(this.timeoutMs));
          }, this.timeoutMs);
        }),
      ]);

      return {
        nodes: layoutNodes,
        didUseFallback: false,
        error: null,
      };
    } catch (error) {
      const normalizedError = error instanceof Error ? error : new Error(String(error));
      return {
        nodes: this.computeFallbackLayoutFn(nodes, edges),
        didUseFallback: true,
        error: normalizedError,
      };
    } finally {
      if (timeoutHandle) {
        clearTimeout(timeoutHandle);
      }
    }
  }
}
