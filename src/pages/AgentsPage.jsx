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

  async function handleCreateAgentSubmit(event) {
    const didCreate = await onCreateAgent(event);
    if (didCreate) {
      setIsCreateModalOpen(false);
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
              const draft = agentDrafts[agent.id] || {
                agentRunnerId: "",
                skillIds: [],
                mcpServerIds: [],
                name: "",
                agentSdk: DEFAULT_AGENT_SDK,
                model: "",
                modelReasoningLevel: "",
                defaultAdditionalModelInstructions: "",
              };
              const draftSkillIds = normalizeUniqueStringList(draft.skillIds);
              const draftAvailableSkills = skills.filter(
                (skill) => !draftSkillIds.includes(skill.id),
              );
              const draftMcpServerIds = normalizeUniqueStringList(draft.mcpServerIds);
              const draftAvailableMcpServers = mcpServers.filter(
                (mcpServer) => !draftMcpServerIds.includes(mcpServer.id),
              );
              const draftRunnerCodexModelEntries = getRunnerCodexModelEntriesForRunner(
                runnerCodexModelEntriesById,
                draft.agentRunnerId,
              );
              const draftRunnerModelNames = getRunnerModelNames(draftRunnerCodexModelEntries);
              const draftRunnerReasoningLevels = getRunnerReasoningLevels(
                draftRunnerCodexModelEntries,
                draft.model,
              );
              const isSavingOrDeleting =
                savingAgentId === agent.id || deletingAgentId === agent.id;

              return (
                <li key={agent.id} className="task-card">
                  <div className="task-card-top">
                    <strong>{agent.name}</strong>
                    <code className="runner-id">{agent.id}</code>
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

                  <div className="relationship-editor">
                    <div className="agent-edit-grid">
                      <label className="relationship-field" htmlFor={`agent-runner-${agent.id}`}>
                        Runner
                      </label>
                      <select
                        id={`agent-runner-${agent.id}`}
                        value={draft.agentRunnerId}
                        onChange={(event) =>
                          onAgentDraftChange(agent.id, "agentRunnerId", event.target.value)
                        }
                        disabled={isSavingOrDeleting}
                      >
                        <option value="">Unassigned</option>
                        {agentRunners.map((runner) => (
                          <option key={runner.id} value={runner.id}>
                            {formatRunnerLabel(runner)}
                          </option>
                        ))}
                      </select>

                      <label className="relationship-field" htmlFor={`agent-name-${agent.id}`}>
                        Name
                      </label>
                      <input
                        id={`agent-name-${agent.id}`}
                        value={draft.name}
                        onChange={(event) =>
                          onAgentDraftChange(agent.id, "name", event.target.value)
                        }
                        disabled={isSavingOrDeleting}
                      />

                      <label className="relationship-field" htmlFor={`agent-sdk-${agent.id}`}>
                        SDK
                      </label>
                      <select
                        id={`agent-sdk-${agent.id}`}
                        value={draft.agentSdk}
                        onChange={(event) =>
                          onAgentDraftChange(agent.id, "agentSdk", event.target.value)
                        }
                        disabled={isSavingOrDeleting}
                      >
                        {AVAILABLE_AGENT_SDKS.map((sdkName) => (
                          <option key={`${agent.id}-sdk-${sdkName}`} value={sdkName}>
                            {sdkName}
                          </option>
                        ))}
                      </select>

                      <label className="relationship-field" htmlFor={`agent-model-${agent.id}`}>
                        Model
                      </label>
                      <select
                        id={`agent-model-${agent.id}`}
                        value={draft.model}
                        onChange={(event) =>
                          onAgentDraftChange(agent.id, "model", event.target.value)
                        }
                        disabled={isSavingOrDeleting || !draft.agentRunnerId}
                      >
                        {!draft.agentRunnerId ? (
                          <option value="">Select a runner first</option>
                        ) : draftRunnerModelNames.length === 0 ? (
                          <option value="">No models reported by selected runner</option>
                        ) : (
                          <>
                            <option value="">Select model</option>
                            {draftRunnerModelNames.map((modelName) => (
                              <option key={`${agent.id}-model-${modelName}`} value={modelName}>
                                {modelName}
                              </option>
                            ))}
                          </>
                        )}
                      </select>

                      <label className="relationship-field" htmlFor={`agent-reasoning-${agent.id}`}>
                        Reasoning
                      </label>
                      <select
                        id={`agent-reasoning-${agent.id}`}
                        value={draft.modelReasoningLevel}
                        onChange={(event) =>
                          onAgentDraftChange(agent.id, "modelReasoningLevel", event.target.value)
                        }
                        disabled={isSavingOrDeleting || !draft.agentRunnerId || !draft.model}
                      >
                        {!draft.agentRunnerId ? (
                          <option value="">Select a runner first</option>
                        ) : !draft.model ? (
                          <option value="">Select a model first</option>
                        ) : draftRunnerReasoningLevels.length === 0 ? (
                          <option value="">No reasoning levels reported for this model</option>
                        ) : (
                          <>
                            <option value="">Select reasoning</option>
                            {draftRunnerReasoningLevels.map((reasoningLevel) => (
                              <option
                                key={`${agent.id}-reasoning-${reasoningLevel}`}
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
                        htmlFor={`agent-default-additional-model-instructions-${agent.id}`}
                      >
                        Default additional model instructions
                      </label>
                      <textarea
                        id={`agent-default-additional-model-instructions-${agent.id}`}
                        value={draft.defaultAdditionalModelInstructions || ""}
                        onChange={(event) =>
                          onAgentDraftChange(
                            agent.id,
                            "defaultAdditionalModelInstructions",
                            event.target.value,
                          )
                        }
                        rows={4}
                        placeholder="Optional. Applied to new chats unless thread-specific instructions are provided."
                        disabled={isSavingOrDeleting}
                      />

                      <label className="relationship-field" htmlFor={`agent-skills-assigned-${agent.id}`}>
                        Assigned skills
                      </label>
                      <div id={`agent-skills-assigned-${agent.id}`} className="inline-selection-list">
                        {draftSkillIds.length === 0 ? (
                          <span className="empty-hint">No skills assigned.</span>
                        ) : (
                          draftSkillIds.map((skillId) => {
                            const skill = skillLookup.get(skillId);
                            const skillLabel = skill ? formatSkillLabel(skill) : skillId;
                            return (
                              <button
                                key={`agent-remove-skill-${agent.id}-${skillId}`}
                                type="button"
                                className="tag-remove-btn"
                                onClick={() =>
                                  onAgentDraftChange(
                                    agent.id,
                                    "skillIds",
                                    draftSkillIds.filter((candidateId) => candidateId !== skillId),
                                  )
                                }
                                disabled={isSavingOrDeleting}
                                title={`Remove ${skillLabel}`}
                              >
                                {skillLabel} ×
                              </button>
                            );
                          })
                        )}
                      </div>

                      <label className="relationship-field" htmlFor={`agent-skills-add-${agent.id}`}>
                        Add skill
                      </label>
                      <select
                        id={`agent-skills-add-${agent.id}`}
                        value=""
                        onChange={(event) => {
                          const nextSkillId = String(event.target.value || "").trim();
                          if (!nextSkillId) {
                            return;
                          }
                          onAgentDraftChange(agent.id, "skillIds", [...draftSkillIds, nextSkillId]);
                        }}
                        disabled={isSavingOrDeleting || draftAvailableSkills.length === 0}
                      >
                        <option value="">
                          {draftAvailableSkills.length === 0
                            ? "All company skills already assigned"
                            : "Select skill to assign"}
                        </option>
                        {draftAvailableSkills.map((skill) => (
                          <option key={`agent-skill-option-${agent.id}-${skill.id}`} value={skill.id}>
                            {formatSkillLabel(skill)}
                          </option>
                        ))}
                      </select>

                      <label className="relationship-field" htmlFor={`agent-mcp-assigned-${agent.id}`}>
                        Assigned MCP servers
                      </label>
                      <div id={`agent-mcp-assigned-${agent.id}`} className="inline-selection-list">
                        {draftMcpServerIds.length === 0 ? (
                          <span className="empty-hint">No MCP servers assigned.</span>
                        ) : (
                          draftMcpServerIds.map((mcpServerId) => {
                            const mcpServer = mcpServerLookup.get(mcpServerId);
                            const mcpServerLabel = mcpServer ? mcpServer.name : mcpServerId;
                            return (
                              <button
                                key={`agent-remove-mcp-${agent.id}-${mcpServerId}`}
                                type="button"
                                className="tag-remove-btn"
                                onClick={() =>
                                  onAgentDraftChange(
                                    agent.id,
                                    "mcpServerIds",
                                    draftMcpServerIds.filter((candidateId) => candidateId !== mcpServerId),
                                  )
                                }
                                disabled={isSavingOrDeleting}
                                title={`Remove ${mcpServerLabel}`}
                              >
                                {mcpServerLabel} ×
                              </button>
                            );
                          })
                        )}
                      </div>

                      <label className="relationship-field" htmlFor={`agent-mcp-add-${agent.id}`}>
                        Add MCP server
                      </label>
                      <select
                        id={`agent-mcp-add-${agent.id}`}
                        value=""
                        onChange={(event) => {
                          const nextMcpServerId = String(event.target.value || "").trim();
                          if (!nextMcpServerId) {
                            return;
                          }
                          onAgentDraftChange(
                            agent.id,
                            "mcpServerIds",
                            [...draftMcpServerIds, nextMcpServerId],
                          );
                        }}
                        disabled={isSavingOrDeleting || draftAvailableMcpServers.length === 0}
                      >
                        <option value="">
                          {draftAvailableMcpServers.length === 0
                            ? "All company MCP servers already assigned"
                            : "Select MCP server to assign"}
                        </option>
                        {draftAvailableMcpServers.map((mcpServer) => (
                          <option key={`agent-mcp-option-${agent.id}-${mcpServer.id}`} value={mcpServer.id}>
                            {mcpServer.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="task-card-actions">
                      <button
                        type="button"
                        className="secondary-btn"
                        onClick={() => onOpenAgentSessions(agent.id)}
                        disabled={
                          savingAgentId === agent.id ||
                          deletingAgentId === agent.id ||
                          initializingAgentId === agent.id
                        }
                      >
                        Chats
                      </button>
                      <button
                        type="button"
                        className="secondary-btn relationship-save-btn"
                        onClick={() => onSaveAgent(agent.id)}
                        disabled={
                          savingAgentId === agent.id ||
                          deletingAgentId === agent.id ||
                          initializingAgentId === agent.id
                        }
                      >
                        {savingAgentId === agent.id ? "Saving..." : "Save"}
                      </button>
                      <button
                        type="button"
                        className="danger-btn"
                        onClick={() => openDeleteAgentModal(agent.id, agent.name)}
                        disabled={
                          savingAgentId === agent.id ||
                          deletingAgentId === agent.id ||
                          initializingAgentId === agent.id
                        }
                      >
                        {deletingAgentId === agent.id ? "Deleting..." : "Delete"}
                      </button>
                    </div>
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
