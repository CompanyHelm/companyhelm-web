import { CreationModal } from "./CreationModal.jsx";

export function TaskCreateModal({
  isOpen,
  onClose,
  tasks,
  name,
  description,
  parentTaskId,
  dependencyTaskIds,
  isSubmittingTask,
  onNameChange,
  onDescriptionChange,
  onParentTaskIdChange,
  onDependencyTaskIdsChange,
  onCreateTask,
}) {
  async function handleSubmit(event) {
    const didCreate = await onCreateTask(event);
    if (didCreate) {
      onClose();
    }
  }

  return (
    <CreationModal
      modalId="create-task-modal"
      title="Create task"
      description="Add a new task for the current company."
      isOpen={isOpen}
      onClose={onClose}
    >
      <form className="task-form" onSubmit={handleSubmit}>
        <label htmlFor="task-name">Name</label>
        <input
          id="task-name"
          name="name"
          placeholder="e.g. Build API docs"
          value={name}
          onChange={(event) => onNameChange(event.target.value)}
          required
          autoFocus
        />

        <label htmlFor="task-description">Description</label>
        <textarea
          id="task-description"
          name="description"
          rows={3}
          placeholder="Optional details..."
          value={description}
          onChange={(event) => onDescriptionChange(event.target.value)}
        />

        <label htmlFor="task-parent">Parent task</label>
        <select
          id="task-parent"
          name="parentTaskId"
          value={String(parentTaskId || "")}
          onChange={(event) => onParentTaskIdChange(event.target.value)}
        >
          <option value="">No parent task</option>
          {tasks.map((task) => (
            <option key={`create-parent-${task.id}`} value={String(task.id)}>
              {task.name}
            </option>
          ))}
        </select>
        <p className="chat-card-meta">Optional: assign this task under an existing parent task.</p>

        <label htmlFor="task-dependency">Dependencies</label>
        <select
          id="task-dependency"
          name="dependencyTaskIds"
          multiple
          value={Array.isArray(dependencyTaskIds) ? dependencyTaskIds : []}
          onChange={(event) =>
            onDependencyTaskIdsChange(
              Array.from(event.target.selectedOptions).map((option) => option.value),
            )
          }
        >
          {tasks.map((task) => (
            <option key={`create-dependency-${task.id}`} value={String(task.id)}>
              {task.name}
            </option>
          ))}
        </select>
        <p className="chat-card-meta">Select one or more tasks this task depends on.</p>

        <button type="submit" disabled={isSubmittingTask}>
          {isSubmittingTask ? "Creating..." : "Create task"}
        </button>
      </form>
    </CreationModal>
  );
}
