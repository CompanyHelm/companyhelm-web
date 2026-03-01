import { useState, useMemo, useEffect } from "react";
import { CreationModal } from "../components/CreationModal.jsx";
import { AVAILABLE_AGENT_SDKS, DEFAULT_AGENT_SDK } from "../utils/constants.js";
import {
  normalizeUniqueStringList,
  getRunnerCodexModelEntriesForRunner,
  getRunnerModelNames,
  getRunnerReasoningLevels,
} from "../utils/normalization.js";
import { formatRunnerLabel } from "../utils/formatting.js";
import { setBrowserPath } from "../utils/path.js";

function collectRoleAndSubroleIds(roleIds, roleChildrenByParentId) {
  const normalizedRoleIds = normalizeUniqueStringList(roleIds);
  const visitedRoleIds = new Set();
  const expandedRoleIds = [];
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

function resolveEffectiveRoleMcpServerIds(expandedRoleIds, roleMcpServerIdsByRoleId) {
  const effectiveMcpServerIds = [];
  const seenMcpServerIds = new Set();

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

export function AgentsPage({
  selectedCompanyId,
  agents,
  skills,
  skillGroups,
  mcpServers,
  roleMcpServerIdsByRoleId,
  agentRunners,
  agentRunnerLookup,
  runnerCodexModelEntriesById,
  isLoadingAgents,
  agentError,
  isCreatingAgent,
  savingAgentId,
  deletingAgentId,
  initializingAgentId,
  hasLoadedAgentRunners,
  agentRunnerId,
  agentSkillGroupIds,
  agentName,
  agentSdk,
  agentModel,
  agentModelReasoningLevel,
  agentDefaultAdditionalModelInstructions,
  agentDrafts,
  agentCountLabel,
  onAgentRunnerChange,
  onAgentSkillGroupIdsChange,
  onAgentNameChange,
  onAgentSdkChange,
  onAgentModelChange,
  onAgentModelReasoningLevelChange,
  onAgentDefaultAdditionalModelInstructionsChange,
  onCreateAgent,
  onAgentDraftChange,
  onEnsureAgentEditorData,
  onSaveAgent,
  onOpenAgentSessions,
  onDeleteAgent,
  pendingEditAgentId,
  onClearPendingEditAgentId,
}) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingAgentId, setEditingAgentId] = useState("");
  const [isEditInstructionsFullscreen, setIsEditInstructionsFullscreen] = useState(false);
  const [pendingDeleteAgent, setPendingDeleteAgent] = useState(null);
  const [forceDeleteAgent, setForceDeleteAgent] = useState(false);
  const skillGroupLookup = useMemo(() => {
    return skillGroups.reduce((map, skillGroup) => {
      map.set(skillGroup.id, skillGroup);
      return map;
    }, new Map());
  }, [skillGroups]);
  const roleChildrenByParentId = useMemo(() => {
    const childrenByParentId = new Map();
    for (const role of skillGroups) {
      const roleId = String(role?.id || "").trim();
      const parentRoleId = String(role?.parentSkillGroup?.id || "").trim();
      if (!roleId || !parentRoleId) {
        continue;
      }
      const existingChildRoleIds = childrenByParentId.get(parentRoleId);
      if (existingChildRoleIds) {
        existingChildRoleIds.push(roleId);
      } else {
        childrenByParentId.set(parentRoleId, [roleId]);
      }
    }
    return childrenByParentId;
  }, [skillGroups]);
  const mcpServerLookup = useMemo(() => {
    return mcpServers.reduce((map, mcpServer) => {
      map.set(mcpServer.id, mcpServer);
      return map;
    }, new Map());
  }, [mcpServers]);
  const createRunnerCodexModelEntries = useMemo(() => {
    return getRunnerCodexModelEntriesForRunner(runnerCodexModelEntriesById, agentRunnerId);
  }, [agentRunnerId, runnerCodexModelEntriesById]);
  const createRunnerModelNames = useMemo(() => {
    return getRunnerModelNames(createRunnerCodexModelEntries);
  }, [createRunnerCodexModelEntries]);
  const createRunnerReasoningLevels = useMemo(() => {
    return getRunnerReasoningLevels(createRunnerCodexModelEntries, agentModel);
  }, [agentModel, createRunnerCodexModelEntries]);
  const createAssignedSkillGroupIds = useMemo(
    () => normalizeUniqueStringList(agentSkillGroupIds),
    [agentSkillGroupIds],
  );
  const createExpandedRoleIds = useMemo(
    () => collectRoleAndSubroleIds(createAssignedSkillGroupIds, roleChildrenByParentId),
    [createAssignedSkillGroupIds, roleChildrenByParentId],
  );
  const createEffectiveMcpServerIds = useMemo(
    () => resolveEffectiveRoleMcpServerIds(createExpandedRoleIds, roleMcpServerIdsByRoleId),
    [createExpandedRoleIds, roleMcpServerIdsByRoleId],
  );
  const createAvailableSkillGroups = useMemo(
    () =>
      skillGroups.filter((skillGroup) => !createAssignedSkillGroupIds.includes(skillGroup.id)),
    [createAssignedSkillGroupIds, skillGroups],
  );
  const hasRegisteredRunners = agentRunners.length > 0;
  const isCreateBlockedByRunners = hasLoadedAgentRunners && !hasRegisteredRunners;
  const createAgentButtonTitle = isCreateBlockedByRunners
    ? "Register at least one runner before creating an agent"
    : "Create agent";
  const editingAgent = agents.find((agent) => agent.id === editingAgentId) || null;
  const isEditModalOpen = Boolean(editingAgent);

  function getAgentDraft(agentId) {
    return (
      agentDrafts[agentId] || {
      agentRunnerId: "",
      skillGroupIds: [],
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
  const editingSkillGroupIds = editingDraft
    ? normalizeUniqueStringList(editingDraft.skillGroupIds)
    : [];
  const editingExpandedRoleIds = useMemo(
    () => collectRoleAndSubroleIds(editingSkillGroupIds, roleChildrenByParentId),
    [editingSkillGroupIds, roleChildrenByParentId],
  );
  const editingAvailableSkillGroups = editingDraft
    ? skillGroups.filter((skillGroup) => !editingSkillGroupIds.includes(skillGroup.id))
    : [];
  const editingEffectiveMcpServerIds = useMemo(
    () => resolveEffectiveRoleMcpServerIds(editingExpandedRoleIds, roleMcpServerIdsByRoleId),
    [editingExpandedRoleIds, roleMcpServerIdsByRoleId],
  );
  const editingRunnerCodexModelEntries = editingDraft
    ? getRunnerCodexModelEntriesForRunner(
        runnerCodexModelEntriesById,
        editingDraft.agentRunnerId,
      )
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
    if (pendingEditAgentId) {
      openEditAgentModal(pendingEditAgentId);
      if (typeof onClearPendingEditAgentId === "function") {
        onClearPendingEditAgentId();
      }
    }
  }, [pendingEditAgentId]);

  function openEditAgentModal(agentId) {
    if (typeof onEnsureAgentEditorData === "function") {
      void onEnsureAgentEditorData();
    }
    setEditingAgentId(agentId);
    setIsEditInstructionsFullscreen(false);
  }

  function openCreateAgentModal() {
    if (typeof onEnsureAgentEditorData === "function") {
      void onEnsureAgentEditorData();
    }
    setIsCreateModalOpen(true);
  }

  function closeEditAgentModal() {
    setEditingAgentId("");
    setIsEditInstructionsFullscreen(false);
  }

  async function handleCreateAgentSubmit(event) {
    const didCreate = await onCreateAgent(event);
    if (didCreate) {
      setIsCreateModalOpen(false);
    }
  }

  async function handleEditAgentSubmit(event) {
    event.preventDefault();
    if (!editingAgent) {
      return;
    }

    const didSave = await onSaveAgent(editingAgent.id);
    if (didSave) {
      closeEditAgentModal();
    }
  }

  function handleEditInstructionsChange(value) {
    if (!editingAgent) {
      return;
    }
    onAgentDraftChange(editingAgent.id, "defaultAdditionalModelInstructions", value);
  }

  function openDeleteAgentModal(agentId, agentName) {
    setPendingDeleteAgent({
      id: agentId,
      name: agentName,
    });
    setForceDeleteAgent(false);
  }

  function closeDeleteAgentModal() {
    setPendingDeleteAgent(null);
    setForceDeleteAgent(false);
  }

  async function handleDeleteAgentSubmit(event) {
    event.preventDefault();
    if (!pendingDeleteAgent) {
      return;
    }

    const didDelete = await onDeleteAgent(
      pendingDeleteAgent.id,
      pendingDeleteAgent.name,
      forceDeleteAgent,
    );
    if (didDelete) {
      closeDeleteAgentModal();
    }
  }

  return (
    <div className="page-stack">
      <header className="chat-minimal-header">
        <div className="chat-minimal-header-info">
          <p className="chat-minimal-header-agent">{selectedCompanyId}</p>
          <h1 className="chat-minimal-header-title">Agents</h1>
        </div>
        <div className="chat-minimal-header-actions">
          <button
            type="button"
            className="chat-minimal-header-icon-btn"
            aria-label="Create agent"
            title={createAgentButtonTitle}
            onClick={openCreateAgentModal}
            disabled={isCreateBlockedByRunners}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
        </div>
      </header>

      <section className="panel list-panel">

        {agentError ? <p className="error-banner">{agentError}</p> : null}
        {isLoadingAgents ? <p className="empty-hint">Loading agents...</p> : null}
        {!isLoadingAgents && agents.length === 0 ? (
          <div className="empty-state">
            <p className="empty-hint">No agents created for this company yet.</p>
            {isCreateBlockedByRunners ? (
              <p className="empty-hint">
                Register at least one runner before creating an agent.
              </p>
            ) : null}
            <button
              type="button"
              className="secondary-btn empty-create-btn"
              onClick={openCreateAgentModal}
              disabled={isCreateBlockedByRunners}
            >
              + Create agent
            </button>
          </div>
        ) : null}

        {agents.length > 0 ? (
          <ul className="chat-card-list">
            {agents.map((agent) => {
              const assignedRunner = agent.agentRunnerId
                ? agentRunnerLookup.get(agent.agentRunnerId) || {
                    id: agent.agentRunnerId,
                    status: "disconnected",
                  }
                : null;
              const assignedRunnerLabel = assignedRunner
                ? formatRunnerLabel(assignedRunner)
                : "Unassigned";
              const assignedRoleIds = normalizeUniqueStringList(agent.skillGroupIds || []);
              const assignedRoleLabels = assignedRoleIds.map((roleId) => {
                const role = skillGroupLookup.get(roleId);
                return role ? role.name : roleId;
              });
              const assignedRoleSummary =
                assignedRoleLabels.length > 0 ? assignedRoleLabels.join(", ") : "none";
              const expandedRoleIds = collectRoleAndSubroleIds(assignedRoleIds, roleChildrenByParentId);
              const effectiveMcpServerIds = resolveEffectiveRoleMcpServerIds(
                expandedRoleIds,
                roleMcpServerIdsByRoleId,
              );
              const assignedMcpServerLabels = effectiveMcpServerIds.map((mcpServerId) => {
                const mcpServer = mcpServerLookup.get(mcpServerId);
                return mcpServer ? mcpServer.name : mcpServerId;
              });
              const assignedMcpServerSummary =
                assignedMcpServerLabels.length > 0 ? assignedMcpServerLabels.join(", ") : "none";
              const isSavingOrDeleting =
                savingAgentId === agent.id || deletingAgentId === agent.id;
              const isInitializing = initializingAgentId === agent.id;
              const isBusy = isSavingOrDeleting || isInitializing;
              const modelLabel = String(agent.model || "").trim() || "n/a";

              return (
                <li
                  key={agent.id}
                  className="chat-card"
                  onClick={() => !isBusy && setBrowserPath(`/agents/${agent.id}`)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !isBusy) {
                      setBrowserPath(`/agents/${agent.id}`);
                    }
                  }}
                >
                  <div className="chat-card-main">
                    <p className="chat-card-title">
                      <strong>{agent.name}</strong>
                    </p>
                    <p className="chat-card-meta">
                      {agent.agentSdk} · {modelLabel} · {assignedRunnerLabel}
                    </p>
                    <p className="chat-card-meta">Roles: {assignedRoleSummary}</p>
                    <p className="chat-card-meta">MCP servers: {assignedMcpServerSummary}</p>
                  </div>
                  <div className="chat-card-actions">
                    <button
                      type="button"
                      className="chat-card-icon-btn"
                      onClick={(event) => {
                        event.stopPropagation();
                        openEditAgentModal(agent.id);
                      }}
                      disabled={isBusy}
                      aria-label="Edit agent settings"
                      title="Edit agent settings"
                    >
                      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                        <circle cx="12" cy="12" r="3" />
                        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      className="chat-card-icon-btn chat-card-icon-btn-danger"
                      onClick={(event) => {
                        event.stopPropagation();
                        openDeleteAgentModal(agent.id, agent.name);
                      }}
                      disabled={isBusy}
                      aria-label={deletingAgentId === agent.id ? "Deleting..." : "Delete agent"}
                      title={deletingAgentId === agent.id ? "Deleting..." : "Delete agent"}
                    >
                      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                        <path d="M3 6h18" />
                        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                        <line x1="10" y1="11" x2="10" y2="17" />
                        <line x1="14" y1="11" x2="14" y2="17" />
                      </svg>
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : null}
      </section>

      <CreationModal
        modalId="create-agent-modal"
        title="Create agent"
        description="Register a new agent profile for this company. A registered runner is required."
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      >
        <form className="task-form" onSubmit={handleCreateAgentSubmit}>
          <label htmlFor="agent-runner-id">Assigned runner</label>
          <select
            id="agent-runner-id"
            name="agentRunnerId"
            value={agentRunnerId}
            onChange={(event) => onAgentRunnerChange(event.target.value)}
            required
            disabled={!hasLoadedAgentRunners || !hasRegisteredRunners}
          >
            {!hasLoadedAgentRunners ? (
              <option value="">Loading runners...</option>
            ) : !hasRegisteredRunners ? (
              <option value="">No registered runners available</option>
            ) : (
              <>
                <option value="">Select runner</option>
                {agentRunners.map((runner) => (
                  <option key={runner.id} value={runner.id}>
                    {formatRunnerLabel(runner)}
                  </option>
                ))}
              </>
            )}
          </select>

          <label htmlFor="create-agent-skills-assigned">Assigned roles (optional)</label>
          <div id="create-agent-skills-assigned" className="inline-selection-list">
            {createAssignedSkillGroupIds.length === 0 ? (
              <span className="empty-hint">No roles assigned.</span>
            ) : (
              createAssignedSkillGroupIds.map((skillGroupId) => {
                const skillGroup = skillGroupLookup.get(skillGroupId);
                const skillGroupLabel = skillGroup ? skillGroup.name : skillGroupId;
                return (
                  <button
                    key={`create-agent-remove-skill-${skillGroupId}`}
                    type="button"
                    className="tag-remove-btn"
                    onClick={() =>
                      onAgentSkillGroupIdsChange(
                        createAssignedSkillGroupIds.filter(
                          (candidateId) => candidateId !== skillGroupId,
                        ),
                      )
                    }
                    title={`Remove ${skillGroupLabel}`}
                  >
                    {skillGroupLabel} ×
                  </button>
                );
              })
            )}
          </div>

          <label htmlFor="create-agent-skill-add">Add role</label>
          <select
            id="create-agent-skill-add"
            value=""
            onChange={(event) => {
              const nextSkillGroupId = String(event.target.value || "").trim();
              if (!nextSkillGroupId) {
                return;
              }
              onAgentSkillGroupIdsChange([...createAssignedSkillGroupIds, nextSkillGroupId]);
            }}
            disabled={createAvailableSkillGroups.length === 0}
          >
            <option value="">
              {createAvailableSkillGroups.length === 0
                ? "All roles already assigned"
                : "Select role to assign"}
            </option>
            {createAvailableSkillGroups.map((skillGroup) => (
              <option key={`create-agent-skill-${skillGroup.id}`} value={skillGroup.id}>
                {skillGroup.name}
              </option>
            ))}
          </select>

          <label htmlFor="create-agent-effective-mcp">Effective MCP servers (from roles)</label>
          <div id="create-agent-effective-mcp" className="inline-selection-list">
            {createEffectiveMcpServerIds.length === 0 ? (
              <span className="empty-hint">No MCP servers inherited from assigned roles.</span>
            ) : (
              createEffectiveMcpServerIds.map((mcpServerId) => {
                const mcpServer = mcpServerLookup.get(mcpServerId);
                const mcpServerLabel = mcpServer ? mcpServer.name : mcpServerId;
                return (
                  <span key={`create-agent-effective-mcp-${mcpServerId}`} className="tag-pill">
                    {mcpServerLabel}
                  </span>
                );
              })
            )}
          </div>

          <label htmlFor="agent-name">Name</label>
          <input
            id="agent-name"
            name="name"
            placeholder="e.g. CEO Agent"
            value={agentName}
            onChange={(event) => onAgentNameChange(event.target.value)}
            required
            autoFocus
          />

          <label htmlFor="agent-sdk">Agent SDK</label>
          <select
            id="agent-sdk"
            name="agentSdk"
            value={agentSdk}
            onChange={(event) => onAgentSdkChange(event.target.value)}
            required
          >
            {AVAILABLE_AGENT_SDKS.map((sdkName) => (
              <option key={`create-agent-sdk-${sdkName}`} value={sdkName}>
                {sdkName}
              </option>
            ))}
          </select>

          <label htmlFor="agent-model">Default model</label>
          <select
            id="agent-model"
            name="defaultModel"
            value={agentModel}
            onChange={(event) => onAgentModelChange(event.target.value)}
            required
            disabled={!agentRunnerId}
          >
            {!agentRunnerId ? (
              <option value="">Select a runner first</option>
            ) : createRunnerModelNames.length === 0 ? (
              <option value="">No models reported by selected runner</option>
            ) : (
              <>
                <option value="">Select default model</option>
                {createRunnerModelNames.map((modelName) => (
                  <option key={`create-agent-model-${modelName}`} value={modelName}>
                    {modelName}
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
            onChange={(event) => onAgentModelReasoningLevelChange(event.target.value)}
            required
            disabled={!agentRunnerId || !agentModel}
          >
            {!agentRunnerId ? (
              <option value="">Select a runner first</option>
            ) : !agentModel ? (
              <option value="">Select a model first</option>
            ) : createRunnerReasoningLevels.length === 0 ? (
              <option value="">No reasoning levels reported for this model</option>
            ) : (
              <>
                <option value="">Select default reasoning level</option>
                {createRunnerReasoningLevels.map((reasoningLevel) => (
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
            onChange={(event) =>
              onAgentDefaultAdditionalModelInstructionsChange(event.target.value)
            }
            rows={4}
            placeholder="Optional. Used for new chats when no thread-specific instructions are provided."
          />

          <button type="submit" disabled={isCreatingAgent || !hasRegisteredRunners}>
            {isCreatingAgent ? "Creating..." : "Create agent"}
          </button>
        </form>
      </CreationModal>

      <CreationModal
        modalId="edit-agent-modal"
        title={editingAgent ? `Edit agent "${editingAgent.name}"` : "Edit agent"}
        description={
          editingAgent ? "Update runner, model, and role assignments for this agent." : ""
        }
        isOpen={isEditModalOpen}
        onClose={closeEditAgentModal}
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
                onChange={(event) =>
                  onAgentDraftChange(editingAgent.id, "agentRunnerId", event.target.value)
                }
                disabled={isEditingDisabled}
              >
                <option value="">Unassigned</option>
                {agentRunners.map((runner) => (
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
                onChange={(event) =>
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
                onChange={(event) =>
                  onAgentDraftChange(editingAgent.id, "agentSdk", event.target.value)
                }
                disabled={isEditingDisabled}
              >
                {AVAILABLE_AGENT_SDKS.map((sdkName) => (
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
                onChange={(event) =>
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
                    {editingRunnerModelNames.map((modelName) => (
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
                onChange={(event) =>
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
                  onChange={(event) => handleEditInstructionsChange(event.target.value)}
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
                {editingSkillGroupIds.length === 0 ? (
                  <span className="empty-hint">No roles assigned.</span>
                ) : (
                  editingSkillGroupIds.map((skillGroupId) => {
                    const skillGroup = skillGroupLookup.get(skillGroupId);
                    const skillGroupLabel = skillGroup ? skillGroup.name : skillGroupId;
                    return (
                      <button
                        key={`edit-agent-remove-skill-${editingAgent.id}-${skillGroupId}`}
                        type="button"
                        className="tag-remove-btn"
                        onClick={() =>
                          onAgentDraftChange(
                            editingAgent.id,
                            "skillGroupIds",
                            editingSkillGroupIds.filter(
                              (candidateId) => candidateId !== skillGroupId,
                            ),
                          )
                        }
                        disabled={isEditingDisabled}
                        title={`Remove ${skillGroupLabel}`}
                      >
                        {skillGroupLabel} ×
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
                onChange={(event) => {
                  const nextSkillGroupId = String(event.target.value || "").trim();
                  if (!nextSkillGroupId) {
                    return;
                  }
                  onAgentDraftChange(editingAgent.id, "skillGroupIds", [
                    ...editingSkillGroupIds,
                    nextSkillGroupId,
                  ]);
                }}
                disabled={isEditingDisabled || editingAvailableSkillGroups.length === 0}
              >
                <option value="">
                  {editingAvailableSkillGroups.length === 0
                    ? "All roles already assigned"
                    : "Select role to assign"}
                </option>
                {editingAvailableSkillGroups.map((skillGroup) => (
                  <option
                    key={`edit-agent-skill-option-${editingAgent.id}-${skillGroup.id}`}
                    value={skillGroup.id}
                  >
                    {skillGroup.name}
                  </option>
                ))}
              </select>

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
                  editingEffectiveMcpServerIds.map((mcpServerId) => {
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
                onClick={closeEditAgentModal}
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
                  onClick={(event) => event.stopPropagation()}
                  onKeyDown={(event) => {
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
                    onChange={(event) => handleEditInstructionsChange(event.target.value)}
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

      <CreationModal
        modalId="delete-agent-modal"
        title={pendingDeleteAgent ? `Delete agent "${pendingDeleteAgent.name}"` : "Delete agent"}
        description="Remove this agent from the selected company."
        isOpen={Boolean(pendingDeleteAgent)}
        onClose={closeDeleteAgentModal}
      >
        <form className="task-form" onSubmit={handleDeleteAgentSubmit}>
          <p className="subcopy">
            This action deletes the agent record from companyhelm-api.
          </p>
          <label
            htmlFor="delete-agent-force"
            title="Forcing deletion doesn't delete resources on agent runner side."
          >
            <input
              id="delete-agent-force"
              type="checkbox"
              checked={forceDeleteAgent}
              onChange={(event) => setForceDeleteAgent(event.target.checked)}
              disabled={!pendingDeleteAgent || deletingAgentId === pendingDeleteAgent.id}
            />{" "}
            Force deletion
          </label>
          <div className="task-card-actions">
            <button
              type="submit"
              className="danger-btn"
              disabled={!pendingDeleteAgent || deletingAgentId === pendingDeleteAgent.id}
            >
              {pendingDeleteAgent && deletingAgentId === pendingDeleteAgent.id
                ? "Deleting..."
                : "Delete agent"}
            </button>
            <button
              type="button"
              className="secondary-btn"
              onClick={closeDeleteAgentModal}
              disabled={pendingDeleteAgent && deletingAgentId === pendingDeleteAgent.id}
            >
              Cancel
            </button>
          </div>
        </form>
      </CreationModal>
    </div>
  );
}
