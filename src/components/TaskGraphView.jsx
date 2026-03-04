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
const BLOCK_VERTICAL_GAP = 46;
const BLOCK_EDGE_ROUTE_BASE_OFFSET = 30;
const BLOCK_EDGE_ROUTE_LANE_GAP = 24;

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

function assignPositions(nodes, edges, xById, yById, levelById) {
  const parentById = new Map();
  const childrenByParent = new Map();
  for (const edge of edges) {
    if (!edge.id.startsWith("child-")) continue;
    parentById.set(edge.target, edge.source);
    if (!childrenByParent.has(edge.source)) childrenByParent.set(edge.source, []);
    childrenByParent.get(edge.source).push(edge.target);
  }

  const orderedChildrenByParent = new Map();
  for (const [parentId, childIds] of childrenByParent.entries()) {
    orderedChildrenByParent.set(
      parentId,
      [...childIds].sort((a, b) => (xById.get(a) || 0) - (xById.get(b) || 0)),
    );
  }

  const subtreeWidthById = new Map();
  function getSubtreeWidth(nodeId, visiting = new Set()) {
    if (subtreeWidthById.has(nodeId)) return subtreeWidthById.get(nodeId);
    if (visiting.has(nodeId)) return NODE_WIDTH;
    visiting.add(nodeId);

    const childIds = orderedChildrenByParent.get(nodeId) || [];
    let width = NODE_WIDTH;
    if (childIds.length > 0) {
      const childrenTotalWidth = childIds.reduce(
        (sum, childId) => sum + getSubtreeWidth(childId, visiting),
        0,
      ) + (childIds.length - 1) * HORIZONTAL_GAP;
      width = Math.max(NODE_WIDTH, childrenTotalWidth);
    }

    visiting.delete(nodeId);
    subtreeWidthById.set(nodeId, width);
    return width;
  }

  for (const node of nodes) {
    getSubtreeWidth(node.id);
  }

  const positionById = new Map();

  function placeSubtree(nodeId, leftX, fallbackLevel = 0, visiting = new Set()) {
    if (visiting.has(nodeId)) return;
    visiting.add(nodeId);

    const width = subtreeWidthById.get(nodeId) || NODE_WIDTH;
    const level = levelById.get(nodeId) || fallbackLevel;
    positionById.set(nodeId, {
      x: leftX + (width - NODE_WIDTH) / 2,
      y: level * VERTICAL_LEVEL_GAP,
    });

    const childIds = orderedChildrenByParent.get(nodeId) || [];
    if (childIds.length > 0) {
      const childrenTotalWidth = childIds.reduce(
        (sum, childId) => sum + (subtreeWidthById.get(childId) || NODE_WIDTH),
        0,
      ) + (childIds.length - 1) * HORIZONTAL_GAP;
      let childLeft = leftX + (width - childrenTotalWidth) / 2;

      for (const childId of childIds) {
        const childWidth = subtreeWidthById.get(childId) || NODE_WIDTH;
        placeSubtree(childId, childLeft, level + 1, visiting);
        childLeft += childWidth + HORIZONTAL_GAP;
      }
    }

    visiting.delete(nodeId);
  }

  const roots = nodes
    .filter((node) => !parentById.has(node.id))
    .sort((a, b) => (xById.get(a.id) || 0) - (xById.get(b.id) || 0));

  let nextRootLeft = 0;
  for (const root of roots) {
    placeSubtree(root.id, nextRootLeft);
    nextRootLeft += (subtreeWidthById.get(root.id) || NODE_WIDTH) + HORIZONTAL_GAP * 2;
  }

  const remainingNodes = nodes
    .filter((node) => !positionById.has(node.id))
    .sort((a, b) => {
      const levelDiff = (levelById.get(a.id) || 0) - (levelById.get(b.id) || 0);
      if (levelDiff !== 0) return levelDiff;
      return (xById.get(a.id) || 0) - (xById.get(b.id) || 0);
    });

  let fallbackX = nextRootLeft;
  for (const node of remainingNodes) {
    positionById.set(node.id, {
      x: fallbackX,
      y: (levelById.get(node.id) || 0) * VERTICAL_LEVEL_GAP,
    });
    fallbackX += NODE_WIDTH + HORIZONTAL_GAP;
  }

  const dependencySourcesByTarget = new Map();
  for (const edge of edges) {
    if (!edge.id.startsWith("dependency-")) continue;
    if (!dependencySourcesByTarget.has(edge.target)) dependencySourcesByTarget.set(edge.target, []);
    dependencySourcesByTarget.get(edge.target).push(edge.source);
  }

  const blockedBySource = new Map();
  for (const [targetId, sourceIds] of dependencySourcesByTarget.entries()) {
    if (sourceIds.length === 0 || !positionById.has(targetId)) continue;

    const targetCenterX = (positionById.get(targetId)?.x ?? 0) + NODE_WIDTH / 2;
    let chosenSourceId = sourceIds[0];
    let chosenDistance = Number.POSITIVE_INFINITY;

    for (const sourceId of sourceIds) {
      const sourcePos = positionById.get(sourceId);
      if (!sourcePos) continue;
      const sourceCenterX = sourcePos.x + NODE_WIDTH / 2;
      const horizontalDistance = targetCenterX - sourceCenterX;
      const distance =
        horizontalDistance >= 0
          ? horizontalDistance
          : Number.MAX_SAFE_INTEGER / 2 + Math.abs(horizontalDistance);
      if (distance < chosenDistance) {
        chosenDistance = distance;
        chosenSourceId = sourceId;
      }
    }

    if (!blockedBySource.has(chosenSourceId)) blockedBySource.set(chosenSourceId, []);
    blockedBySource.get(chosenSourceId).push(targetId);
  }

  function shiftSubtreeY(nodeId, deltaY, visiting = new Set()) {
    if (visiting.has(nodeId)) return;
    visiting.add(nodeId);

    const nodePos = positionById.get(nodeId);
    if (nodePos) {
      positionById.set(nodeId, { x: nodePos.x, y: nodePos.y + deltaY });
    }

    const childIds = orderedChildrenByParent.get(nodeId) || [];
    for (const childId of childIds) {
      shiftSubtreeY(childId, deltaY, visiting);
    }

    visiting.delete(nodeId);
  }

  const blockers = [...blockedBySource.keys()].sort(
    (a, b) => (positionById.get(a)?.x ?? 0) - (positionById.get(b)?.x ?? 0),
  );

  for (const blockerId of blockers) {
    const blockedTargets = [...(blockedBySource.get(blockerId) || [])].sort((a, b) => {
      const yDiff = (yById.get(a) || 0) - (yById.get(b) || 0);
      if (yDiff !== 0) return yDiff;
      return (xById.get(a) || 0) - (xById.get(b) || 0);
    });

    const blockerPos = positionById.get(blockerId);
    if (!blockerPos || blockedTargets.length === 0) continue;

    const blockerCenterY = blockerPos.y + NODE_HEIGHT / 2;
    for (let index = 0; index < blockedTargets.length; index++) {
      const targetId = blockedTargets[index];
      const targetPos = positionById.get(targetId);
      if (!targetPos) continue;

      const centeredLane = index - (blockedTargets.length - 1) / 2;
      const desiredCenterY = blockerCenterY + centeredLane * (NODE_HEIGHT + BLOCK_VERTICAL_GAP);
      const desiredY = desiredCenterY - NODE_HEIGHT / 2;
      const deltaY = desiredY - targetPos.y;
      if (Math.abs(deltaY) < 0.5) continue;

      shiftSubtreeY(targetId, deltaY);
    }
  }

  return positionById;
}

