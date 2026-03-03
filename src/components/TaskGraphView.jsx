import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ReactFlow,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
  MarkerType,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import ELK from "elkjs/lib/elk.bundled.js";

const elk = new ELK();

const ELK_OPTIONS = {
  "elk.algorithm": "layered",
  "elk.direction": "RIGHT",
  "elk.spacing.nodeNode": "60",
  "elk.layered.spacing.nodeNodeBetweenLayers": "100",
  "elk.layered.crossingMinimization.strategy": "LAYER_SWEEP",
};

const NODE_WIDTH = 220;
const NODE_HEIGHT = 90;
const CHILD_EDGE_COLOR = "rgba(37, 99, 235, 0.82)";

function TaskNode({ data }) {
  return (
    <div className={`task-graph-node task-graph-node-${data.status}`} onClick={data.onClick}>
      <Handle type="target" position={Position.Left} />
      <div className="task-graph-node-header">
        <strong className="task-graph-node-name">{data.label}</strong>
        <span className={`task-status-pill task-status-pill-${data.status}`}>
          {data.status}
        </span>
      </div>
      <span className="task-graph-node-meta">
        {data.commentCount === 0
          ? "No comments"
          : `${data.commentCount} comment${data.commentCount === 1 ? "" : "s"}`}
      </span>
      <Handle type="source" position={Position.Right} />
    </div>
  );
}

const nodeTypes = { task: TaskNode };

function buildGraphElements(tasks) {
  const taskArray = Array.isArray(tasks) ? tasks : [];
  const taskIds = new Set(
    taskArray
      .map((task) => String(task?.id || "").trim())
      .filter(Boolean),
  );

  const nodes = taskArray.map((task) => ({
    id: String(task?.id || "").trim(),
    type: "task",
    data: {
      label: task?.name || `Task ${task?.id}`,
      status: task.status || "draft",
      commentCount: Array.isArray(task.comments) ? task.comments.length : 0,
    },
    position: { x: 0, y: 0 },
  }));

  const edges = [];
  for (const task of taskArray) {
    const taskId = String(task?.id || "").trim();
    if (!taskId) {
      continue;
    }

    const deps = Array.isArray(task.dependencyTaskIds) ? task.dependencyTaskIds : [];
    for (const depId of deps) {
      const dependencyTaskId = String(depId || "").trim();
      if (taskIds.has(dependencyTaskId) && dependencyTaskId !== taskId) {
        edges.push({
          id: `dependency-${dependencyTaskId}-${taskId}`,
          source: dependencyTaskId,
          target: taskId,
          label: "blocks",
          type: "smoothstep",
          animated: false,
          markerEnd: { type: MarkerType.ArrowClosed },
        });
      }
    }

    const parentTaskId = String(task?.parentTaskId || "").trim();
    if (!parentTaskId || parentTaskId === taskId || !taskIds.has(parentTaskId)) {
      continue;
    }

    edges.push({
      id: `child-${parentTaskId}-${taskId}`,
      source: parentTaskId,
      target: taskId,
      label: "child",
      type: "smoothstep",
      animated: false,
      style: {
        stroke: CHILD_EDGE_COLOR,
        strokeWidth: 1.6,
        strokeDasharray: "4 3",
      },
      labelStyle: {
        fill: CHILD_EDGE_COLOR,
        fontWeight: 600,
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: CHILD_EDGE_COLOR,
      },
    });
  }

  return { nodes, edges };
}

async function computeElkLayout(nodes, edges) {
  const graph = {
    id: "root",
    layoutOptions: ELK_OPTIONS,
    children: nodes.map((node) => ({
      id: node.id,
      width: NODE_WIDTH,
      height: NODE_HEIGHT,
    })),
    edges: edges.map((edge) => ({
      id: edge.id,
      sources: [edge.source],
      targets: [edge.target],
    })),
  };

  const layoutResult = await elk.layout(graph);
  const positionMap = new Map();
  for (const child of layoutResult.children || []) {
    positionMap.set(child.id, { x: child.x || 0, y: child.y || 0 });
  }

  return nodes.map((node) => ({
    ...node,
    position: positionMap.get(node.id) || node.position,
  }));
}

export function TaskGraphView({ tasks, onTaskClick }) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [isLayoutReady, setIsLayoutReady] = useState(false);

  const { nodes: rawNodes, edges: rawEdges } = useMemo(
    () => buildGraphElements(tasks),
    [tasks],
  );

  useEffect(() => {
    if (rawNodes.length === 0) {
      setNodes([]);
      setEdges([]);
      setIsLayoutReady(true);
      return;
    }

    setIsLayoutReady(false);
    computeElkLayout(rawNodes, rawEdges).then((layoutNodes) => {
      const nodesWithHandlers = layoutNodes.map((node) => ({
        ...node,
        data: {
          ...node.data,
          onClick: () => onTaskClick(node.id),
        },
      }));
      setNodes(nodesWithHandlers);
      setEdges(rawEdges);
      setIsLayoutReady(true);
    });
  }, [rawNodes, rawEdges, onTaskClick, setNodes, setEdges]);

  const handleNodeClick = useCallback(
    (_event, node) => {
      onTaskClick(node.id);
    },
    [onTaskClick],
  );

  if (!isLayoutReady && rawNodes.length > 0) {
    return <div className="task-graph-loading">Computing layout...</div>;
  }

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onNodeClick={handleNodeClick}
      nodeTypes={nodeTypes}
      fitView
      fitViewOptions={{ padding: 0.2 }}
      proOptions={{ hideAttribution: true }}
      minZoom={0.1}
      maxZoom={2}
    >
      <Controls />
      <MiniMap
        nodeStrokeWidth={3}
        pannable
        zoomable
      />
    </ReactFlow>
  );
}
