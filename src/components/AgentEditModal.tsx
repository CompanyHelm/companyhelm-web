import { useEffect, useMemo, useState } from "react";
import { CreationModal } from "./CreationModal.tsx";
import { AVAILABLE_AGENT_SDKS, DEFAULT_AGENT_SDK } from "../utils/constants.ts";
import {
  normalizeUniqueStringList,
  getRunnerCodexModelEntriesForRunner,
  getRunnerModelNames,
  getRunnerReasoningLevels,
} from "../utils/normalization.ts";
import { formatRunnerLabel } from "../utils/formatting.ts";

function collectRoleAndSubroleIds(roleIds: any, roleChildrenByParentId: any) {
  const normalizedRoleIds = normalizeUniqueStringList(roleIds);
  const visitedRoleIds = new Set<any>();
  const expandedRoleIds: any[] = [];
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

function resolveEffectiveRoleMcpServerIds(expandedRoleIds: any, roleMcpServerIdsByRoleId: any) {
  const effectiveMcpServerIds: any[] = [];
  const seenMcpServerIds = new Set<any>();

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

function resolveEffectiveRoleSkills(expandedRoleIds: any, roleLookup: any) {
  const effectiveSkills: any[] = [];
  const seenSkillIds = new Set<any>();

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
        name: String(skill?.name || "").trim() || skillId,
      });
    }
  }

  return effectiveSkills;
}

