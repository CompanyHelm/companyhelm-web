# Task Graph & Table View Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the current tasks page (list + dependency lanes) with a two-tab full-screen view: a React Flow graph (default) and a tabular view.

**Architecture:** The TasksPage component gets a tab bar with "Graph" and "Table" tabs. Graph view uses `@xyflow/react` with `elkjs` for automatic left-to-right DAG layout. Table view is a standard HTML table with horizontal scroll. Both views fill the viewport height with no page-level scrollbars. Task creation/editing continues to use existing modals.

**Tech Stack:** React 18, @xyflow/react (React Flow v12), elkjs, plain CSS

---

### Task 1: Install dependencies

**Files:**
- Modify: `package.json`

**Step 1: Install @xyflow/react and elkjs**

Run: `cd /Users/andrea/repos/company-helm/frontend && npm install @xyflow/react elkjs`

**Step 2: Verify installation**

Run: `cd /Users/andrea/repos/company-helm/frontend && node -e "require('@xyflow/react'); require('elkjs'); console.log('OK')"`
Expected: `OK`

**Step 3: Commit**

```bash
cd /Users/andrea/repos/company-helm/frontend
git add package.json package-lock.json
git commit -m "feat: add @xyflow/react and elkjs dependencies for task graph view"
```

---

### Task 2: Create TaskGraphView component

**Files:**
- Create: `src/components/TaskGraphView.jsx`

**Step 1: Create the TaskGraphView component**

This component receives `tasks` (array) and `onTaskClick` (callback). It:
1. Converts tasks to React Flow nodes and edges
2. Uses ELK to compute left-to-right hierarchical layout
3. Renders the graph with custom task nodes (name, status pill, comment count)
4. Edges are directional with "blocks" labels
5. Includes Controls and MiniMap from React Flow

```jsx
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
  const taskIds = new Set(taskArray.map((t) => String(t.id)));

  const nodes = taskArray.map((task) => ({
    id: String(task.id),
    type: "task",
    data: {
      label: task.name || `Task ${task.id}`,
      status: task.status || "draft",
      commentCount: Array.isArray(task.comments) ? task.comments.length : 0,
    },
    position: { x: 0, y: 0 },
  }));

  const edges = [];
  for (const task of taskArray) {
    const deps = Array.isArray(task.dependencyTaskIds) ? task.dependencyTaskIds : [];
    for (const depId of deps) {
      if (taskIds.has(String(depId)) && String(depId) !== String(task.id)) {
        edges.push({
          id: `e-${depId}-${task.id}`,
          source: String(depId),
          target: String(task.id),
          label: "blocks",
          type: "smoothstep",
          animated: false,
          markerEnd: { type: MarkerType.ArrowClosed },
        });
      }
    }
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
```

**Step 2: Verify file was created**

Run: `ls -la /Users/andrea/repos/company-helm/frontend/src/components/TaskGraphView.jsx`

**Step 3: Commit**

```bash
cd /Users/andrea/repos/company-helm/frontend
git add src/components/TaskGraphView.jsx
git commit -m "feat: add TaskGraphView component with React Flow and ELK layout"
```

---

### Task 3: Create TaskTableView component

**Files:**
- Create: `src/components/TaskTableView.jsx`

**Step 1: Create the TaskTableView component**

This component receives `tasks` (array) and `onTaskClick` (callback). It renders a table with columns: Name, Status, Description, Blocking, Blocked by, Comments, Created.

