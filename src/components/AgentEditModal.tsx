import {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent,
  type KeyboardEvent,
  type MouseEvent,
} from "react";
import { CreationModal } from "./CreationModal.tsx";
import { AVAILABLE_AGENT_SDKS, DEFAULT_AGENT_SDK } from "../utils/constants.ts";
import {
  normalizeUniqueStringList,
  getRunnerCodexModelEntriesForRunner,
  getRunnerModelNames,
  getRunnerReasoningLevels,
  normalizeRunnerAvailableAgentSdks,
} from "../utils/normalization.ts";
import { formatRunnerLabel, isRunnerReadyAndConnected } from "../utils/formatting.ts";
import type {
  Agent,
  AgentDraft,
  AgentDraftById,
  AgentRunner,
  McpServer,
  Role,
  Skill,
  RunnerCodexModelEntriesById,
  StringArrayById,
} from "../types/domain.ts";

function collectRoleAndSubroleIds(roleIds: string[], roleChildrenByParentId: Map<string, string[]>) {
  const normalizedRoleIds = normalizeUniqueStringList(roleIds);
  const visitedRoleIds = new Set<string>();
  const expandedRoleIds: string[] = [];
  const queue = [...normalizedRoleIds];

  while (queue.length > 0) {
    const nextRoleId = String(queue.shift() || "").trim();
    if (!nextRoleId || visitedRoleIds.has(nextRoleId)) {
      continue;
    }
    visitedRoleIds.add(nextRoleId);
    expandedRoleIds.push(nextRoleId);

    const childRoleIds = roleChildrenByParentId.get(nextRoleId) || [];
    for (const childRoleId of childRoleIds) {
      if (!visitedRoleIds.has(childRoleId)) {
        queue.push(childRoleId);
      }
    }
  }

  return expandedRoleIds;
}

function resolveEffectiveRoleMcpServerIds(expandedRoleIds: string[], roleMcpServerIdsByRoleId: StringArrayById) {
  const effectiveMcpServerIds: string[] = [];
  const seenMcpServerIds = new Set<string>();

  for (const roleId of expandedRoleIds) {
    const roleMcpServerIds = normalizeUniqueStringList(roleMcpServerIdsByRoleId?.[roleId] || []);
    for (const mcpServerId of roleMcpServerIds) {
      if (seenMcpServerIds.has(mcpServerId)) {
        continue;
      }
      seenMcpServerIds.add(mcpServerId);
      effectiveMcpServerIds.push(mcpServerId);
    }
  }

  return effectiveMcpServerIds;
}

function resolveEffectiveRoleSkills(expandedRoleIds: string[], roleLookup: Map<string, Role>) {
  const effectiveSkills: Array<{ id: string; name: string }> = [];
  const seenSkillIds = new Set<string>();

  for (const roleId of expandedRoleIds) {
    const role = roleLookup.get(roleId);
    const roleEffectiveSkills = Array.isArray(role?.effectiveSkills)
      ? role.effectiveSkills
      : [];
    for (const skill of roleEffectiveSkills) {
      const skillId = String(skill?.id || "").trim();
      if (!skillId || seenSkillIds.has(skillId)) {
        continue;
      }
      seenSkillIds.add(skillId);
      effectiveSkills.push({
        id: skillId,
        name: String(skill?.name || "").trim() || "Unknown skill",
      });
    }
  }

  return effectiveSkills;
}

function formatAvailabilityOptionLabel(
  name: string,
  availabilityState: "available" | "unavailable" | "not-reported",
  { isCurrent = false }: { isCurrent?: boolean } = {},
) {
  const currentSuffix = isCurrent ? ", current" : "";
  if (availabilityState === "available") {
    return `${name} (available${currentSuffix})`;
  }
  if (availabilityState === "unavailable") {
    return `${name} (unavailable${currentSuffix})`;
  }
  return `${name} (not reported${currentSuffix})`;
}

type AgentDraftField = keyof AgentDraft;

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

