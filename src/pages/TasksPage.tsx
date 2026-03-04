import { useCallback, useMemo, useState } from "react";
import { Page } from "../components/Page.tsx";
import { useSetPageActions } from "../components/PageActionsContext.tsx";
import { TaskGraphView } from "../components/TaskGraphView.tsx";
import { TaskTableView } from "../components/TaskTableView.tsx";
import { TaskCreateModal } from "../components/TaskCreateModal.tsx";
import { TaskEditModal } from "../components/TaskEditModal.tsx";

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
  parentTaskId,
  dependencyTaskIds,
  relationshipDrafts,
  taskCountLabel,
  onNameChange,
  onDescriptionChange,
  onParentTaskIdChange,
  onDependencyTaskIdsChange,
  onCreateTask,
  onDraftChange,
  onSaveRelationships,
  onAddDependency,
  onCreateTaskComment,
  onDeleteTask,
  renderTaskLink,
}: any) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<any>(false);
  const [editingTaskId, setEditingTaskId] = useState<any>("");
  const [activeTab, setActiveTab] = useState<any>("graph");

  const editingTask = editingTaskId
    ? tasks.find((t: any) => t.id === editingTaskId) || null
    : null;

  function closeEditTaskModal() {
    setEditingTaskId("");
  }

  const handleTaskClick = useCallback((taskId: any) => {
    setEditingTaskId(taskId);
  }, []);

  const handleDeleteTask = useCallback((taskId: any, taskName: any) => {
    onDeleteTask(taskId, taskName);
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
              <TaskTableView tasks={tasks} onTaskClick={handleTaskClick} onDeleteTask={onDeleteTask} />
            )}
          </div>
        ) : null}
      </div>

      <TaskCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        tasks={tasks}
        name={name}
        description={description}
        parentTaskId={parentTaskId}
        dependencyTaskIds={dependencyTaskIds}
        isSubmittingTask={isSubmittingTask}
        onNameChange={onNameChange}
        onDescriptionChange={onDescriptionChange}
        onParentTaskIdChange={onParentTaskIdChange}
        onDependencyTaskIdsChange={onDependencyTaskIdsChange}
        onCreateTask={onCreateTask}
      />

      <TaskEditModal
        task={editingTask}
        tasks={tasks}
        relationshipDraft={relationshipDrafts[editingTaskId]}
        savingTaskId={savingTaskId}
        commentingTaskId={commentingTaskId}
        deletingTaskId={deletingTaskId}
        onDraftChange={onDraftChange}
        onSaveRelationships={onSaveRelationships}
        onCreateTaskComment={onCreateTaskComment}
        onDeleteTask={handleDeleteTask}
        onClose={closeEditTaskModal}
      />
    </Page>
  );
}
