import { useState, useMemo } from "react";
import { CreationModal } from "../components/CreationModal.jsx";
import { AVAILABLE_AGENT_SDKS, DEFAULT_AGENT_SDK, SKILL_TYPE_SKILLSMP } from "../utils/constants.js";
import {
  normalizeUniqueStringList,
  normalizeSkillType,
  getRunnerCodexModelEntriesForRunner,
  getRunnerModelNames,
  getRunnerReasoningLevels,
} from "../utils/normalization.js";
import { formatRunnerLabel, formatSkillLabel } from "../utils/formatting.js";

export function AgentsPage({
  selectedCompanyId,
  agents,
  skills,
  mcpServers,
  agentRunners,
  agentRunnerLookup,
  runnerCodexModelEntriesById,
  isLoadingAgents,
  agentError,
  isCreatingAgent,
  savingAgentId,
  deletingAgentId,
  initializingAgentId,
  retryingAgentSkillInstallKey,
  agentRunnerId,
  agentSkillIds,
  agentMcpServerIds,
  agentName,
  agentSdk,
  agentModel,
  agentModelReasoningLevel,
  agentDefaultAdditionalModelInstructions,
  agentDrafts,
  agentCountLabel,
  onAgentRunnerChange,
  onAgentSkillIdsChange,
  onAgentMcpServerIdsChange,
  onAgentNameChange,
  onAgentSdkChange,
  onAgentModelChange,
  onAgentModelReasoningLevelChange,
  onAgentDefaultAdditionalModelInstructionsChange,
  onCreateAgent,
  onAgentDraftChange,
  onSaveAgent,
  onRetryAgentSkillInstall,
  onOpenAgentSessions,
  onDeleteAgent,
}) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingAgentId, setEditingAgentId] = useState("");
  const [pendingDeleteAgent, setPendingDeleteAgent] = useState(null);
  const [forceDeleteAgent, setForceDeleteAgent] = useState(false);
  const skillLookup = useMemo(() => {
    return skills.reduce((map, skill) => {
      map.set(skill.id, skill);
      return map;
    }, new Map());
  }, [skills]);
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
  const createAssignedMcpServerIds = useMemo(
    () => normalizeUniqueStringList(agentMcpServerIds),
    [agentMcpServerIds],
  );
  const createAssignedSkillIds = useMemo(() => normalizeUniqueStringList(agentSkillIds), [agentSkillIds]);
  const createAvailableSkills = useMemo(
    () => skills.filter((skill) => !createAssignedSkillIds.includes(skill.id)),
    [createAssignedSkillIds, skills],
  );
  const createAvailableMcpServers = useMemo(
    () => mcpServers.filter((mcpServer) => !createAssignedMcpServerIds.includes(mcpServer.id)),
    [createAssignedMcpServerIds, mcpServers],
  );
  const hasRegisteredRunners = agentRunners.length > 0;
  const editingAgent = agents.find((agent) => agent.id === editingAgentId) || null;
  const isEditModalOpen = Boolean(editingAgent);

  function getAgentDraft(agentId) {
    return (
      agentDrafts[agentId] || {
        agentRunnerId: "",
        skillIds: [],
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
  const editingSkillIds = editingDraft ? normalizeUniqueStringList(editingDraft.skillIds) : [];
  const editingAvailableSkills = editingDraft
    ? skills.filter((skill) => !editingSkillIds.includes(skill.id))
    : [];
  const editingMcpServerIds = editingDraft ? normalizeUniqueStringList(editingDraft.mcpServerIds) : [];
  const editingAvailableMcpServers = editingDraft
    ? mcpServers.filter((mcpServer) => !editingMcpServerIds.includes(mcpServer.id))
    : [];
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
      setEditingAgentId("");
    }
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
      <section className="panel hero-panel">
        <p className="eyebrow">Agent Registry</p>
        <h1>Agents page</h1>
        <p className="subcopy">
          Register AI agents by SDK, model, and reasoning profile for the active company.
        </p>
        <p className="context-pill">Company: {selectedCompanyId}</p>
      </section>

      <section className="panel list-panel">
        <header className="panel-header panel-header-row">
          <h2>Agents</h2>
          <div className="task-meta">
            <span>{agentCountLabel}</span>
            <button
              type="button"
              className="icon-create-btn"
              aria-label="Create agent"
              title={
                hasRegisteredRunners
                  ? "Create agent"
                  : "Register at least one runner before creating an agent"
              }
              onClick={() => setIsCreateModalOpen(true)}
              disabled={!hasRegisteredRunners}
            >
              +
            </button>
          </div>
        </header>

        {agentError ? <p className="error-banner">{agentError}</p> : null}
        {isLoadingAgents ? <p className="empty-hint">Loading agents...</p> : null}
        {!isLoadingAgents && agents.length === 0 ? (
          <div className="empty-state">
            <p className="empty-hint">No agents created for this company yet.</p>
            {!hasRegisteredRunners ? (
              <p className="empty-hint">
                Register at least one runner before creating an agent.
              </p>
            ) : null}
            <button
              type="button"
              className="secondary-btn empty-create-btn"
              onClick={() => setIsCreateModalOpen(true)}
              disabled={!hasRegisteredRunners}
            >
              + Create agent
            </button>
          </div>
        ) : null}

        {agents.length > 0 ? (
          <ul className="task-list">
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
              const assignedSkillLabels = (agent.skillIds || []).map((skillId) => {
                const skill = skillLookup.get(skillId);
                if (!skill) {
                  return skillId;
                }
                return formatSkillLabel(skill);
              });
              const assignedSkillSummary =
                assignedSkillLabels.length > 0 ? assignedSkillLabels.join(", ") : "none";
              const assignedMcpServerLabels = (agent.mcpServerIds || []).map((mcpServerId) => {
                const mcpServer = mcpServerLookup.get(mcpServerId);
                return mcpServer ? mcpServer.name : mcpServerId;
              });
              const assignedMcpServerSummary =
                assignedMcpServerLabels.length > 0 ? assignedMcpServerLabels.join(", ") : "none";
              const installedSkillRows = Array.isArray(agent.installedSkills)
                ? agent.installedSkills.filter(
                    (installedSkill) =>
                      normalizeSkillType(installedSkill?.skillType) === SKILL_TYPE_SKILLSMP,
                  )
                : [];
              const isSavingOrDeleting =
                savingAgentId === agent.id || deletingAgentId === agent.id;
              const isInitializing = initializingAgentId === agent.id;
              const isBusy = isSavingOrDeleting || isInitializing;

              return (
                <li key={agent.id} className="task-card">
                  <div className="task-card-top">
                    <div className="task-card-title-group">
                      <strong>{agent.name}</strong>
                      <code className="runner-id">{agent.id}</code>
                    </div>
                    <div className="task-card-top-actions">
                      <button
                        type="button"
                        className="icon-edit-btn"
                        aria-label={`Edit ${agent.name}`}
                        title="Edit agent"
                        onClick={() => setEditingAgentId(agent.id)}
                        disabled={isBusy}
                      >
                        <svg
                          aria-hidden="true"
                          viewBox="0 0 20 20"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M4 13.5 3 17l3.5-1 9-9a1.8 1.8 0 0 0 0-2.5l-1-1a1.8 1.8 0 0 0-2.5 0l-9 9Z"
                            stroke="currentColor"
                            strokeWidth="1.4"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M11.5 4.5 15.5 8.5"
                            stroke="currentColor"
                            strokeWidth="1.4"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <p className="agent-subcopy">
                    SDK: <strong>{agent.agentSdk}</strong> • model: <strong>{agent.model}</strong>{" "}
                    • reasoning: <strong>{agent.modelReasoningLevel}</strong>
                  </p>
                  <p className="agent-subcopy">
                    Runner: <strong>{assignedRunnerLabel}</strong>
                  </p>
                  <p className="agent-subcopy">
                    Skills: <strong>{assignedSkillSummary}</strong>
                  </p>
                  <p className="agent-subcopy">
                    MCP servers: <strong>{assignedMcpServerSummary}</strong>
                  </p>
                  {installedSkillRows.length > 0 ? (
                    <div className="agent-installed-skills">
                      <p className="agent-subcopy">
                        SkillsMP install status:
                      </p>
                      {installedSkillRows.map((installedSkill) => {
                        const installKey = `${agent.id}:${installedSkill.skillId}`;
                        const retryingThisInstall = retryingAgentSkillInstallKey === installKey;
                        const installStatus = String(installedSkill.status || "").trim() || "unknown";
                        const installMessage = String(installedSkill.message || "").trim();
                        const installLogs = String(installedSkill.installLogs || "").trim();
                        return (
                          <div key={`installed-skill-${installKey}`} className="agent-installed-skill-row">
                            <p className="agent-subcopy">
                              <strong>{installedSkill.skillName || installedSkill.skillId}</strong>:{" "}
                              <span className={`agent-install-status agent-install-status-${installStatus}`}>
                                {installStatus}
                              </span>
                              {installMessage ? ` (${installMessage})` : ""}
                            </p>
                            <div className="task-card-actions">
                              <button
                                type="button"
                                className="secondary-btn"
                                onClick={() =>
                                  onRetryAgentSkillInstall(agent.id, installedSkill.skillId)
                                }
                                disabled={retryingThisInstall || isSavingOrDeleting}
                              >
                                {retryingThisInstall ? "Retrying..." : "Retry install"}
                              </button>
                            </div>
                            {installLogs ? (
                              <details className="agent-install-logs">
                                <summary>View install logs</summary>
                                <pre>{installLogs}</pre>
                          </details>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              ) : null}

                  <div className="task-card-actions">
                    <button
                      type="button"
                      className="secondary-btn"
                      onClick={() => onOpenAgentSessions(agent.id)}
                      disabled={isBusy}
                    >
                      Chats
                    </button>
                    <button
                      type="button"
                      className="danger-btn"
                      onClick={() => openDeleteAgentModal(agent.id, agent.name)}
                      disabled={isBusy}
                    >
                      {deletingAgentId === agent.id ? "Deleting..." : "Delete"}
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
            disabled={!hasRegisteredRunners}
          >
            {!hasRegisteredRunners ? (
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

          <label htmlFor="create-agent-skills-assigned">Assigned skills (optional)</label>
          <div id="create-agent-skills-assigned" className="inline-selection-list">
            {createAssignedSkillIds.length === 0 ? (
              <span className="empty-hint">No skills assigned.</span>
            ) : (
              createAssignedSkillIds.map((skillId) => {
                const skill = skillLookup.get(skillId);
                const skillLabel = skill ? formatSkillLabel(skill) : skillId;
                return (
                  <button
                    key={`create-agent-remove-skill-${skillId}`}
                    type="button"
                    className="tag-remove-btn"
                    onClick={() =>
                      onAgentSkillIdsChange(
                        createAssignedSkillIds.filter((candidateId) => candidateId !== skillId),
                      )
                    }
                    title={`Remove ${skillLabel}`}
                  >
                    {skillLabel} ×
                  </button>
                );
              })
            )}
          </div>

          <label htmlFor="create-agent-skill-add">Add skill</label>
          <select
            id="create-agent-skill-add"
            value=""
            onChange={(event) => {
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
                ? "All company skills already assigned"
                : "Select skill to assign"}
            </option>
            {createAvailableSkills.map((skill) => (
              <option key={`create-agent-skill-${skill.id}`} value={skill.id}>
                {formatSkillLabel(skill)}
              </option>
            ))}
          </select>

          <label htmlFor="create-agent-mcp-assigned">Assigned MCP servers (optional)</label>
          <div id="create-agent-mcp-assigned" className="inline-selection-list">
            {createAssignedMcpServerIds.length === 0 ? (
              <span className="empty-hint">No MCP servers assigned.</span>
            ) : (
              createAssignedMcpServerIds.map((mcpServerId) => {
                const mcpServer = mcpServerLookup.get(mcpServerId);
                const mcpServerLabel = mcpServer ? mcpServer.name : mcpServerId;
                return (
                  <button
                    key={`create-agent-remove-mcp-${mcpServerId}`}
                    type="button"
                    className="tag-remove-btn"
                    onClick={() =>
                      onAgentMcpServerIdsChange(
                        createAssignedMcpServerIds.filter((candidateId) => candidateId !== mcpServerId),
                      )
                    }
                    title={`Remove ${mcpServerLabel}`}
                  >
                    {mcpServerLabel} ×
                  </button>
                );
              })
            )}
          </div>

          <label htmlFor="create-agent-mcp-add">Add MCP server</label>
          <select
            id="create-agent-mcp-add"
            value=""
            onChange={(event) => {
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
                ? "All company MCP servers already assigned"
                : "Select MCP server to assign"}
            </option>
            {createAvailableMcpServers.map((mcpServer) => (
              <option key={`create-agent-mcp-${mcpServer.id}`} value={mcpServer.id}>
                {mcpServer.name}
              </option>
            ))}
          </select>

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
          editingAgent ? "Update runner, model, skills, and MCP servers for this agent." : ""
        }
        isOpen={isEditModalOpen}
        onClose={() => setEditingAgentId("")}
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
              <textarea
                id={`edit-agent-default-additional-model-instructions-${editingAgent.id}`}
                value={editingDraft.defaultAdditionalModelInstructions || ""}
                onChange={(event) =>
                  onAgentDraftChange(
                    editingAgent.id,
                    "defaultAdditionalModelInstructions",
                    event.target.value,
                  )
                }
                rows={4}
                placeholder="Optional. Applied to new chats unless thread-specific instructions are provided."
                disabled={isEditingDisabled}
              />

              <label
                className="relationship-field"
                htmlFor={`edit-agent-skills-assigned-${editingAgent.id}`}
              >
                Assigned skills
              </label>
              <div
                id={`edit-agent-skills-assigned-${editingAgent.id}`}
                className="inline-selection-list"
              >
                {editingSkillIds.length === 0 ? (
                  <span className="empty-hint">No skills assigned.</span>
                ) : (
                  editingSkillIds.map((skillId) => {
                    const skill = skillLookup.get(skillId);
                    const skillLabel = skill ? formatSkillLabel(skill) : skillId;
                    return (
                      <button
                        key={`edit-agent-remove-skill-${editingAgent.id}-${skillId}`}
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

              <label className="relationship-field" htmlFor={`edit-agent-skills-add-${editingAgent.id}`}>
                Add skill
              </label>
              <select
                id={`edit-agent-skills-add-${editingAgent.id}`}
                value=""
                onChange={(event) => {
                  const nextSkillId = String(event.target.value || "").trim();
                  if (!nextSkillId) {
                    return;
                  }
                  onAgentDraftChange(editingAgent.id, "skillIds", [...editingSkillIds, nextSkillId]);
                }}
                disabled={isEditingDisabled || editingAvailableSkills.length === 0}
              >
                <option value="">
                  {editingAvailableSkills.length === 0
                    ? "All company skills already assigned"
                    : "Select skill to assign"}
                </option>
                {editingAvailableSkills.map((skill) => (
                  <option key={`edit-agent-skill-option-${editingAgent.id}-${skill.id}`} value={skill.id}>
                    {formatSkillLabel(skill)}
                  </option>
                ))}
              </select>

              <label
                className="relationship-field"
                htmlFor={`edit-agent-mcp-assigned-${editingAgent.id}`}
              >
                Assigned MCP servers
              </label>
              <div
                id={`edit-agent-mcp-assigned-${editingAgent.id}`}
                className="inline-selection-list"
              >
                {editingMcpServerIds.length === 0 ? (
                  <span className="empty-hint">No MCP servers assigned.</span>
                ) : (
                  editingMcpServerIds.map((mcpServerId) => {
                    const mcpServer = mcpServerLookup.get(mcpServerId);
                    const mcpServerLabel = mcpServer ? mcpServer.name : mcpServerId;
                    return (
                      <button
                        key={`edit-agent-remove-mcp-${editingAgent.id}-${mcpServerId}`}
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

              <label className="relationship-field" htmlFor={`edit-agent-mcp-add-${editingAgent.id}`}>
                Add MCP server
              </label>
              <select
                id={`edit-agent-mcp-add-${editingAgent.id}`}
                value=""
                onChange={(event) => {
                  const nextMcpServerId = String(event.target.value || "").trim();
                  if (!nextMcpServerId) {
                    return;
                  }
                  onAgentDraftChange(
                    editingAgent.id,
                    "mcpServerIds",
                    [...editingMcpServerIds, nextMcpServerId],
                  );
                }}
                disabled={isEditingDisabled || editingAvailableMcpServers.length === 0}
              >
                <option value="">
                  {editingAvailableMcpServers.length === 0
                    ? "All company MCP servers already assigned"
                    : "Select MCP server to assign"}
                </option>
                {editingAvailableMcpServers.map((mcpServer) => (
                  <option key={`edit-agent-mcp-option-${editingAgent.id}-${mcpServer.id}`} value={mcpServer.id}>
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
                onClick={() => setEditingAgentId("")}
                disabled={isEditingAgentSaving}
              >
                Cancel
              </button>
            </div>
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
