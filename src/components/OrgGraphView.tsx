import { useCallback, useMemo } from "react";
import {
  Controls,
  Handle,
  MarkerType,
  MiniMap,
  type NodeProps,
  type NodeTypes,
  Position,
  ReactFlow,
  type Edge,
  type Node,
  type NodeMouseHandler,
} from "@xyflow/react";
import { ActorKindBadge } from "./ActorKindBadge.tsx";
import type { Actor, ReporteeRelation } from "../types/domain.ts";

const NODE_WIDTH = 220;
const NODE_HEIGHT = 84;
const VERTICAL_LEVEL_GAP = 170;
const HORIZONTAL_GAP = 64;

interface OrgGraphViewProps {
  actors: Actor[];
  reportees: ReporteeRelation[];
  onOpenActor?: (actorId: string) => void;
}

type OrgGraphNodeData = {
  kind: Actor["kind"];
  label: string;
};

function OrgNode({ data }: NodeProps<Node<OrgGraphNodeData, "org">>) {
  return (
    <div className="org-graph-node">
      <Handle type="target" id="top" position={Position.Top} className="org-graph-handle" />
      <strong className="org-graph-node-name">{data.label}</strong>
      <ActorKindBadge kind={data.kind} className="org-graph-node-badge" />
      <Handle type="source" id="bottom" position={Position.Bottom} className="org-graph-handle" />
    </div>
  );
}

const nodeTypes: NodeTypes = {
  org: OrgNode,
};

function compareActors(left: Actor, right: Actor) {
  const leftName = String(left?.displayName || "").trim();
  const rightName = String(right?.displayName || "").trim();
  const byName = leftName.localeCompare(rightName);
  if (byName !== 0) {
    return byName;
  }
  return String(left?.id || "").localeCompare(String(right?.id || ""));
}

