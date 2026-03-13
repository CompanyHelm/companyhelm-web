import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

const taskGraphViewSource = readFileSync(
  new URL("../../src/components/TaskGraphView.tsx", import.meta.url),
  "utf8",
);

test("TaskGraphView keeps graph layout independent from onTaskClick callback identity", () => {
  assert.match(
    taskGraphViewSource,
    /const onTaskClickRef = useRef\(onTaskClick\);/,
  );
  assert.match(
    taskGraphViewSource,
    /onClick: \(\) => onTaskClickRef\.current\(node\.id\)/,
  );
  assert.doesNotMatch(
    taskGraphViewSource,
    /\}, \[rawNodes, rawEdges, onTaskClick, setNodes, setEdges\]\);/,
  );
});

test("TaskGraphView refits the viewport after async layout applies nodes", () => {
  assert.match(
    taskGraphViewSource,
    /const reactFlowInstanceRef = useRef<ReactFlowInstance<TaskGraphNode, TaskGraphEdge> \| null>\(null\);/,
  );
  assert.match(
    taskGraphViewSource,
    /useEffect\(\(\) => \{\s+if \(!isLayoutReady \|\| nodes\.length === 0\) \{\s+return;\s+\}\s+const reactFlowInstance = reactFlowInstanceRef\.current;\s+if \(!reactFlowInstance\) \{\s+return;\s+\}\s+void reactFlowInstance\.fitView\(\{\s+padding: 0\.2,\s+duration: 200,\s+\}\);\s+\}, \[isLayoutReady, nodes\.length\]\);/s,
  );
  assert.match(
    taskGraphViewSource,
    /onInit=\{\(instance\) => \{\s+reactFlowInstanceRef\.current = instance;\s+\}\}/,
  );
});
