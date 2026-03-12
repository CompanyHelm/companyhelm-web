import {
  useState,
  useMemo,
  useEffect,
  useCallback,
  type ChangeEvent,
  type FormEvent,
  type KeyboardEvent,
  type MouseEvent,
} from "react";
import { Page } from "../components/Page.tsx";
import { AgentCreateModal } from "../components/AgentCreateModal.tsx";
import { CreationModal } from "../components/CreationModal.tsx";
import { AgentEditModal } from "../components/AgentEditModal.tsx";
import { DEFAULT_AGENT_SDK } from "../utils/constants.ts";
import { getAgentCreationFormStatus, type CreatedAgentSummary } from "../utils/agent-creation.ts";
import {
  normalizeUniqueStringList,
  getRunnerCodexModelEntriesForRunner,
  getRunnerModelNames,
  getRunnerReasoningLevels,
  normalizeRunnerAvailableAgentSdks,
} from "../utils/normalization.ts";
import { formatRunnerLabel, isRunnerReadyAndConnected } from "../utils/formatting.ts";
import { setBrowserPath } from "../utils/path.ts";
import { useSetPageActions } from "../components/PageActionsContext.tsx";
import type {
  Agent,
  AgentDraft,
  AgentDraftById,
  AgentRunner,
  McpServer,
  Role,
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

type AgentDraftField = keyof AgentDraft;

interface AgentsPageProps {
  selectedCompanyId: string;
  agents: Agent[];
  skills: Array<{ id: string; name: string }>;
  roles: Role[];
  mcpServers: McpServer[];
  roleMcpServerIdsByRoleId: StringArrayById;
  agentRunners: AgentRunner[];
  agentRunnerLookup: Map<string, AgentRunner>;
  runnerCodexModelEntriesById: RunnerCodexModelEntriesById;
  isLoadingAgents: boolean;
  agentError: string;
  isCreatingAgent: boolean;
  savingAgentId: string | null;
  deletingAgentId: string | null;
  initializingAgentId: string | null;
  hasLoadedAgentRunners: boolean;
  agentRunnerId: string;
  agentRoleIds: string[];
  agentName: string;
  agentSdk: string;
  agentModel: string;
  agentModelReasoningLevel: string;
  agentDefaultAdditionalModelInstructions: string;
  agentDrafts: AgentDraftById;
  agentCountLabel: string;
  onAgentRunnerChange: (runnerId: string) => void;
  onAgentRoleIdsChange: (roleIds: string[]) => void;
  onAgentNameChange: (name: string) => void;
  onAgentSdkChange: (sdk: string) => void;
  onAgentModelChange: (model: string) => void;
  onAgentModelReasoningLevelChange: (reasoningLevel: string) => void;
  onAgentDefaultAdditionalModelInstructionsChange: (instructions: string) => void;
  onCreateAgent: (event: FormEvent<HTMLFormElement>) => Promise<boolean> | boolean;
  onAgentDraftChange: (agentId: string, field: AgentDraftField, value: string | string[]) => void;
  onEnsureAgentEditorData: () => Promise<void> | void;
  onSaveAgent: (agentId: string) => Promise<boolean> | boolean;
  onOpenAgentSessions: (agentId: string) => void;
  onCreateChatForAgent: (agentId: string) => Promise<void> | void;
  onDeleteAgent: (agentId: string, agentName: string, forceDelete: boolean) => Promise<boolean> | boolean;
  pendingEditAgentId: string;
  onClearPendingEditAgentId: () => void;
}

export function AgentsPage({
  selectedCompanyId,
  agents,
  skills,
  roles,
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
  agentRoleIds,
  agentName,
  agentSdk,
  agentModel,
  agentModelReasoningLevel,
  agentDefaultAdditionalModelInstructions,
  agentDrafts,
  agentCountLabel,
  onAgentRunnerChange,
  onAgentRoleIdsChange,
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
  onCreateChatForAgent,
  onDeleteAgent,
  pendingEditAgentId,
  onClearPendingEditAgentId,
}: AgentsPageProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createdAgent, setCreatedAgent] = useState<CreatedAgentSummary | null>(null);
  const [isCreatingPostCreateChat, setIsCreatingPostCreateChat] = useState(false);
  const [editingAgentId, setEditingAgentId] = useState("");
  const [pendingDeleteAgent, setPendingDeleteAgent] = useState<{ id: string; name: string } | null>(null);
  const [forceDeleteAgent, setForceDeleteAgent] = useState(false);
  const roleLookup = useMemo(() => {
    return roles.reduce((map, role) => {
      map.set(role.id, role);
      return map;
    }, new Map<string, Role>());
  }, [roles]);
  const roleChildrenByParentId = useMemo(() => {
    const childrenByParentId = new Map<string, string[]>();
    for (const role of roles) {
      const roleId = String(role?.id || "").trim();
      const parentRoleId = String(role?.parentRole?.id || "").trim();
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
  }, [roles]);
  const mcpServerLookup = useMemo(() => {
    return mcpServers.reduce((map, mcpServer) => {
      map.set(mcpServer.id, mcpServer);
      return map;
    }, new Map<string, McpServer>());
  }, [mcpServers]);
  const createRunnerCodexModelEntries = useMemo(() => {
    return getRunnerCodexModelEntriesForRunner(runnerCodexModelEntriesById, agentRunnerId);
  }, [agentRunnerId, runnerCodexModelEntriesById]);
  const createRunnerSdkAvailabilityByName = useMemo(() => {
    const selectedRunner = agentRunners.find((runner) => runner.id === agentRunnerId) || null;
    const sdkEntries = selectedRunner ? normalizeRunnerAvailableAgentSdks(selectedRunner) : [];
    return sdkEntries.reduce((map, sdkEntry) => {
      map.set(sdkEntry.name, sdkEntry.isAvailable && sdkEntry.status === "ready" ? "available" : "unavailable");
      return map;
    }, new Map<string, "available" | "unavailable">());
  }, [agentRunners, agentRunnerId]);
  const createRunnerModelNames = useMemo(() => {
    return getRunnerModelNames(createRunnerCodexModelEntries);
  }, [createRunnerCodexModelEntries]);
  const createRunnerReasoningLevels = useMemo(() => {
    return getRunnerReasoningLevels(createRunnerCodexModelEntries, agentModel);
  }, [agentModel, createRunnerCodexModelEntries]);
  const createAssignedRoleIds = useMemo(
    () => normalizeUniqueStringList(agentRoleIds),
    [agentRoleIds],
  );
  const createExpandedRoleIds = useMemo(
    () => collectRoleAndSubroleIds(createAssignedRoleIds, roleChildrenByParentId),
    [createAssignedRoleIds, roleChildrenByParentId],
  );
  const createEffectiveMcpServerIds = useMemo(
    () => resolveEffectiveRoleMcpServerIds(createExpandedRoleIds, roleMcpServerIdsByRoleId),
    [createExpandedRoleIds, roleMcpServerIdsByRoleId],
  );
  const createAvailableRoles = useMemo(
    () =>
      roles.filter((role) => !createAssignedRoleIds.includes(role.id)),
    [createAssignedRoleIds, roles],
  );
  const createFormStatus = useMemo(() => {
    return getAgentCreationFormStatus({
      agentRunners,
      runnerCodexModelEntriesById,
      agentName,
      agentRunnerId,
      agentSdk,
      agentModel,
      agentModelReasoningLevel,
    });
  }, [
    agentModel,
    agentModelReasoningLevel,
    agentName,
    agentRunnerId,
    agentRunners,
    agentSdk,
    runnerCodexModelEntriesById,
  ]);
  const createEffectiveMcpServerLabels = useMemo(
    () => createEffectiveMcpServerIds.map((mcpServerId) => {
      const mcpServer = mcpServerLookup.get(mcpServerId);
      return mcpServer ? mcpServer.name : mcpServerId;
    }),
    [createEffectiveMcpServerIds, mcpServerLookup],
  );
  const hasReadyConnectedRunner = agentRunners.some((runner) => isRunnerReadyAndConnected(runner));
  const isCreateBlockedByRunners = hasLoadedAgentRunners && !hasReadyConnectedRunner;
  const createAgentButtonTitle = isCreateBlockedByRunners
    ? "A connected runner with configured Codex SDK is required before creating an agent"
    : "Create agent";
  useEffect(() => {
    if (pendingEditAgentId) {
      setEditingAgentId(pendingEditAgentId);
      onClearPendingEditAgentId();
    }
  }, [pendingEditAgentId, onClearPendingEditAgentId]);

  function openEditAgentModal(agentId: string) {
    setEditingAgentId(agentId);
  }

  const openCreateAgentModal = useCallback(() => {
    void onEnsureAgentEditorData();
    setCreatedAgent(null);
    setIsCreateModalOpen(true);
  }, [onEnsureAgentEditorData]);

  function closeCreateAgentModal() {
    setCreatedAgent(null);
    setIsCreatingPostCreateChat(false);
    setIsCreateModalOpen(false);
  }

  async function handleCreateAgentSubmit(event: FormEvent<HTMLFormElement>) {
    const createdAgentName = String(agentName || "").trim() || "New agent";
    const didCreate = await onCreateAgent(event);
    if (typeof didCreate === "string") {
      setCreatedAgent({
        id: didCreate,
        name: createdAgentName,
      });
      return;
    }
    if (didCreate) {
      closeCreateAgentModal();
    }
  }

  async function handleCreateModalChatNow() {
    if (!createdAgent?.id) {
      return;
    }

    try {
      setIsCreatingPostCreateChat(true);
      await onCreateChatForAgent(createdAgent.id);
      closeCreateAgentModal();
    } finally {
      setIsCreatingPostCreateChat(false);
    }
  }

  async function handleSaveEditedAgent(agentId: string) {
    const didSave = await onSaveAgent(agentId);
    if (didSave) {
      setEditingAgentId("");
    }
    return didSave;
  }

  function openDeleteAgentModal(agentId: string, agentName: string) {
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

  async function handleDeleteAgentSubmit(event: FormEvent<HTMLFormElement>) {
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

  const pageActions = useMemo(() => (
    <>
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
    </>
  ), [createAgentButtonTitle, openCreateAgentModal, isCreateBlockedByRunners]);
  useSetPageActions(pageActions);

  return (
    <Page><div className="page-stack">
      <section className="panel list-panel">

        {agentError ? <p className="error-banner">{agentError}</p> : null}
        {isLoadingAgents ? <p className="empty-hint">Loading agents...</p> : null}
        {!isLoadingAgents && agents.length === 0 ? (
          <div className="empty-state">
            <p className="empty-hint">No agents created for this company yet.</p>
            {isCreateBlockedByRunners ? (
              <p className="empty-hint">
                Wait for a runner to connect and report a configured Codex SDK before creating an agent.
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
                    isConnected: false,
                    status: "disconnected",
                  }
                : null;
              const assignedRunnerLabel = assignedRunner
                ? formatRunnerLabel(assignedRunner)
                : "Unassigned";
              const assignedRoleIds = normalizeUniqueStringList(agent.roleIds || []);
              const assignedRoleLabels = assignedRoleIds.map((roleId) => {
                const role = roleLookup.get(roleId);
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
                  onKeyDown={(event: KeyboardEvent<HTMLLIElement>) => {
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
                      onClick={(event: MouseEvent<HTMLButtonElement>) => {
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
                      onClick={(event: MouseEvent<HTMLButtonElement>) => {
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

      <AgentCreateModal
        isOpen={isCreateModalOpen}
        hasLoadedAgentRunners={hasLoadedAgentRunners}
        formStatus={createFormStatus}
        agentRunners={agentRunners}
        createAssignedRoleIds={createAssignedRoleIds}
        createAvailableRoles={createAvailableRoles}
        createEffectiveMcpServerLabels={createEffectiveMcpServerLabels}
        roleLabelById={new Map(roles.map((role) => [role.id, role.name]))}
        agentRunnerId={agentRunnerId}
        agentName={agentName}
        agentSdk={agentSdk}
        agentModel={agentModel}
        agentModelReasoningLevel={agentModelReasoningLevel}
        agentDefaultAdditionalModelInstructions={agentDefaultAdditionalModelInstructions}
        sdkAvailabilityByName={createRunnerSdkAvailabilityByName}
        runnerModelEntries={createRunnerCodexModelEntries}
        runnerModelNames={createRunnerModelNames}
        runnerReasoningLevels={createRunnerReasoningLevels}
        isCreatingAgent={isCreatingAgent}
        createdAgent={createdAgent}
        isCreatingPostCreateChat={isCreatingPostCreateChat}
        onClose={closeCreateAgentModal}
        onCreateAgent={handleCreateAgentSubmit}
        onAgentRunnerChange={onAgentRunnerChange}
        onAgentRoleIdsChange={onAgentRoleIdsChange}
        onAgentNameChange={onAgentNameChange}
        onAgentSdkChange={onAgentSdkChange}
        onAgentModelChange={onAgentModelChange}
        onAgentModelReasoningLevelChange={onAgentModelReasoningLevelChange}
        onAgentDefaultAdditionalModelInstructionsChange={onAgentDefaultAdditionalModelInstructionsChange}
        onChatNow={handleCreateModalChatNow}
        onSkipPostCreate={closeCreateAgentModal}
      />

      <AgentEditModal
        agents={agents}
        agentRunners={agentRunners}
        roles={roles}
        mcpServers={mcpServers}
        roleMcpServerIdsByRoleId={roleMcpServerIdsByRoleId}
        runnerCodexModelEntriesById={runnerCodexModelEntriesById}
        agentDrafts={agentDrafts}
        savingAgentId={savingAgentId}
        deletingAgentId={deletingAgentId}
        initializingAgentId={initializingAgentId}
        onAgentDraftChange={onAgentDraftChange}
        onSaveAgent={handleSaveEditedAgent}
        onEnsureAgentEditorData={onEnsureAgentEditorData}
        editingAgentId={editingAgentId}
        onClose={() => setEditingAgentId("")}
      />

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
              onChange={(event: ChangeEvent<HTMLInputElement>) => setForceDeleteAgent(event.target.checked)}
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
              disabled={Boolean(pendingDeleteAgent && deletingAgentId === pendingDeleteAgent.id)}
            >
              Cancel
            </button>
          </div>
        </form>
      </CreationModal>
    </div></Page>
  );
}
