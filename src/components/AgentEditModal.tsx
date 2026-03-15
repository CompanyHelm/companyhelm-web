import { CreationModal } from "./CreationModal.tsx";
import { AgentEditorForm, type AgentDraftField } from "./AgentEditorForm.tsx";
import type {
  Agent,
  AgentDraftById,
  AgentRunner,
  McpServer,
  Role,
  RunnerCodexModelEntriesById,
  Skill,
  StringArrayById,
} from "../types/domain.ts";

interface AgentEditModalProps {
  agents: Agent[];
  agentRunners: AgentRunner[];
  roles: Role[];
  skills: Skill[];
  mcpServers: McpServer[];
  roleMcpServerIdsByRoleId: StringArrayById;
  runnerCodexModelEntriesById: RunnerCodexModelEntriesById;
  agentDrafts: AgentDraftById;
  savingAgentId: string | null;
  deletingAgentId: string | null;
  initializingAgentId: string | null;
  onAgentDraftChange: (agentId: string, field: AgentDraftField, value: string | string[]) => void;
  onSaveAgent: (agentId: string) => Promise<boolean> | boolean;
  onEnsureAgentEditorData: () => Promise<void> | void;
  editingAgentId: string;
  onClose: () => void;
}

export function AgentEditModal({
  agents,
  agentRunners,
  roles,
  skills,
  mcpServers,
  roleMcpServerIdsByRoleId,
  runnerCodexModelEntriesById,
  agentDrafts,
  savingAgentId,
  deletingAgentId,
  initializingAgentId,
  onAgentDraftChange,
  onSaveAgent,
  onEnsureAgentEditorData,
  editingAgentId,
  onClose,
}: AgentEditModalProps) {
  const editingAgent = agents.find((agent) => agent.id === editingAgentId) || null;

  return (
    <CreationModal
      modalId="edit-agent-modal"
      title={editingAgent ? `Edit agent "${editingAgent.name}"` : "Edit agent"}
      description={editingAgent ? "Update runner, model, and role assignments for this agent." : ""}
      isOpen={Boolean(editingAgent)}
      onClose={onClose}
      cardClassName="modal-card-wide"
    >
      {editingAgent ? (
        <AgentEditorForm
          agent={editingAgent}
          agentRunners={agentRunners}
          roles={roles}
          skills={skills}
          mcpServers={mcpServers}
          roleMcpServerIdsByRoleId={roleMcpServerIdsByRoleId}
          runnerCodexModelEntriesById={runnerCodexModelEntriesById}
          agentDraft={agentDrafts[editingAgent.id]}
          savingAgentId={savingAgentId}
          deletingAgentId={deletingAgentId}
          initializingAgentId={initializingAgentId}
          onAgentDraftChange={onAgentDraftChange}
          onSaveAgent={async (agentId: string) => {
            const didSave = await onSaveAgent(agentId);
            if (didSave) {
              onClose();
            }
            return didSave;
          }}
          onEnsureAgentEditorData={onEnsureAgentEditorData}
          onCancel={onClose}
        />
      ) : null}
    </CreationModal>
  );
}