export function AgentEditModal({
  agents,
  agentRunners,
  roles,
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
}: any) {
  const [isEditInstructionsFullscreen, setIsEditInstructionsFullscreen] = useState<any>(false);

  const editingAgent = agents.find((agent: any) => agent.id === editingAgentId) || null;
  const isEditModalOpen = Boolean(editingAgent);

  const roleLookup = useMemo(() => {
    return roles.reduce((map: any, role: any) => {
      map.set(role.id, role);
      return map;
    }, new Map<any, any>());
  }, [roles]);

  const mcpServerLookup = useMemo(() => {
    return mcpServers.reduce((map: any, mcpServer: any) => {
      map.set(mcpServer.id, mcpServer);
      return map;
    }, new Map<any, any>());
  }, [mcpServers]);

  function getAgentDraft(agentId: any) {
    return (
      agentDrafts[agentId] || {
        agentRunnerId: "",
        roleIds: [],
        mcpServerIds: [],
        name: "",
        agentSdk: DEFAULT_AGENT_SDK,
        model: "",
        modelReasoningLevel: "",
        defaultAdditionalModelInstructions: "",
      }
    );
  }

  const editingDraft = editingAgent ? getAgentDraft(editingAgentId) : null;
  const editingRoleIds = editingDraft
    ? normalizeUniqueStringList(editingDraft.roleIds)
    : [];
  const editingAvailableRoles = editingDraft
    ? roles.filter((role: any) => !editingRoleIds.includes(role.id))
    : [];

  const roleChildrenByParentId = useMemo(() => {
    const map = new Map<any, any>();
    for (const role of roles) {
      const parentId = String(role.parentId || "").trim();
      if (!parentId) {
        continue;
      }
      if (!map.has(parentId)) {
        map.set(parentId, []);
      }
      map.get(parentId).push(role.id);
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
  const editingRunnerModelNames = editingDraft
    ? getRunnerModelNames(editingRunnerCodexModelEntries)
    : [];
  const editingRunnerReasoningLevels = editingDraft
    ? getRunnerReasoningLevels(editingRunnerCodexModelEntries, editingDraft.model)
    : [];
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
    if (editingAgentId && typeof onEnsureAgentEditorData === "function") {
      void onEnsureAgentEditorData();
    }
  }, [editingAgentId]);

  async function handleEditAgentSubmit(event: any) {
    event.preventDefault();
    if (!editingAgent) {
      return;
    }
    const didSave = await onSaveAgent(editingAgent.id);
    if (didSave) {
      onClose();
    }
  }

  function handleEditInstructionsChange(value: any) {
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
      {editingDraft ? (
        <form className="task-form" onSubmit={handleEditAgentSubmit}>
          <div className="agent-edit-grid">
            <label className="relationship-field" htmlFor={`edit-agent-runner-${editingAgent.id}`}>
              Runner
            </label>
            <select
              id={`edit-agent-runner-${editingAgent.id}`}
              value={editingDraft.agentRunnerId}
              onChange={(event: any) =>
                onAgentDraftChange(editingAgent.id, "agentRunnerId", event.target.value)
              }
              disabled={isEditingDisabled}
            >
              <option value="">Unassigned</option>
              {agentRunners.map((runner: any) => (
                <option key={runner.id} value={runner.id}>
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
              onChange={(event: any) =>
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
              onChange={(event: any) =>
                onAgentDraftChange(editingAgent.id, "agentSdk", event.target.value)
              }
              disabled={isEditingDisabled}
            >
              {AVAILABLE_AGENT_SDKS.map((sdkName: any) => (
                <option key={`${editingAgent.id}-sdk-${sdkName}`} value={sdkName}>
                  {sdkName}
                </option>
              ))}
            </select>

            <label className="relationship-field" htmlFor={`edit-agent-model-${editingAgent.id}`}>
              Model
            </label>
            <select
              id={`edit-agent-model-${editingAgent.id}`}
              value={editingDraft.model}
              onChange={(event: any) =>
                onAgentDraftChange(editingAgent.id, "model", event.target.value)
              }
              disabled={isEditingDisabled || !editingDraft.agentRunnerId}
            >
              {!editingDraft.agentRunnerId ? (
                <option value="">Select a runner first</option>
              ) : editingRunnerModelNames.length === 0 ? (
                <option value="">No models reported by selected runner</option>
              ) : (
                <>
                  <option value="">Select model</option>
                  {editingRunnerModelNames.map((modelName: any) => (
                    <option key={`${editingAgent.id}-model-${modelName}`} value={modelName}>
                      {modelName}
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
              onChange={(event: any) =>
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
                  {editingRunnerReasoningLevels.map((reasoningLevel: any) => (
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
                onChange={(event: any) => handleEditInstructionsChange(event.target.value)}
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
                editingRoleIds.map((roleId: any) => {
                  const role = roleLookup.get(roleId);
                  const roleLabel = role ? role.name : roleId;
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
                            (candidateId: any) => candidateId !== roleId,
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
              onChange={(event: any) => {
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
              {editingAvailableRoles.map((role: any) => (
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
              Effective skills (from roles)
            </label>
            <div
              id={`edit-agent-effective-skills-${editingAgent.id}`}
              className="inline-selection-list"
            >
              {editingEffectiveSkills.length === 0 ? (
                <span className="empty-hint">No skills inherited from assigned roles.</span>
              ) : (
                editingEffectiveSkills.map((skill: any) => (
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
              htmlFor={`edit-agent-effective-mcp-${editingAgent.id}`}
            >
              Effective MCP servers (from roles)
            </label>
            <div
              id={`edit-agent-effective-mcp-${editingAgent.id}`}
              className="inline-selection-list"
            >
              {editingEffectiveMcpServerIds.length === 0 ? (
                <span className="empty-hint">No MCP servers inherited from assigned roles.</span>
              ) : (
                editingEffectiveMcpServerIds.map((mcpServerId: any) => {
                  const mcpServer = mcpServerLookup.get(mcpServerId);
                  const mcpServerLabel = mcpServer ? mcpServer.name : mcpServerId;
                  return (
                    <span key={`edit-agent-effective-mcp-${editingAgent.id}-${mcpServerId}`} className="tag-pill">
                      {mcpServerLabel}
                    </span>
                  );
                })
              )}
            </div>
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
                onClick={(event: any) => event.stopPropagation()}
                onKeyDown={(event: any) => {
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
                  onChange={(event: any) => handleEditInstructionsChange(event.target.value)}
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
