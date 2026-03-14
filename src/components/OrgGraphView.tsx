import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Controls,
  MiniMap,
  ReactFlow,
  type Edge,
  type Node,
  type NodeMouseHandler,
} from "@xyflow/react";
import ELK from "elkjs/lib/elk.bundled.js";
import type { Actor, ReporteeRelation } from "../types/domain.ts";

type ElkInstance = {
  layout: (graph: unknown) => Promise<unknown>;
};

const ElkConstructor = ELK as unknown as { new (): ElkInstance };
const elk = new ElkConstructor();

const ORG_ELK_OPTIONS = {
  "elk.algorithm": "layered",
  "elk.direction": "RIGHT",
  "elk.spacing.nodeNode": "56",
  "elk.layered.spacing.nodeNodeBetweenLayers": "90",
};

const NODE_WIDTH = 220;
const NODE_HEIGHT = 84;

interface OrgGraphViewProps {
  actors: Actor[];
  reportees: ReporteeRelation[];
  onOpenActor?: (actorId: string) => void;
}

function getActorKindLabel(kind: Actor["kind"]) {
  return kind === "user" ? "Human" : "AI";
}

function buildOrgGraph(actors: Actor[], reportees: ReporteeRelation[]) {
  const actorList = Array.isArray(actors) ? actors : [];
  const relationList = Array.isArray(reportees) ? reportees : [];
  const actorById = new Map(
    actorList.map((actor) => [String(actor?.id || "").trim(), actor] as const).filter(([id]) => Boolean(id)),
  );

  const nodes: Node[] = actorList.map((actor) => ({
    id: actor.id,
    position: { x: 0, y: 0 },
    data: {
      label: `${actor.displayName} · ${getActorKindLabel(actor.kind)}`,
    },
    type: "default",
    style: {
      width: NODE_WIDTH,
      borderRadius: 18,
      padding: 16,
      border: actor.kind === "agent" ? "1px solid rgba(15, 118, 110, 0.25)" : "1px solid rgba(184, 90, 31, 0.22)",
      background: "rgba(255,255,255,0.92)",
      boxShadow: "0 16px 34px rgba(17, 24, 39, 0.08)",
      fontFamily: "\"Instrument Sans\", sans-serif",
    },
  }));
  const edges: Edge[] = relationList
    .map((relation) => ({
      id: relation.id,
      source: relation.managerActorId,
      target: relation.reporteeActorId,
      label: "manages",
      animated: false,
      type: "smoothstep",
    }))
    .filter((edge) => actorById.has(edge.source) && actorById.has(edge.target) && edge.source !== edge.target);

  return { nodes, edges };
}

export function OrgGraphView({ actors, reportees, onOpenActor }: OrgGraphViewProps) {
  const graph = useMemo(() => buildOrgGraph(actors, reportees), [actors, reportees]);
  const [nodes, setNodes] = useState<Node[]>(graph.nodes);
  const [edges, setEdges] = useState<Edge[]>(graph.edges);
  const [isLoadingLayout, setIsLoadingLayout] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function layoutGraph() {
      if (graph.nodes.length === 0) {
        setNodes([]);
        setEdges(graph.edges);
        return;
      }

      setIsLoadingLayout(true);
      try {
        const layoutResult = await elk.layout({
          id: "org-root",
          layoutOptions: ORG_ELK_OPTIONS,
          children: graph.nodes.map((node) => ({
            id: node.id,
            width: NODE_WIDTH,
            height: NODE_HEIGHT,
          })),
          edges: graph.edges.map((edge) => ({
            id: edge.id,
            sources: [edge.source],
            targets: [edge.target],
          })),
        }) as { children?: Array<{ id?: string; x?: number; y?: number }> };

        if (cancelled) {
          return;
        }

        const positionedNodes = graph.nodes.map((node) => {
          const layoutNode = layoutResult.children?.find((candidate) => candidate.id === node.id);
          return {
            ...node,
            position: {
              x: layoutNode?.x ?? 0,
              y: layoutNode?.y ?? 0,
            },
          };
        });

        setNodes(positionedNodes);
        setEdges(graph.edges);
      } finally {
        if (!cancelled) {
          setIsLoadingLayout(false);
        }
      }
    }

    void layoutGraph();

    return () => {
      cancelled = true;
    };
  }, [graph]);

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

  if (isLoadingLayout) {
    return <div className="task-graph-loading">Computing org layout...</div>;
  }

  return (
    <div className="task-graph-surface org-graph-surface">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        onNodeClick={handleNodeClick}
      >
        <MiniMap pannable zoomable />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
}