function routeDependencyEdges(edges, nodesWithPositions) {
  const positionById = new Map(
    nodesWithPositions.map((node) => [node.id, node.position]),
  );
  const dependencyEdgesBySource = new Map();

  for (const edge of edges) {
    if (!edge.id.startsWith("dependency-")) continue;
    if (!dependencyEdgesBySource.has(edge.source)) dependencyEdgesBySource.set(edge.source, []);
    dependencyEdgesBySource.get(edge.source).push(edge);
  }

  const centeredLaneByEdgeId = new Map();
  for (const sourceEdges of dependencyEdgesBySource.values()) {
    const sortedEdges = [...sourceEdges].sort((a, b) => {
      const centerAY = (positionById.get(a.target)?.y ?? 0) + NODE_HEIGHT / 2;
      const centerBY = (positionById.get(b.target)?.y ?? 0) + NODE_HEIGHT / 2;
      const yDiff = centerAY - centerBY;
      if (yDiff !== 0) return yDiff;
      return a.target.localeCompare(b.target);
    });

    for (let index = 0; index < sortedEdges.length; index++) {
      centeredLaneByEdgeId.set(
        sortedEdges[index].id,
        index - (sortedEdges.length - 1) / 2,
      );
    }
  }

  return edges.map((edge) => {
    if (!edge.id.startsWith("dependency-")) return edge;
    const centeredLane = centeredLaneByEdgeId.get(edge.id) || 0;
    const laneOffset = BLOCK_EDGE_ROUTE_BASE_OFFSET + Math.abs(centeredLane) * BLOCK_EDGE_ROUTE_LANE_GAP;

    return {
      ...edge,
      pathOptions: {
        ...edge.pathOptions,
        borderRadius: 16,
        offset: laneOffset,
      },
    };
  });
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
  const yById = new Map();
  for (const child of layoutResult.children || []) {
    xById.set(child.id, child.x || 0);
    yById.set(child.id, child.y || 0);
  }

  const positionById = assignPositions(nodes, edges, xById, yById, levelById);

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
      const routedEdges = routeDependencyEdges(rawEdges, nodesWithHandlers);
      setNodes(nodesWithHandlers);
      setEdges(routedEdges);
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