```jsx
import { useMemo } from "react";

function buildDependencyMaps(tasks) {
  const taskArray = Array.isArray(tasks) ? tasks : [];
  const taskIds = new Set(taskArray.map((t) => String(t.id)));
  const nameById = new Map();
  const blocksMap = new Map();

  for (const task of taskArray) {
    nameById.set(String(task.id), task.name || `Task ${task.id}`);
  }

  for (const task of taskArray) {
    const deps = Array.isArray(task.dependencyTaskIds) ? task.dependencyTaskIds : [];
    for (const depId of deps) {
      if (taskIds.has(String(depId)) && String(depId) !== String(task.id)) {
        const existing = blocksMap.get(String(depId)) || [];
        existing.push(String(task.id));
        blocksMap.set(String(depId), existing);
      }
    }
  }

  return { nameById, blocksMap };
}

export function TaskTableView({ tasks, onTaskClick }) {
  const taskArray = Array.isArray(tasks) ? tasks : [];

  const { nameById, blocksMap } = useMemo(
    () => buildDependencyMaps(taskArray),
    [taskArray],
  );

  if (taskArray.length === 0) {
    return null;
  }

  return (
    <div className="task-table-scroll">
      <table className="task-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Status</th>
            <th>Description</th>
            <th>Blocking</th>
            <th>Blocked by</th>
            <th>Comments</th>
            <th>Created</th>
          </tr>
        </thead>
        <tbody>
          {taskArray.map((task) => {
            const taskId = String(task.id);
            const deps = (Array.isArray(task.dependencyTaskIds) ? task.dependencyTaskIds : [])
              .filter((id) => nameById.has(String(id)) && String(id) !== taskId);
            const blocking = blocksMap.get(taskId) || [];
            const commentCount = Array.isArray(task.comments) ? task.comments.length : 0;

            return (
              <tr
                key={taskId}
                className="task-table-row"
                onClick={() => onTaskClick(taskId)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") onTaskClick(taskId);
                }}
              >
                <td className="task-table-name">{task.name}</td>
                <td>
                  <span className={`task-status-pill task-status-pill-${task.status || "draft"}`}>
                    {task.status || "draft"}
                  </span>
                </td>
                <td className="task-table-desc">{task.description || "\u2014"}</td>
                <td className="task-table-deps">
                  {blocking.length === 0
                    ? "\u2014"
                    : blocking.map((id) => nameById.get(id) || id).join(", ")}
                </td>
                <td className="task-table-deps">
                  {deps.length === 0
                    ? "\u2014"
                    : deps.map((id) => nameById.get(String(id)) || id).join(", ")}
                </td>
                <td>{commentCount}</td>
                <td className="task-table-date">
                  {task.createdAt
                    ? new Date(task.createdAt).toLocaleDateString()
                    : "\u2014"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
```

**Step 2: Verify file was created**

Run: `ls -la /Users/andrea/repos/company-helm/frontend/src/components/TaskTableView.jsx`

**Step 3: Commit**

```bash
cd /Users/andrea/repos/company-helm/frontend
git add src/components/TaskTableView.jsx
git commit -m "feat: add TaskTableView component with core columns"
```

---

### Task 4: Add CSS styles for graph view, table view, and tab bar

**Files:**
- Modify: `src/index.css`

**Step 1: Add CSS for the tab bar, graph container, graph nodes, and table**

Append the following CSS after the existing `.task-status-pill-completed` block (around line 2426) in `src/index.css`:

```css
/* ── Task view tabs ─────────────────────────────── */

.task-view-tabs {
  display: flex;
  gap: 0;
  border-bottom: 1px solid var(--panel-border);
  flex-shrink: 0;
}

.task-view-tab {
  padding: 0.5rem 1.2rem;
  font-size: 0.82rem;
  font-weight: 500;
  color: var(--ink-1);
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  cursor: pointer;
  transition: color 0.15s, border-color 0.15s;
}

.task-view-tab:hover {
  color: var(--ink-0);
}

.task-view-tab-active {
  color: var(--action);
  border-bottom-color: var(--action);
}

/* ── Task view container (full viewport) ────────── */

.task-view-container {
  flex: 1;
  min-height: 0;
  position: relative;
  overflow: hidden;
}

.task-view-fullscreen {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 8rem);
  overflow: hidden;
}

/* ── React Flow graph nodes ─────────────────────── */

.task-graph-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--ink-2);
  font-size: 0.85rem;
}

.task-graph-node {
  padding: 0.55rem 0.65rem;
  border-radius: 10px;
  border: 1px solid rgba(26, 32, 38, 0.14);
  background: rgba(255, 255, 255, 0.92);
  cursor: pointer;
  min-width: 180px;
  max-width: 220px;
  transition: border-color 0.12s, box-shadow 0.12s;
}

.task-graph-node:hover {
  border-color: rgba(15, 118, 110, 0.45);
  box-shadow: 0 2px 12px rgba(15, 118, 110, 0.1);
}

.task-graph-node-draft {
  border-left: 3px solid rgba(71, 85, 105, 0.5);
}

.task-graph-node-pending {
  border-left: 3px solid rgba(194, 65, 12, 0.6);
}

.task-graph-node-in_progress {
  border-left: 3px solid rgba(29, 78, 216, 0.6);
}

.task-graph-node-completed {
  border-left: 3px solid rgba(15, 118, 110, 0.6);
}

.task-graph-node-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.4rem;
  margin-bottom: 0.25rem;
}

.task-graph-node-name {
  font-size: 0.82rem;
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
}

.task-graph-node-meta {
  font-size: 0.7rem;
  color: var(--ink-2);
}

/* ── Task table ─────────────────────────────────── */

.task-table-scroll {
  flex: 1;
  min-height: 0;
  overflow-x: auto;
  overflow-y: auto;
}

.task-table {
  width: 100%;
  min-width: 800px;
  border-collapse: collapse;
  font-size: 0.82rem;
}

.task-table th {
  position: sticky;
  top: 0;
  background: var(--bg-base);
  text-align: left;
  padding: 0.55rem 0.65rem;
  font-weight: 600;
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--ink-1);
  border-bottom: 1px solid var(--panel-border);
  white-space: nowrap;
}

.task-table-row {
  cursor: pointer;
  transition: background 0.1s;
}

.task-table-row:hover {
  background: rgba(15, 118, 110, 0.04);
}

.task-table-row td {
  padding: 0.52rem 0.65rem;
  border-bottom: 1px solid rgba(26, 32, 38, 0.06);
  vertical-align: middle;
}

.task-table-name {
  font-weight: 500;
  white-space: nowrap;
}

.task-table-desc {
  max-width: 260px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--ink-1);
}

.task-table-deps {
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.76rem;
  color: var(--ink-1);
}

.task-table-date {
  white-space: nowrap;
  color: var(--ink-2);
  font-size: 0.76rem;
}
```