const EMPTY_AGENT_DRAFT: AgentDraft = {
  agentRunnerId: "",
  roleIds: [],
  skillIds: [],
  mcpServerIds: [],
  name: "",
  agentSdk: DEFAULT_AGENT_SDK,
  model: "",
  modelReasoningLevel: "",
  defaultAdditionalModelInstructions: "",
};

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
  const [isEditInstructionsFullscreen, setIsEditInstructionsFullscreen] = useState(false);

  const editingAgent = agents.find((agent) => agent.id === editingAgentId) || null;
  const isEditModalOpen = Boolean(editingAgent);

  const roleLookup = useMemo(() => {
    return roles.reduce((map, role) => {
      map.set(role.id, role);
      return map;
    }, new Map<string, Role>());
  }, [roles]);

  const mcpServerLookup = useMemo(() => {
    return mcpServers.reduce((map, mcpServer) => {
      map.set(mcpServer.id, mcpServer);
      return map;
    }, new Map<string, McpServer>());
  }, [mcpServers]);
  const skillLookup = useMemo(() => {
    return skills.reduce((map, skill) => {
      map.set(skill.id, skill);
      return map;
    }, new Map<string, Skill>());
  }, [skills]);

  function getAgentDraft(agentId: string): AgentDraft {
    return {
      ...EMPTY_AGENT_DRAFT,
      ...(agentDrafts[agentId] || {}),
    };
  }

  const editingDraft = editingAgent ? getAgentDraft(editingAgentId) : null;
  const editingRoleIds = editingDraft
    ? normalizeUniqueStringList(editingDraft.roleIds)
    : [];
  const editingSkillIds = editingDraft
    ? normalizeUniqueStringList(editingDraft.skillIds)
    : [];
  const editingMcpServerIds = editingDraft
    ? normalizeUniqueStringList(editingDraft.mcpServerIds)
    : [];
  const editingAvailableRoles = editingDraft
    ? roles.filter((role) => !editingRoleIds.includes(role.id))
    : [];
  const editingAvailableSkills = editingDraft
    ? skills.filter((skill) => !editingSkillIds.includes(skill.id))
    : [];
  const editingAvailableMcpServers = editingDraft
    ? mcpServers.filter((mcpServer) => !editingMcpServerIds.includes(mcpServer.id))
    : [];

  const roleChildrenByParentId = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const role of roles) {
      const parentId = String(role.parentId || role.parentRole?.id || "").trim();
      if (!parentId) {
        continue;
      }
      const existingChildren = map.get(parentId) || [];
      existingChildren.push(role.id);
      map.set(parentId, existingChildren);
    }
    return map;
  }, [roles]);

  const editingExpandedRoleIds = useMemo(
    () => collectRoleAndSubroleIds(editingRoleIds, roleChildrenByParentId),
    [editingRoleIds, roleChildrenByParentId],
  );
  const editingEffectiveMcpServerIds = useMemo(
    () => resolveEffectiveRoleMcpServerIds(editingExpandedRoleIds, roleMcpServerIdsByRoleId),
    [editingExpandedRoleIds, roleMcpServerIdsByRoleId],
  );
  const editingEffectiveSkills = useMemo(
    () => resolveEffectiveRoleSkills(editingExpandedRoleIds, roleLookup),
    [editingExpandedRoleIds, roleLookup],
  );
  const editingRunnerCodexModelEntries = editingDraft
    ? getRunnerCodexModelEntriesForRunner(runnerCodexModelEntriesById, editingDraft.agentRunnerId)
    : [];
  const editingRunnerSdkAvailabilityByName = useMemo(() => {
    if (!editingDraft?.agentRunnerId) {
      return new Map<string, "available" | "unavailable">();
    }
    const selectedRunner = agentRunners.find((runner) => runner.id === editingDraft.agentRunnerId) || null;
    const sdkEntries = selectedRunner ? normalizeRunnerAvailableAgentSdks(selectedRunner) : [];
    return sdkEntries.reduce((map, sdkEntry) => {
      map.set(sdkEntry.name, sdkEntry.isAvailable && sdkEntry.status === "ready" ? "available" : "unavailable");
      return map;
    }, new Map<string, "available" | "unavailable">());
  }, [agentRunners, editingDraft?.agentRunnerId]);
  const editingRunnerModelNames = editingDraft
    ? getRunnerModelNames(editingRunnerCodexModelEntries)
    : [];
  const editingRunnerReasoningLevels = editingDraft
    ? getRunnerReasoningLevels(editingRunnerCodexModelEntries, editingDraft.model)
    : [];
  const editingMissingModelOption = useMemo(() => {
    if (!editingDraft?.model) {
      return "";
    }
    return editingRunnerCodexModelEntries.some((modelEntry) => modelEntry.name === editingDraft.model)
      ? ""
      : editingDraft.model;
  }, [editingDraft?.model, editingRunnerCodexModelEntries]);
  const isEditingAgentSaving = editingAgent ? savingAgentId === editingAgent.id : false;
  const isEditingAgentDeleting = editingAgent ? deletingAgentId === editingAgent.id : false;
  const isEditingAgentInitializing = editingAgent ? initializingAgentId === editingAgent.id : false;
  const isEditingDisabled = isEditingAgentSaving || isEditingAgentDeleting || isEditingAgentInitializing;

  useEffect(() => {
    if (!isEditModalOpen) {
      setIsEditInstructionsFullscreen(false);
    }
  }, [isEditModalOpen]);

  useEffect(() => {
    if (editingAgentId) {
      void onEnsureAgentEditorData();
    }
  }, [editingAgentId, onEnsureAgentEditorData]);

  async function handleEditAgentSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingAgent) {
      return;
    }
    const didSave = await onSaveAgent(editingAgent.id);
    if (didSave) {
      onClose();
    }
  }

  function handleEditInstructionsChange(value: string) {
    if (!editingAgent) {
      return;
    }
    onAgentDraftChange(editingAgent.id, "defaultAdditionalModelInstructions", value);
  }

  return (
    <CreationModal
      modalId="edit-agent-modal"
      title={editingAgent ? `Edit agent "${editingAgent.name}"` : "Edit agent"}
      description={
        editingAgent ? "Update runner, model, and role assignments for this agent." : ""
      }
      isOpen={isEditModalOpen}
      onClose={onClose}
      cardClassName="modal-card-wide"
    >
      {editingAgent && editingDraft ? (
        <form className="task-form" onSubmit={handleEditAgentSubmit}>
          <div className="agent-edit-grid">
            <label className="relationship-field" htmlFor={`edit-agent-runner-${editingAgent.id}`}>
              Runner
            </label>
            <select
              id={`edit-agent-runner-${editingAgent.id}`}
              value={editingDraft.agentRunnerId}
              onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                onAgentDraftChange(editingAgent.id, "agentRunnerId", event.target.value)
              }
              disabled={isEditingDisabled}
            >
              <option value="">Unassigned</option>
              {agentRunners.map((runner) => (
                <option
                  key={runner.id}
                  value={runner.id}
                  disabled={!isRunnerReadyAndConnected(runner)}
                >
                  {formatRunnerLabel(runner)}
                </option>
              ))}
            </select>

            <label className="relationship-field" htmlFor={`edit-agent-name-${editingAgent.id}`}>
              Name
            </label>
            <input
              id={`edit-agent-name-${editingAgent.id}`}
              value={editingDraft.name}
              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                onAgentDraftChange(editingAgent.id, "name", event.target.value)
              }
              disabled={isEditingDisabled}
            />

            <label className="relationship-field" htmlFor={`edit-agent-sdk-${editingAgent.id}`}>
              SDK
            </label>
            <select
              id={`edit-agent-sdk-${editingAgent.id}`}
              value={editingDraft.agentSdk}
              onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                onAgentDraftChange(editingAgent.id, "agentSdk", event.target.value)
              }
              disabled={isEditingDisabled}
            >
              {AVAILABLE_AGENT_SDKS.map((sdkName) => (
                <option
                  key={`${editingAgent.id}-sdk-${sdkName}`}
                  value={sdkName}
                  disabled={
                    Boolean(editingDraft.agentRunnerId)
                    && editingRunnerSdkAvailabilityByName.get(sdkName) !== "available"
                    && editingDraft.agentSdk !== sdkName
                  }
                >
                  {formatAvailabilityOptionLabel(
                    sdkName,
                    editingRunnerSdkAvailabilityByName.get(sdkName) || "not-reported",
                    { isCurrent: editingDraft.agentSdk === sdkName },
                  )}
                </option>
              ))}
            </select>

            <label className="relationship-field" htmlFor={`edit-agent-model-${editingAgent.id}`}>
              Model
            </label>
            <select
              id={`edit-agent-model-${editingAgent.id}`}
              value={editingDraft.model}
              onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                onAgentDraftChange(editingAgent.id, "model", event.target.value)
              }
              disabled={isEditingDisabled || !editingDraft.agentRunnerId}
            >
              {!editingDraft.agentRunnerId ? (
                <option value="">Select a runner first</option>
              ) : editingRunnerCodexModelEntries.length === 0 ? (
                <option value="">No models reported by selected runner</option>
              ) : editingRunnerModelNames.length === 0 ? (
                <option value="">No available models reported by selected runner</option>
              ) : (
                <>
                  <option value="">Select model</option>
                  {editingMissingModelOption ? (
                    <option value={editingMissingModelOption} disabled>
                      {formatAvailabilityOptionLabel(editingMissingModelOption, "not-reported", { isCurrent: true })}
                    </option>
                  ) : null}
                  {editingRunnerCodexModelEntries.map((modelEntry) => (
                    <option
                      key={`${editingAgent.id}-model-${modelEntry.name}`}
                      value={modelEntry.name}
                      disabled={!modelEntry.isAvailable && editingDraft.model !== modelEntry.name}
                    >
                      {formatAvailabilityOptionLabel(
                        modelEntry.name,
                        modelEntry.isAvailable ? "available" : "unavailable",
                        { isCurrent: editingDraft.model === modelEntry.name },
                      )}
                    </option>
                  ))}
                </>
              )}
            </select>

            <label
              className="relationship-field"
              htmlFor={`edit-agent-reasoning-${editingAgent.id}`}
            >
              Reasoning
            </label>
            <select
              id={`edit-agent-reasoning-${editingAgent.id}`}
              value={editingDraft.modelReasoningLevel}
              onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                onAgentDraftChange(editingAgent.id, "modelReasoningLevel", event.target.value)
              }
              disabled={isEditingDisabled || !editingDraft.agentRunnerId || !editingDraft.model}
            >
              {!editingDraft.agentRunnerId ? (
                <option value="">Select a runner first</option>
              ) : !editingDraft.model ? (
                <option value="">Select a model first</option>
              ) : editingRunnerReasoningLevels.length === 0 ? (
                <option value="">No reasoning levels reported for this model</option>
              ) : (
                <>
                  <option value="">Select reasoning</option>
                  {editingRunnerReasoningLevels.map((reasoningLevel) => (
                    <option
                      key={`${editingAgent.id}-reasoning-${reasoningLevel}`}
                      value={reasoningLevel}
                    >
                      {reasoningLevel}
                    </option>
                  ))}
                </>
              )}
            </select>

            <label
              className="relationship-field"
              htmlFor={`edit-agent-default-additional-model-instructions-${editingAgent.id}`}
            >
              Default additional model instructions
            </label>
            <div className="edit-agent-instructions-field">
              <div className="edit-agent-instructions-toolbar">
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() => setIsEditInstructionsFullscreen(true)}
                  disabled={isEditingDisabled}
                >
                  Full screen
                </button>
              </div>
              <textarea
                id={`edit-agent-default-additional-model-instructions-${editingAgent.id}`}
                className="edit-agent-instructions-textarea"
                value={editingDraft.defaultAdditionalModelInstructions || ""}
                onChange={(event: ChangeEvent<HTMLTextAreaElement>) => handleEditInstructionsChange(event.target.value)}
                rows={8}
                placeholder="Optional. Applied to new chats unless thread-specific instructions are provided."
                disabled={isEditingDisabled}
              />
            </div>

            <label
              className="relationship-field"
              htmlFor={`edit-agent-skills-assigned-${editingAgent.id}`}
            >
              Assigned roles
            </label>
            <div
              id={`edit-agent-skills-assigned-${editingAgent.id}`}
              className="inline-selection-list"
            >
              {editingRoleIds.length === 0 ? (
                <span className="empty-hint">No roles assigned.</span>
              ) : (
                editingRoleIds.map((roleId) => {
                  const role = roleLookup.get(roleId);
                  const roleLabel = role?.name || "Unknown role";
                  return (
                    <button
                      key={`edit-agent-remove-skill-${editingAgent.id}-${roleId}`}
                      type="button"
                      className="tag-remove-btn"
                      onClick={() =>
                        onAgentDraftChange(
                          editingAgent.id,
                          "roleIds",
                          editingRoleIds.filter(
                            (candidateId) => candidateId !== roleId,
                          ),
                        )
                      }
                      disabled={isEditingDisabled}
                      title={`Remove ${roleLabel}`}
                    >
                      {roleLabel} ×
                    </button>
                  );
                })
              )}
            </div>

            <label className="relationship-field" htmlFor={`edit-agent-skills-add-${editingAgent.id}`}>
              Add role
            </label>
            <select
              id={`edit-agent-skills-add-${editingAgent.id}`}
              value=""
              onChange={(event: ChangeEvent<HTMLSelectElement>) => {
                const nextRoleId = String(event.target.value || "").trim();
                if (!nextRoleId) {
                  return;
                }
                onAgentDraftChange(editingAgent.id, "roleIds", [
                  ...editingRoleIds,
                  nextRoleId,
                ]);
              }}
              disabled={isEditingDisabled || editingAvailableRoles.length === 0}
            >
              <option value="">
                {editingAvailableRoles.length === 0
                  ? "All roles already assigned"
                  : "Select role to assign"}
              </option>
              {editingAvailableRoles.map((role) => (
                <option
                  key={`edit-agent-skill-option-${editingAgent.id}-${role.id}`}
                  value={role.id}
                >
                  {role.name}
                </option>
              ))}
            </select>

            <label
              className="relationship-field"
              htmlFor={`edit-agent-effective-skills-${editingAgent.id}`}
            >
              Inherited skills (from roles)
            </label>
            <div
              id={`edit-agent-effective-skills-${editingAgent.id}`}
              className="inline-selection-list"
            >
              {editingEffectiveSkills.length === 0 ? (
                <span className="empty-hint">No skills inherited from assigned roles.</span>
              ) : (
                editingEffectiveSkills.map((skill) => (
                  <span
                    key={`edit-agent-effective-skill-${editingAgent.id}-${skill.id}`}
                    className="tag-pill"
                  >
                    {skill.name}
                  </span>
                ))
              )}
            </div>

            <label
              className="relationship-field"
              htmlFor={`edit-agent-direct-skills-${editingAgent.id}`}
            >
              Direct skills
            </label>
            <div
              id={`edit-agent-direct-skills-${editingAgent.id}`}
              className="inline-selection-list"
            >
              {editingSkillIds.length === 0 ? (
                <span className="empty-hint">No direct skills assigned.</span>
              ) : (
                editingSkillIds.map((skillId) => {
                  const skill = skillLookup.get(skillId);
                  const skillLabel = skill?.name || "Unknown skill";
                  return (
                    <button
                      key={`edit-agent-remove-direct-skill-${editingAgent.id}-${skillId}`}
                      type="button"
                      className="tag-remove-btn"
                      onClick={() =>
                        onAgentDraftChange(
                          editingAgent.id,
                          "skillIds",
                          editingSkillIds.filter((candidateId) => candidateId !== skillId),
                        )
                      }
                      disabled={isEditingDisabled}
                      title={`Remove ${skillLabel}`}
                    >
                      {skillLabel} ×
                    </button>
                  );
                })
              )}
            </div>

            <label className="relationship-field" htmlFor={`edit-agent-direct-skill-add-${editingAgent.id}`}>
              Add direct skill
            </label>
            <select
              id={`edit-agent-direct-skill-add-${editingAgent.id}`}
              value=""
              onChange={(event: ChangeEvent<HTMLSelectElement>) => {
                const nextSkillId = String(event.target.value || "").trim();
                if (!nextSkillId) {
                  return;
                }
                onAgentDraftChange(editingAgent.id, "skillIds", [
                  ...editingSkillIds,
                  nextSkillId,
                ]);
              }}
              disabled={isEditingDisabled || editingAvailableSkills.length === 0}
            >
              <option value="">
                {editingAvailableSkills.length === 0
                  ? "All skills already assigned"
                  : "Select skill to assign"}
              </option>
              {editingAvailableSkills.map((skill) => (
                <option
                  key={`edit-agent-direct-skill-option-${editingAgent.id}-${skill.id}`}
                  value={skill.id}
                >
                  {skill.name}
                </option>
              ))}
            </select>

            <label
              className="relationship-field"
              htmlFor={`edit-agent-effective-mcp-${editingAgent.id}`}
            >
              Inherited MCP servers (from roles)
            </label>
            <div
              id={`edit-agent-effective-mcp-${editingAgent.id}`}
              className="inline-selection-list"
            >
              {editingEffectiveMcpServerIds.length === 0 ? (
                <span className="empty-hint">No MCP servers inherited from assigned roles.</span>
              ) : (
                editingEffectiveMcpServerIds.map((mcpServerId) => {
                  const mcpServer = mcpServerLookup.get(mcpServerId);
                  const mcpServerLabel = mcpServer?.name || "Unknown MCP server";
                  return (
                    <span key={`edit-agent-effective-mcp-${editingAgent.id}-${mcpServerId}`} className="tag-pill">
                      {mcpServerLabel}
                    </span>
                  );
                })
              )}
            </div>

            <label
              className="relationship-field"
              htmlFor={`edit-agent-direct-mcp-${editingAgent.id}`}
            >
              Direct MCP servers
            </label>
            <div
              id={`edit-agent-direct-mcp-${editingAgent.id}`}
              className="inline-selection-list"
            >
              {editingMcpServerIds.length === 0 ? (
                <span className="empty-hint">No direct MCP servers assigned.</span>
              ) : (
                editingMcpServerIds.map((mcpServerId) => {
                  const mcpServer = mcpServerLookup.get(mcpServerId);
                  const mcpServerLabel = mcpServer?.name || "Unknown MCP server";
                  return (
                    <button
                      key={`edit-agent-remove-direct-mcp-${editingAgent.id}-${mcpServerId}`}
                      type="button"
                      className="tag-remove-btn"
                      onClick={() =>
                        onAgentDraftChange(
                          editingAgent.id,
                          "mcpServerIds",
                          editingMcpServerIds.filter((candidateId) => candidateId !== mcpServerId),
                        )
                      }
                      disabled={isEditingDisabled}
                      title={`Remove ${mcpServerLabel}`}
                    >
                      {mcpServerLabel} ×
                    </button>
                  );
                })
              )}
            </div>

            <label className="relationship-field" htmlFor={`edit-agent-direct-mcp-add-${editingAgent.id}`}>
              Add direct MCP server
            </label>
            <select
              id={`edit-agent-direct-mcp-add-${editingAgent.id}`}
              value=""
              onChange={(event: ChangeEvent<HTMLSelectElement>) => {
                const nextMcpServerId = String(event.target.value || "").trim();
                if (!nextMcpServerId) {
                  return;
                }
                onAgentDraftChange(editingAgent.id, "mcpServerIds", [
                  ...editingMcpServerIds,
                  nextMcpServerId,
                ]);
              }}
              disabled={isEditingDisabled || editingAvailableMcpServers.length === 0}
            >
              <option value="">
                {editingAvailableMcpServers.length === 0
                  ? "All MCP servers already assigned"
                  : "Select MCP server to assign"}
              </option>
              {editingAvailableMcpServers.map((mcpServer) => (
                <option
                  key={`edit-agent-direct-mcp-option-${editingAgent.id}-${mcpServer.id}`}
                  value={mcpServer.id}
                >
                  {mcpServer.name}
                </option>
              ))}
            </select>
          </div>

          <div className="task-card-actions modal-actions">
            <button type="submit" disabled={isEditingDisabled}>
              {isEditingAgentSaving ? "Saving..." : "Save changes"}
            </button>
            <button
              type="button"
              className="secondary-btn"
              onClick={onClose}
              disabled={isEditingAgentSaving}
            >
              Cancel
            </button>
          </div>

          {isEditInstructionsFullscreen ? (
            <div
              className="edit-agent-instructions-fullscreen-overlay"
              role="presentation"
              onClick={() => setIsEditInstructionsFullscreen(false)}
            >
              <section
                className="panel edit-agent-instructions-fullscreen-card"
                role="dialog"
                aria-modal="true"
                aria-labelledby={`edit-agent-instructions-fullscreen-title-${editingAgent.id}`}
                onClick={(event: MouseEvent<HTMLElement>) => event.stopPropagation()}
                onKeyDown={(event: KeyboardEvent<HTMLElement>) => {
                  if (event.key === "Escape") {
                    event.stopPropagation();
                    setIsEditInstructionsFullscreen(false);
                  }
                }}
              >
                <header className="edit-agent-instructions-fullscreen-header">
                  <h3 id={`edit-agent-instructions-fullscreen-title-${editingAgent.id}`}>
                    Default additional model instructions
                  </h3>
                  <button
                    type="button"
                    className="secondary-btn"
                    onClick={() => setIsEditInstructionsFullscreen(false)}
                  >
                    Done
                  </button>
                </header>
                <textarea
                  className="edit-agent-instructions-textarea edit-agent-instructions-textarea-fullscreen"
                  value={editingDraft.defaultAdditionalModelInstructions || ""}
                  onChange={(event: ChangeEvent<HTMLTextAreaElement>) => handleEditInstructionsChange(event.target.value)}
                  placeholder="Optional. Applied to new chats unless thread-specific instructions are provided."
                  disabled={isEditingDisabled}
                  autoFocus
                />
              </section>
            </div>
          ) : null}
        </form>
      ) : null}
    </CreationModal>
  );
}
