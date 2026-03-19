import { useEffect, useMemo, useState } from "react";
import { Page } from "../components/Page.tsx";
import { CreationModal } from "../components/CreationModal.tsx";
import { AgentEditorForm } from "../components/AgentEditorForm.tsx";
import { ChatListStatusToggle } from "../components/ChatListStatusToggle.tsx";
import { ChatSessionRunningBadge } from "../components/ChatSessionRunningBadge.tsx";
import { ThreadTaskSummary } from "../components/ThreadTaskSummary.tsx";
import { isChatSessionRunning } from "../utils/chat.ts";
import { ArchivedChatSelection } from "../utils/archivedChatSelection.ts";
import { resolveAgentApiDocsUrl } from "../utils/agent-api.ts";
import { formatRunnerLabel, formatTimestamp } from "../utils/formatting.ts";
import { normalizeUniqueStringList } from "../utils/normalization.ts";

function collectRoleAndSubroleIds(roleIds: any, roles: any) {
  const normalizedRoleIds = normalizeUniqueStringList(roleIds || []);
  if (normalizedRoleIds.length === 0) {
    return [];
  }

  const childRoleIdsByParentId = new Map<any, any>();
  for (const role of Array.isArray(roles) ? roles : []) {
    const roleId = String(role?.id || "").trim();
    const parentRoleId = String(role?.parentRole?.id || "").trim();
    if (!roleId || !parentRoleId) {
      continue;
    }

    const existingChildRoleIds = childRoleIdsByParentId.get(parentRoleId);
    if (existingChildRoleIds) {
      existingChildRoleIds.push(roleId);
    } else {
      childRoleIdsByParentId.set(parentRoleId, [roleId]);
    }
  }

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
    const childRoleIds = childRoleIdsByParentId.get(nextRoleId) || [];
    for (const childRoleId of childRoleIds) {
      if (!visitedRoleIds.has(childRoleId)) {
        queue.push(childRoleId);
      }
    }
  }

  return expandedRoleIds;
}

function resolveEffectiveRoleMcpServerIds(roleIds: any, roles: any, roleMcpServerIdsByRoleId: any) {
  const expandedRoleIds = collectRoleAndSubroleIds(roleIds, roles);
  const mcpServerIds: any[] = [];
  const seenMcpServerIds = new Set<any>();

  for (const roleId of expandedRoleIds) {
    const assignedMcpServerIds = normalizeUniqueStringList(roleMcpServerIdsByRoleId?.[roleId] || []);
    for (const mcpServerId of assignedMcpServerIds) {
      if (seenMcpServerIds.has(mcpServerId)) {
        continue;
      }
      seenMcpServerIds.add(mcpServerId);
      mcpServerIds.push(mcpServerId);
    }
  }

  return mcpServerIds;
}

function resolveEffectiveRoleSkills(roleIds: any, roles: any) {
  const expandedRoleIds = collectRoleAndSubroleIds(roleIds, roles);
  const effectiveSkills: any[] = [];
  const seenSkillIds = new Set<any>();

  for (const roleId of expandedRoleIds) {
    const role = (Array.isArray(roles) ? roles : []).find((candidate: any) => String(candidate?.id || "").trim() === roleId);
    const roleEffectiveSkills = Array.isArray(role?.effectiveSkills) ? role.effectiveSkills : [];
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

function unionAssignments(directAssignments: any[], inheritedAssignments: any[]) {
  const mergedAssignments: any[] = [];
  const seenAssignmentIds = new Set<any>();

  for (const assignment of [...directAssignments, ...inheritedAssignments]) {
    const assignmentId = String(assignment?.id || "").trim();
    if (!assignmentId || seenAssignmentIds.has(assignmentId)) {
      continue;
    }
    seenAssignmentIds.add(assignmentId);
    mergedAssignments.push(assignment);
  }

  return mergedAssignments;
}

function normalizeChatListStatusFilter(value: any) {
  return String(value || "").trim().toLowerCase() === "archived" ? "archived" : "active";
}

function createEmptyHeartbeatDraft() {
  return {
    name: "",
    prompt: "",
    intervalMinutes: "60",
    enabled: true,
  };
}

function formatHeartbeatIntervalMinutes(intervalSeconds: any) {
  const normalizedIntervalSeconds = Number(intervalSeconds);
  if (!Number.isFinite(normalizedIntervalSeconds) || normalizedIntervalSeconds <= 0) {
    return "";
  }

  const intervalMinutes = normalizedIntervalSeconds / 60;
  return Number.isInteger(intervalMinutes) ? String(intervalMinutes) : String(intervalMinutes);
}

function createHeartbeatDraftFromHeartbeat(heartbeat: any) {
  return {
    name: String(heartbeat?.name || "").trim(),
    prompt: String(heartbeat?.prompt || "").trim(),
    intervalMinutes: formatHeartbeatIntervalMinutes(heartbeat?.intervalSeconds),
    enabled: heartbeat?.enabled !== false,
  };
}

function normalizeHeartbeatDraftForComparison(draft: any) {
  return {
    name: String(draft?.name || "").trim(),
    prompt: String(draft?.prompt || "").trim(),
    intervalMinutes: Number(draft?.intervalMinutes),
    enabled: draft?.enabled !== false,
  };
}

function heartbeatDraftMatchesSource(draft: any, heartbeat: any) {
  const normalizedDraft = normalizeHeartbeatDraftForComparison(draft);
  const sourceDraft = normalizeHeartbeatDraftForComparison(createHeartbeatDraftFromHeartbeat(heartbeat));
  return normalizedDraft.name === sourceDraft.name
    && normalizedDraft.prompt === sourceDraft.prompt
    && normalizedDraft.intervalMinutes === sourceDraft.intervalMinutes
    && normalizedDraft.enabled === sourceDraft.enabled;
}

function renderPencilIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
    </svg>
  );
}