**Step 2: Commit**

```bash
cd /Users/andrea/repos/company-helm/frontend
git add src/index.css
git commit -m "feat: add CSS styles for task graph view, table view, and tab bar"
```

---

### Task 5: Refactor TasksPage to use tab layout

**Files:**
- Modify: `src/pages/TasksPage.jsx`

**Step 1: Rewrite TasksPage**

Replace the two-section layout (list panel + lanes board) with a tab bar and conditional rendering of `TaskGraphView` or `TaskTableView`. Keep all modals (create and edit) unchanged.

The new component structure:
1. Tab bar (Graph | Table)
2. Empty state (when no tasks)
3. Conditional: `<TaskGraphView>` or `<TaskTableView>`
4. Create modal (unchanged)
5. Edit modal (unchanged)

```jsx
import { useCallback, useMemo, useState } from "react";
import { Page } from "../components/Page.jsx";
import { CreationModal } from "../components/CreationModal.jsx";
import { useSetPageActions } from "../components/PageActionsContext.jsx";
import { TaskGraphView } from "../components/TaskGraphView.jsx";
import { TaskTableView } from "../components/TaskTableView.jsx";

export function TasksPage({
  selectedCompanyId,
  tasks,
  isLoadingTasks,
  taskError,
  isSubmittingTask,
  savingTaskId,
  commentingTaskId,
  deletingTaskId,
  name,
  description,
  dependencyTaskIds,
  relationshipDrafts,
  taskCountLabel,
  onNameChange,
  onDescriptionChange,
  onDependencyTaskIdsChange,
  onCreateTask,
  onDraftChange,
  onSaveRelationships,
  onCreateTaskComment,
  onDeleteTask,
  renderTaskLink,
}) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState("");
  const [commentDraft, setCommentDraft] = useState("");
  const [activeTab, setActiveTab] = useState("graph");

  function openEditTaskModal(taskId) {
    setEditingTaskId(taskId);
    setCommentDraft("");
  }

  function closeEditTaskModal() {
    setEditingTaskId("");
    setCommentDraft("");
  }

  async function handleCreateTaskSubmit(event) {
    const didCreate = await onCreateTask(event);
    if (didCreate) {
      setIsCreateModalOpen(false);
    }
  }

  async function handleSaveTaskDependencies(taskId) {
    const didSave = await onSaveRelationships(taskId);
    if (didSave) {
      closeEditTaskModal();
    }
  }

  async function handleCreateTaskCommentSubmit(event) {
    event.preventDefault();
    if (!editingTaskId) {
      return;
    }
    const didCreateComment = await onCreateTaskComment(editingTaskId, commentDraft);
    if (didCreateComment) {
      setCommentDraft("");
    }
  }

  const handleTaskClick = useCallback((taskId) => {
    openEditTaskModal(taskId);
  }, []);

  const pageActions = useMemo(() => (
    <>
      <span className="chat-card-meta">{taskCountLabel}</span>
      <button
        type="button"
        className="chat-minimal-header-icon-btn"
        aria-label="Create task"
        title="Create task"
        onClick={() => setIsCreateModalOpen(true)}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>
    </>
  ), [taskCountLabel]);
  useSetPageActions(pageActions);

  return (
    <Page>
      <div className="task-view-fullscreen">
        {/* Tab bar */}
        <div className="task-view-tabs">
          <button
            type="button"
            className={`task-view-tab${activeTab === "graph" ? " task-view-tab-active" : ""}`}
            onClick={() => setActiveTab("graph")}
          >
            Graph
          </button>
          <button
            type="button"
            className={`task-view-tab${activeTab === "table" ? " task-view-tab-active" : ""}`}
            onClick={() => setActiveTab("table")}
          >
            Table
          </button>
        </div>

        {/* Error and loading states */}
        {taskError ? <p className="error-banner">{taskError}</p> : null}
        {isLoadingTasks ? <p className="empty-hint">Loading tasks...</p> : null}

        {/* Empty state */}
        {!isLoadingTasks && tasks.length === 0 ? (
          <div className="empty-state">
            <p className="empty-hint">Create your first task to populate this board.</p>
            <button
              type="button"
              className="secondary-btn empty-create-btn"
              onClick={() => setIsCreateModalOpen(true)}
            >
              + Create task
            </button>
          </div>
        ) : null}

        {/* Active view */}
        {tasks.length > 0 ? (
          <div className="task-view-container">
            {activeTab === "graph" ? (
              <TaskGraphView tasks={tasks} onTaskClick={handleTaskClick} />
            ) : (
              <TaskTableView tasks={tasks} onTaskClick={handleTaskClick} />
            )}
          </div>
        ) : null}
      </div>

      {/* Create modal - unchanged */}
      <CreationModal
        modalId="create-task-modal"
        title="Create task"
        description="Add a new task for the current company."
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      >
        {/* ... existing create form ... */}
      </CreationModal>

      {/* Edit modal - unchanged */}
      {editingTaskId ? (() => {
        const editTask = tasks.find((t) => t.id === editingTaskId);
        const editDraft = relationshipDrafts[editingTaskId];
        if (!editTask) return null;
        return (
          <CreationModal
            modalId="edit-task-modal"
            title="Edit task"
            description="Update task dependencies and comments."
            isOpen={!!editingTaskId}
            onClose={closeEditTaskModal}
          >
            {/* ... existing edit form ... */}
          </CreationModal>
        );
      })() : null}
    </Page>
  );
}
```

