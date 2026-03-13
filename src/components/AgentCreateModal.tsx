import type { ChangeEvent, FormEvent } from "react";
import { CreationModal } from "./CreationModal.tsx";
import { AgentCreatedActions } from "./AgentCreatedActions.tsx";
import { AVAILABLE_AGENT_SDKS } from "../utils/constants.ts";
import { formatRunnerLabel, isRunnerReadyAndConnected } from "../utils/formatting.ts";
import type { CreatedAgentSummary, AgentCreationFormStatus } from "../utils/agent-creation.ts";
import type { AgentRunner, RunnerCodexModelEntry } from "../types/domain.ts";

function formatAvailabilityOptionLabel(
  name: string,
  availabilityState: "available" | "unavailable" | "not-reported",
) {
  if (availabilityState === "available") {
    return `${name} (available)`;
  }
  if (availabilityState === "unavailable") {
    return `${name} (unavailable)`;
  }
  return `${name} (not reported)`;
}

interface AgentCreateModalProps {
  isOpen: boolean;
  hasLoadedAgentRunners: boolean;
  formStatus: Pick<AgentCreationFormStatus, "canSubmit">;
  agentRunners: AgentRunner[];
  createAssignedRoleIds: string[];
  createAssignedSkillIds: string[];
  createAssignedMcpServerIds: string[];
  createAvailableRoles: Array<{ id: string; name: string }>;
  createAvailableSkills: Array<{ id: string; name: string }>;
  createAvailableMcpServers: Array<{ id: string; name: string }>;
  createEffectiveSkillLabels: string[];
  createEffectiveMcpServerLabels: string[];
  roleLabelById: Map<string, string>;
  skillLabelById: Map<string, string>;
  mcpServerLabelById: Map<string, string>;
  agentRunnerId: string;
  agentName: string;
  agentSdk: string;
  agentModel: string;
  agentModelReasoningLevel: string;
  agentDefaultAdditionalModelInstructions: string;
  sdkAvailabilityByName: Map<string, "available" | "unavailable">;
  runnerModelEntries: RunnerCodexModelEntry[];
  runnerModelNames: string[];
  runnerReasoningLevels: string[];
  isCreatingAgent: boolean;
  createdAgent: CreatedAgentSummary | null;
  isCreatingPostCreateChat: boolean;
  onClose: () => void;
  onCreateAgent: (event: FormEvent<HTMLFormElement>) => Promise<boolean> | boolean;
  onAgentRunnerChange: (runnerId: string) => void;
  onAgentRoleIdsChange: (roleIds: string[]) => void;
  onAgentSkillIdsChange: (skillIds: string[]) => void;
  onAgentMcpServerIdsChange: (mcpServerIds: string[]) => void;
  onAgentNameChange: (name: string) => void;
  onAgentSdkChange: (sdk: string) => void;
  onAgentModelChange: (model: string) => void;
  onAgentModelReasoningLevelChange: (reasoningLevel: string) => void;
  onAgentDefaultAdditionalModelInstructionsChange: (instructions: string) => void;
  onChatNow: () => void;
  onSkipPostCreate: () => void;
}

