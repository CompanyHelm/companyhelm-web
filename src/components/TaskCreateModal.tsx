import { useState, type ChangeEvent, type FormEvent } from "react";
import { CreationModal } from "./CreationModal.tsx";

interface TaskOption {
  id: string | number;
  name: string;
}

interface AgentOption {
  id: string | number;
  name: string;
}

interface ActorOption {
  id: string | number;
  kind: "agent" | "user";
  displayName: string;
  agentId?: string | null;
}

interface TaskCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: TaskOption[];
  agents: AgentOption[];
  actors: ActorOption[];
  name: string;
  description: string;
  assigneeActorId: string;
  status: string;
  parentTaskId: string;
  dependencyTaskIds: string[];
  isSubmittingTask: boolean;
  onNameChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onAssigneeActorIdChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onParentTaskIdChange: (value: string) => void;
  onDependencyTaskIdsChange: (value: string[]) => void;
  onCreateTask: (event: FormEvent<HTMLFormElement>) => Promise<boolean> | boolean;
  onCreateAndExecuteTask: (event: FormEvent<HTMLFormElement>, agentId: string) => Promise<boolean> | boolean;
}

export function TaskCreateModal({
  isOpen,
  onClose,
  tasks,
  agents,
  actors,
  name,
  description,
  assigneeActorId,
  status,
  parentTaskId,
  dependencyTaskIds,
  isSubmittingTask,
  onNameChange,
  onDescriptionChange,
  onAssigneeActorIdChange,
  onStatusChange,
  onParentTaskIdChange,
  onDependencyTaskIdsChange,
  onCreateTask,
  onCreateAndExecuteTask,
}: TaskCreateModalProps) {
  const [selectedAgentId, setSelectedAgentId] = useState("");
  const assignedAgentId = String(
    actors.find((actor) => String(actor.id) === String(assigneeActorId) && actor.kind === "agent")
      ?.agentId || "",
  ).trim();
  const effectiveExecuteAgentId = String(selectedAgentId || assignedAgentId).trim();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const didCreate = await onCreateTask(event);
    if (didCreate) {
      onClose();
    }
  }

  async function handleCreateAndExecute(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const didCreate = await onCreateAndExecuteTask(event, effectiveExecuteAgentId);
    if (didCreate) {
      setSelectedAgentId("");
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
          onChange={(event: ChangeEvent<HTMLInputElement>) => onNameChange(event.target.value)}
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
          onChange={(event: ChangeEvent<HTMLTextAreaElement>) => onDescriptionChange(event.target.value)}
        />

        <label htmlFor="task-assignee">Assignee</label>
        <select
          id="task-assignee"
          name="assigneeActorId"
          value={String(assigneeActorId || "")}
          onChange={(event: ChangeEvent<HTMLSelectElement>) => onAssigneeActorIdChange(event.target.value)}
        >
          <option value="">Unassigned</option>
          {actors.map((actor) => (
            <option key={`create-assignee-${actor.id}`} value={String(actor.id)}>
              {actor.displayName} ({actor.kind === "agent" ? "Agent" : "Human"})
            </option>
          ))}
        </select>
        <p className="chat-card-meta">Assign this task to an agent or teammate.</p>

        <label htmlFor="task-status">Status</label>
        <select
          id="task-status"
          name="status"
          value={String(status || "draft")}
          onChange={(event: ChangeEvent<HTMLSelectElement>) => onStatusChange(event.target.value)}
        >
          <option value="draft">draft</option>
          <option value="pending">pending</option>
          <option value="in_progress">in_progress</option>
          <option value="completed">completed</option>
        </select>

        <label htmlFor="task-agent">Execute with agent</label>
        <select
          id="task-agent"
          name="agentId"
          value={selectedAgentId}
          onChange={(event: ChangeEvent<HTMLSelectElement>) => setSelectedAgentId(event.target.value)}
        >
          <option value="">
            {assignedAgentId ? "Use assigned agent" : "No agent"}
          </option>
          {agents.map((agent) => (
            <option key={`create-agent-${agent.id}`} value={String(agent.id)}>
              {agent.name}
            </option>
          ))}
        </select>
        <p className="chat-card-meta">Optional: assign an agent to execute this task.</p>

        <label htmlFor="task-parent">Parent task</label>
        <select
          id="task-parent"
          name="parentTaskId"
          value={String(parentTaskId || "")}
          onChange={(event: ChangeEvent<HTMLSelectElement>) => onParentTaskIdChange(event.target.value)}
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
          onChange={(event: ChangeEvent<HTMLSelectElement>) =>
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

        <div className="task-form-actions">
          <button type="submit" disabled={isSubmittingTask}>
            {isSubmittingTask ? "Creating..." : "Create task"}
          </button>
          <button
            type="button"
            disabled={isSubmittingTask || !effectiveExecuteAgentId}
            onClick={(event: any) => handleCreateAndExecute(event)}
            title={!effectiveExecuteAgentId ? "Select an agent above or assign the task to an agent." : ""}
          >
            {isSubmittingTask ? "Creating..." : "Create & Execute"}
          </button>
        </div>
      </form>
    </CreationModal>
  );
}
