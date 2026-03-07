import { useCallback, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { Page } from "../components/Page.tsx";
import { useSetPageActions } from "../components/PageActionsContext.tsx";
import { TaskGraphView } from "../components/TaskGraphView.tsx";
import { TaskTableView } from "../components/TaskTableView.tsx";
import { TaskCreateModal } from "../components/TaskCreateModal.tsx";
import { TaskEditModal } from "../components/TaskEditModal.tsx";
import type {
  Agent,
  Principal,
  TaskItem,
  TaskRelationshipDraftById,
} from "../types/domain.ts";

interface TasksPageProps {
  selectedCompanyId: string;
  tasks: TaskItem[];
  agents: Agent[];
  principals: Principal[];
  isLoadingTasks: boolean;
  taskError: string;
  isSubmittingTask: boolean;
  savingTaskId: string | null;
  commentingTaskId: string | null;
  deletingTaskId: string | null;
  name: string;
  description: string;
  assigneePrincipalId: string;
  status: string;
  parentTaskId: string;
  dependencyTaskIds: string[];
  relationshipDrafts: TaskRelationshipDraftById;
  taskCountLabel: string;
  onNameChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onAssigneePrincipalIdChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onParentTaskIdChange: (value: string) => void;
  onDependencyTaskIdsChange: (value: string[]) => void;
  onCreateTask: (event: FormEvent<HTMLFormElement>) => Promise<boolean> | boolean;
  onCreateAndExecuteTask: (event: FormEvent<HTMLFormElement>, agentId: string) => Promise<boolean> | boolean;
  onDraftChange: (taskId: string, field: string, value: string | string[]) => void;
  onSaveRelationships: (taskId: string) => Promise<boolean> | boolean;
  onExecuteTask: (taskId: string, agentId: string) => Promise<boolean> | boolean;
  onAddDependency?: (taskId: string, dependencyTaskId: string) => void;
  onCreateTaskComment: (taskId: string, comment: string) => Promise<boolean> | boolean;
  onDeleteTask: (taskId: string, taskName: string) => void;
  onBatchDeleteTasks: (taskIds: string[]) => Promise<boolean> | boolean;
  onBatchExecuteTasks: (taskIds: string[], fallbackAgentId?: string) => Promise<boolean> | boolean;
  onOpenTaskThread: (threadId: string) => Promise<void> | void;
  renderTaskLink: (task: TaskItem) => ReactNode;
}

export function TasksPage({
  selectedCompanyId,
  tasks,
  agents,
  principals,
  isLoadingTasks,
  taskError,
  isSubmittingTask,
  savingTaskId,
  commentingTaskId,
  deletingTaskId,
  name,
  description,
  assigneePrincipalId,
  status,
  parentTaskId,
  dependencyTaskIds,
  relationshipDrafts,
  taskCountLabel,
  onNameChange,
  onDescriptionChange,
  onAssigneePrincipalIdChange,
  onStatusChange,
  onParentTaskIdChange,
  onDependencyTaskIdsChange,
  onCreateTask,
  onCreateAndExecuteTask,
  onDraftChange,
  onSaveRelationships,
  onExecuteTask,
  onAddDependency,
  onCreateTaskComment,
  onDeleteTask,
  onBatchDeleteTasks,
  onBatchExecuteTasks,
  onOpenTaskThread,
  renderTaskLink,
}: TasksPageProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState("");
  const [activeTab, setActiveTab] = useState<"graph" | "table">("graph");

  const editingTask = editingTaskId
    ? tasks.find((task) => task.id === editingTaskId) || null
    : null;

  function closeEditTaskModal() {
    setEditingTaskId("");
  }

  const handleTaskClick = useCallback((taskId: string) => {
    setEditingTaskId(taskId);
  }, []);

  const handleDeleteTask = useCallback((taskId: string, taskName?: string) => {
    onDeleteTask(taskId, taskName || taskId);
    setEditingTaskId("");
  }, [onDeleteTask]);

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
    <Page className="page-container-full">
      <div className="task-view-fullscreen">
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

        {taskError ? <p className="error-banner">{taskError}</p> : null}
        {isLoadingTasks ? <p className="empty-hint">Loading tasks...</p> : null}

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

        {tasks.length > 0 ? (
          <div className="task-view-container">
            {activeTab === "graph" ? (
              <TaskGraphView tasks={tasks} onTaskClick={handleTaskClick} onAddDependency={onAddDependency} />
            ) : (
              <TaskTableView
                tasks={tasks}
                agents={agents}
                onTaskClick={handleTaskClick}
                onDeleteTask={handleDeleteTask}
                onBatchDeleteTasks={onBatchDeleteTasks}
                onBatchExecuteTasks={onBatchExecuteTasks}
              />
            )}
          </div>
        ) : null}
      </div>

      <TaskCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        tasks={tasks}
        principals={principals}
        name={name}
        description={description}
        assigneePrincipalId={assigneePrincipalId}
        status={status}
        parentTaskId={parentTaskId}
        dependencyTaskIds={dependencyTaskIds}
        isSubmittingTask={isSubmittingTask}
        onNameChange={onNameChange}
        onDescriptionChange={onDescriptionChange}
        onAssigneePrincipalIdChange={onAssigneePrincipalIdChange}
        onStatusChange={onStatusChange}
        onParentTaskIdChange={onParentTaskIdChange}
        onDependencyTaskIdsChange={onDependencyTaskIdsChange}
        onCreateTask={onCreateTask}
        onCreateAndExecuteTask={onCreateAndExecuteTask}
        agents={agents}
      />

      <TaskEditModal
        task={editingTask}
        tasks={tasks}
        agents={agents}
        principals={principals}
        relationshipDraft={relationshipDrafts[editingTaskId]}
        savingTaskId={savingTaskId}
        commentingTaskId={commentingTaskId}
        deletingTaskId={deletingTaskId}
        onDraftChange={onDraftChange}
        onSaveRelationships={onSaveRelationships}
        onExecuteTask={onExecuteTask}
        onCreateTaskComment={onCreateTaskComment}
        onDeleteTask={handleDeleteTask}
        onOpenTaskThread={onOpenTaskThread}
        onClose={closeEditTaskModal}
      />
    </Page>
  );
}