export function AgentCreateModal({
  isOpen,
  hasLoadedAgentRunners,
  formStatus,
  agentRunners,
  createAssignedRoleIds,
  createAssignedSkillIds,
  createAssignedMcpServerIds,
  createAvailableRoles,
  createAvailableSkills,
  createAvailableMcpServers,
  createEffectiveSkillLabels,
  createEffectiveMcpServerLabels,
  roleLabelById,
  skillLabelById,
  mcpServerLabelById,
  agentRunnerId,
  agentName,
  agentSdk,
  agentModel,
  agentModelReasoningLevel,
  agentDefaultAdditionalModelInstructions,
  sdkAvailabilityByName,
  runnerModelEntries,
  runnerModelNames,
  runnerReasoningLevels,
  isCreatingAgent,
  createdAgent,
  isCreatingPostCreateChat,
  onClose,
  onCreateAgent,
  onAgentRunnerChange,
  onAgentRoleIdsChange,
  onAgentSkillIdsChange,
  onAgentMcpServerIdsChange,
  onAgentNameChange,
  onAgentSdkChange,
  onAgentModelChange,
  onAgentModelReasoningLevelChange,
  onAgentDefaultAdditionalModelInstructionsChange,
  onChatNow,
  onSkipPostCreate,
}: AgentCreateModalProps) {
  const hasReadyConnectedRunner = agentRunners.some((runner) => isRunnerReadyAndConnected(runner));

  return (
    <CreationModal
      modalId="create-agent-modal"
      title="Create agent"
      description="Register a new agent profile for this company. A connected runner with a configured Codex SDK is required."
      isOpen={isOpen}
      onClose={onClose}
    >
      {createdAgent ? (
        <AgentCreatedActions
          agentName={createdAgent.name}
          isCreatingChat={isCreatingPostCreateChat}
          onChatNow={onChatNow}
          onSkipForNow={onSkipPostCreate}
        />
      ) : (
        <form className="task-form" onSubmit={onCreateAgent}>
          <label htmlFor="agent-runner-id">Assigned runner</label>
          <select
            id="agent-runner-id"
            name="agentRunnerId"
            value={agentRunnerId}
            onChange={(event: ChangeEvent<HTMLSelectElement>) => onAgentRunnerChange(event.target.value)}
            required
            disabled={!hasLoadedAgentRunners || !hasReadyConnectedRunner}
          >
            {!hasLoadedAgentRunners ? (
              <option value="">Loading runners...</option>
            ) : !hasReadyConnectedRunner ? (
              <option value="">No connected runners with configured Codex available</option>
            ) : (
              <>
                <option value="">Select runner</option>
                {agentRunners.map((runner) => (
                  <option
                    key={runner.id}
                    value={runner.id}
                    disabled={!isRunnerReadyAndConnected(runner)}
                  >
                    {formatRunnerLabel(runner)}
                  </option>
                ))}
              </>
            )}
          </select>

          <label htmlFor="create-agent-skills-assigned">Assigned roles (optional)</label>
          <div id="create-agent-skills-assigned" className="inline-selection-list">
            {createAssignedRoleIds.length === 0 ? (
              <span className="empty-hint">No roles assigned.</span>
            ) : (
              createAssignedRoleIds.map((roleId) => (
                <button
                  key={`create-agent-remove-skill-${roleId}`}
                  type="button"
                  className="tag-remove-btn"
                  onClick={() =>
                    onAgentRoleIdsChange(
                      createAssignedRoleIds.filter(
                        (candidateId) => candidateId !== roleId,
                      ),
                    )
                  }
                  title={`Remove ${roleLabelById.get(roleId) || "Unknown role"}`}
                >
                  {roleLabelById.get(roleId) || "Unknown role"} ×
                </button>
              ))
            )}
          </div>

          <label htmlFor="create-agent-skill-add">Add role</label>
          <select
            id="create-agent-skill-add"
            value=""
            onChange={(event: ChangeEvent<HTMLSelectElement>) => {
              const nextRoleId = String(event.target.value || "").trim();
              if (!nextRoleId) {
                return;
              }
              onAgentRoleIdsChange([...createAssignedRoleIds, nextRoleId]);
            }}
            disabled={createAvailableRoles.length === 0}
          >
            <option value="">
              {createAvailableRoles.length === 0
                ? "All roles already assigned"
                : "Select role to assign"}
            </option>
            {createAvailableRoles.map((role) => (
              <option key={`create-agent-skill-${role.id}`} value={role.id}>
                {role.name}
              </option>
            ))}
          </select>

          <label htmlFor="create-agent-effective-mcp">Effective MCP servers (from roles)</label>
          <div id="create-agent-effective-mcp" className="inline-selection-list">
            {createEffectiveMcpServerLabels.length === 0 ? (
              <span className="empty-hint">No MCP servers inherited from assigned roles.</span>
            ) : (
              createEffectiveMcpServerLabels.map((mcpServerLabel) => (
                <span key={`create-agent-effective-mcp-${mcpServerLabel}`} className="tag-pill">
                  {mcpServerLabel}
                </span>
              ))
            )}
          </div>

          <label htmlFor="create-agent-direct-skills-assigned">Direct skills</label>
          <div id="create-agent-direct-skills-assigned" className="inline-selection-list">
            {createAssignedSkillIds.length === 0 ? (
              <span className="empty-hint">No direct skills assigned.</span>
            ) : (
              createAssignedSkillIds.map((skillId) => (
                <button
                  key={`create-agent-remove-direct-skill-${skillId}`}
                  type="button"
                  className="tag-remove-btn"
                  onClick={() =>
                    onAgentSkillIdsChange(
                      createAssignedSkillIds.filter((candidateId) => candidateId !== skillId),
                    )
                  }
                  title={`Remove ${skillLabelById.get(skillId) || "Unknown skill"}`}
                >
                  {skillLabelById.get(skillId) || "Unknown skill"} ×
                </button>
              ))
            )}
          </div>

          <label htmlFor="create-agent-direct-skill-add">Add direct skill</label>
          <select
            id="create-agent-direct-skill-add"
            value=""
            onChange={(event: ChangeEvent<HTMLSelectElement>) => {
              const nextSkillId = String(event.target.value || "").trim();
              if (!nextSkillId) {
                return;
              }
              onAgentSkillIdsChange([...createAssignedSkillIds, nextSkillId]);
            }}
            disabled={createAvailableSkills.length === 0}
          >
            <option value="">
              {createAvailableSkills.length === 0
                ? "All skills already assigned"
                : "Select skill to assign"}
            </option>
            {createAvailableSkills.map((skill) => (
              <option key={`create-agent-direct-skill-${skill.id}`} value={skill.id}>
                {skill.name}
              </option>
            ))}
          </select>

          <label htmlFor="create-agent-effective-skills">Inherited skills (from roles)</label>
          <div id="create-agent-effective-skills" className="inline-selection-list">
            {createEffectiveSkillLabels.length === 0 ? (
              <span className="empty-hint">No skills inherited from assigned roles.</span>
            ) : (
              createEffectiveSkillLabels.map((skillLabel) => (
                <span key={`create-agent-effective-skill-${skillLabel}`} className="tag-pill">
                  {skillLabel}
                </span>
              ))
            )}
          </div>

          <label htmlFor="create-agent-direct-mcp-assigned">Direct MCP servers</label>
          <div id="create-agent-direct-mcp-assigned" className="inline-selection-list">
            {createAssignedMcpServerIds.length === 0 ? (
              <span className="empty-hint">No direct MCP servers assigned.</span>
            ) : (
              createAssignedMcpServerIds.map((mcpServerId) => (
                <button
                  key={`create-agent-remove-direct-mcp-${mcpServerId}`}
                  type="button"
                  className="tag-remove-btn"
                  onClick={() =>
                    onAgentMcpServerIdsChange(
                      createAssignedMcpServerIds.filter((candidateId) => candidateId !== mcpServerId),
                    )
                  }
                  title={`Remove ${mcpServerLabelById.get(mcpServerId) || "Unknown MCP server"}`}
                >
                  {mcpServerLabelById.get(mcpServerId) || "Unknown MCP server"} ×
                </button>
              ))
            )}
          </div>

          <label htmlFor="create-agent-direct-mcp-add">Add direct MCP server</label>
          <select
            id="create-agent-direct-mcp-add"
            value=""
            onChange={(event: ChangeEvent<HTMLSelectElement>) => {
              const nextMcpServerId = String(event.target.value || "").trim();
              if (!nextMcpServerId) {
                return;
              }
              onAgentMcpServerIdsChange([...createAssignedMcpServerIds, nextMcpServerId]);
            }}
            disabled={createAvailableMcpServers.length === 0}
          >
            <option value="">
              {createAvailableMcpServers.length === 0
                ? "All MCP servers already assigned"
                : "Select MCP server to assign"}
            </option>
            {createAvailableMcpServers.map((mcpServer) => (
              <option key={`create-agent-direct-mcp-${mcpServer.id}`} value={mcpServer.id}>
                {mcpServer.name}
              </option>
            ))}
          </select>

          <label htmlFor="create-agent-direct-effective-mcp">Inherited MCP servers (from roles)</label>
          <div id="create-agent-direct-effective-mcp" className="inline-selection-list">
            {createEffectiveMcpServerLabels.length === 0 ? (
              <span className="empty-hint">No MCP servers inherited from assigned roles.</span>
            ) : (
              createEffectiveMcpServerLabels.map((mcpServerLabel) => (
                <span key={`create-agent-direct-effective-mcp-${mcpServerLabel}`} className="tag-pill">
                  {mcpServerLabel}
                </span>
              ))
            )}
          </div>

          <label htmlFor="agent-name">Name</label>
          <input
            id="agent-name"
            name="name"
            placeholder="e.g. CEO Agent"
            value={agentName}
            onChange={(event: ChangeEvent<HTMLInputElement>) => onAgentNameChange(event.target.value)}
            required
            autoFocus
          />

          <label htmlFor="agent-sdk">Agent SDK</label>
          <select
            id="agent-sdk"
            name="agentSdk"
            value={agentSdk}
            onChange={(event: ChangeEvent<HTMLSelectElement>) => onAgentSdkChange(event.target.value)}
            required
          >
            {AVAILABLE_AGENT_SDKS.map((sdkName) => (
              <option
                key={`create-agent-sdk-${sdkName}`}
                value={sdkName}
                disabled={Boolean(agentRunnerId) && sdkAvailabilityByName.get(sdkName) !== "available"}
              >
                {formatAvailabilityOptionLabel(
                  sdkName,
                  sdkAvailabilityByName.get(sdkName) || "not-reported",
                )}
              </option>
            ))}
          </select>

          <label htmlFor="agent-model">Default model</label>
          <select
            id="agent-model"
            name="defaultModel"
            value={agentModel}
            onChange={(event: ChangeEvent<HTMLSelectElement>) => onAgentModelChange(event.target.value)}
            required
            disabled={!agentRunnerId}
          >
            {!agentRunnerId ? (
              <option value="">Select a runner first</option>
            ) : runnerModelEntries.length === 0 ? (
              <option value="">No models reported by selected runner</option>
            ) : runnerModelNames.length === 0 ? (
              <option value="">No available models reported by selected runner</option>
            ) : (
              <>
                <option value="">Select default model</option>
                {runnerModelEntries.map((modelEntry) => (
                  <option
                    key={`create-agent-model-${modelEntry.name}`}
                    value={modelEntry.name}
                    disabled={!modelEntry.isAvailable}
                  >
                    {formatAvailabilityOptionLabel(
                      modelEntry.name,
                      modelEntry.isAvailable ? "available" : "unavailable",
                    )}
                  </option>
                ))}
              </>
            )}
          </select>

          <label htmlFor="agent-reasoning-level">Default reasoning level</label>
          <select
            id="agent-reasoning-level"
            name="defaultReasoningLevel"
            value={agentModelReasoningLevel}
            onChange={(event: ChangeEvent<HTMLSelectElement>) => onAgentModelReasoningLevelChange(event.target.value)}
            required
            disabled={!agentRunnerId || !agentModel}
          >
            {!agentRunnerId ? (
              <option value="">Select a runner first</option>
            ) : !agentModel ? (
              <option value="">Select a model first</option>
            ) : runnerReasoningLevels.length === 0 ? (
              <option value="">No reasoning levels reported for this model</option>
            ) : (
              <>
                <option value="">Select default reasoning level</option>
                {runnerReasoningLevels.map((reasoningLevel) => (
                  <option key={`create-agent-reasoning-${reasoningLevel}`} value={reasoningLevel}>
                    {reasoningLevel}
                  </option>
                ))}
              </>
            )}
          </select>

          <label htmlFor="agent-default-additional-model-instructions">
            Default additional model instructions (optional)
          </label>
          <textarea
            id="agent-default-additional-model-instructions"
            name="defaultAdditionalModelInstructions"
            value={agentDefaultAdditionalModelInstructions}
            onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
              onAgentDefaultAdditionalModelInstructionsChange(event.target.value)
            }
            rows={4}
            placeholder="Optional. Used for new chats when no thread-specific instructions are provided."
          />

          <button type="submit" disabled={isCreatingAgent || !formStatus.canSubmit}>
            {isCreatingAgent ? "Creating..." : "Create agent"}
          </button>
        </form>
      )}
    </CreationModal>
  );
}
