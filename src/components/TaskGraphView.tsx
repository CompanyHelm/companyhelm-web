import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ReactFlow,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
  MarkerType,
  type Connection,
  type Edge,
  type IsValidConnection,
  type Node,
  type NodeMouseHandler,
  type NodeProps,
  type NodeTypes,
} from "@xyflow/react";
import ELK from "elkjs/lib/elk.bundled.js";

import type { TaskItem } from "../types/domain.ts";

type ElkInstance = {
  layout: (graph: unknown) => Promise<unknown>;
};

const ElkConstructor = ELK as unknown as { new (): ElkInstance };
const elk = new ElkConstructor();

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

type TaskGraphNodeData = {
  label: string;
  status: string;
  commentCount: number;
  onClick: () => void;
};

type TaskGraphNode = Node<TaskGraphNodeData, "task">;
type TaskGraphEdge = Edge & {
  pathOptions?: {
    borderRadius?: number;
    offset?: number;
  };
};

type XYPosition = {
  x: number;
  y: number;
};

type ElkLayoutNode = {
  id?: string;
  x?: number;
  y?: number;
};

type ElkLayoutResult = {
  children?: ElkLayoutNode[];
};

function TaskNode({ data }: NodeProps<TaskGraphNode>) {
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

const nodeTypes: NodeTypes = { task: TaskNode };

function buildGraphElements(tasks: TaskItem[]) {
  const taskArray = Array.isArray(tasks) ? tasks : [];
  const taskIds = new Set(
    taskArray
      .map((task) => String(task.id || "").trim())
      .filter(Boolean),
  );

  const nodes: TaskGraphNode[] = taskArray.map((task) => ({
    id: String(task.id || "").trim(),
    type: "task",
    data: {
      label: task.name || `Task ${task.id}`,
      status: task.status || "draft",
      commentCount: Array.isArray(task.comments) ? task.comments.length : 0,
      onClick: () => undefined,
    },
    position: { x: 0, y: 0 },
  }));

  const edges: TaskGraphEdge[] = [];
  for (const task of taskArray) {
    const taskId = String(task.id || "").trim();
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

    const parentTaskId = String(task.parentTaskId || "").trim();
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

function computeParentChildLevels(nodes: TaskGraphNode[], edges: TaskGraphEdge[]) {
  const parentById = new Map<string, string>();
  for (const edge of edges) {
    if (edge.id.startsWith("child-")) {
      parentById.set(edge.target, edge.source);
    }
  }

  const levelById = new Map<string, number>();
  function getLevel(nodeId: string, visited: Set<string> = new Set<string>()): number {
    if (levelById.has(nodeId)) {
      return levelById.get(nodeId) || 0;
    }
    if (visited.has(nodeId)) {
      return 0;
    }
    visited.add(nodeId);
    const parentId = parentById.get(nodeId);
    const level = parentId ? getLevel(parentId, visited) + 1 : 0;
    levelById.set(nodeId, level);
    return level;
  }
  for (const node of nodes) {
    getLevel(node.id);
  }
  return levelById;
}

function assignPositions(
  nodes: TaskGraphNode[],
  edges: TaskGraphEdge[],
  xById: Map<string, number>,
  yById: Map<string, number>,
  levelById: Map<string, number>,
) {
  const parentById = new Map<string, string>();
  const childrenByParent = new Map<string, string[]>();
  for (const edge of edges) {
    if (!edge.id.startsWith("child-")) {
      continue;
    }
    parentById.set(edge.target, edge.source);
    if (!childrenByParent.has(edge.source)) {
      childrenByParent.set(edge.source, []);
    }
    childrenByParent.get(edge.source)?.push(edge.target);
  }

  const orderedChildrenByParent = new Map<string, string[]>();
  for (const [parentId, childIds] of childrenByParent.entries()) {
    orderedChildrenByParent.set(
      parentId,
      [...childIds].sort((leftId, rightId) => (xById.get(leftId) || 0) - (xById.get(rightId) || 0)),
    );
  }

  const subtreeWidthById = new Map<string, number>();
  function getSubtreeWidth(nodeId: string, visiting: Set<string> = new Set<string>()) {
    if (subtreeWidthById.has(nodeId)) {
      return subtreeWidthById.get(nodeId) || NODE_WIDTH;
    }
    if (visiting.has(nodeId)) {
      return NODE_WIDTH;
    }
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

  const positionById = new Map<string, XYPosition>();

  function placeSubtree(
    nodeId: string,
    leftX: number,
    fallbackLevel = 0,
    visiting: Set<string> = new Set<string>(),
  ) {
    if (visiting.has(nodeId)) {
      return;
    }
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
    .sort((leftNode, rightNode) => (xById.get(leftNode.id) || 0) - (xById.get(rightNode.id) || 0));

  let nextRootLeft = 0;
  for (const root of roots) {
    placeSubtree(root.id, nextRootLeft);
    nextRootLeft += (subtreeWidthById.get(root.id) || NODE_WIDTH) + HORIZONTAL_GAP * 2;
  }

  const remainingNodes = nodes
    .filter((node) => !positionById.has(node.id))
    .sort((leftNode, rightNode) => {
      const levelDiff = (levelById.get(leftNode.id) || 0) - (levelById.get(rightNode.id) || 0);
      if (levelDiff !== 0) {
        return levelDiff;
      }
      return (xById.get(leftNode.id) || 0) - (xById.get(rightNode.id) || 0);
    });

  let fallbackX = nextRootLeft;
  for (const node of remainingNodes) {
    positionById.set(node.id, {
      x: fallbackX,
      y: (levelById.get(node.id) || 0) * VERTICAL_LEVEL_GAP,
    });
    fallbackX += NODE_WIDTH + HORIZONTAL_GAP;
  }

  const dependencySourcesByTarget = new Map<string, string[]>();
  for (const edge of edges) {
    if (!edge.id.startsWith("dependency-")) {
      continue;
    }
    if (!dependencySourcesByTarget.has(edge.target)) {
      dependencySourcesByTarget.set(edge.target, []);
    }
    dependencySourcesByTarget.get(edge.target)?.push(edge.source);
  }

  const blockedBySource = new Map<string, string[]>();
  for (const [targetId, sourceIds] of dependencySourcesByTarget.entries()) {
    if (sourceIds.length === 0 || !positionById.has(targetId)) {
      continue;
    }

    const targetCenterX = (positionById.get(targetId)?.x ?? 0) + NODE_WIDTH / 2;
    let chosenSourceId = sourceIds[0];
    let chosenDistance = Number.POSITIVE_INFINITY;

    for (const sourceId of sourceIds) {
      const sourcePos = positionById.get(sourceId);
      if (!sourcePos) {
        continue;
      }
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

    if (!blockedBySource.has(chosenSourceId)) {
      blockedBySource.set(chosenSourceId, []);
    }
    blockedBySource.get(chosenSourceId)?.push(targetId);
  }

  function shiftSubtreeY(nodeId: string, deltaY: number, visiting: Set<string> = new Set<string>()) {
    if (visiting.has(nodeId)) {
      return;
    }
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
    (leftId, rightId) => (positionById.get(leftId)?.x ?? 0) - (positionById.get(rightId)?.x ?? 0),
  );

  for (const blockerId of blockers) {
    const blockedTargets = [...(blockedBySource.get(blockerId) || [])].sort((leftId, rightId) => {
      const yDiff = (yById.get(leftId) || 0) - (yById.get(rightId) || 0);
      if (yDiff !== 0) {
        return yDiff;
      }
      return (xById.get(leftId) || 0) - (xById.get(rightId) || 0);
    });

    const blockerPos = positionById.get(blockerId);
    if (!blockerPos || blockedTargets.length === 0) {
      continue;
    }

    const blockerCenterY = blockerPos.y + NODE_HEIGHT / 2;
    for (let index = 0; index < blockedTargets.length; index += 1) {
      const targetId = blockedTargets[index];
      const targetPos = positionById.get(targetId);
      if (!targetPos) {
        continue;
      }

      const centeredLane = index - (blockedTargets.length - 1) / 2;
      const desiredCenterY = blockerCenterY + centeredLane * (NODE_HEIGHT + BLOCK_VERTICAL_GAP);
      const desiredY = desiredCenterY - NODE_HEIGHT / 2;
      const deltaY = desiredY - targetPos.y;
      if (Math.abs(deltaY) < 0.5) {
        continue;
      }

      shiftSubtreeY(targetId, deltaY);
    }
  }

  return positionById;
}

function routeDependencyEdges(edges: TaskGraphEdge[], nodesWithPositions: TaskGraphNode[]) {
  const positionById = new Map<string, XYPosition>(
    nodesWithPositions.map((node) => [node.id, node.position]),
  );
  const dependencyEdgesBySource = new Map<string, TaskGraphEdge[]>();

  for (const edge of edges) {
    if (!edge.id.startsWith("dependency-")) {
      continue;
    }
    if (!dependencyEdgesBySource.has(edge.source)) {
      dependencyEdgesBySource.set(edge.source, []);
    }
    dependencyEdgesBySource.get(edge.source)?.push(edge);
  }

  const centeredLaneByEdgeId = new Map<string, number>();
  for (const sourceEdges of dependencyEdgesBySource.values()) {
    const sortedEdges = [...sourceEdges].sort((leftEdge, rightEdge) => {
      const centerAY = (positionById.get(leftEdge.target)?.y ?? 0) + NODE_HEIGHT / 2;
      const centerBY = (positionById.get(rightEdge.target)?.y ?? 0) + NODE_HEIGHT / 2;
      const yDiff = centerAY - centerBY;
      if (yDiff !== 0) {
        return yDiff;
      }
      return leftEdge.target.localeCompare(rightEdge.target);
    });

    for (let index = 0; index < sortedEdges.length; index += 1) {
      centeredLaneByEdgeId.set(
        sortedEdges[index].id,
        index - (sortedEdges.length - 1) / 2,
      );
    }
  }

  return edges.map((edge) => {
    if (!edge.id.startsWith("dependency-")) {
      return edge;
    }
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

function computeFallbackLayout(nodes: TaskGraphNode[], edges: TaskGraphEdge[]) {
  const levelById = computeParentChildLevels(nodes, edges);
  const nextColumnByLevel = new Map<number, number>();

  return [...nodes]
    .sort((leftNode, rightNode) => {
      const levelDiff = (levelById.get(leftNode.id) || 0) - (levelById.get(rightNode.id) || 0);
      if (levelDiff !== 0) {
        return levelDiff;
      }
      return leftNode.id.localeCompare(rightNode.id);
    })
    .map((node) => {
      const level = levelById.get(node.id) || 0;
      const columnIndex = nextColumnByLevel.get(level) || 0;
      nextColumnByLevel.set(level, columnIndex + 1);

      return {
        ...node,
        position: {
          x: columnIndex * (NODE_WIDTH + HORIZONTAL_GAP * 2),
          y: level * VERTICAL_LEVEL_GAP,
        },
      };
    });
}

async function computeElkLayout(nodes: TaskGraphNode[], edges: TaskGraphEdge[]) {
  const depEdges = edges.filter((edge) => edge.id.startsWith("dependency-"));
  const levelById = computeParentChildLevels(nodes, edges);

  const graph = {
    id: "root",
    layoutOptions: ELK_OPTIONS,
    children: nodes.map((node) => ({ id: node.id, width: NODE_WIDTH, height: NODE_HEIGHT })),
    edges: depEdges.map((edge) => ({ id: edge.id, sources: [edge.source], targets: [edge.target] })),
  };

  const layoutResult = await elk.layout(graph) as ElkLayoutResult;
  const xById = new Map<string, number>();
  const yById = new Map<string, number>();
  for (const child of layoutResult.children || []) {
    const childId = String(child.id || "").trim();
    if (!childId) {
      continue;
    }
    xById.set(childId, child.x || 0);
    yById.set(childId, child.y || 0);
  }

  const positionById = assignPositions(nodes, edges, xById, yById, levelById);

  return nodes.map((node) => ({
    ...node,
    position: positionById.get(node.id) || node.position,
  }));
}

interface TaskGraphViewProps {
  tasks: TaskItem[];
  onTaskClick: (taskId: string) => void;
  onAddDependency?: (taskId: string, dependencyTaskId: string) => void;
}

export function TaskGraphView({ tasks, onTaskClick, onAddDependency }: TaskGraphViewProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState<TaskGraphNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<TaskGraphEdge>([]);
  const [isLayoutReady, setIsLayoutReady] = useState(false);
  const onTaskClickRef = useRef(onTaskClick);

  const { nodes: rawNodes, edges: rawEdges } = useMemo(
    () => buildGraphElements(tasks),
    [tasks],
  );

  useEffect(() => {
    onTaskClickRef.current = onTaskClick;
  }, [onTaskClick]);

  useEffect(() => {
    let isCancelled = false;

    if (rawNodes.length === 0) {
      setNodes([]);
      setEdges([]);
      setIsLayoutReady(true);
      return () => {
        isCancelled = true;
      };
    }

    setIsLayoutReady(false);

    const applyLayoutNodes = (layoutNodes: TaskGraphNode[]) => {
      if (isCancelled) {
        return;
      }
      const nodesWithHandlers: TaskGraphNode[] = layoutNodes.map((node) => ({
        ...node,
        data: {
          ...node.data,
          onClick: () => onTaskClickRef.current(node.id),
        },
      }));
      const routedEdges = routeDependencyEdges(rawEdges, nodesWithHandlers);
      setNodes(nodesWithHandlers);
      setEdges(routedEdges);
      setIsLayoutReady(true);
    };

    void computeElkLayout(rawNodes, rawEdges)
      .then((layoutNodes) => {
        applyLayoutNodes(layoutNodes);
      })
      .catch((error) => {
        console.error("Task graph layout failed. Falling back to a basic layout.", error);
        applyLayoutNodes(computeFallbackLayout(rawNodes, rawEdges));
      });

    return () => {
      isCancelled = true;
    };
  }, [rawNodes, rawEdges, setNodes, setEdges]);

  const handleNodeClick = useCallback<NodeMouseHandler<TaskGraphNode>>(
    (_event, node) => {
      onTaskClick(node.id);
    },
    [onTaskClick],
  );

  const handleConnect = useCallback(
    (connection: Connection) => {
      if (!onAddDependency) {
        return;
      }
      const targetTaskId = String(connection.target || "").trim();
      const dependencyTaskId = String(connection.source || "").trim();
      if (!targetTaskId || !dependencyTaskId) {
        return;
      }
      // source = blocker (dependency), target = the task that depends on it
      onAddDependency(targetTaskId, dependencyTaskId);
    },
    [onAddDependency],
  );

  const isValidConnection = useCallback<IsValidConnection>(
    (connection) => connection.sourceHandle === "right" && connection.targetHandle === "left",
    [],
  );

  if (rawNodes.length === 0) {
    return (
      <div className="task-empty-panel task-graph-empty-panel">
        <p className="empty-hint">No tasks are available for this graph.</p>
      </div>
    );
  }

  if (!isLayoutReady && rawNodes.length > 0) {
    return <div className="task-graph-loading">Computing layout...</div>;
  }

  return (
    <div className="task-graph-surface">
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
    </div>
  );
}
