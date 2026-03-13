import assert from "node:assert/strict";
import test from "node:test";
import { TaskGraphLayoutEngine, TaskGraphLayoutTimeoutError } from "../../src/utils/task-graph-layout.ts";

test("TaskGraphLayoutEngine falls back when the primary layout promise hangs", async () => {
  const nodes = [{ id: "task-1", position: { x: 0, y: 0 } }];
  const edges = [{ id: "edge-1", source: "task-1", target: "task-2" }];
  let fallbackCalls = 0;

  const engine = new TaskGraphLayoutEngine({
    timeoutMs: 5,
    computeLayout: () => new Promise<typeof nodes>(() => undefined),
    computeFallbackLayout: (receivedNodes, receivedEdges) => {
      fallbackCalls += 1;
      assert.deepEqual(receivedNodes, nodes);
      assert.deepEqual(receivedEdges, edges);
      return [{ ...receivedNodes[0], position: { x: 120, y: 240 } }];
    },
  });

  const result = await engine.layout(nodes, edges);

  assert.equal(fallbackCalls, 1);
  assert.equal(result.didUseFallback, true);
  assert.ok(result.error instanceof TaskGraphLayoutTimeoutError);
  assert.deepEqual(result.nodes, [{ id: "task-1", position: { x: 120, y: 240 } }]);
});

test("TaskGraphLayoutEngine keeps the primary layout result when it resolves in time", async () => {
  const nodes = [{ id: "task-1", position: { x: 0, y: 0 } }];
  const edges: Array<{ id: string; source: string; target: string }> = [];

  const engine = new TaskGraphLayoutEngine({
    timeoutMs: 50,
    computeLayout: async (receivedNodes, receivedEdges) => {
      assert.deepEqual(receivedNodes, nodes);
      assert.deepEqual(receivedEdges, edges);
      return [{ ...receivedNodes[0], position: { x: 40, y: 80 } }];
    },
    computeFallbackLayout: () => {
      throw new Error("fallback should not run");
    },
  });

  const result = await engine.layout(nodes, edges);

  assert.equal(result.didUseFallback, false);
  assert.equal(result.error, null);
  assert.deepEqual(result.nodes, [{ id: "task-1", position: { x: 40, y: 80 } }]);
});