function buildOrgGraph(actors: Actor[], reportees: ReporteeRelation[]) {
  const actorList = Array.isArray(actors) ? actors : [];
  const relationList = Array.isArray(reportees) ? reportees : [];
  const actorById = new Map(
    actorList.map((actor) => [String(actor?.id || "").trim(), actor] as const).filter(([id]) => Boolean(id)),
  );
  const childIdsByManagerId = new Map<string, string[]>();
  const parentIdByChildId = new Map<string, string>();

  for (const relation of relationList) {
    const managerActorId = String(relation?.managerActorId || "").trim();
    const reporteeActorId = String(relation?.reporteeActorId || "").trim();
    if (!managerActorId || !reporteeActorId || managerActorId === reporteeActorId) {
      continue;
    }
    if (!actorById.has(managerActorId) || !actorById.has(reporteeActorId)) {
      continue;
    }
    if (parentIdByChildId.has(reporteeActorId)) {
      continue;
    }

    parentIdByChildId.set(reporteeActorId, managerActorId);
    const currentChildIds = childIdsByManagerId.get(managerActorId) || [];
    childIdsByManagerId.set(managerActorId, [...currentChildIds, reporteeActorId]);
  }

  for (const [managerActorId, childIds] of childIdsByManagerId.entries()) {
    childIdsByManagerId.set(
      managerActorId,
      [...childIds].sort((leftId, rightId) => compareActors(actorById.get(leftId)!, actorById.get(rightId)!)),
    );
  }

  const nodes: Node<OrgGraphNodeData, "org">[] = actorList.map((actor) => ({
    id: actor.id,
    position: { x: 0, y: 0 },
    data: {
      label: actor.displayName,
      kind: actor.kind,
    },
    type: "org",
    sourcePosition: Position.Bottom,
    targetPosition: Position.Top,
    style: {
      width: NODE_WIDTH,
      background: "transparent",
      border: "0",
      boxShadow: "none",
      padding: 0,
    },
  }));

  const subtreeWidthById = new Map<string, number>();
  function getSubtreeWidth(actorId: string, visiting: Set<string> = new Set<string>()) {
    if (subtreeWidthById.has(actorId)) {
      return subtreeWidthById.get(actorId) || NODE_WIDTH;
    }
    if (visiting.has(actorId)) {
      return NODE_WIDTH;
    }

    visiting.add(actorId);
    const childIds = childIdsByManagerId.get(actorId) || [];
    const childrenTotalWidth = childIds.reduce(
      (sum, childId) => sum + getSubtreeWidth(childId, visiting),
      0,
    ) + Math.max(0, childIds.length - 1) * HORIZONTAL_GAP;
    const width = Math.max(NODE_WIDTH, childrenTotalWidth);
    visiting.delete(actorId);
    subtreeWidthById.set(actorId, width);
    return width;
  }

  for (const actor of actorList) {
    getSubtreeWidth(actor.id);
  }

  const positionByActorId = new Map<string, { x: number; y: number }>();
  function placeSubtree(actorId: string, leftX: number, depth: number, visiting: Set<string> = new Set<string>()) {
    if (visiting.has(actorId)) {
      return;
    }

    visiting.add(actorId);
    const subtreeWidth = subtreeWidthById.get(actorId) || NODE_WIDTH;
    positionByActorId.set(actorId, {
      x: leftX + (subtreeWidth - NODE_WIDTH) / 2,
      y: depth * VERTICAL_LEVEL_GAP,
    });

    const childIds = childIdsByManagerId.get(actorId) || [];
    const childrenTotalWidth = childIds.reduce(
      (sum, childId) => sum + (subtreeWidthById.get(childId) || NODE_WIDTH),
      0,
    ) + Math.max(0, childIds.length - 1) * HORIZONTAL_GAP;
    let childLeftX = leftX + (subtreeWidth - childrenTotalWidth) / 2;

    for (const childId of childIds) {
      const childWidth = subtreeWidthById.get(childId) || NODE_WIDTH;
      placeSubtree(childId, childLeftX, depth + 1, visiting);
      childLeftX += childWidth + HORIZONTAL_GAP;
    }

    visiting.delete(actorId);
  }

  const rootActors = actorList
    .filter((actor) => !parentIdByChildId.has(String(actor.id || "").trim()))
    .sort(compareActors);
  let nextRootLeftX = 0;
  for (const rootActor of rootActors) {
    placeSubtree(rootActor.id, nextRootLeftX, 0);
    nextRootLeftX += (subtreeWidthById.get(rootActor.id) || NODE_WIDTH) + HORIZONTAL_GAP * 2;
  }

  function getDepth(actorId: string, visiting: Set<string> = new Set<string>()) {
    if (visiting.has(actorId)) {
      return 0;
    }
    visiting.add(actorId);
    const parentActorId = parentIdByChildId.get(actorId);
    if (!parentActorId) {
      return 0;
    }
    return getDepth(parentActorId, visiting) + 1;
  }

  let fallbackLeftX = nextRootLeftX;
  for (const actor of actorList.sort(compareActors)) {
    if (positionByActorId.has(actor.id)) {
      continue;
    }
    positionByActorId.set(actor.id, {
      x: fallbackLeftX,
      y: getDepth(actor.id) * VERTICAL_LEVEL_GAP,
    });
    fallbackLeftX += NODE_WIDTH + HORIZONTAL_GAP;
  }

  const positionedNodes = nodes.map((node) => ({
    ...node,
    position: positionByActorId.get(node.id) || { x: 0, y: 0 },
  }));
  const edges: Edge[] = [...parentIdByChildId.entries()]
    .map(([reporteeActorId, managerActorId]) => ({
      id: `${managerActorId}-${reporteeActorId}`,
      source: managerActorId,
      target: reporteeActorId,
      sourceHandle: "bottom",
      targetHandle: "top",
      type: "smoothstep",
      animated: false,
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: "rgba(15, 118, 110, 0.72)",
      },
      style: {
        stroke: "rgba(15, 118, 110, 0.72)",
        strokeWidth: 1.6,
      },
    }));

  return { nodes: positionedNodes, edges };
}

export function OrgGraphView({ actors, reportees, onOpenActor }: OrgGraphViewProps) {
  const graph = useMemo(() => buildOrgGraph(actors, reportees), [actors, reportees]);

  const handleNodeClick = useCallback<NodeMouseHandler>((_event, node) => {
    if (onOpenActor) {
      onOpenActor(node.id);
      return;
    }
    if (typeof window === "undefined") {
      return;
    }
    const selectedNode = window.document.querySelector(`[data-id="${node.id}"]`);
    if (selectedNode instanceof HTMLElement) {
      selectedNode.scrollIntoView({ block: "center", behavior: "smooth" });
    }
  }, [onOpenActor]);

  if (graph.nodes.length === 0) {
    return (
      <div className="task-empty-panel task-graph-empty-panel">
        <p className="empty-hint">No actors available for this org chart.</p>
      </div>
    );
  }

  return (
    <div className="org-graph-surface">
      <div className="task-graph-surface">
        <ReactFlow
          nodes={graph.nodes}
          edges={graph.edges}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
          onNodeClick={handleNodeClick}
          proOptions={{ hideAttribution: true }}
          minZoom={0.1}
          maxZoom={2}
        >
          <MiniMap pannable zoomable />
          <Controls showInteractive={false} />
        </ReactFlow>
      </div>
    </div>
  );
}