export function AgentChatsPage({
  selectedCompanyId,
  agent,
  agents,
  chatSessions,
  chatSessionRunningById,
  isLoadingChatSessions,
  isCreatingChatSession,
  archivingChatSessionKey,
  deletingChatSessionKey,
  agentError,
  chatError,
  chatListStatusFilter = "active",
  createChatDisabledReason,
  chatSessionTitleDraft,
  chatSessionAdditionalModelInstructionsDraft,
  onChatSessionTitleDraftChange,
  onChatSessionAdditionalModelInstructionsDraftChange,
  onChatListStatusFilterChange,
  onCreateChatSession,
  onOpenChat,
  onArchiveChat,
  onDeleteChat,
  onBatchDeleteChats,
  activeTab = "overview",
  onSelectTab,
  onSetChatDraftMessage,
  agentRunners,
  skills,
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
  onCreateHeartbeat,
  onUpdateHeartbeat,
  onDeleteHeartbeat,
  onScheduleHeartbeatNow,
  onEnsureAgentEditorData,
  isBatchDeletingChats = false,
}: any) {
  const resolvedCreateChatDisabledReason = String(createChatDisabledReason || "").trim();
  const resolvedAgentError = String(agentError || "").trim();
  const normalizedChatListStatusFilter = normalizeChatListStatusFilter(chatListStatusFilter);
  const canShowCreateChatActions = normalizedChatListStatusFilter !== "archived";
  const isCreateChatDisabled = !agent || isCreatingChatSession || Boolean(resolvedCreateChatDisabledReason);
  const [isCreateSettingsOpen, setIsCreateSettingsOpen] = useState<any>(false);
  const [isHeartbeatComposerOpen, setIsHeartbeatComposerOpen] = useState<any>(false);
  const [selectedArchivedChatKeys, setSelectedArchivedChatKeys] = useState<any>(new Set());
  const [heartbeatDraftsById, setHeartbeatDraftsById] = useState<any>({});
  const [editingHeartbeatFieldsById, setEditingHeartbeatFieldsById] = useState<any>({});
  const [newHeartbeatDraft, setNewHeartbeatDraft] = useState<any>(createEmptyHeartbeatDraft);
  const [savingHeartbeatId, setSavingHeartbeatId] = useState<any>("");
  const [deletingHeartbeatId, setDeletingHeartbeatId] = useState<any>("");
  const [schedulingHeartbeatId, setSchedulingHeartbeatId] = useState<any>("");
  const [heartbeatError, setHeartbeatError] = useState<any>("");
  const [heartbeatSaveNotice, setHeartbeatSaveNotice] = useState<any>(null);
  const runnerLookup = useMemo(() => {
    return (Array.isArray(agentRunners) ? agentRunners : []).reduce((map: any, runner: any) => {
      const runnerId = String(runner?.id || "").trim();
      if (runnerId) {
        map.set(runnerId, runner);
      }
      return map;
    }, new Map<any, any>());
  }, [agentRunners]);
  const roleLookup = useMemo(() => {
    return (Array.isArray(roles) ? roles : []).reduce((map: any, role: any) => {
      const roleId = String(role?.id || "").trim();
      if (roleId) {
        map.set(roleId, role);
      }
      return map;
    }, new Map<any, any>());
  }, [roles]);
  const mcpServerLookup = useMemo(() => {
    return (Array.isArray(mcpServers) ? mcpServers : []).reduce((map: any, mcpServer: any) => {
      const mcpServerId = String(mcpServer?.id || "").trim();
      if (mcpServerId) {
        map.set(mcpServerId, mcpServer);
      }
      return map;
    }, new Map<any, any>());
  }, [mcpServers]);
  const chatCountLabel = useMemo(() => {
    if (!agent) {
      return "";
    }
    if (chatSessions.length === 0) {
      return "No chats";
    }
    if (chatSessions.length === 1) {
      return "1 chat";
    }
    return `${chatSessions.length} chats`;
  }, [agent, chatSessions.length]);
  const agentSummary = useMemo(() => {
    if (!agent) {
      return null;
    }

    const assignedRunner = agent.agentRunnerId
      ? runnerLookup.get(agent.agentRunnerId) || {
          id: agent.agentRunnerId,
          isConnected: false,
          status: "disconnected",
        }
      : null;
    const assignedRunnerLabel = assignedRunner ? formatRunnerLabel(assignedRunner) : "Unassigned";
    const assignedRoleIds = normalizeUniqueStringList(agent.roleIds || []);
    const assignedRoleLabels = assignedRoleIds.map((roleId: any) => {
      const role = roleLookup.get(roleId);
      return role?.name || "Unknown role";
    });
    const assignedRoles = assignedRoleIds.map((roleId: any, index: number) => ({
      id: roleId,
      name: assignedRoleLabels[index] || "Unknown role",
    }));
    const assignedRoleSummary = assignedRoleLabels.length > 0 ? assignedRoleLabels.join(", ") : "none";
    const directSkillIds = normalizeUniqueStringList(agent.skillIds || []);
    const directSkills = directSkillIds.map((skillId: any) => {
      const skill = (Array.isArray(skills) ? skills : []).find((candidate: any) => String(candidate?.id || "").trim() === skillId);
      return {
        id: skillId,
        name: String(skill?.name || "").trim() || "Unknown skill",
      };
    });
    const inheritedSkills = resolveEffectiveRoleSkills(assignedRoleIds, roles);
    const effectiveSkills = unionAssignments(directSkills, inheritedSkills);
    const directSkillSummary = directSkills.length > 0
      ? directSkills.map((skill: any) => skill.name).join(", ")
      : "none";
    const effectiveSkillSummary = effectiveSkills.length > 0
      ? effectiveSkills.map((skill: any) => skill.name).join(", ")
      : "none";
    const inheritedMcpServerIds = resolveEffectiveRoleMcpServerIds(
      assignedRoleIds,
      roles,
      roleMcpServerIdsByRoleId,
    );
    const directMcpServerIds = normalizeUniqueStringList(agent.mcpServerIds || []);
    const directMcpServers = directMcpServerIds.map((mcpServerId: any) => {
      const mcpServer = mcpServerLookup.get(mcpServerId);
      return {
        id: mcpServerId,
        name: mcpServer?.name || "Unknown MCP server",
      };
    });
    const inheritedMcpServers = inheritedMcpServerIds.map((mcpServerId: any) => {
      const mcpServer = mcpServerLookup.get(mcpServerId);
      return {
        id: mcpServerId,
        name: mcpServer?.name || "Unknown MCP server",
      };
    });
    const effectiveMcpServers = unionAssignments(directMcpServers, inheritedMcpServers);
    const directMcpServerSummary =
      directMcpServers.length > 0 ? directMcpServers.map((mcpServer: any) => mcpServer.name).join(", ") : "none";
    const effectiveMcpServerSummary =
      effectiveMcpServers.length > 0 ? effectiveMcpServers.map((mcpServer: any) => mcpServer.name).join(", ") : "none";
    const modelLabel = String(agent.model || "").trim() || "n/a";
    const reasoningLabel = String(agent.modelReasoningLevel || "").trim() || "n/a";
    const instructions = String(agent.defaultAdditionalModelInstructions || "").trim();

    return {
      assignedRunnerLabel,
      assignedRoles,
      directSkills,
      effectiveSkills,
      directMcpServers,
      effectiveMcpServers,
      assignedRoleSummary,
      directSkillSummary,
      effectiveSkillSummary,
      directMcpServerSummary,
      effectiveMcpServerSummary,
      modelLabel,
      reasoningLabel,
      instructions,
      sdkLabel: String(agent.agentSdk || "").trim() || "n/a",
      chatCount: chatSessions.length,
      heartbeatCount: Array.isArray(agent.heartbeats) ? agent.heartbeats.length : 0,
    };
  }, [agent, chatSessions.length, mcpServerLookup, roleLookup, roleMcpServerIdsByRoleId, roles, runnerLookup, skills]);
  const visibleArchivedChats = useMemo(() => {
    if (!agent || normalizedChatListStatusFilter !== "archived") {
      return [];
    }
    return (Array.isArray(chatSessions) ? chatSessions : [])
      .filter((session: any) => String(session?.status || "").trim().toLowerCase() === "archived")
      .map((session: any) => ({
        agentId: agent.id,
        sessionId: String(session?.id || "").trim(),
        title: String(session?.title || "").trim(),
      }))
      .filter((session: any) => session.sessionId);
  }, [agent, chatSessions, normalizedChatListStatusFilter]);
  const visibleArchivedChatKeys = useMemo(
    () => visibleArchivedChats.map((session: any) => ArchivedChatSelection.getKey(session.agentId, session.sessionId)),
    [visibleArchivedChats],
  );
  const agentApiDocsUrl = useMemo(() => resolveAgentApiDocsUrl(), []);
  const archivedSelectionSummary = useMemo(
    () => ArchivedChatSelection.getSummary(selectedArchivedChatKeys, visibleArchivedChatKeys),
    [selectedArchivedChatKeys, visibleArchivedChatKeys],
  );

  useEffect(() => {
    if (normalizedChatListStatusFilter !== "archived") {
      setSelectedArchivedChatKeys(new Set());
      return;
    }
    const visibleKeySet = new Set(visibleArchivedChatKeys);
    setSelectedArchivedChatKeys((current: Set<string>) => {
      const next = new Set(Array.from(current).filter((key) => visibleKeySet.has(key)));
      return next.size === current.size ? current : next;
    });
  }, [normalizedChatListStatusFilter, visibleArchivedChatKeys.join("|")]);

  useEffect(() => {
    const heartbeatRows = Array.isArray(agent?.heartbeats) ? agent.heartbeats : [];
    setHeartbeatDraftsById(
      heartbeatRows.reduce((drafts: Record<string, unknown>, heartbeat: any) => {
        const heartbeatId = String(heartbeat?.id || "").trim();
        if (!heartbeatId) {
          return drafts;
        }
        drafts[heartbeatId] = createHeartbeatDraftFromHeartbeat(heartbeat);
        return drafts;
      }, {}),
    );
  }, [agent?.id, JSON.stringify(agent?.heartbeats || [])]);

  useEffect(() => {
    setEditingHeartbeatFieldsById({});
    setHeartbeatSaveNotice(null);
  }, [agent?.id]);

  useEffect(() => {
    if (!heartbeatSaveNotice?.heartbeatId) {
      return undefined;
    }
    const timeoutId = window.setTimeout(() => {
      setHeartbeatSaveNotice((current: any) => {
        if (!current || current?.heartbeatId !== heartbeatSaveNotice.heartbeatId || current?.token !== heartbeatSaveNotice.token) {
          return current;
        }
        return null;
      });
    }, 2200);
    return () => window.clearTimeout(timeoutId);
  }, [heartbeatSaveNotice]);

  async function handleNewChat() {
    const createdSessionId = await onCreateChatSession({
      title: chatSessionTitleDraft || null,
      additionalModelInstructions: chatSessionAdditionalModelInstructionsDraft || null,
    });
    if (createdSessionId) {
      onOpenChat(createdSessionId);
    }
  }

  async function handleBatchDeleteArchivedChats() {
    if (!onBatchDeleteChats || archivedSelectionSummary.selectedCount === 0 || isBatchDeletingChats) {
      return;
    }
    const selectedChats = visibleArchivedChats.filter((session: any) =>
      selectedArchivedChatKeys.has(ArchivedChatSelection.getKey(session.agentId, session.sessionId)),
    );
    const result = await onBatchDeleteChats(selectedChats);
    const deletedKeys = Array.isArray(result?.deletedKeys) ? result.deletedKeys : [];
    if (deletedKeys.length > 0) {
      setSelectedArchivedChatKeys((current: Set<string>) => ArchivedChatSelection.clearKeys(current, deletedKeys));
    }
  }

  function handleHeartbeatDraftChange(heartbeatId: string, field: string, value: any) {
    setHeartbeatDraftsById((currentDrafts: Record<string, any>) => ({
      ...currentDrafts,
      [heartbeatId]: {
        ...(currentDrafts[heartbeatId] || createEmptyHeartbeatDraft()),
        [field]: value,
      },
    }));
  }

  function setHeartbeatFieldEditing(heartbeatId: string, field: string, isEditing: boolean) {
    setEditingHeartbeatFieldsById((currentFields: Record<string, Record<string, boolean>>) => {
      const nextFields = {
        ...(currentFields || {}),
      };
      const heartbeatFields = {
        ...(nextFields[heartbeatId] || {}),
      };
      if (isEditing) {
        heartbeatFields[field] = true;
        nextFields[heartbeatId] = heartbeatFields;
        return nextFields;
      }
      delete heartbeatFields[field];
      if (Object.keys(heartbeatFields).length > 0) {
        nextFields[heartbeatId] = heartbeatFields;
      } else {
        delete nextFields[heartbeatId];
      }
      return nextFields;
    });
  }

  function resetHeartbeatDraftField(heartbeatId: string, field: string, heartbeat: any) {
    const sourceDraft = createHeartbeatDraftFromHeartbeat(heartbeat) as Record<string, any>;
    setHeartbeatDraftsById((currentDrafts: Record<string, any>) => ({
      ...currentDrafts,
      [heartbeatId]: {
        ...(currentDrafts[heartbeatId] || sourceDraft),
        [field]: sourceDraft[field],
      },
    }));
  }

  function markHeartbeatSaved(heartbeatId: string, message: string = "Saved") {
    setHeartbeatSaveNotice({
      heartbeatId,
      message,
      token: Date.now(),
    });
  }

  async function handleSaveHeartbeat(heartbeatId: string, draftOverride: any = null) {
    if (!agent || !onUpdateHeartbeat) {
      return false;
    }
    const draft = draftOverride || heartbeatDraftsById[heartbeatId] || createEmptyHeartbeatDraft();
    setHeartbeatError("");
    setSavingHeartbeatId(heartbeatId);
    try {
      const didSave = await onUpdateHeartbeat(agent.id, heartbeatId, {
        ...draft,
        intervalMinutes: Number(draft.intervalMinutes),
      });
      if (didSave) {
        markHeartbeatSaved(heartbeatId);
      }
      return didSave;
    } finally {
      setSavingHeartbeatId("");
    }
  }

  async function handleHeartbeatFieldBlur(heartbeatId: string, field: string, heartbeat: any) {
    const draft = heartbeatDraftsById[heartbeatId] || createHeartbeatDraftFromHeartbeat(heartbeat);
    if (heartbeatDraftMatchesSource(draft, heartbeat)) {
      setHeartbeatFieldEditing(heartbeatId, field, false);
      return;
    }
    const didSave = await handleSaveHeartbeat(heartbeatId);
    if (didSave) {
      setHeartbeatFieldEditing(heartbeatId, field, false);
    }
  }

  async function handleHeartbeatEnabledChange(heartbeatId: string, heartbeat: any, nextEnabled: boolean) {
    const nextDraft = {
      ...(heartbeatDraftsById[heartbeatId] || createHeartbeatDraftFromHeartbeat(heartbeat)),
      enabled: nextEnabled,
    };
    handleHeartbeatDraftChange(heartbeatId, "enabled", nextEnabled);
    if (heartbeatDraftMatchesSource(nextDraft, heartbeat)) {
      return;
    }
    const didSave = await handleSaveHeartbeat(heartbeatId, nextDraft);
    return didSave;
  }

  function handleHeartbeatFieldKeyDown(event: any, heartbeatId: string, field: string, heartbeat: any) {
    if (event.key === "Escape") {
      event.preventDefault();
      resetHeartbeatDraftField(heartbeatId, field, heartbeat);
      setHeartbeatFieldEditing(heartbeatId, field, false);
      event.currentTarget.blur();
      return;
    }
    if (event.key === "Enter" && event.currentTarget.tagName !== "TEXTAREA") {
      event.preventDefault();
      event.currentTarget.blur();
      return;
    }
    if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      event.currentTarget.blur();
    }
  }

  async function handleCreateHeartbeat() {
    if (!agent || !onCreateHeartbeat) {
      return false;
    }
    setHeartbeatError("");
    setSavingHeartbeatId("new");
    try {
      const didCreate = await onCreateHeartbeat(agent.id, {
        ...newHeartbeatDraft,
        intervalMinutes: Number(newHeartbeatDraft.intervalMinutes),
      });
      if (didCreate) {
        setNewHeartbeatDraft(createEmptyHeartbeatDraft());
        setIsHeartbeatComposerOpen(false);
      }
      return didCreate;
    } finally {
      setSavingHeartbeatId("");
    }
  }

  async function handleDeleteHeartbeat(heartbeatId: string) {
    if (!agent || !onDeleteHeartbeat) {
      return false;
    }
    setHeartbeatError("");
    setDeletingHeartbeatId(heartbeatId);
    try {
      return await onDeleteHeartbeat(agent.id, heartbeatId);
    } finally {
      setDeletingHeartbeatId("");
    }
  }

  async function handleScheduleHeartbeatNow(heartbeatId: string) {
    if (!agent || !onScheduleHeartbeatNow) {
      return false;
    }
    setHeartbeatError("");
    setSchedulingHeartbeatId(heartbeatId);
    try {
      const didSchedule = await onScheduleHeartbeatNow(agent.id, heartbeatId);
      if (didSchedule) {
        markHeartbeatSaved(heartbeatId, "Scheduled");
      }
      return didSchedule;
    } finally {
      setSchedulingHeartbeatId("");
    }
  }

  const resolvedActiveTab = activeTab === "chats" ? "chats" : activeTab === "heartbeats" ? "heartbeats" : "overview";
  const detailTabs = [
    { id: "overview", label: "Overview" },
    { id: "chats", label: "Chats" },
    { id: "heartbeats", label: "Heartbeats" },
  ];

  return (
    <Page><div className="page-stack">
      {!agent ? (
        <section className="panel">
          <p className="empty-hint">Agent not found.</p>
        </section>
      ) : null}

      {agent && agentSummary ? (
        <>
          <section className="panel">
            <div className="task-view-tabs" role="tablist" aria-label="Agent detail views">
              {detailTabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={resolvedActiveTab === tab.id}
                  className={`task-view-tab${resolvedActiveTab === tab.id ? " task-view-tab-active" : ""}`}
                  onClick={() => onSelectTab?.(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </section>

          {resolvedActiveTab === "overview" ? (
            <>
              <section className="panel role-detail-hero">
                <div className="role-detail-hero-title-row">
                  <h1 className="role-detail-hero-title">{agent.name}</h1>
                </div>

                <div className="agent-detail-hero-runner">
                  <span className="agent-detail-hero-runner-label">Runner</span>
                  <span className="agent-detail-hero-runner-value">{agentSummary.assignedRunnerLabel}</span>
                </div>

                <div className="role-detail-stats agent-detail-overview-stats">
                  <div className="role-detail-stat">
                    <p className="role-detail-stat-value">{agentSummary.modelLabel}</p>
                    <p className="role-detail-stat-label">Model</p>
                  </div>
                  <div className="role-detail-stat">
                    <p className="role-detail-stat-value">{agentSummary.reasoningLabel}</p>
                    <p className="role-detail-stat-label">Reasoning</p>
                  </div>
                  <div className="role-detail-stat">
                    <p className="role-detail-stat-value">{agentSummary.assignedRoles.length}</p>
                    <p className="role-detail-stat-label">Roles</p>
                  </div>
                  <div className="role-detail-stat">
                    <p className="role-detail-stat-value">{agentSummary.chatCount}</p>
                    <p className="role-detail-stat-label">Chats</p>
                  </div>
                  <div className="role-detail-stat role-detail-stat-action">
                    <div className="agent-detail-api-card-copy">
                      <p className="role-detail-stat-value">API</p>
                      <p className="role-detail-stat-label">Swagger docs</p>
                      <p className="agent-detail-api-card-hint">
                        Inspect endpoints, auth, and schemas in Swagger UI.
                      </p>
                    </div>
                    <a
                      className="agent-detail-api-link"
                      href={agentApiDocsUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open Swagger UI
                      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                        <path d="M7 17L17 7" />
                        <path d="M9 7h8v8" />
                      </svg>
                    </a>
                  </div>
                </div>
              </section>

              <div className="role-detail-column">
                <div className="role-detail-card">
                  <div className="role-detail-card-header">
                    <svg viewBox="0 0 24 24"><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" /></svg>
                    <h3>Configuration</h3>
                  </div>
                  <AgentEditorForm
                    agent={agent}
                    agentRunners={agentRunners || []}
                    roles={roles || []}
                    skills={skills || []}
                    mcpServers={mcpServers || []}
                    roleMcpServerIdsByRoleId={roleMcpServerIdsByRoleId || {}}
                    runnerCodexModelEntriesById={runnerCodexModelEntriesById || {}}
                    agentDraft={agentDrafts?.[agent.id]}
                    savingAgentId={savingAgentId}
                    deletingAgentId={deletingAgentId}
                    initializingAgentId={initializingAgentId}
                    onAgentDraftChange={onAgentDraftChange}
                    onSaveAgent={onSaveAgent}
                    onEnsureAgentEditorData={onEnsureAgentEditorData}
                    saveButtonLabel="Save agent"
                  />
                </div>
              </div>
            </>
          ) : null}

          {resolvedActiveTab === "chats" ? (
            <div className="role-detail-column">
              <div className="role-detail-card">
                <div className="role-detail-card-header">
                  <svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                  <h3>Chats</h3>
                  <span className="role-detail-card-count">{chatCountLabel}</span>
                </div>

                {chatError ? <p className="error-banner" style={{ marginBottom: "0.5rem" }}>Chat error: {chatError}</p> : null}

                <div className="agent-detail-chat-toolbar">
                  <ChatListStatusToggle
                    value={normalizedChatListStatusFilter}
                    onChange={onChatListStatusFilterChange}
                  />
                  {canShowCreateChatActions ? (
                    <button
                      type="button"
                      className="agent-detail-chat-new"
                      onClick={() => !isCreateChatDisabled && handleNewChat()}
                      disabled={isCreateChatDisabled}
                      title={resolvedCreateChatDisabledReason || "Start a new chat"}
                      style={{ flex: 1 }}
                    >
                      <svg viewBox="0 0 24 24" aria-hidden="true"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                      New chat
                    </button>
                  ) : null}
                  {canShowCreateChatActions ? (
                    <button
                      type="button"
                      className="agent-detail-chat-settings-btn"
                      onClick={() => setIsCreateSettingsOpen(true)}
                      disabled={isCreateChatDisabled}
                      aria-label="Chat settings"
                      title="Chat settings"
                    >
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <circle cx="12" cy="12" r="3" />
                        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                      </svg>
                    </button>
                  ) : null}
                </div>
                {normalizedChatListStatusFilter === "archived" ? (
                  <div className="archived-chat-selection-toolbar">
                    <label className="archived-chat-selection-toggle">
                      <input
                        type="checkbox"
                        aria-label="Select all archived chats"
                        checked={archivedSelectionSummary.allVisibleSelected}
                        onChange={(event: any) =>
                          setSelectedArchivedChatKeys((current: Set<string>) =>
                            ArchivedChatSelection.setAll(current, visibleArchivedChatKeys, event.target.checked),
                          )
                        }
                        disabled={visibleArchivedChatKeys.length === 0 || isBatchDeletingChats}
                      />
                      <span>{`${archivedSelectionSummary.selectedCount} selected`}</span>
                    </label>
                    <div className="archived-chat-selection-actions">
                      <button
                        type="button"
                        className="secondary-btn"
                        onClick={() => setSelectedArchivedChatKeys(new Set())}
                        disabled={archivedSelectionSummary.selectedCount === 0 || isBatchDeletingChats}
                      >
                        Deselect all
                      </button>
                      <button
                        type="button"
                        className="danger-btn"
                        onClick={handleBatchDeleteArchivedChats}
                        disabled={archivedSelectionSummary.selectedCount === 0 || isBatchDeletingChats}
                      >
                        Delete selected
                      </button>
                    </div>
                  </div>
                ) : null}

                {isLoadingChatSessions ? <p className="empty-hint" style={{ marginTop: "0.5rem" }}>Loading chats...</p> : null}
                {!isLoadingChatSessions && chatSessions.length === 0 ? (
                  <p className="empty-hint" style={{ marginTop: "0.5rem" }}>No chats yet.</p>
                ) : null}

                {chatSessions.length > 0 ? (
                  <div style={{ marginTop: "0.5rem", display: "flex", flexDirection: "column", gap: "0.15rem" }}>
                    {chatSessions.map((session: any) => {
                      const isRunning = isChatSessionRunning(session, chatSessionRunningById);
                      const sessionStatus = String(session?.status || "").trim().toLowerCase();
                      const isArchived = sessionStatus === "archived";
                      const isArchiving = sessionStatus === "archiving";
                      const isError = sessionStatus === "error";
                      const isDeletingSession = sessionStatus === "deleting";
                      const isPendingSession = sessionStatus === "pending";
                      const threadErrorMessage = String(session?.errorMessage || "").trim();
                      const chatSessionKey = `${agent.id}:${session.id}`;
                      const archivedSelectionKey = ArchivedChatSelection.getKey(agent.id, session.id);
                      const isArchivingChat = archivingChatSessionKey === chatSessionKey || isArchiving;
                      const isDeletingChat = deletingChatSessionKey === chatSessionKey || isDeletingSession;
                      const showDeleteAction = normalizedChatListStatusFilter === "archived" || isArchived;
                      const actionLabel = showDeleteAction
                        ? isDeletingChat
                          ? "Deleting..."
                          : "Delete permanently"
                        : isArchivingChat
                          ? "Archiving..."
                          : "Archive chat";
                      const modelLabel = String(session?.currentModelName || session?.currentModelId || "").trim() || "n/a";
                      const reasoningLabel = String(session?.currentReasoningLevel || "").trim() || "n/a";
                      return (
                        <div
                          key={`agent-session-${session.id}`}
                          className="agent-detail-chat-item"
                          onClick={() => !isDeletingChat && onOpenChat(session.id)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(event: any) => {
                            if (event.key === "Enter" && !isDeletingChat) {
                              onOpenChat(session.id);
                            }
                          }}
                        >
                          {normalizedChatListStatusFilter === "archived" && isArchived ? (
                            <div
                              className="archived-chat-row-checkbox"
                              onClick={(event: any) => event.stopPropagation()}
                              onKeyDown={(event: any) => event.stopPropagation()}
                            >
                              <input
                                type="checkbox"
                                aria-label={`Select archived chat ${session.title || "Untitled chat"}`}
                                checked={selectedArchivedChatKeys.has(archivedSelectionKey)}
                                onChange={(event: any) =>
                                  setSelectedArchivedChatKeys((current: Set<string>) =>
                                    ArchivedChatSelection.toggle(
                                      current,
                                      archivedSelectionKey,
                                      event.target.checked,
                                    ),
                                  )
                                }
                                disabled={isDeletingChat || isBatchDeletingChats}
                              />
                            </div>
                          ) : null}
                          <div className="agent-detail-chat-item-main">
                            <p className="agent-detail-chat-item-title">
                              {isRunning ? <ChatSessionRunningBadge /> : null} {session.title || "Untitled chat"}
                              {!isRunning && isPendingSession ? (
                                <span className="chat-thread-status chat-thread-status-pending">pending</span>
                              ) : null}
                              {!isRunning && isDeletingSession ? (
                                <span className="chat-thread-status chat-thread-status-deleting">deleting</span>
                              ) : null}
                              {!isRunning && isArchiving ? (
                                <span className="chat-thread-status chat-thread-status-deleting">archiving</span>
                              ) : null}
                              {!isRunning && isArchived ? (
                                <span className="chat-thread-status chat-thread-status-archived">archived</span>
                              ) : null}
                              {isError ? <span className="chat-thread-status chat-thread-status-error">error</span> : null}
                            </p>
                            <p className="agent-detail-chat-item-meta">
                              {isArchived && session?.archivedAt
                                ? `Archived ${formatTimestamp(session.archivedAt)}`
                                : formatTimestamp(session.updatedAt)} · {modelLabel} · {reasoningLabel}
                            </p>
                            <ThreadTaskSummary
                              tasks={session?.tasks}
                              threadTitle={session?.title}
                              modalId={`agent-chats-${agent.id}-${session.id}`}
                            />
                            {isError && threadErrorMessage ? (
                              <p className="chat-thread-error-text">{threadErrorMessage}</p>
                            ) : null}
                          </div>
                          <div className="agent-detail-chat-item-actions">
                            <button
                              type="button"
                              className={`chat-card-icon-btn${showDeleteAction ? " chat-card-icon-btn-danger" : ""}`}
                              onClick={(event: any) => {
                                event.stopPropagation();
                                const payload = {
                                  agentId: agent.id,
                                  sessionId: session.id,
                                  title: session.title,
                                };
                                if (showDeleteAction) {
                                  onDeleteChat(payload);
                                  return;
                                }
                                onArchiveChat(payload);
                              }}
                              disabled={isDeletingChat || isArchivingChat}
                              aria-label={actionLabel}
                              title={actionLabel}
                            >
                              {showDeleteAction ? (
                                <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                                  <path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                                </svg>
                              ) : (
                                <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                                  <path d="M3 7h18" />
                                  <path d="M5 7v11a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7" />
                                  <path d="M9 11h6" />
                                  <path d="M12 7V4" />
                                </svg>
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}

          {resolvedActiveTab === "heartbeats" ? (
            <div className="role-detail-column">
              <div className="role-detail-card role-detail-card-muted">
                <div className="role-detail-card-header">
                  <svg viewBox="0 0 24 24"><path d="M12 8v4l3 3" /><circle cx="12" cy="12" r="9" /></svg>
                  <h3>Heartbeat schedules</h3>
                  <span className="role-detail-card-count">{agentSummary.heartbeatCount}</span>
                </div>
                {heartbeatError || resolvedAgentError ? (
                  <p className="error-banner" style={{ marginBottom: "0.75rem" }}>
                    {heartbeatError || resolvedAgentError}
                  </p>
                ) : null}
                {Array.isArray(agent.heartbeats) && agent.heartbeats.length > 0 ? (
                  <div style={{ display: "grid", gap: "0.9rem" }}>
                    {agent.heartbeats.map((heartbeat: any) => {
                      const heartbeatId = String(heartbeat?.id || "").trim();
                      const draft = heartbeatDraftsById[heartbeatId] || createHeartbeatDraftFromHeartbeat(heartbeat);
                      const isHeartbeatSaving = savingHeartbeatId === heartbeatId || savingAgentId === agent.id;
                      const isHeartbeatDeleting = deletingHeartbeatId === heartbeatId || savingAgentId === agent.id;
                      const isHeartbeatScheduling = schedulingHeartbeatId === heartbeatId;
                      const isNameEditing = Boolean(editingHeartbeatFieldsById?.[heartbeatId]?.name);
                      const isPromptEditing = Boolean(editingHeartbeatFieldsById?.[heartbeatId]?.prompt);
                      const isIntervalEditing = Boolean(editingHeartbeatFieldsById?.[heartbeatId]?.intervalMinutes);
                      return (
                        <div
                          key={heartbeatId}
                          style={{
                            border: "1px solid rgba(148, 163, 184, 0.18)",
                            borderRadius: "1rem",
                            padding: "0.95rem",
                            display: "grid",
                            gap: "0.75rem",
                          }}
                        >
                          <div className="heartbeat-field">
                            <label htmlFor={`heartbeat-name-${heartbeatId}`}>Name</label>
                            {isNameEditing ? (
                              <input
                                id={`heartbeat-name-${heartbeatId}`}
                                className="heartbeat-field-input"
                                type="text"
                                value={draft.name}
                                onChange={(event: any) => handleHeartbeatDraftChange(heartbeatId, "name", event.target.value)}
                                onBlur={() => void handleHeartbeatFieldBlur(heartbeatId, "name", heartbeat)}
                                onKeyDown={(event: any) => handleHeartbeatFieldKeyDown(event, heartbeatId, "name", heartbeat)}
                                disabled={isHeartbeatSaving}
                                autoFocus
                              />
                            ) : (
                              <button
                                type="button"
                                className="heartbeat-field-display"
                                onClick={() => setHeartbeatFieldEditing(heartbeatId, "name", true)}
                                disabled={isHeartbeatSaving}
                                aria-label="Edit Name"
                                title="Edit"
                              >
                                <span className="heartbeat-field-display-text">
                                  {draft.name || "Untitled heartbeat"}
                                </span>
                                <span className="heartbeat-field-display-icon" aria-hidden="true">
                                  {renderPencilIcon()}
                                </span>
                              </button>
                            )}
                          </div>
                          <div className="heartbeat-field">
                            <label htmlFor={`heartbeat-prompt-${heartbeatId}`}>Prompt</label>
                            {isPromptEditing ? (
                              <textarea
                                id={`heartbeat-prompt-${heartbeatId}`}
                                className="heartbeat-field-input heartbeat-field-textarea"
                                rows={4}
                                value={draft.prompt}
                                onChange={(event: any) => handleHeartbeatDraftChange(heartbeatId, "prompt", event.target.value)}
                                onBlur={() => void handleHeartbeatFieldBlur(heartbeatId, "prompt", heartbeat)}
                                onKeyDown={(event: any) => handleHeartbeatFieldKeyDown(event, heartbeatId, "prompt", heartbeat)}
                                disabled={isHeartbeatSaving}
                                autoFocus
                              />
                            ) : (
                              <button
                                type="button"
                                className="heartbeat-field-display heartbeat-field-display-multiline"
                                onClick={() => setHeartbeatFieldEditing(heartbeatId, "prompt", true)}
                                disabled={isHeartbeatSaving}
                                aria-label="Edit Prompt"
                                title="Edit"
                              >
                                <span className="heartbeat-field-display-text">
                                  {draft.prompt || "No prompt configured"}
                                </span>
                                <span className="heartbeat-field-display-icon" aria-hidden="true">
                                  {renderPencilIcon()}
                                </span>
                              </button>
                            )}
                          </div>
                          <div style={{ display: "grid", gap: "0.45rem", gridTemplateColumns: "minmax(0, 11rem) minmax(0, 1fr)", alignItems: "end" }}>
                            <div className="heartbeat-field">
                              <label htmlFor={`heartbeat-interval-${heartbeatId}`}>Interval (min)</label>
                              {isIntervalEditing ? (
                                <input
                                  id={`heartbeat-interval-${heartbeatId}`}
                                  className="heartbeat-field-input"
                                  type="number"
                                  min="1"
                                  value={draft.intervalMinutes}
                                  onChange={(event: any) => handleHeartbeatDraftChange(heartbeatId, "intervalMinutes", event.target.value)}
                                  onBlur={() => void handleHeartbeatFieldBlur(heartbeatId, "intervalMinutes", heartbeat)}
                                  onKeyDown={(event: any) => handleHeartbeatFieldKeyDown(event, heartbeatId, "intervalMinutes", heartbeat)}
                                  disabled={isHeartbeatSaving}
                                  autoFocus
                                />
                              ) : (
                                <button
                                  type="button"
                                  className="heartbeat-field-display"
                                  onClick={() => setHeartbeatFieldEditing(heartbeatId, "intervalMinutes", true)}
                                  disabled={isHeartbeatSaving}
                                  aria-label="Edit Interval"
                                  title="Edit"
                                >
                                  <span className="heartbeat-field-display-text">
                                    {draft.intervalMinutes || "Not set"}
                                  </span>
                                  <span className="heartbeat-field-display-icon" aria-hidden="true">
                                    {renderPencilIcon()}
                                  </span>
                                </button>
                              )}
                            </div>
                            <div className="heartbeat-field">
                              <span>Enabled</span>
                                <button
                                  type="button"
                                  className={`heartbeat-toggle${draft.enabled !== false ? " heartbeat-toggle-active" : ""}`}
                                  onClick={() => void handleHeartbeatEnabledChange(heartbeatId, heartbeat, draft.enabled === false)}
                                  disabled={isHeartbeatSaving}
                                  aria-label={draft.enabled !== false ? "Disable heartbeat" : "Enable heartbeat"}
                                  aria-pressed={draft.enabled !== false}
                                >
                                  <span className="heartbeat-toggle-copy">
                                    {draft.enabled !== false ? "Enabled" : "Paused"}
                                  </span>
                                  <span className="heartbeat-toggle-track" aria-hidden="true">
                                    <span className="heartbeat-toggle-thumb" />
                                  </span>
                                </button>
                            </div>
                          </div>
                          <div className="task-overview-field"><span className="task-overview-field-label">Next scheduled</span><span>{formatTimestamp(heartbeat?.nextHeartbeatAt) || "Not scheduled"}</span></div>
                          <div className="task-overview-field"><span className="task-overview-field-label">Last sent</span><span>{formatTimestamp(heartbeat?.lastSentAt) || "Never"}</span></div>
                          <div className="task-form-actions">
                            {isHeartbeatSaving ? (
                              <span className="heartbeat-save-notice" role="status" aria-live="polite">Saving...</span>
                            ) : null}
                            {isHeartbeatScheduling ? (
                              <span className="heartbeat-save-notice" role="status" aria-live="polite">Scheduling...</span>
                            ) : null}
                            {heartbeatSaveNotice?.heartbeatId === heartbeatId ? (
                              <span className="heartbeat-save-notice" role="status" aria-live="polite">
                                {heartbeatSaveNotice?.message || "Saved"}
                              </span>
                            ) : null}
                            <button
                              type="button"
                              className="secondary-btn"
                              onClick={() => void handleScheduleHeartbeatNow(heartbeatId)}
                              disabled={isHeartbeatScheduling || isHeartbeatSaving || isHeartbeatDeleting || !onScheduleHeartbeatNow}
                            >
                              Schedule now
                            </button>
                            {String(heartbeat?.threadId || "").trim() ? (
                              <button
                                type="button"
                                className="secondary-btn"
                                onClick={() => onOpenChat(String(heartbeat.threadId))}
                              >
                                Open thread
                              </button>
                            ) : (
                              <span className="task-overview-field-label">No linked thread yet</span>
                            )}
                            <button
                              type="button"
                              className="danger-btn"
                              onClick={() => void handleDeleteHeartbeat(heartbeatId)}
                              disabled={isHeartbeatDeleting}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="role-detail-empty">No heartbeat schedules configured</div>
                )}
                {isHeartbeatComposerOpen ? (
                  <div style={{ marginTop: "0.9rem", borderTop: "1px solid rgba(148, 163, 184, 0.16)", paddingTop: "0.9rem", display: "grid", gap: "0.75rem" }}>
                    <div style={{ display: "grid", gap: "0.45rem" }}>
                      <label htmlFor="new-heartbeat-name">Name</label>
                      <input
                        id="new-heartbeat-name"
                        className="heartbeat-field-input"
                        type="text"
                        value={newHeartbeatDraft.name}
                        onChange={(event: any) => setNewHeartbeatDraft((current: any) => ({ ...current, name: event.target.value }))}
                      />
                    </div>
                    <div style={{ display: "grid", gap: "0.45rem" }}>
                      <label htmlFor="new-heartbeat-prompt">Prompt</label>
                      <textarea
                        id="new-heartbeat-prompt"
                        className="heartbeat-field-input heartbeat-field-textarea"
                        rows={4}
                        value={newHeartbeatDraft.prompt}
                        onChange={(event: any) => setNewHeartbeatDraft((current: any) => ({ ...current, prompt: event.target.value }))}
                      />
                    </div>
                    <div style={{ display: "grid", gap: "0.45rem", gridTemplateColumns: "minmax(0, 11rem) minmax(0, 1fr)", alignItems: "end" }}>
                      <div style={{ display: "grid", gap: "0.45rem" }}>
                        <label htmlFor="new-heartbeat-interval">Interval (min)</label>
                        <input
                          id="new-heartbeat-interval"
                          className="heartbeat-field-input"
                          type="number"
                          min="1"
                          value={newHeartbeatDraft.intervalMinutes}
                          onChange={(event: any) => setNewHeartbeatDraft((current: any) => ({ ...current, intervalMinutes: event.target.value }))}
                        />
                      </div>
                      <label style={{ display: "inline-flex", gap: "0.5rem", alignItems: "center", marginBottom: "0.35rem" }}>
                        <input
                          type="checkbox"
                          checked={newHeartbeatDraft.enabled !== false}
                          onChange={(event: any) => setNewHeartbeatDraft((current: any) => ({ ...current, enabled: event.target.checked }))}
                        />
                        <span>Enabled</span>
                      </label>
                    </div>
                    <div className="task-form-actions">
                      <button
                        type="button"
                        className="secondary-btn"
                        onClick={() => void handleCreateHeartbeat()}
                        disabled={savingHeartbeatId === "new" || savingAgentId === agent.id}
                      >
                        Create heartbeat
                      </button>
                      <button
                        type="button"
                        className="secondary-btn"
                        onClick={() => {
                          setIsHeartbeatComposerOpen(false);
                          setNewHeartbeatDraft(createEmptyHeartbeatDraft());
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="task-form-actions" style={{ marginTop: "0.9rem" }}>
                    <button
                      type="button"
                      className="secondary-btn"
                      onClick={() => setIsHeartbeatComposerOpen(true)}
                    >
                      Add heartbeat
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : null}

          <CreationModal
            modalId="create-chat-settings-modal"
            title="New Chat Settings"
            description="Set optional title and instructions before starting."
            isOpen={isCreateSettingsOpen}
            onClose={() => setIsCreateSettingsOpen(false)}
          >
            <div className="chat-settings-modal-form">
              <div className="chat-settings-field">
                <label htmlFor="create-chat-title" className="chat-settings-label">Title</label>
                <input
                  id="create-chat-title"
                  className="chat-settings-input"
                  value={chatSessionTitleDraft}
                  onChange={(event: any) => onChatSessionTitleDraftChange(event.target.value)}
                  placeholder="e.g. Release planning"
                  disabled={isCreateChatDisabled}
                />
              </div>
              <div className="chat-settings-field">
                <label htmlFor="create-chat-instructions" className="chat-settings-label">
                  Additional instructions
                </label>
                <textarea
                  id="create-chat-instructions"
                  className="chat-settings-input chat-settings-textarea"
                  value={chatSessionAdditionalModelInstructionsDraft}
                  onChange={(event: any) =>
                    onChatSessionAdditionalModelInstructionsDraftChange(event.target.value)
                  }
                  placeholder={agent?.defaultAdditionalModelInstructions || "Optional. Leave blank for agent defaults."}
                  rows={4}
                  disabled={isCreateChatDisabled}
                />
              </div>
              <div className="chat-settings-actions">
                <button
                  type="button"
                  onClick={() => setIsCreateSettingsOpen(false)}
                >
                  Done
                </button>
              </div>
            </div>
          </CreationModal>
        </>
      ) : null}
    </div></Page>
  );
}
