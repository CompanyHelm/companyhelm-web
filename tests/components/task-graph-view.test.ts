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