Note: The modals (create and edit) keep their exact existing contents — the `{/* ... */}` placeholders above represent the existing form markup that must be preserved as-is from the current file.

**Step 2: Run existing tests**

Run: `cd /Users/andrea/repos/company-helm/frontend && npm test`
Expected: All tests pass (task-graph.test.js etc.)

**Step 3: Verify the build compiles**

Run: `cd /Users/andrea/repos/company-helm/frontend && npm run build`
Expected: Build succeeds

**Step 4: Commit**

```bash
cd /Users/andrea/repos/company-helm/frontend
git add src/pages/TasksPage.jsx
git commit -m "feat: refactor TasksPage to use Graph/Table tab view"
```

---

### Task 6: Remove old lane CSS (cleanup)

**Files:**
- Modify: `src/index.css`

**Step 1: Remove unused CSS classes**

Remove the following CSS blocks that are no longer used:
- `.task-lane-header` (line ~2311)
- `.task-lane-board` (line ~2319)
- `.task-lane-column` (line ~2326)
- `.task-lane-column-header` (line ~2335)
- `.task-lane-list` (line ~2342)
- `.task-lane-card` (line ~2350)
- `.task-lane-open-btn` (line ~2354)
- `.task-lane-open-btn:hover` (line ~2368)
- `.task-lane-title-row` (line ~2373)
- `.task-lane-title-row strong` (line ~2381)
- `.task-lane-meta` (line ~2386)

Keep `.task-status-pill` and its variants as they are reused by both views.

**Step 2: Verify build still compiles**

Run: `cd /Users/andrea/repos/company-helm/frontend && npm run build`
Expected: Build succeeds

**Step 3: Commit**

```bash
cd /Users/andrea/repos/company-helm/frontend
git add src/index.css
git commit -m "chore: remove unused task lane CSS classes"
```

---

### Task 7: Visual verification

**Step 1: Start dev server**

Run: `cd /Users/andrea/repos/company-helm/frontend && npm run dev`

**Step 2: Open browser and verify**

- Navigate to the tasks page
- Verify the Graph tab is selected by default
- Verify task nodes are laid out left-to-right with directional edges labeled "blocks"
- Switch to Table tab and verify columns render correctly
- Verify clicking a task node/row opens the edit modal
- Verify no page-level scrollbars appear
- Verify the table has horizontal scroll when needed

**Step 3: Run all tests one final time**

Run: `cd /Users/andrea/repos/company-helm/frontend && npm test`
Expected: All tests pass
