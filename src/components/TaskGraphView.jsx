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
const VERTICAL_LEVEL_GAP = 160;
const HORIZONTAL_GAP = 60;

function TaskNode({ data }) {
  return (
    <div className={`task-graph-node task-graph-node-${data.status}`} onClick={data.onClick}>
      <Handle type="target" id="left" position={Position.Left} />
      <Handle type="target" id="top" position={Position.Top} />
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
      <Handle type="source" id="right" position={Position.Right} />
      <Handle type="source" id="bottom" position={Position.Bottom} />
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
          sourceHandle: "right",
          targetHandle: "left",
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
      sourceHandle: "bottom",
      targetHandle: "top",
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

function computeParentChildLevels(nodes, edges) {
  const parentById = new Map();
  for (const edge of edges) {
    if (edge.id.startsWith("child-")) {
      parentById.set(edge.target, edge.source);
    }
  }

  const levelById = new Map();
  function getLevel(nodeId, visited = new Set()) {
    if (levelById.has(nodeId)) return levelById.get(nodeId);
    if (visited.has(nodeId)) return 0;
    visited.add(nodeId);
    const parentId = parentById.get(nodeId);
    const level = parentId ? getLevel(parentId, visited) + 1 : 0;
    levelById.set(nodeId, level);
    return level;
  }
  for (const node of nodes) getLevel(node.id);
  return levelById;
}

function assignPositions(nodes, edges, xById, levelById) {
  const parentById = new Map();
  const childrenByParent = new Map();
  for (const edge of edges) {
    if (!edge.id.startsWith("child-")) continue;
    parentById.set(edge.target, edge.source);
    if (!childrenByParent.has(edge.source)) childrenByParent.set(edge.source, []);
    childrenByParent.get(edge.source).push(edge.target);
  }

  const maxLevel = Math.max(0, ...nodes.map((n) => levelById.get(n.id) || 0));
  const nodesByLevel = new Map();
  for (const node of nodes) {
    const level = levelById.get(node.id) || 0;
    if (!nodesByLevel.has(level)) nodesByLevel.set(level, []);
    nodesByLevel.get(level).push(node);
  }

  const positionById = new Map();

  // Level 0: use ELK x, spread to avoid overlaps
  const roots = [...(nodesByLevel.get(0) || [])].sort(
    (a, b) => (xById.get(a.id) || 0) - (xById.get(b.id) || 0),
  );
  for (let i = 0; i < roots.length; i++) {
    let x = xById.get(roots[i].id) || 0;
    if (i > 0) x = Math.max(x, positionById.get(roots[i - 1].id).x + NODE_WIDTH + HORIZONTAL_GAP);
    positionById.set(roots[i].id, { x, y: 0 });
  }

  // Levels 1+: center each sibling group under its parent
  for (let level = 1; level <= maxLevel; level++) {
    const levelNodes = nodesByLevel.get(level) || [];

    // Group nodes by parent, sorted by the parent's x position
    const groups = new Map();
    for (const node of levelNodes) {
      const pid = parentById.get(node.id);
      if (!groups.has(pid)) groups.set(pid, []);
      groups.get(pid).push(node);
    }
    const sortedParentIds = [...groups.keys()].sort(
      (a, b) => (positionById.get(a)?.x ?? 0) - (positionById.get(b)?.x ?? 0),
    );

    let nextMinX = 0;
    for (const pid of sortedParentIds) {
      // Sort siblings by ELK x to respect any dependency ordering within the group
      const children = [...groups.get(pid)].sort(
        (a, b) => (xById.get(a.id) || 0) - (xById.get(b.id) || 0),
      );
      const parentCenterX = (positionById.get(pid)?.x ?? 0) + NODE_WIDTH / 2;
      const groupWidth = children.length * NODE_WIDTH + (children.length - 1) * HORIZONTAL_GAP;
      const startX = Math.max(parentCenterX - groupWidth / 2, nextMinX);

      for (let i = 0; i < children.length; i++) {
        positionById.set(children[i].id, {
          x: startX + i * (NODE_WIDTH + HORIZONTAL_GAP),
          y: level * VERTICAL_LEVEL_GAP,
        });
      }
      nextMinX = startX + groupWidth + HORIZONTAL_GAP;
    }
  }

  return positionById;
}

async function computeElkLayout(nodes, edges) {
  const depEdges = edges.filter((e) => e.id.startsWith("dependency-"));
  const levelById = computeParentChildLevels(nodes, edges);

  const graph = {
    id: "root",
    layoutOptions: ELK_OPTIONS,
    children: nodes.map((node) => ({ id: node.id, width: NODE_WIDTH, height: NODE_HEIGHT })),
    edges: depEdges.map((edge) => ({ id: edge.id, sources: [edge.source], targets: [edge.target] })),
  };

  const layoutResult = await elk.layout(graph);
  const xById = new Map();
  for (const child of layoutResult.children || []) {
    xById.set(child.id, child.x || 0);
  }

  const positionById = assignPositions(nodes, edges, xById, levelById);

  return nodes.map((node) => ({
    ...node,
    position: positionById.get(node.id) || node.position,
  }));
}

export function TaskGraphView({ tasks, onTaskClick, onAddDependency }) {
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

  const handleConnect = useCallback(
    (connection) => {
      if (onAddDependency) {
        // source = blocker (dependency), target = the task that depends on it
        onAddDependency(connection.target, connection.source);
      }
    },
    [onAddDependency],
  );

  const isValidConnection = useCallback(
    (connection) => connection.sourceHandle === "right" && connection.targetHandle === "left",
    [],
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
      onConnect={handleConnect}
      isValidConnection={isValidConnection}
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
