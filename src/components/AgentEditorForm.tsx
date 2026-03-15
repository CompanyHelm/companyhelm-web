import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
  type ChangeEvent,
  type FormEvent,
  type KeyboardEvent,
  type MouseEvent,
} from "react";
import { createPortal } from "react-dom";
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
  AgentRunner,
  McpServer,
  Role,
  RunnerCodexModelEntriesById,
  Skill,
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

function renderPencilIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
    </svg>
  );
}

function summarizeInstructions(value: string) {
  const normalizedValue = String(value || "").trim();
  if (!normalizedValue) {
    return "No default instructions";
  }
  if (normalizedValue.length <= 160) {
    return normalizedValue;
  }
  return `${normalizedValue.slice(0, 157)}...`;
}

export type AgentDraftField = keyof AgentDraft;

interface AgentEditorFormProps {
  agent: Agent;
  agentRunners: AgentRunner[];
  roles: Role[];
  skills: Skill[];
  mcpServers: McpServer[];
  roleMcpServerIdsByRoleId: StringArrayById;
  runnerCodexModelEntriesById: RunnerCodexModelEntriesById;
  agentDraft: AgentDraft | null | undefined;
  savingAgentId: string | null;
  deletingAgentId: string | null;
  initializingAgentId: string | null;
  onAgentDraftChange: (agentId: string, field: AgentDraftField, value: string | string[]) => void;
  onSaveAgent: (agentId: string) => Promise<boolean> | boolean;
  onEnsureAgentEditorData: () => Promise<void> | void;
  saveButtonLabel?: string;
  onCancel?: (() => void) | null;
  cancelButtonLabel?: string;
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

export function AgentEditorForm({
  agent,
  agentRunners,
  roles,
  skills,
  mcpServers,
  roleMcpServerIdsByRoleId,
  runnerCodexModelEntriesById,
  agentDraft,
  savingAgentId,
  deletingAgentId,
  initializingAgentId,
  onAgentDraftChange,
  onSaveAgent,
  onEnsureAgentEditorData,
  saveButtonLabel = "Save changes",
  onCancel = null,
  cancelButtonLabel = "Cancel",
}: AgentEditorFormProps) {
  const [editingSectionById, setEditingSectionById] = useState<Record<string, boolean>>({});
  const [isInstructionsFullscreen, setIsInstructionsFullscreen] = useState(false);
  const editingDraft = {
    ...EMPTY_AGENT_DRAFT,
    ...(agentDraft || {}),
  };

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

  const editingRoleIds = normalizeUniqueStringList(editingDraft.roleIds);
  const editingSkillIds = normalizeUniqueStringList(editingDraft.skillIds);
  const editingMcpServerIds = normalizeUniqueStringList(editingDraft.mcpServerIds);
  const editingAvailableRoles = roles.filter((role) => !editingRoleIds.includes(role.id));
  const editingAvailableSkills = skills.filter((skill) => !editingSkillIds.includes(skill.id));
  const editingAvailableMcpServers = mcpServers.filter((mcpServer) => !editingMcpServerIds.includes(mcpServer.id));

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

  const expandedRoleIds = useMemo(
    () => collectRoleAndSubroleIds(editingRoleIds, roleChildrenByParentId),
    [editingRoleIds, roleChildrenByParentId],
  );
  const effectiveMcpServerIds = useMemo(
    () => resolveEffectiveRoleMcpServerIds(expandedRoleIds, roleMcpServerIdsByRoleId),
    [expandedRoleIds, roleMcpServerIdsByRoleId],
  );
  const effectiveSkills = useMemo(
    () => resolveEffectiveRoleSkills(expandedRoleIds, roleLookup),
    [expandedRoleIds, roleLookup],
  );
  const runnerCodexModelEntries = getRunnerCodexModelEntriesForRunner(
    runnerCodexModelEntriesById,
    editingDraft.agentRunnerId,
  );
  const runnerSdkAvailabilityByName = useMemo(() => {
    if (!editingDraft.agentRunnerId) {
      return new Map<string, "available" | "unavailable">();
    }
    const selectedRunner = agentRunners.find((runner) => runner.id === editingDraft.agentRunnerId) || null;
    const sdkEntries = selectedRunner ? normalizeRunnerAvailableAgentSdks(selectedRunner) : [];
    return sdkEntries.reduce((map, sdkEntry) => {
      map.set(sdkEntry.name, sdkEntry.isAvailable && sdkEntry.status === "ready" ? "available" : "unavailable");
      return map;
    }, new Map<string, "available" | "unavailable">());
  }, [agentRunners, editingDraft.agentRunnerId]);
  const runnerReasoningLevels = getRunnerReasoningLevels(runnerCodexModelEntries, editingDraft.model);
  const missingModelOption = useMemo(() => {
    if (!editingDraft.model) {
      return "";
    }
    return runnerCodexModelEntries.some((modelEntry) => modelEntry.name === editingDraft.model)
      ? ""
      : editingDraft.model;
  }, [editingDraft.model, runnerCodexModelEntries]);

  const directRoles = editingRoleIds.map((roleId) => ({
    id: roleId,
    name: roleLookup.get(roleId)?.name || "Unknown role",
  }));
  const directSkills = editingSkillIds.map((skillId) => ({
    id: skillId,
    name: skillLookup.get(skillId)?.name || "Unknown skill",
  }));
  const directMcpServers = editingMcpServerIds.map((mcpServerId) => ({
    id: mcpServerId,
    name: mcpServerLookup.get(mcpServerId)?.name || "Unknown MCP server",
  }));
  const resolvedEffectiveMcpServers = effectiveMcpServerIds.map((mcpServerId) => ({
    id: mcpServerId,
    name: mcpServerLookup.get(mcpServerId)?.name || "Unknown MCP server",
  }));

  const isEditingAgentSaving = savingAgentId === agent.id;
  const isEditingAgentDeleting = deletingAgentId === agent.id;
  const isEditingAgentInitializing = initializingAgentId === agent.id;
  const isEditingDisabled = isEditingAgentSaving || isEditingAgentDeleting || isEditingAgentInitializing;

  useEffect(() => {
    void onEnsureAgentEditorData();
  }, [onEnsureAgentEditorData]);

  useEffect(() => {
    setEditingSectionById({});
    setIsInstructionsFullscreen(false);
  }, [agent.id]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onSaveAgent(agent.id);
  }

  function handleInstructionsChange(value: string) {
    onAgentDraftChange(agent.id, "defaultAdditionalModelInstructions", value);
  }

  function setSectionEditing(sectionId: string, isEditing: boolean) {
    setEditingSectionById((current) => {
      const next = { ...current };
      if (isEditing) {
        next[sectionId] = true;
      } else {
        delete next[sectionId];
      }
      return next;
    });
  }

  function renderSectionShell({
    sectionId,
    label,
    children,
    editable = true,
  }: {
    sectionId: string;
    label: string;
    children: ReactNode;
    editable?: boolean;
  }) {
    const isEditing = Boolean(editingSectionById[sectionId]);
    return (
      <div className="agent-config-section">
        <div className="agent-config-section-header">
          <span className="task-overview-field-label">{label}</span>
          {editable ? (
            <button
              type="button"
              className="agent-config-edit-toggle"
              onClick={() => setSectionEditing(sectionId, !isEditing)}
              disabled={isEditingDisabled}
              aria-label={`${isEditing ? "Finish editing" : "Edit"} ${label}`}
              title={isEditing ? "Done" : "Edit"}
            >
              {renderPencilIcon()}
            </button>
          ) : null}
        </div>
        {children}
      </div>
    );
  }

  const fullscreenEditor = isInstructionsFullscreen && typeof document !== "undefined"
    ? createPortal(
      <div
        className="edit-agent-instructions-fullscreen-overlay"
        role="presentation"
        onClick={() => setIsInstructionsFullscreen(false)}
      >
        <section
          className="panel edit-agent-instructions-fullscreen-card"
          role="dialog"
          aria-modal="true"
          aria-labelledby={`edit-agent-instructions-fullscreen-title-${agent.id}`}
          onClick={(event: MouseEvent<HTMLElement>) => event.stopPropagation()}
          onKeyDown={(event: KeyboardEvent<HTMLElement>) => {
            if (event.key === "Escape") {
              event.stopPropagation();
              setIsInstructionsFullscreen(false);
            }
          }}
        >
          <header className="edit-agent-instructions-fullscreen-header">
            <h3 id={`edit-agent-instructions-fullscreen-title-${agent.id}`}>
              Default additional model instructions
            </h3>
            <button
              type="button"
              className="secondary-btn"
              onClick={() => setIsInstructionsFullscreen(false)}
            >
              Done
            </button>
          </header>
          <textarea
            className="edit-agent-instructions-textarea edit-agent-instructions-textarea-fullscreen"
            value={editingDraft.defaultAdditionalModelInstructions || ""}
            onChange={(event: ChangeEvent<HTMLTextAreaElement>) => handleInstructionsChange(event.target.value)}
            placeholder="Optional. Applied to new chats unless thread-specific instructions are provided."
            disabled={isEditingDisabled}
            autoFocus
          />
        </section>
      </div>,
      document.body,
    )
    : null;

  return (
    <>
      <form className="task-form" onSubmit={handleSubmit}>
        <div className="agent-config-layout">
          {renderSectionShell({
            sectionId: "name",
            label: "Name",
            children: editingSectionById.name ? (
              <div className="agent-config-inline-edit">
                <input
                  id={`edit-agent-name-${agent.id}`}
                  value={editingDraft.name}
                  onChange={(event: ChangeEvent<HTMLInputElement>) =>
                    onAgentDraftChange(agent.id, "name", event.target.value)
                  }
                  disabled={isEditingDisabled}
                />
              </div>
            ) : (
              <p className="agent-config-value">{editingDraft.name || "Unnamed agent"}</p>
            ),
          })}

          {renderSectionShell({
            sectionId: "runner",
            label: "Runner",
            children: editingSectionById.runner ? (
              <div className="agent-config-inline-edit">
                <select
                  id={`edit-agent-runner-${agent.id}`}
                  value={editingDraft.agentRunnerId}
                  onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                    onAgentDraftChange(agent.id, "agentRunnerId", event.target.value)
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
              </div>
            ) : (
              <p className="agent-config-value">
                {(() => {
                  if (!editingDraft.agentRunnerId) {
                    return "Unassigned";
                  }
                  const selectedRunner = agentRunners.find((runner) => runner.id === editingDraft.agentRunnerId);
                  return selectedRunner ? formatRunnerLabel(selectedRunner) : editingDraft.agentRunnerId;
                })()}
              </p>
            ),
          })}

          {renderSectionShell({
            sectionId: "sdk",
            label: "SDK",
            children: editingSectionById.sdk ? (
              <div className="agent-config-inline-edit">
                <select
                  id={`edit-agent-sdk-${agent.id}`}
                  value={editingDraft.agentSdk}
                  onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                    onAgentDraftChange(agent.id, "agentSdk", event.target.value)
                  }
                  disabled={isEditingDisabled}
                >
                  {AVAILABLE_AGENT_SDKS.map((sdkName) => (
                    <option
                      key={`${agent.id}-sdk-${sdkName}`}
                      value={sdkName}
                      disabled={
                        Boolean(editingDraft.agentRunnerId)
                        && runnerSdkAvailabilityByName.get(sdkName) !== "available"
                        && editingDraft.agentSdk !== sdkName
                      }
                    >
                      {formatAvailabilityOptionLabel(
                        sdkName,
                        runnerSdkAvailabilityByName.get(sdkName) || "not-reported",
                        { isCurrent: editingDraft.agentSdk === sdkName },
                      )}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <p className="agent-config-value">{editingDraft.agentSdk || "n/a"}</p>
            ),
          })}

          {renderSectionShell({
            sectionId: "model",
            label: "Model",
            children: editingSectionById.model ? (
              <div className="agent-config-inline-edit">
                <select
                  id={`edit-agent-model-${agent.id}`}
                  value={editingDraft.model}
                  onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                    onAgentDraftChange(agent.id, "model", event.target.value)
                  }
                  disabled={isEditingDisabled || !editingDraft.agentRunnerId}
                >
                  {!editingDraft.agentRunnerId ? (
                    <option value="">Select a runner first</option>
                  ) : runnerCodexModelEntries.length === 0 ? (
                    <option value="">No models reported by selected runner</option>
                  ) : getRunnerModelNames(runnerCodexModelEntries).length === 0 ? (
                    <option value="">No available models reported by selected runner</option>
                  ) : (
                    <>
                      <option value="">Select model</option>
                      {missingModelOption ? (
                        <option value={missingModelOption} disabled>
                          {formatAvailabilityOptionLabel(missingModelOption, "not-reported", { isCurrent: true })}
                        </option>
                      ) : null}
                      {runnerCodexModelEntries.map((modelEntry) => (
                        <option
                          key={`${agent.id}-model-${modelEntry.name}`}
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
              </div>
            ) : (
              <p className="agent-config-value">{editingDraft.model || "n/a"}</p>
            ),
          })}

          {renderSectionShell({
            sectionId: "reasoning",
            label: "Reasoning",
            children: editingSectionById.reasoning ? (
              <div className="agent-config-inline-edit">
                <select
                  id={`edit-agent-reasoning-${agent.id}`}
                  value={editingDraft.modelReasoningLevel}
                  onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                    onAgentDraftChange(agent.id, "modelReasoningLevel", event.target.value)
                  }
                  disabled={isEditingDisabled || !editingDraft.agentRunnerId || !editingDraft.model}
                >
                  {!editingDraft.agentRunnerId ? (
                    <option value="">Select a runner first</option>
                  ) : !editingDraft.model ? (
                    <option value="">Select a model first</option>
                  ) : runnerReasoningLevels.length === 0 ? (
                    <option value="">No reasoning levels reported for this model</option>
                  ) : (
                    <>
                      <option value="">Select reasoning</option>
                      {runnerReasoningLevels.map((reasoningLevel) => (
                        <option key={`${agent.id}-reasoning-${reasoningLevel}`} value={reasoningLevel}>
                          {reasoningLevel}
                        </option>
                      ))}
                    </>
                  )}
                </select>
              </div>
            ) : (
              <p className="agent-config-value">{editingDraft.modelReasoningLevel || "n/a"}</p>
            ),
          })}

          {renderSectionShell({
            sectionId: "instructions",
            label: "Default additional model instructions",
            children: (
              <button
                type="button"
                className="agent-config-text-trigger"
                onClick={() => setIsInstructionsFullscreen(true)}
                disabled={isEditingDisabled}
              >
                {summarizeInstructions(editingDraft.defaultAdditionalModelInstructions || "")}
              </button>
            ),
          })}

          {renderSectionShell({
            sectionId: "roles",
            label: "Assigned roles",
            children: editingSectionById.roles ? (
              <div className="agent-config-inline-edit">
                <div className="inline-selection-list">
                  {directRoles.length === 0 ? (
                    <span className="empty-hint">No roles assigned.</span>
                  ) : (
                    directRoles.map((role) => (
                      <button
                        key={`edit-agent-role-${agent.id}-${role.id}`}
                        type="button"
                        className="tag-remove-btn"
                        onClick={() =>
                          onAgentDraftChange(
                            agent.id,
                            "roleIds",
                            editingRoleIds.filter((candidateId) => candidateId !== role.id),
                          )
                        }
                        disabled={isEditingDisabled}
                        title={`Remove ${role.name}`}
                      >
                        {role.name} ×
                      </button>
                    ))
                  )}
                </div>
                <select
                  value=""
                  onChange={(event: ChangeEvent<HTMLSelectElement>) => {
                    const nextRoleId = String(event.target.value || "").trim();
                    if (!nextRoleId) {
                      return;
                    }
                    onAgentDraftChange(agent.id, "roleIds", [...editingRoleIds, nextRoleId]);
                  }}
                  disabled={isEditingDisabled || editingAvailableRoles.length === 0}
                >
                  <option value="">
                    {editingAvailableRoles.length === 0 ? "All roles already assigned" : "Add role"}
                  </option>
                  {editingAvailableRoles.map((role) => (
                    <option key={`edit-agent-role-option-${agent.id}-${role.id}`} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="inline-selection-list">
                {directRoles.length === 0 ? (
                  <span className="empty-hint">No roles assigned.</span>
                ) : (
                  directRoles.map((role) => (
                    <span key={`agent-role-pill-${role.id}`} className="tag-pill">{role.name}</span>
                  ))
                )}
              </div>
            ),
          })}

          {renderSectionShell({
            sectionId: "direct-skills",
            label: "Direct skills",
            children: editingSectionById["direct-skills"] ? (
              <div className="agent-config-inline-edit">
                <div className="inline-selection-list">
                  {directSkills.length === 0 ? (
                    <span className="empty-hint">No direct skills assigned.</span>
                  ) : (
                    directSkills.map((skill) => (
                      <button
                        key={`edit-agent-direct-skill-${agent.id}-${skill.id}`}
                        type="button"
                        className="tag-remove-btn"
                        onClick={() =>
                          onAgentDraftChange(
                            agent.id,
                            "skillIds",
                            editingSkillIds.filter((candidateId) => candidateId !== skill.id),
                          )
                        }
                        disabled={isEditingDisabled}
                        title={`Remove ${skill.name}`}
                      >
                        {skill.name} ×
                      </button>
                    ))
                  )}
                </div>
                <select
                  value=""
                  onChange={(event: ChangeEvent<HTMLSelectElement>) => {
                    const nextSkillId = String(event.target.value || "").trim();
                    if (!nextSkillId) {
                      return;
                    }
                    onAgentDraftChange(agent.id, "skillIds", [...editingSkillIds, nextSkillId]);
                  }}
                  disabled={isEditingDisabled || editingAvailableSkills.length === 0}
                >
                  <option value="">
                    {editingAvailableSkills.length === 0 ? "All skills already assigned" : "Add direct skill"}
                  </option>
                  {editingAvailableSkills.map((skill) => (
                    <option key={`edit-agent-direct-skill-option-${agent.id}-${skill.id}`} value={skill.id}>
                      {skill.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="inline-selection-list">
                {directSkills.length === 0 ? (
                  <span className="empty-hint">No direct skills assigned.</span>
                ) : (
                  directSkills.map((skill) => (
                    <span key={`direct-skill-pill-${skill.id}`} className="tag-pill">{skill.name}</span>
                  ))
                )}
              </div>
            ),
          })}

          {renderSectionShell({
            sectionId: "inherited-skills",
            label: "Inherited skills",
            editable: false,
            children: (
              <div className="inline-selection-list">
                {effectiveSkills.length === 0 ? (
                  <span className="empty-hint">No skills inherited from assigned roles.</span>
                ) : (
                  effectiveSkills.map((skill) => (
                    <span key={`effective-skill-pill-${skill.id}`} className="tag-pill">{skill.name}</span>
                  ))
                )}
              </div>
            ),
          })}

          {renderSectionShell({
            sectionId: "direct-mcp",
            label: "Direct MCP Servers",
            children: editingSectionById["direct-mcp"] ? (
              <div className="agent-config-inline-edit">
                <div className="inline-selection-list">
                  {directMcpServers.length === 0 ? (
                    <span className="empty-hint">No direct MCP servers assigned.</span>
                  ) : (
                    directMcpServers.map((mcpServer) => (
                      <button
                        key={`edit-agent-direct-mcp-${agent.id}-${mcpServer.id}`}
                        type="button"
                        className="tag-remove-btn"
                        onClick={() =>
                          onAgentDraftChange(
                            agent.id,
                            "mcpServerIds",
                            editingMcpServerIds.filter((candidateId) => candidateId !== mcpServer.id),
                          )
                        }
                        disabled={isEditingDisabled}
                        title={`Remove ${mcpServer.name}`}
                      >
                        {mcpServer.name} ×
                      </button>
                    ))
                  )}
                </div>
                <select
                  value=""
                  onChange={(event: ChangeEvent<HTMLSelectElement>) => {
                    const nextMcpServerId = String(event.target.value || "").trim();
                    if (!nextMcpServerId) {
                      return;
                    }
                    onAgentDraftChange(agent.id, "mcpServerIds", [...editingMcpServerIds, nextMcpServerId]);
                  }}
                  disabled={isEditingDisabled || editingAvailableMcpServers.length === 0}
                >
                  <option value="">
                    {editingAvailableMcpServers.length === 0 ? "All MCP servers already assigned" : "Add direct MCP server"}
                  </option>
                  {editingAvailableMcpServers.map((mcpServer) => (
                    <option key={`edit-agent-direct-mcp-option-${agent.id}-${mcpServer.id}`} value={mcpServer.id}>
                      {mcpServer.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="inline-selection-list">
                {directMcpServers.length === 0 ? (
                  <span className="empty-hint">No direct MCP servers assigned.</span>
                ) : (
                  directMcpServers.map((mcpServer) => (
                    <span key={`direct-mcp-pill-${mcpServer.id}`} className="tag-pill">{mcpServer.name}</span>
                  ))
                )}
              </div>
            ),
          })}

          {renderSectionShell({
            sectionId: "effective-mcp",
            label: "Effective MCP Servers",
            editable: false,
            children: (
              <div className="inline-selection-list">
                {resolvedEffectiveMcpServers.length === 0 ? (
                  <span className="empty-hint">No MCP servers inherited from assigned roles.</span>
                ) : (
                  resolvedEffectiveMcpServers.map((mcpServer) => (
                    <span key={`effective-mcp-pill-${mcpServer.id}`} className="tag-pill">{mcpServer.name}</span>
                  ))
                )}
              </div>
            ),
          })}
        </div>

        <div className="task-card-actions modal-actions">
          <button type="submit" disabled={isEditingDisabled}>
            {isEditingAgentSaving ? "Saving..." : saveButtonLabel}
          </button>
          {onCancel ? (
            <button
              type="button"
              className="secondary-btn"
              onClick={onCancel}
              disabled={isEditingAgentSaving}
            >
              {cancelButtonLabel}
            </button>
          ) : null}
        </div>
      </form>
      {fullscreenEditor}
    </>
  );
}
