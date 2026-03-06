// @ts-nocheck
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  DEFAULT_RUNNER_GRPC_TARGET,
  DEFAULT_GITHUB_APP_INSTALL_URL,
  AVAILABLE_AGENT_SDKS,
  DEFAULT_AGENT_SDK,
  SKILL_TYPE_TEXT,
  SKILL_TYPE_SKILLSMP,
  MCP_TRANSPORT_TYPE_STREAMABLE_HTTP,
  MCP_TRANSPORT_TYPE_STDIO,
  MCP_AUTH_TYPE_NONE,
  MCP_AUTH_TYPE_BEARER_TOKEN,
  MCP_AUTH_TYPE_CUSTOM_HEADERS,
  SIDEBAR_COLLAPSE_MEDIA_QUERY,
  THREAD_TITLE_MAX_LENGTH,
  NAV_SECTIONS,
  BOTTOM_NAV_ITEMS,
  NAV_ITEMS,
  NAV_ITEM_LOOKUP,
} from "./utils/constants.ts";

import { matchesMediaQuery } from "./utils/media.ts";

import {
  LIST_COMPANIES_QUERY,
  ME_QUERY,
  CREATE_COMPANY_MUTATION,
  DELETE_COMPANY_MUTATION,
  LIST_GITHUB_APP_CONFIG_QUERY,
  LIST_GITHUB_INSTALLATIONS_QUERY,
  ADD_GITHUB_INSTALLATION_MUTATION,
  DELETE_GITHUB_INSTALLATION_MUTATION,
  LIST_REPOSITORIES_QUERY,
  REFRESH_GITHUB_INSTALLATION_REPOSITORIES_MUTATION,
  LIST_TASKS_QUERY,
  LIST_TASK_ASSIGNABLE_PRINCIPALS_QUERY,
  LIST_AGENT_RUNNERS_QUERY,
  CREATE_AGENT_RUNNER_MUTATION,
  REGENERATE_AGENT_RUNNER_SECRET_MUTATION,
  LIST_AGENTS_QUERY,
  LIST_SKILLS_QUERY,
  LIST_ROLES_QUERY,
  LIST_SKILL_GROUPS_QUERY,
  LIST_GIT_SKILL_PACKAGES_QUERY,
  LIST_MCP_SERVERS_QUERY,
  LIST_SECRETS_QUERY,
  LIST_SECRET_VALUE_QUERY,
  LIST_SECRET_ACCESS_LOGS_QUERY,
  LIST_APPROVALS_QUERY,
  APPROVE_APPROVAL_MUTATION,
  REJECT_APPROVAL_MUTATION,
  DELETE_APPROVAL_MUTATION,
  CREATE_TASK_MUTATION,
  ADD_TASK_DEPENDENCY_MUTATION,
  REMOVE_TASK_DEPENDENCY_MUTATION,
  SET_TASK_PARENT_MUTATION,
  SET_TASK_ASSIGNEE_PRINCIPAL_MUTATION,
  SET_TASK_STATUS_MUTATION,
  DELETE_TASK_MUTATION,
  BATCH_DELETE_TASKS_MUTATION,
  BATCH_EXECUTE_TASKS_MUTATION,
  CREATE_TASK_COMMENT_MUTATION,
  DELETE_AGENT_RUNNER_MUTATION,
  CREATE_AGENT_MUTATION,
  UPDATE_AGENT_MUTATION,
  DELETE_AGENT_MUTATION,
  CREATE_SKILL_MUTATION,
  UPDATE_SKILL_MUTATION,
  DELETE_SKILL_MUTATION,
  PREVIEW_GIT_SKILL_PACKAGE_MUTATION,
  CREATE_GIT_SKILL_PACKAGE_MUTATION,
  DELETE_GIT_SKILL_PACKAGE_MUTATION,
  CREATE_SKILL_GROUP_MUTATION,
  UPDATE_SKILL_GROUP_MUTATION,
  DELETE_SKILL_GROUP_MUTATION,
  ADD_SKILL_TO_GROUP_MUTATION,
  REMOVE_SKILL_FROM_GROUP_MUTATION,
  CREATE_ROLE_MUTATION,
  UPDATE_ROLE_MUTATION,
  DELETE_ROLE_MUTATION,
  ADD_SKILL_TO_ROLE_MUTATION,
  REMOVE_SKILL_FROM_ROLE_MUTATION,
  ADD_SKILL_GROUP_TO_ROLE_MUTATION,
  REMOVE_SKILL_GROUP_FROM_ROLE_MUTATION,
  ADD_MCP_SERVER_TO_ROLE_MUTATION,
  REMOVE_MCP_SERVER_FROM_ROLE_MUTATION,
  CREATE_MCP_SERVER_MUTATION,
  UPDATE_MCP_SERVER_MUTATION,
  DELETE_MCP_SERVER_MUTATION,
  CREATE_SECRET_MUTATION,
  UPDATE_SECRET_MUTATION,
  DELETE_SECRET_MUTATION,
  INITIALIZE_AGENT_MUTATION,
  RETRY_AGENT_SKILL_INSTALL_MUTATION,
  LIST_AGENT_TURNS_QUERY,
  LIST_AGENT_THREADS_QUERY,
  CREATE_AGENT_THREAD_MUTATION,
  UPDATE_AGENT_THREAD_MUTATION,
  DELETE_AGENT_THREAD_MUTATION,
  CREATE_AGENT_TURN_MUTATION,
  STEER_AGENT_TURN_MUTATION,
  INTERRUPT_AGENT_TURN_MUTATION,
  AGENT_RUNNERS_SUBSCRIPTION,
  AGENT_THREADS_SUBSCRIPTION,
  AGENT_TURNS_SUBSCRIPTION,
  AGENT_QUEUED_USER_MESSAGES_SUBSCRIPTION,
  COMPANY_API_NOT_IMPLEMENTED_ERROR,
  COMPANY_API_PAGE_SIZE,
  COMPANY_API_LIST_COMPANIES_CONNECTION_QUERY,
  COMPANY_API_ME_QUERY,
  COMPANY_API_CREATE_COMPANY_MUTATION,
  COMPANY_API_DELETE_COMPANY_MUTATION,
  COMPANY_API_GITHUB_APP_CONFIG_QUERY,
  COMPANY_API_LIST_GITHUB_INSTALLATIONS_QUERY,
  COMPANY_API_LIST_REPOSITORIES_CONNECTION_QUERY,
  COMPANY_API_ADD_GITHUB_INSTALLATION_MUTATION,
  COMPANY_API_DELETE_GITHUB_INSTALLATION_MUTATION,
  COMPANY_API_REFRESH_GITHUB_INSTALLATION_REPOSITORIES_MUTATION,
  COMPANY_API_LIST_TASKS_QUERY,
  COMPANY_API_LIST_TASK_ASSIGNABLE_PRINCIPALS_QUERY,
  COMPANY_API_CREATE_TASK_MUTATION,
  COMPANY_API_ADD_TASK_DEPENDENCY_MUTATION,
  COMPANY_API_REMOVE_TASK_DEPENDENCY_MUTATION,
  COMPANY_API_SET_TASK_PARENT_MUTATION,
  COMPANY_API_SET_TASK_ASSIGNEE_PRINCIPAL_MUTATION,
  COMPANY_API_SET_TASK_STATUS_MUTATION,
  COMPANY_API_DELETE_TASK_MUTATION,
  COMPANY_API_BATCH_DELETE_TASKS_MUTATION,
  COMPANY_API_BATCH_EXECUTE_TASKS_MUTATION,
  COMPANY_API_CREATE_TASK_COMMENT_MUTATION,
  COMPANY_API_LIST_SKILLS_QUERY,
  COMPANY_API_LIST_ROLES_QUERY,
  COMPANY_API_LIST_SKILL_GROUPS_QUERY,
  COMPANY_API_LIST_GIT_SKILL_PACKAGES_QUERY,
  COMPANY_API_LIST_MCP_SERVERS_QUERY,
  COMPANY_API_LIST_SECRETS_QUERY,
  COMPANY_API_LIST_SECRET_VALUE_QUERY,
  COMPANY_API_LIST_SECRET_ACCESS_LOGS_QUERY,
  COMPANY_API_LIST_APPROVALS_QUERY,
  COMPANY_API_APPROVE_APPROVAL_MUTATION,
  COMPANY_API_REJECT_APPROVAL_MUTATION,
  COMPANY_API_DELETE_APPROVAL_MUTATION,
  COMPANY_API_PREVIEW_GIT_SKILL_PACKAGE_MUTATION,
  COMPANY_API_CREATE_GIT_SKILL_PACKAGE_MUTATION,
  COMPANY_API_DELETE_GIT_SKILL_PACKAGE_MUTATION,
  COMPANY_API_CREATE_SKILL_GROUP_MUTATION,
  COMPANY_API_UPDATE_SKILL_GROUP_MUTATION,
  COMPANY_API_DELETE_SKILL_GROUP_MUTATION,
  COMPANY_API_ADD_SKILL_TO_GROUP_MUTATION,
  COMPANY_API_REMOVE_SKILL_FROM_GROUP_MUTATION,
  COMPANY_API_CREATE_ROLE_MUTATION,
  COMPANY_API_UPDATE_ROLE_MUTATION,
  COMPANY_API_DELETE_ROLE_MUTATION,
  COMPANY_API_ADD_SKILL_TO_ROLE_MUTATION,
  COMPANY_API_REMOVE_SKILL_FROM_ROLE_MUTATION,
  COMPANY_API_ADD_SKILL_GROUP_TO_ROLE_MUTATION,
  COMPANY_API_REMOVE_SKILL_GROUP_FROM_ROLE_MUTATION,
  COMPANY_API_ADD_MCP_SERVER_TO_ROLE_MUTATION,
  COMPANY_API_REMOVE_MCP_SERVER_FROM_ROLE_MUTATION,
  COMPANY_API_CREATE_MCP_SERVER_MUTATION,
  COMPANY_API_UPDATE_MCP_SERVER_MUTATION,
  COMPANY_API_DELETE_MCP_SERVER_MUTATION,
  COMPANY_API_CREATE_SECRET_MUTATION,
  COMPANY_API_UPDATE_SECRET_MUTATION,
  COMPANY_API_DELETE_SECRET_MUTATION,
  COMPANY_API_LIST_AGENT_RUNNERS_CONNECTION_QUERY,
  COMPANY_API_CREATE_AGENT_RUNNER_MUTATION,
  COMPANY_API_REGENERATE_AGENT_RUNNER_SECRET_MUTATION,
  COMPANY_API_DELETE_AGENT_RUNNER_MUTATION,
  COMPANY_API_LIST_AGENTS_CONNECTION_QUERY,
  COMPANY_API_LIST_AGENTS_WITH_THREADS_CONNECTION_QUERY,
  COMPANY_API_CREATE_AGENT_MUTATION,
  COMPANY_API_UPDATE_AGENT_MUTATION,
  COMPANY_API_DELETE_AGENT_MUTATION,
  COMPANY_API_LIST_THREADS_CONNECTION_QUERY,
  COMPANY_API_CREATE_THREAD_MUTATION,
  COMPANY_API_UPDATE_THREAD_TITLE_MUTATION,
  COMPANY_API_DELETE_THREAD_MUTATION,
  COMPANY_API_LIST_THREAD_TURNS_CONNECTION_QUERY,
  COMPANY_API_LIST_THREAD_TURNS_WITH_QUEUED_QUERY,
  COMPANY_API_QUEUE_USER_MESSAGE_MUTATION,
  COMPANY_API_STEER_QUEUED_USER_MESSAGE_MUTATION,
  COMPANY_API_DELETE_QUEUED_USER_MESSAGE_MUTATION,
  COMPANY_API_INTERRUPT_TURN_MUTATION,
} from "./utils/graphql.ts";

import {
  normalizeUniqueStringList,
  normalizeOptionalInstructions,
  normalizeSkillType,
  normalizeMcpTransportType,
  normalizeMcpAuthType,
  normalizeAgentSdkValue,
  isAvailableAgentSdk,
  normalizeRunnerAvailableAgentSdks,
  normalizeRunnerCodexAvailableModels,
  resolveRunnerSdkAndModelIds,
  resolveRunnerBackedModelSelection,
  mergeAgentRunnerPayloadList,
  getRunnerModelNames,
  getRunnerReasoningLevels,
  getRunnerCodexModelEntriesForRunner,
  parseMcpHeadersText,
  parseMcpArgsText,
  parseMcpEnvVarsText,
} from "./utils/normalization.ts";

import { normalizeRunnerStatus, normalizeChatStatus } from "./utils/formatting.ts";
import { buildTaskExecutionPlan } from "./utils/task-execution.ts";
import { normalizeThreadTaskList } from "./utils/thread-tasks.ts";

import {
  hasRunningChatTurns,
  getLatestRunningChatTurn,
  compareTurnsByTimestamp,
  getTurnLifecycleSignature,
  mergeChatSessionsByAgentSnapshot,
  resolveChatSendMode,
  isSameChatSelection,
} from "./utils/chat.ts";

import {
  normalizePathname,
  getPageFromPathname,
  getAgentsRouteFromPathname,
  getSkillsRouteFromPathname,
  getRolesRouteFromPathname,
  getGitSkillPackagesRouteFromPathname,
  getRunnersRouteFromPathname,
  getChatsRouteFromLocation,
  getChatsPath,
  setBrowserPath,
  getPathForPage,
  parseGithubInstallCallbackFromLocation,
  clearGithubInstallCallbackFromLocation,
  buildGithubAppInstallUrl,
} from "./utils/path.ts";

import { getPersistedCompanyId, persistCompanyId } from "./utils/persistence.ts";
import { setActiveCompanyId } from "./utils/company-context.ts";
import { createSingleFlightByKey } from "./utils/single-flight.ts";

import { buildRunnerStartCommand } from "./utils/shell.ts";

import {
  createRelationshipDrafts,
  createAgentDrafts,
  createSkillDrafts,
  createMcpServerDrafts,
  createSecretDrafts,
} from "./utils/drafts.ts";

import { subscribeGraphQL, useGraphQLSubscription } from "./hooks/useGraphQLSubscription.ts";
import { executeRelayGraphQL } from "./relay/client.ts";
import { authProvider } from "./auth/runtime.ts";

import { Breadcrumbs } from "./components/Breadcrumbs.tsx";
import { PageActionsProvider } from "./components/PageActionsContext.tsx";
import { CompanyRequiredPanel } from "./components/CompanyRequiredPanel.tsx";
import { FirstCompanyOnboardingPage } from "./components/FirstCompanyOnboardingPage.tsx";

import { DashboardPage } from "./pages/DashboardPage.tsx";
import { TasksPage } from "./pages/TasksPage.tsx";
import { AgentRunnerPage } from "./pages/AgentRunnerPage.tsx";
import { AgentRunnerDetailPage } from "./pages/AgentRunnerDetailPage.tsx";
import { AgentsPage } from "./pages/AgentsPage.tsx";
import { SkillsPage } from "./pages/SkillsPage.tsx";
import { SkillGroupsPage } from "./pages/SkillGroupsPage.tsx";
import { RolesPage } from "./pages/RolesPage.tsx";
import { GitSkillPackagesPage } from "./pages/GitSkillPackagesPage.tsx";
import { SecretsPage } from "./pages/SecretsPage.tsx";
import { ApprovalsPage } from "./pages/ApprovalsPage.tsx";
import { McpServersPage } from "./pages/McpServersPage.tsx";
import { AgentChatsPage } from "./pages/AgentChatsPage.tsx";
import { AgentChatPage } from "./pages/AgentChatPage.tsx";
import { SettingsPage } from "./pages/SettingsPage.tsx";
import { ReposPage } from "./pages/ReposPage.tsx";
import { ProfilePage } from "./pages/ProfilePage.tsx";

// --- Module-level mutable state (shared by adapter functions and executeGraphQL) ---
const companyApiThreadMetadataById = new Map<any, any>();
const companyApiRunnerMetadataById = new Map<any, any>();


async function executeRawGraphQL(query: any, variables: any, options: any = {}) {
  return executeRelayGraphQL({
    query,
    variables,
    operationKind: options.operationKind,
    force: options.force,
  });
}

function normalizeCompanyApiRunnerStatus(value: any) {
  return String(value || "").trim().toLowerCase() === "connected" ? "ready" : "disconnected";
}

function resolveLegacyId(...values: any) {
  for (const value of values) {
    const resolved = String(value || "").trim();
    if (resolved) {
      return resolved;
    }
  }
  return "";
}

function getChatCreateBlockedReason(agent: any, agentRunnerLookup: any) {
  const assignedRunnerId = resolveLegacyId(agent?.agentRunnerId);
  if (!assignedRunnerId) {
    // Some API payloads can still omit runner linkage fields.
    // In that case we cannot reliably determine runner assignment client-side, so
    // allow chat creation and defer validation to the API mutation path.
    return "";
  }

  const assignedRunner = agentRunnerLookup.get(assignedRunnerId);
  if (!assignedRunner) {
    return "";
  }

  if (normalizeRunnerStatus(assignedRunner.status) !== "ready") {
    return `Assigned runner ${assignedRunnerId} is not connected. Start or reconnect the runner before creating chats.`;
  }

  return "";
}

function sortAgentsForChatNavigation(agentList: any) {
  return [...(Array.isArray(agentList) ? agentList : [])].sort((leftAgent: any, rightAgent: any) => {
    const leftName = String(leftAgent?.name || "");
    const rightName = String(rightAgent?.name || "");
    const byName = leftName.localeCompare(rightName);
    if (byName !== 0) {
      return byName;
    }
    return String(leftAgent?.id || "").localeCompare(String(rightAgent?.id || ""));
  });
}

function sortChatSessionsForChatNavigation(sessionList: any) {
  return [...(Array.isArray(sessionList) ? sessionList : [])].sort((leftChat: any, rightChat: any) =>
    compareTurnsByTimestamp(
      { createdAt: leftChat?.updatedAt, id: leftChat?.id },
      { createdAt: rightChat?.updatedAt, id: rightChat?.id },
    ),
  );
}

function toConnectionNodes(connection: any) {
  if (!connection || !Array.isArray(connection.edges)) {
    return [];
  }
  return connection.edges.map((edge: any) => edge?.node).filter(Boolean);
}

async function fetchCompanyApiConnectionNodes({
  query,
  rootField,
  variables = {},
  limit = null,
}: any) {
  const nodes: any[] = [];
  const seenCursors = new Set<any>();
  let after = null;

  while (true) {
    const remaining = Number.isInteger(limit) && limit > 0 ? limit - nodes.length : COMPANY_API_PAGE_SIZE;
    if (remaining <= 0) {
      break;
    }

    const first = Math.min(COMPANY_API_PAGE_SIZE, remaining);
    const data = await executeRawGraphQL(query, {
      ...variables,
      first,
      after,
    });

    const connection = data?.[rootField];
    const batch = toConnectionNodes(connection);
    nodes.push(...batch);

    if (!connection?.pageInfo?.hasNextPage) {
      break;
    }

    const nextCursor = String(connection?.pageInfo?.endCursor || "").trim();
    if (!nextCursor || seenCursors.has(nextCursor)) {
      break;
    }
    seenCursors.add(nextCursor);
    after = nextCursor;
  }

  if (Number.isInteger(limit) && limit > 0) {
    return nodes.slice(0, limit);
  }
  return nodes;
}

async function loadCompanyApiAgentThreads({
  companyId,
  agentId,
  limit = null,
}: any) {
  const threadNodes = await fetchCompanyApiConnectionNodes({
    query: COMPANY_API_LIST_THREADS_CONNECTION_QUERY,
    rootField: "threads",
    variables: {
      companyId,
      agentId,
    },
    limit,
  });

  return threadNodes.map((threadNode: any) => toLegacyThreadPayload(threadNode));
}

async function loadCompanyApiAgentsWithThreads({
  companyId,
  agentLimit = null,
  threadLimit = 500,
}: any) {
  const agentNodes = await fetchCompanyApiConnectionNodes({
    query: COMPANY_API_LIST_AGENTS_WITH_THREADS_CONNECTION_QUERY,
    rootField: "agents",
    variables: {
      companyId,
      firstThreads: threadLimit,
    },
    limit: agentLimit,
  });

  const agentRunnersById = new Map<any, any>();
  const sessionsByAgent = {};
  const legacyAgents = agentNodes.map((agentNode: any) => {
    const legacyAgent = toAgentPayload(agentNode);
    const legacyRunner = agentNode?.runner ? toLegacyRunnerPayload(agentNode.runner) : null;
    const resolvedRunnerId = resolveLegacyId(legacyRunner?.id);
    if (resolvedRunnerId) {
      agentRunnersById.set(resolvedRunnerId, legacyRunner);
    }
    const resolvedAgentId = resolveLegacyId(legacyAgent?.id);
    if (resolvedAgentId) {
      sessionsByAgent[resolvedAgentId] = toConnectionNodes(agentNode?.threads).map((threadNode: any) =>
        toLegacyThreadPayload(threadNode),
      );
    }
    return legacyAgent;
  });

  return {
    agents: legacyAgents,
    agentRunners: [...agentRunnersById.values()],
    sessionsByAgent,
  };
}

async function loadCompanyApiThreadTurns({
  threadId,
  runnerId = null,
  limit = null,
}: any) {
  const turnNodes = await fetchCompanyApiConnectionNodes({
    query: COMPANY_API_LIST_THREAD_TURNS_CONNECTION_QUERY,
    rootField: "threadTurns",
    variables: { threadId },
    limit,
  });

  return turnNodes.map((turnNode: any) => toLegacyTurnPayload(turnNode, { runnerId }));
}

function toLegacyRunnerPayload(agentRunner: any) {
  const runnerId = resolveLegacyId(agentRunner?.id);
  const runnerName = resolveLegacyId(agentRunner?.name);
  const nowIso = new Date().toISOString();
  const currentMetadata = companyApiRunnerMetadataById.get(runnerId) || {};
  const runnerStatus = normalizeCompanyApiRunnerStatus(agentRunner?.status);
  const availableAgentSdks = normalizeRunnerAvailableAgentSdks(agentRunner);

  const nextMetadata = {
    name: runnerName || currentMetadata.name || runnerId,
    createdAt: currentMetadata.createdAt || nowIso,
    updatedAt: nowIso,
    lastSeenAt: runnerStatus === "ready" ? nowIso : currentMetadata.lastSeenAt || null,
    lastHealthCheckAt:
      runnerStatus === "ready" ? nowIso : currentMetadata.lastHealthCheckAt || null,
    availableAgentSdks,
  };
  if (runnerId) {
    companyApiRunnerMetadataById.set(runnerId, nextMetadata);
  }

  return {
    id: runnerId,
    companyId: resolveLegacyId(agentRunner?.company?.id),
    name: nextMetadata.name,
    callbackUrl: null,
    hasAuthSecret: true,
    availableAgentSdks,
    status: runnerStatus,
    lastHealthCheckAt: nextMetadata.lastHealthCheckAt,
    lastSeenAt: nextMetadata.lastSeenAt,
    createdAt: nextMetadata.createdAt,
    updatedAt: nextMetadata.updatedAt,
  };
}

function toAgentPayload(agent: any) {
  const resolvedSdkValue = resolveLegacyId(agent?.agentSdk, agent?.agentRunnerSdk?.name);
  const resolvedSdk = isAvailableAgentSdk(resolvedSdkValue)
    ? normalizeAgentSdkValue(resolvedSdkValue)
    : DEFAULT_AGENT_SDK;

  return {
    id: resolveLegacyId(agent?.id),
    companyId: resolveLegacyId(agent?.company?.id),
    name: resolveLegacyId(agent?.name),
    status: resolveLegacyId(agent?.status) || "pending",
    agentRunnerId: resolveLegacyId(agent?.runner?.id, agent?.agentRunnerId),
    roleIds: normalizeUniqueStringList(agent?.roleIds || []),
    roles: Array.isArray(agent?.roles)
      ? agent.roles
          .map((role: any) => ({
            id: resolveLegacyId(role?.id),
            name: resolveLegacyId(role?.name),
            parentRole: role?.parentRole
              ? {
                  id: resolveLegacyId(role.parentRole.id),
                  name: resolveLegacyId(role.parentRole.name),
                }
              : null,
            parentId: resolveLegacyId(role?.parentRole?.id),
          }))
          .filter((role: any) => role.id)
      : [],
    mcpServerIds: normalizeUniqueStringList(agent?.mcpServerIds || []),
    installedSkills: [],
    agentSdk: resolvedSdk,
    model: resolveLegacyId(agent?.model, agent?.defaultModel?.name),
    modelReasoningLevel: resolveLegacyId(agent?.modelReasoningLevel, agent?.defaultReasoningLevel),
    defaultAdditionalModelInstructions: normalizeOptionalInstructions(
      agent?.defaultAdditionalModelInstructions,
    ),
  };
}

function toSkillGroupPayload(skillGroup: any) {
  const skillGroupId = resolveLegacyId(skillGroup?.id);
  return {
    id: skillGroupId,
    companyId: resolveLegacyId(skillGroup?.company?.id, skillGroup?.companyId),
    name: resolveLegacyId(skillGroup?.name),
    parentSkillGroup: skillGroup?.parentSkillGroup
      ? {
          id: resolveLegacyId(skillGroup.parentSkillGroup.id),
          name: resolveLegacyId(skillGroup.parentSkillGroup.name),
        }
      : null,
    skills: Array.isArray(skillGroup?.skills)
      ? skillGroup.skills
          .map((skill: any) => ({
            id: resolveLegacyId(skill?.id),
            name: resolveLegacyId(skill?.name),
          }))
          .filter((skill: any) => skill.id)
      : [],
  };
}

function toRolePayload(role: any) {
  const roleId = resolveLegacyId(role?.id);
  return {
    id: roleId,
    companyId: resolveLegacyId(role?.company?.id, role?.companyId),
    name: resolveLegacyId(role?.name),
    parentRole: role?.parentRole
      ? {
          id: resolveLegacyId(role.parentRole.id),
          name: resolveLegacyId(role.parentRole.name),
        }
      : null,
    subRoles: Array.isArray(role?.subRoles)
      ? role.subRoles
          .map((subRole: any) => ({
            id: resolveLegacyId(subRole?.id),
            name: resolveLegacyId(subRole?.name),
          }))
          .filter((subRole: any) => subRole.id)
      : [],
    skills: Array.isArray(role?.skills)
      ? role.skills
          .map((skill: any) => ({
            id: resolveLegacyId(skill?.id),
            name: resolveLegacyId(skill?.name),
          }))
          .filter((skill: any) => skill.id)
      : [],
    skillGroups: Array.isArray(role?.skillGroups)
      ? role.skillGroups
          .map((skillGroup: any) => ({
            id: resolveLegacyId(skillGroup?.id),
            name: resolveLegacyId(skillGroup?.name),
          }))
          .filter((skillGroup: any) => skillGroup.id)
      : [],
    effectiveSkills: Array.isArray(role?.effectiveSkills)
      ? role.effectiveSkills
          .map((skill: any) => ({
            id: resolveLegacyId(skill?.id),
            name: resolveLegacyId(skill?.name),
          }))
          .filter((skill: any) => skill.id)
      : [],
    mcpServers: Array.isArray(role?.mcpServers)
      ? role.mcpServers
          .map((mcpServer: any) => ({
            id: resolveLegacyId(mcpServer?.id),
            name: resolveLegacyId(mcpServer?.name),
          }))
          .filter((mcpServer: any) => mcpServer.id)
      : [],
    effectiveMcpServers: Array.isArray(role?.effectiveMcpServers)
      ? role.effectiveMcpServers
          .map((mcpServer: any) => ({
            id: resolveLegacyId(mcpServer?.id),
            name: resolveLegacyId(mcpServer?.name),
          }))
          .filter((mcpServer: any) => mcpServer.id)
      : [],
  };
}

function collectRoleAndSubroleIds(roleIds: any, roles: any) {
  const normalizedRoleIds = normalizeUniqueStringList(roleIds || []);
  if (normalizedRoleIds.length === 0) {
    return [];
  }

  const childRoleIdsByParentId = new Map<any, any>();
  for (const role of roles) {
    const roleId = resolveLegacyId(role?.id);
    const parentRoleId = resolveLegacyId(role?.parentRole?.id);
    if (!roleId || !parentRoleId) {
      continue;
    }
    const existingChildIds = childRoleIdsByParentId.get(parentRoleId);
    if (existingChildIds) {
      existingChildIds.push(roleId);
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

function toGitSkillPackagePayload(gitSkillPackage: any) {
  const packageId = resolveLegacyId(gitSkillPackage?.id);
  return {
    id: packageId,
    companyId: resolveLegacyId(gitSkillPackage?.company?.id, gitSkillPackage?.companyId),
    packageName: resolveLegacyId(gitSkillPackage?.packageName),
    gitRepositoryUrl: resolveLegacyId(gitSkillPackage?.gitRepositoryUrl),
    hostingProvider: resolveLegacyId(gitSkillPackage?.hostingProvider),
    currentCommitHash: resolveLegacyId(gitSkillPackage?.currentCommitHash),
    currentReference: resolveLegacyId(gitSkillPackage?.currentReference),
    skills: Array.isArray(gitSkillPackage?.skills)
      ? gitSkillPackage.skills
          .map((skill: any) => ({
            id: resolveLegacyId(skill?.id),
            name: resolveLegacyId(skill?.name),
          }))
          .filter((skill: any) => skill.id)
      : [],
  };
}

function toMcpServerPayload(mcpServer: any) {
  return {
    id: resolveLegacyId(mcpServer?.id),
    companyId: resolveLegacyId(mcpServer?.company?.id, mcpServer?.companyId),
    name: resolveLegacyId(mcpServer?.name),
    transportType: normalizeMcpTransportType(mcpServer?.transportType),
    url: String(mcpServer?.url || "").trim(),
    command: String(mcpServer?.command || "").trim(),
    args: Array.isArray(mcpServer?.args)
      ? mcpServer.args.map((arg: any) => String(arg || "").trim()).filter(Boolean)
      : [],
    envVars: Array.isArray(mcpServer?.envVars)
      ? mcpServer.envVars
          .map((envVar: any) => ({
            key: String(envVar?.key || "").trim(),
            value: String(envVar?.value || "").trim(),
          }))
          .filter((envVar: any) => envVar.key)
      : [],
    authType: normalizeMcpAuthType(mcpServer?.authType),
    bearerTokenSecretId: resolveLegacyId(mcpServer?.bearerTokenSecretId) || null,
    customHeaders: Array.isArray(mcpServer?.customHeaders)
      ? mcpServer.customHeaders
          .map((header: any) => ({
            key: String(header?.key || "").trim(),
            value: String(header?.value || "").trim(),
          }))
          .filter((header: any) => header.key && header.value)
      : [],
    enabled: mcpServer?.enabled !== false,
  };
}

function toSecretPayload(secret: any) {
  return {
    id: resolveLegacyId(secret?.id),
    companyId: resolveLegacyId(secret?.company?.id, secret?.companyId),
    name: resolveLegacyId(secret?.name),
    description: String(secret?.description || "").trim(),
    createdAt: resolveLegacyId(secret?.createdAt),
    updatedAt: resolveLegacyId(secret?.updatedAt),
  };
}

function toApprovalPayload(approval: any) {
  return {
    id: resolveLegacyId(approval?.id),
    companyId: resolveLegacyId(approval?.company?.id, approval?.companyId),
    type: resolveLegacyId(approval?.type) || "secret",
    status: resolveLegacyId(approval?.status) || "pending",
    secretId: resolveLegacyId(approval?.secretId),
    threadId: resolveLegacyId(approval?.threadId),
    reason: String(approval?.reason || "").trim(),
    rejectionReason: String(approval?.rejectionReason || "").trim() || null,
    createdByPrincipalId: resolveLegacyId(approval?.createdByPrincipalId) || null,
    resolvedByPrincipalId: resolveLegacyId(approval?.resolvedByPrincipalId) || null,
    resolvedAt: resolveLegacyId(approval?.resolvedAt) || null,
    createdAt: resolveLegacyId(approval?.createdAt),
    updatedAt: resolveLegacyId(approval?.updatedAt),
    secretName: resolveLegacyId(approval?.secretName) || null,
    requestingAgentId: resolveLegacyId(approval?.requestingAgentId) || null,
    requestingAgentName: resolveLegacyId(approval?.requestingAgentName) || null,
  };
}

function toSecretAccessLogPayload(secretAccessLog: any) {
  const threadId = resolveLegacyId(secretAccessLog?.thread?.id, secretAccessLog?.threadId) || null;
  const threadTitle = resolveLegacyId(secretAccessLog?.thread?.title) || null;
  const agentId = resolveLegacyId(secretAccessLog?.agent?.id, secretAccessLog?.agentId) || null;
  const agentName = resolveLegacyId(secretAccessLog?.agent?.name) || null;
  const mcpServerId = resolveLegacyId(secretAccessLog?.mcpServer?.id, secretAccessLog?.mcpServerId) || null;
  const mcpServerName = resolveLegacyId(secretAccessLog?.mcpServer?.name) || null;

  return {
    id: resolveLegacyId(secretAccessLog?.id),
    companyId: resolveLegacyId(secretAccessLog?.company?.id, secretAccessLog?.companyId),
    secretId: resolveLegacyId(secretAccessLog?.secret?.id, secretAccessLog?.secretId) || null,
    threadId,
    agentId,
    mcpServerId,
    accessReason: String(secretAccessLog?.accessReason || "").trim(),
    accessedAt: resolveLegacyId(secretAccessLog?.accessedAt),
    thread: threadId
      ? {
        id: threadId,
        title: threadTitle,
      }
      : null,
    agent: agentId
      ? {
        id: agentId,
        name: agentName || agentId,
      }
      : null,
    mcpServer: mcpServerId
      ? {
        id: mcpServerId,
        name: mcpServerName || mcpServerId,
      }
      : null,
  };
}

function toTaskCommentPayload(taskComment: any) {
  const authorPrincipal = toPrincipalPayload(taskComment?.authorPrincipal);
  return {
    id: resolveLegacyId(taskComment?.id),
    taskId: resolveLegacyId(taskComment?.taskId),
    companyId: resolveLegacyId(taskComment?.company?.id, taskComment?.companyId),
    comment: String(taskComment?.comment || ""),
    authorPrincipalId: resolveLegacyId(taskComment?.authorPrincipalId) || null,
    authorPrincipal,
    createdAt: resolveLegacyId(taskComment?.createdAt),
    updatedAt: resolveLegacyId(taskComment?.updatedAt),
  };
}

function toPrincipalPayload(principal: any) {
  const principalId = resolveLegacyId(principal?.id);
  if (!principalId) {
    return null;
  }
  const normalizedKind = String(principal?.kind || "").trim().toLowerCase();
  const kind = normalizedKind === "agent" ? "agent" : "user";
  return {
    id: principalId,
    kind,
    displayName: String(principal?.displayName || "").trim() || principalId,
    agentId: resolveLegacyId(principal?.agentId) || null,
    userId: resolveLegacyId(principal?.userId) || null,
    email: resolveLegacyId(principal?.email) || null,
  };
}

function toTaskPayload(task: any) {
  const assigneePrincipal = toPrincipalPayload(task?.assigneePrincipal);
  const assigneeAgentId = resolveLegacyId(task?.agentId, assigneePrincipal?.agentId) || null;
  return {
    id: resolveLegacyId(task?.id),
    companyId: resolveLegacyId(task?.company?.id, task?.companyId),
    name: resolveLegacyId(task?.name),
    description: String(task?.description || ""),
    acceptanceCriteria: String(task?.acceptanceCriteria || ""),
    assigneePrincipalId: resolveLegacyId(task?.assigneePrincipalId) || null,
    assigneePrincipal,
    assigneeAgentId,
    threadId: resolveLegacyId(task?.threadId) || null,
    parentTaskId: resolveLegacyId(task?.parentTaskId) || null,
    status: resolveLegacyId(task?.status) || "draft",
    createdAt: resolveLegacyId(task?.createdAt),
    updatedAt: resolveLegacyId(task?.updatedAt),
    dependencyTaskIds: normalizeUniqueStringList(task?.dependencyTaskIds || []),
    comments: Array.isArray(task?.comments)
      ? task.comments
          .map((comment: any) => toTaskCommentPayload(comment))
          .filter((comment: any) => comment.id)
      : [],
  };
}

function toSkillPayload(skill: any) {
  const skillId = resolveLegacyId(skill?.id);
  const content = String(skill?.content || "");
  const description = String(skill?.description || "");
  return {
    id: skillId,
    companyId: resolveLegacyId(skill?.company?.id, skill?.companyId),
    name: resolveLegacyId(skill?.name),
    description: description,
    content,
    instructions: content,
    fileList: Array.isArray(skill?.fileList)
      ? skill.fileList.map((filePath: any) => String(filePath || "").trim()).filter(Boolean)
      : [],
    gitSkillPackagePath: resolveLegacyId(skill?.gitSkillPackagePath) || null,
    roles: Array.isArray(skill?.roles)
      ? skill.roles
          .map((role: any) => ({
            id: resolveLegacyId(role?.id),
            name: resolveLegacyId(role?.name),
          }))
          .filter((role: any) => role.id)
      : [],
    gitSkillPackage: skill?.gitSkillPackage ? toGitSkillPackagePayload(skill.gitSkillPackage) : null,
  };
}

function toLegacyThreadPayload(thread: any, {
  metadataOverride
}: any = {}) {
  const threadId = resolveLegacyId(thread?.id);
  const nowIso = new Date().toISOString();
  const currentMetadata = companyApiThreadMetadataById.get(threadId) || {};
  const resolvedCurrentModelId = resolveLegacyId(
    metadataOverride?.currentModelId,
    metadataOverride?.currentModel?.id,
    thread?.currentModel?.id,
    currentMetadata.currentModelId,
  ) || null;
  const resolvedCurrentModelName = resolveLegacyId(
    metadataOverride?.currentModelName,
    metadataOverride?.currentModel?.name,
    thread?.currentModelName,
    thread?.currentModel?.name,
    currentMetadata.currentModelName,
  ) || null;
  const resolvedCurrentReasoningLevel = resolveLegacyId(
    metadataOverride?.currentReasoningLevel,
    thread?.currentReasoningLevel,
    currentMetadata.currentReasoningLevel,
  ) || null;
  const overrideProvidesTitle = Boolean(
    metadataOverride && Object.prototype.hasOwnProperty.call(metadataOverride, "title"),
  );
  const threadProvidesTitle = Boolean(thread && Object.prototype.hasOwnProperty.call(thread, "title"));
  const explicitTitleValue = overrideProvidesTitle
    ? metadataOverride.title
    : threadProvidesTitle
      ? thread.title
      : undefined;
  const normalizedExplicitTitle = typeof explicitTitleValue === "string" ? explicitTitleValue.trim() : "";
  const fallbackTitle = explicitTitleValue === undefined ? resolveLegacyId(currentMetadata.title) : "";
  const resolvedTitle = normalizedExplicitTitle || fallbackTitle || `Thread ${threadId.slice(0, 8)}`;
  const overrideProvidesAdditionalModelInstructions = Boolean(
    metadataOverride && Object.prototype.hasOwnProperty.call(metadataOverride, "additionalModelInstructions"),
  );
  const threadProvidesAdditionalModelInstructions = Boolean(
    thread && Object.prototype.hasOwnProperty.call(thread, "additionalModelInstructions"),
  );
  const explicitAdditionalModelInstructions = overrideProvidesAdditionalModelInstructions
    ? metadataOverride.additionalModelInstructions
    : threadProvidesAdditionalModelInstructions
      ? thread.additionalModelInstructions
      : undefined;
  const resolvedAdditionalModelInstructions =
    explicitAdditionalModelInstructions === undefined
      ? normalizeOptionalInstructions(currentMetadata.additionalModelInstructions)
      : normalizeOptionalInstructions(explicitAdditionalModelInstructions);
  const overrideProvidesErrorMessage = Boolean(
    metadataOverride && Object.prototype.hasOwnProperty.call(metadataOverride, "errorMessage"),
  );
  const threadProvidesErrorMessage = Boolean(
    thread && Object.prototype.hasOwnProperty.call(thread, "errorMessage"),
  );
  const explicitErrorMessage = overrideProvidesErrorMessage
    ? metadataOverride.errorMessage
    : threadProvidesErrorMessage
      ? thread.errorMessage
      : undefined;
  const resolvedErrorMessage =
    explicitErrorMessage === undefined
      ? normalizeOptionalInstructions(currentMetadata.errorMessage)
      : normalizeOptionalInstructions(explicitErrorMessage);
  const overrideProvidesTasks = Boolean(
    metadataOverride && Object.prototype.hasOwnProperty.call(metadataOverride, "tasks"),
  );
  const threadProvidesTasks = Boolean(
    thread && Object.prototype.hasOwnProperty.call(thread, "tasks"),
  );
  const explicitTasks = overrideProvidesTasks
    ? metadataOverride.tasks
    : threadProvidesTasks
      ? thread.tasks
      : undefined;
  const resolvedTasks = explicitTasks === undefined
    ? normalizeThreadTaskList(currentMetadata.tasks || [])
    : normalizeThreadTaskList(explicitTasks);
  const nextMetadata = {
    createdAt: currentMetadata.createdAt || nowIso,
    updatedAt: nowIso,
    title: resolvedTitle,
    runnerId: resolveLegacyId(metadataOverride?.runnerId, currentMetadata.runnerId) || null,
    currentModelId: resolvedCurrentModelId,
    currentModelName: resolvedCurrentModelName,
    currentReasoningLevel: resolvedCurrentReasoningLevel,
    additionalModelInstructions: resolvedAdditionalModelInstructions,
    errorMessage: resolvedErrorMessage,
    tasks: resolvedTasks,
  };
  if (threadId) {
    companyApiThreadMetadataById.set(threadId, nextMetadata);
  }

  return {
    id: threadId,
    threadId,
    companyId: resolveLegacyId(thread?.company?.id),
    agentId: resolveLegacyId(thread?.agent?.id),
    runnerId: nextMetadata.runnerId,
    title: nextMetadata.title,
    status: resolveLegacyId(thread?.status) || "pending",
    errorMessage: nextMetadata.errorMessage,
    currentModelId: nextMetadata.currentModelId,
    currentModelName: nextMetadata.currentModelName,
    currentReasoningLevel: nextMetadata.currentReasoningLevel,
    additionalModelInstructions: nextMetadata.additionalModelInstructions,
    tasks: nextMetadata.tasks,
    createdAt: nextMetadata.createdAt,
    updatedAt: nextMetadata.updatedAt,
  };
}

function toLegacyTurnItemRole(itemType: any) {
  const normalizedType = String(itemType || "").trim().toLowerCase();
  if (normalizedType === "user_message") {
    return "user";
  }
  if (normalizedType === "agent_message") {
    return "assistant";
  }
  return "system";
}

function toLegacyTurnPayload(turn: any, {
  runnerId
}: any = {}) {
  const resolvedTurnId = resolveLegacyId(turn?.id);
  const resolvedThreadId = resolveLegacyId(turn?.thread?.id);
  const resolvedCompanyId = resolveLegacyId(turn?.company?.id);
  const resolvedAgentId = resolveLegacyId(turn?.agent?.id);
  const resolvedRunnerId = resolveLegacyId(runnerId) || null;
  const resolvedStartedAt = resolveLegacyId(turn?.startedAt) || null;
  const resolvedEndedAt = resolveLegacyId(turn?.endedAt) || null;
  const fallbackTimestamp = resolvedStartedAt || resolvedEndedAt || new Date().toISOString();

  const items = (Array.isArray(turn?.items) ? turn.items : []).map((item: any) => {
    const resolvedItemType = resolveLegacyId(item?.type) || "unknown";
    const itemStartedAt = resolveLegacyId(item?.startedAt) || null;
    const itemEndedAt = resolveLegacyId(item?.completedAt) || null;
    const itemTimestamp = itemStartedAt || itemEndedAt || fallbackTimestamp;

    return {
      id: resolveLegacyId(item?.id),
      turnId: resolveLegacyId(item?.turn?.id, resolvedTurnId),
      threadId: resolveLegacyId(item?.turn?.thread?.id, resolvedThreadId),
      companyId: resolveLegacyId(item?.company?.id, resolvedCompanyId),
      agentId: resolvedAgentId,
      runnerId: resolvedRunnerId,
      providerItemId: resolveLegacyId(item?.sdkItemId),
      role: toLegacyTurnItemRole(resolvedItemType),
      itemType: resolvedItemType,
      text: resolveLegacyId(item?.text),
      command: resolveLegacyId(item?.commandOutput),
      output: resolveLegacyId(item?.consoleOutput),
      status: resolveLegacyId(item?.status) || "running",
      startedAt: itemStartedAt,
      endedAt: itemEndedAt,
      error: null,
      createdAt: itemTimestamp,
      updatedAt: itemEndedAt || itemStartedAt || itemTimestamp,
    };
  });

  return {
    id: resolvedTurnId,
    threadId: resolvedThreadId,
    companyId: resolvedCompanyId,
    agentId: resolvedAgentId,
    runnerId: resolvedRunnerId,
    status: resolveLegacyId(turn?.status) || "running",
    reasoningText: resolveLegacyId(turn?.reasoningText),
    startedAt: resolvedStartedAt,
    endedAt: resolvedEndedAt,
    createdAt: fallbackTimestamp,
    updatedAt: resolvedEndedAt || resolvedStartedAt || fallbackTimestamp,
    items,
  };
}

function toLegacyQueuedUserMessagePayload(queuedMessage: any) {
  const normalizedStatus = String(queuedMessage?.status || "").trim().toLowerCase();
  return {
    id: resolveLegacyId(queuedMessage?.id),
    companyId: resolveLegacyId(queuedMessage?.company?.id),
    threadId: resolveLegacyId(queuedMessage?.thread?.id),
    status:
      normalizedStatus === "processed"
        ? "processed"
        : normalizedStatus === "submitted"
          ? "submitted"
          : "queued",
    sdkTurnId: resolveLegacyId(queuedMessage?.sdkTurnId) || null,
    allowSteer: Boolean(queuedMessage?.allowSteer),
    text: resolveLegacyId(queuedMessage?.text),
  };
}

function unsupportedMutation(resultKey: any) {
  return {
    [resultKey]: {
      ok: false,
      error: COMPANY_API_NOT_IMPLEMENTED_ERROR,
    },
  };
}

async function executeGraphQL(query: any, variables: any = {}) {
  if (query === LIST_GITHUB_APP_CONFIG_QUERY) {
    const data = await executeRawGraphQL(COMPANY_API_GITHUB_APP_CONFIG_QUERY);
    const githubAppConfig = data?.githubAppConfig;
    return {
      githubAppConfig: {
        appClientId: resolveLegacyId(githubAppConfig?.appClientId),
        appLink: resolveLegacyId(githubAppConfig?.appLink),
      },
    };
  }

  if (query === LIST_COMPANIES_QUERY) {
    const companies = await fetchCompanyApiConnectionNodes({
      query: COMPANY_API_LIST_COMPANIES_CONNECTION_QUERY,
      rootField: "companies",
    });
    return {
      companies: companies.map((company: any) => ({
        id: resolveLegacyId(company?.id),
        name: resolveLegacyId(company?.name),
      })),
    };
  }

  if (query === ME_QUERY) {
    const data = await executeRawGraphQL(COMPANY_API_ME_QUERY);
    const currentUser = data?.me;
    return {
      currentUser: currentUser
        ? {
          id: resolveLegacyId(currentUser.id),
          email: resolveLegacyId(currentUser.email),
          firstName: resolveLegacyId(currentUser.firstName),
          lastName: resolveLegacyId(currentUser.lastName) || null,
        }
        : null,
    };
  }

  if (query === CREATE_COMPANY_MUTATION) {
    const data = await executeRawGraphQL(COMPANY_API_CREATE_COMPANY_MUTATION, {
      name: resolveLegacyId(variables?.name),
    });
    const company = data?.createCompany;
    return {
      createCompany: {
        ok: true,
        error: null,
        company: {
          id: resolveLegacyId(company?.id),
          name: resolveLegacyId(company?.name),
        },
      },
    };
  }

  if (query === DELETE_COMPANY_MUTATION) {
    const companyId = resolveLegacyId(variables?.companyId, variables?.id);
    const data = await executeRawGraphQL(COMPANY_API_DELETE_COMPANY_MUTATION, {
      companyId,
    });
    return {
      deleteCompany: {
        ok: Boolean(data?.deleteCompany),
        error: data?.deleteCompany ? null : "Company deletion failed.",
        companyId,
      },
    };
  }

  if (query === LIST_GITHUB_INSTALLATIONS_QUERY) {
    const data = await executeRawGraphQL(COMPANY_API_LIST_GITHUB_INSTALLATIONS_QUERY, {
      companyId: resolveLegacyId(variables?.companyId),
    });
    const githubInstallations = Array.isArray(data?.githubInstallations)
      ? data.githubInstallations
      : [];
    return {
      githubInstallations: githubInstallations.map((installation: any) => ({
        installationId: resolveLegacyId(installation?.installationId),
        companyId: resolveLegacyId(installation?.company?.id),
        createdAt: String(installation?.createdAt || ""),
      })),
    };
  }

  if (query === ADD_GITHUB_INSTALLATION_MUTATION) {
    const data = await executeRawGraphQL(COMPANY_API_ADD_GITHUB_INSTALLATION_MUTATION, {
      companyId: resolveLegacyId(variables?.companyId),
      installationId: resolveLegacyId(variables?.installationId),
      setupAction: resolveLegacyId(variables?.setupAction) || null,
    });
    const payload = data?.addGithubInstallation;
    const installation = payload?.githubInstallation;
    return {
      addGithubInstallation: {
        ok: Boolean(payload?.ok),
        error: payload?.error ? String(payload.error) : null,
        githubInstallation: installation
          ? {
              installationId: resolveLegacyId(installation.installationId),
              companyId: resolveLegacyId(installation.company?.id),
              createdAt: String(installation.createdAt || ""),
            }
          : null,
      },
    };
  }

  if (query === LIST_AGENT_RUNNERS_QUERY) {
    const companyId = resolveLegacyId(variables?.companyId) || null;
    const runners = await fetchCompanyApiConnectionNodes({
      query: COMPANY_API_LIST_AGENT_RUNNERS_CONNECTION_QUERY,
      rootField: "agentRunners",
      variables: { companyId },
    });
    return {
      agentRunners: runners.map((runner: any) => toLegacyRunnerPayload(runner)),
    };
  }

  if (query === CREATE_AGENT_RUNNER_MUTATION) {
    const data = await executeRawGraphQL(COMPANY_API_CREATE_AGENT_RUNNER_MUTATION, {
      companyId: resolveLegacyId(variables?.companyId),
      name: resolveLegacyId(variables?.name),
    });
    const payload = data?.createAgentRunner;
    const legacyRunner = toLegacyRunnerPayload(payload?.agentRunner);
    const secret = resolveLegacyId(payload?.secret);
    return {
      createAgentRunner: {
        ok: true,
        error: null,
        provisionedAuthSecret: secret,
        runnerLaunchCommand: secret
          ? buildRunnerStartCommand({
              runnerSecret: secret,
            })
          : null,
        agentRunner: legacyRunner,
      },
    };
  }

  if (query === REGENERATE_AGENT_RUNNER_SECRET_MUTATION) {
    const agentRunnerId = resolveLegacyId(variables?.id, variables?.agentRunnerId);
    const data = await executeRawGraphQL(COMPANY_API_REGENERATE_AGENT_RUNNER_SECRET_MUTATION, {
      agentRunnerId,
    });
    const payload = data?.regenerateAgentRunnerSecret;
    const secret = resolveLegacyId(payload?.secret);
    return {
      regenerateAgentRunnerSecret: {
        ok: true,
        error: null,
        provisionedAuthSecret: secret,
        runnerLaunchCommand: secret
          ? buildRunnerStartCommand({
              runnerSecret: secret,
            })
          : null,
        agentRunner: toLegacyRunnerPayload(payload?.agentRunner),
      },
    };
  }

  if (query === DELETE_AGENT_RUNNER_MUTATION) {
    const agentRunnerId = resolveLegacyId(variables?.id, variables?.agentRunnerId);
    const data = await executeRawGraphQL(COMPANY_API_DELETE_AGENT_RUNNER_MUTATION, {
      agentRunnerId,
    });
    return {
      deleteAgentRunner: {
        ok: Boolean(data?.deleteAgentRunner),
        error: data?.deleteAgentRunner ? null : "Runner deletion failed.",
        deletedAgentRunnerId: agentRunnerId,
      },
    };
  }

  if (query === LIST_AGENTS_QUERY) {
    const companyId = resolveLegacyId(variables?.companyId) || null;
    const agents = await fetchCompanyApiConnectionNodes({
      query: COMPANY_API_LIST_AGENTS_CONNECTION_QUERY,
      rootField: "agents",
      variables: { companyId },
    });
    const agentRunnersById = new Map<any, any>();
    const legacyAgents = agents.map((agent: any) => {
      const legacyAgent = toAgentPayload(agent);
      const legacyRunner = agent?.runner ? toLegacyRunnerPayload(agent.runner) : null;
      const resolvedRunnerId = resolveLegacyId(legacyRunner?.id);
      if (resolvedRunnerId) {
        agentRunnersById.set(resolvedRunnerId, legacyRunner);
      }
      return legacyAgent;
    });
    return {
      agents: legacyAgents,
      agentRunners: [...agentRunnersById.values()],
    };
  }

  if (query === CREATE_AGENT_MUTATION) {
    const companyId = resolveLegacyId(variables?.companyId);
    const name = resolveLegacyId(variables?.name);
    const agentRunnerId = resolveLegacyId(variables?.agentRunnerId);
    const agentRunnerSdkId = resolveLegacyId(variables?.agentRunnerSdkId);
    const defaultModelId = resolveLegacyId(variables?.defaultModelId);
    const defaultReasoningLevel =
      resolveLegacyId(variables?.defaultReasoningLevel, variables?.modelReasoningLevel) || null;
    const roleIds = normalizeUniqueStringList(variables?.roleIds || []);
    const mcpServerIds = normalizeUniqueStringList(variables?.mcpServerIds || []);
    const defaultAdditionalModelInstructions = normalizeOptionalInstructions(
      variables?.defaultAdditionalModelInstructions,
    );
    if (!companyId || !name || !agentRunnerId || !agentRunnerSdkId || !defaultModelId) {
      throw new Error("Agent creation requires company, runner, SDK, and model selections.");
    }

    const data = await executeRawGraphQL(COMPANY_API_CREATE_AGENT_MUTATION, {
      companyId,
      name,
      agentRunnerId,
      agentRunnerSdkId,
      defaultModelId,
      roleIds,
      mcpServerIds,
      defaultReasoningLevel,
      defaultAdditionalModelInstructions,
    });
    return {
      createAgent: {
        ok: true,
        error: null,
        agent: toAgentPayload(data?.createAgent),
      },
    };
  }

  if (query === UPDATE_AGENT_MUTATION) {
    const agentId = resolveLegacyId(variables?.id, variables?.agentId);
    const name = resolveLegacyId(variables?.name);
    const agentRunnerId = resolveLegacyId(variables?.agentRunnerId);
    const agentRunnerSdkId = resolveLegacyId(variables?.agentRunnerSdkId);
    const defaultModelId = resolveLegacyId(variables?.defaultModelId);
    const defaultReasoningLevel =
      resolveLegacyId(variables?.defaultReasoningLevel, variables?.modelReasoningLevel) || null;
    const roleIds = normalizeUniqueStringList(variables?.roleIds || []);
    const mcpServerIds = normalizeUniqueStringList(variables?.mcpServerIds || []);
    const defaultAdditionalModelInstructions = normalizeOptionalInstructions(
      variables?.defaultAdditionalModelInstructions,
    );
    if (!agentId || !name || !agentRunnerId || !agentRunnerSdkId || !defaultModelId) {
      throw new Error("Agent update requires id, runner, SDK, and model selections.");
    }

    const data = await executeRawGraphQL(COMPANY_API_UPDATE_AGENT_MUTATION, {
      agentId,
      name,
      agentRunnerId,
      agentRunnerSdkId,
      defaultModelId,
      roleIds,
      mcpServerIds,
      defaultReasoningLevel,
      defaultAdditionalModelInstructions,
    });

    return {
      updateAgent: {
        ok: true,
        error: null,
        agent: toAgentPayload(data?.updateAgent),
      },
    };
  }

  if (query === DELETE_AGENT_MUTATION) {
    const agentId = resolveLegacyId(variables?.id, variables?.agentId);
    const force = Boolean(variables?.force);
    const data = await executeRawGraphQL(COMPANY_API_DELETE_AGENT_MUTATION, {
      input: {
        agentId,
        force,
      },
    });
    const payload = data?.deleteAgent;
    const responseErrors = Array.isArray(payload?.errors)
      ? payload.errors
          .map((errorMessage: any) => String(errorMessage || "").trim())
          .filter(Boolean)
      : [];
    const ok = Boolean(payload?.ok);
    return {
      deleteAgent: {
        ok,
        error: ok ? null : responseErrors.join(" ") || "Agent deletion failed.",
        deletedAgentId: ok ? agentId : null,
      },
    };
  }

  if (query === LIST_AGENT_THREADS_QUERY) {
    const companyId = resolveLegacyId(variables?.companyId) || null;
    const agentId = resolveLegacyId(variables?.agentId) || null;
    const limit = Number.isInteger(variables?.limit) ? Math.max(0, variables.limit) : null;
    const threads = await loadCompanyApiAgentThreads({
      companyId,
      agentId,
      limit,
    });
    return {
      agentThreads: threads,
    };
  }

  if (query === CREATE_AGENT_THREAD_MUTATION) {
    const companyId = resolveLegacyId(variables?.companyId);
    const agentId = resolveLegacyId(variables?.agentId);
    const additionalModelInstructions = normalizeOptionalInstructions(
      variables?.additionalModelInstructions,
    );
    const loadThreadsForAgent = async () =>
      fetchCompanyApiConnectionNodes({
        query: COMPANY_API_LIST_THREADS_CONNECTION_QUERY,
        rootField: "threads",
        variables: {
          companyId,
          agentId,
        },
        limit: 500,
      });

    const previousThreads = await fetchCompanyApiConnectionNodes({
      query: COMPANY_API_LIST_THREADS_CONNECTION_QUERY,
      rootField: "threads",
      variables: {
        companyId,
        agentId,
      },
      limit: 500,
    });
    const previousThreadIds = new Set(previousThreads.map((thread: any) => resolveLegacyId(thread?.id)));

    const createThreadVariables = {
      companyId,
      agentId,
      title: resolveLegacyId(variables?.title) || null,
    };
    if (additionalModelInstructions !== null) {
      createThreadVariables.additionalModelInstructions = additionalModelInstructions;
    }
    const data = await executeRawGraphQL(COMPANY_API_CREATE_THREAD_MUTATION, createThreadVariables);
    const metadata = {
      runnerId: resolveLegacyId(variables?.runnerId) || null,
    };
    if (additionalModelInstructions !== null) {
      metadata.additionalModelInstructions = additionalModelInstructions;
    }
    const requestedThreadId = resolveLegacyId(data?.createThread?.id);

    const pickCanonicalThread = (threadsSnapshot: any) => {
      const requestedThread = threadsSnapshot.find(
        (thread: any) => resolveLegacyId(thread?.id) === requestedThreadId,
      );
      const newlyCreatedThreads = threadsSnapshot.filter(
        (thread: any) => !previousThreadIds.has(resolveLegacyId(thread?.id)),
      );
      const readyRequestedThread = requestedThread
        && resolveLegacyId(requestedThread?.status) === "ready"
        ? requestedThread
        : null;
      const readyCreatedThread = newlyCreatedThreads.find(
        (thread: any) => resolveLegacyId(thread?.status) === "ready",
      );
      const idChangedCreatedThread = newlyCreatedThreads.find(
        (thread: any) => resolveLegacyId(thread?.id) !== requestedThreadId,
      );

      return readyRequestedThread
        || readyCreatedThread
        || idChangedCreatedThread
        || requestedThread
        || (newlyCreatedThreads.length === 1 ? newlyCreatedThreads[0] : null)
        || newlyCreatedThreads[0]
        || data?.createThread;
    };

    const updatedThreads = await loadThreadsForAgent();
    const canonicalThread = pickCanonicalThread(updatedThreads);

    const legacyThread = toLegacyThreadPayload(canonicalThread, { metadataOverride: metadata });
    return {
      createAgentThread: {
        ok: true,
        error: null,
        thread: legacyThread,
      },
    };
  }

  if (query === UPDATE_AGENT_THREAD_MUTATION) {
    const threadId = resolveLegacyId(variables?.threadId, variables?.id);
    const data = await executeRawGraphQL(COMPANY_API_UPDATE_THREAD_TITLE_MUTATION, {
      threadId,
      title: resolveLegacyId(variables?.title) || null,
    });
    const updatedThread = data?.updateThreadTitle;
    if (!updatedThread) {
      throw new Error("Failed to update chat title.");
    }
    return {
      updateAgentThread: {
        ok: true,
        error: null,
        thread: toLegacyThreadPayload(updatedThread),
      },
    };
  }

  if (query === DELETE_AGENT_THREAD_MUTATION) {
    const threadId = resolveLegacyId(variables?.threadId, variables?.id);
    const data = await executeRawGraphQL(COMPANY_API_DELETE_THREAD_MUTATION, {
      threadId,
    });
    const deletingThread = data?.deleteThread
      ? toLegacyThreadPayload(data.deleteThread)
      : null;
    const ok = Boolean(deletingThread?.id);
    return {
      deleteAgentThread: {
        ok,
        error: ok ? null : "Failed to delete chat.",
        deletedThreadId: ok ? threadId : null,
        thread: deletingThread,
      },
    };
  }

  if (query === LIST_AGENT_TURNS_QUERY) {
    const threadId = resolveLegacyId(variables?.threadId);
    if (!threadId) {
      return { agentTurns: [] };
    }

    const limit = Number.isInteger(variables?.limit) ? Math.max(0, variables.limit) : null;
    const metadata = companyApiThreadMetadataById.get(threadId) || {};
    const runnerId = resolveLegacyId(variables?.runnerId, metadata.runnerId) || null;
    const turns = await loadCompanyApiThreadTurns({
      threadId,
      runnerId,
      limit,
    });

    return {
      agentTurns: turns,
    };
  }

  if (query === CREATE_AGENT_TURN_MUTATION) {
    const requestedThreadId = resolveLegacyId(variables?.threadId);
    const modelId = resolveLegacyId(variables?.modelId);
    const reasoningLevel = resolveLegacyId(variables?.reasoningLevel);
    const data = await executeRawGraphQL(COMPANY_API_QUEUE_USER_MESSAGE_MUTATION, {
      threadId: requestedThreadId,
      text: resolveLegacyId(variables?.text),
      allowSteer: false,
      modelId: modelId || null,
      reasoningLevel: reasoningLevel || null,
    });
    const queuedUserMessage = data?.queueUserMessage;

    return {
      createAgentTurn: {
        ok: true,
        error: null,
        itemId: null,
        turnId: null,
        queuedUserMessageId: resolveLegacyId(queuedUserMessage?.id) || null,
        threadId: resolveLegacyId(queuedUserMessage?.threadId, requestedThreadId) || null,
        runnerId: resolveLegacyId(variables?.runnerId) || null,
        agentId: resolveLegacyId(variables?.agentId) || null,
      },
    };
  }

  if (query === STEER_AGENT_TURN_MUTATION) {
    const requestedThreadId = resolveLegacyId(variables?.threadId);
    await executeRawGraphQL(COMPANY_API_QUEUE_USER_MESSAGE_MUTATION, {
      threadId: requestedThreadId,
      text: resolveLegacyId(variables?.message),
      allowSteer: true,
    });

    return {
      steerAgentTurn: {
        ok: true,
        error: null,
        itemId: null,
        turnId: resolveLegacyId(variables?.turnId) || null,
        threadId: requestedThreadId || null,
        runnerId: resolveLegacyId(variables?.runnerId) || null,
        agentId: resolveLegacyId(variables?.agentId) || null,
      },
    };
  }

  if (query === INTERRUPT_AGENT_TURN_MUTATION) {
    const requestedThreadId = resolveLegacyId(variables?.threadId);
    const data = await executeRawGraphQL(COMPANY_API_INTERRUPT_TURN_MUTATION, {
      threadId: requestedThreadId,
    });

    return {
      interruptAgentTurn: {
        ok: Boolean(data?.interruptTurn),
        error: data?.interruptTurn ? null : "Failed to interrupt running turn.",
        threadId: requestedThreadId || null,
        runnerId: resolveLegacyId(variables?.runnerId) || null,
        agentId: resolveLegacyId(variables?.agentId) || null,
      },
    };
  }

  if (query === LIST_REPOSITORIES_QUERY) {
    const provider = resolveLegacyId(variables?.provider).toLowerCase();
    if (provider && provider !== "github") {
      return { repositories: [] };
    }

    const repositories = await fetchCompanyApiConnectionNodes({
      query: COMPANY_API_LIST_REPOSITORIES_CONNECTION_QUERY,
      rootField: "repositories",
      variables: {
        companyId: resolveLegacyId(variables?.companyId),
        githubInstallationId: resolveLegacyId(variables?.githubInstallationId) || null,
      },
    });

    return {
      repositories: repositories.map((repository: any) => ({
        id: resolveLegacyId(repository?.id),
        companyId: resolveLegacyId(repository?.company?.id),
        provider: resolveLegacyId(repository?.provider) || "github",
        externalId: resolveLegacyId(repository?.externalId),
        githubInstallationId: resolveLegacyId(repository?.githubInstallation?.installationId),
        name: resolveLegacyId(repository?.name),
        fullName: resolveLegacyId(repository?.fullName),
        htmlUrl: resolveLegacyId(repository?.htmlUrl) || null,
        isPrivate: Boolean(repository?.isPrivate),
        defaultBranch: resolveLegacyId(repository?.defaultBranch) || null,
        archived: Boolean(repository?.archived),
        createdAt: String(repository?.createdAt || ""),
        updatedAt: String(repository?.updatedAt || ""),
      })),
    };
  }

  if (query === LIST_SKILLS_QUERY) {
    const data = await executeRawGraphQL(COMPANY_API_LIST_SKILLS_QUERY, {
      companyId: resolveLegacyId(variables?.companyId),
    });
    const skills = Array.isArray(data?.skills) ? data.skills : [];
    return {
      skills: skills.map((skill: any) => toSkillPayload(skill)),
    };
  }

  if (query === LIST_ROLES_QUERY) {
    const data = await executeRawGraphQL(COMPANY_API_LIST_ROLES_QUERY, {
      companyId: resolveLegacyId(variables?.companyId),
    });
    const roles = Array.isArray(data?.roles) ? data.roles : [];
    return {
      roles: roles.map((role: any) => toRolePayload(role)),
    };
  }

  if (query === LIST_SKILL_GROUPS_QUERY) {
    const data = await executeRawGraphQL(COMPANY_API_LIST_SKILL_GROUPS_QUERY, {
      companyId: resolveLegacyId(variables?.companyId),
    });
    const skillGroups = Array.isArray(data?.skillGroups) ? data.skillGroups : [];
    return {
      skillGroups: skillGroups.map((skillGroup: any) => toSkillGroupPayload(skillGroup)),
    };
  }

  if (query === LIST_GIT_SKILL_PACKAGES_QUERY) {
    const data = await executeRawGraphQL(COMPANY_API_LIST_GIT_SKILL_PACKAGES_QUERY, {
      companyId: resolveLegacyId(variables?.companyId),
    });
    const gitSkillPackages = Array.isArray(data?.gitSkillPackages) ? data.gitSkillPackages : [];
    return {
      gitSkillPackages: gitSkillPackages.map((gitSkillPackage: any) =>
        toGitSkillPackagePayload(gitSkillPackage),
      ),
    };
  }

  if (query === PREVIEW_GIT_SKILL_PACKAGE_MUTATION) {
    const data = await executeRawGraphQL(COMPANY_API_PREVIEW_GIT_SKILL_PACKAGE_MUTATION, {
      gitRepositoryUrl: resolveLegacyId(variables?.gitRepositoryUrl),
    });
    const payload = data?.previewGitSkillPackage;
    return {
      previewGitSkillPackage: {
        ok: Boolean(payload?.ok),
        error: payload?.error ? String(payload.error) : null,
        normalizedRepositoryUrl: resolveLegacyId(payload?.normalizedRepositoryUrl) || null,
        packageName: resolveLegacyId(payload?.packageName) || null,
        branches: Array.isArray(payload?.branches)
          ? payload.branches.map((reference: any) => ({
              kind: resolveLegacyId(reference?.kind) || "branch",
              name: resolveLegacyId(reference?.name),
              fullRef: resolveLegacyId(reference?.fullRef),
            }))
          : [],
        tags: Array.isArray(payload?.tags)
          ? payload.tags.map((reference: any) => ({
              kind: resolveLegacyId(reference?.kind) || "tag",
              name: resolveLegacyId(reference?.name),
              fullRef: resolveLegacyId(reference?.fullRef),
            }))
          : [],
      },
    };
  }

  if (query === CREATE_GIT_SKILL_PACKAGE_MUTATION) {
    const data = await executeRawGraphQL(COMPANY_API_CREATE_GIT_SKILL_PACKAGE_MUTATION, {
      companyId: resolveLegacyId(variables?.companyId),
      gitRepositoryUrl: resolveLegacyId(variables?.gitRepositoryUrl),
      gitReference: resolveLegacyId(variables?.gitReference),
    });
    const payload = data?.createGitSkillPackage;
    return {
      createGitSkillPackage: {
        ok: Boolean(payload?.ok),
        error: payload?.error ? String(payload.error) : null,
        warnings: Array.isArray(payload?.warnings)
          ? payload.warnings.map((warning: any) => String(warning || "")).filter(Boolean)
          : [],
        packageId: resolveLegacyId(payload?.packageId) || null,
        gitSkillPackage: payload?.gitSkillPackage
          ? toGitSkillPackagePayload(payload.gitSkillPackage)
          : null,
        skills: Array.isArray(payload?.skills)
          ? payload.skills.map((skill: any) => toSkillPayload(skill))
          : [],
      },
    };
  }

  if (query === DELETE_GIT_SKILL_PACKAGE_MUTATION) {
    const data = await executeRawGraphQL(COMPANY_API_DELETE_GIT_SKILL_PACKAGE_MUTATION, {
      companyId: resolveLegacyId(variables?.companyId),
      id: resolveLegacyId(variables?.id),
    });
    const payload = data?.deleteGitSkillPackage;
    return {
      deleteGitSkillPackage: {
        ok: Boolean(payload?.ok),
        error: payload?.error ? String(payload.error) : null,
        deletedGitSkillPackageId: resolveLegacyId(payload?.deletedGitSkillPackageId) || null,
      },
    };
  }

  if (query === CREATE_SKILL_GROUP_MUTATION) {
    const data = await executeRawGraphQL(COMPANY_API_CREATE_SKILL_GROUP_MUTATION, {
      companyId: resolveLegacyId(variables?.companyId),
      name: resolveLegacyId(variables?.name),
      parentSkillGroupId: resolveLegacyId(variables?.parentSkillGroupId) || null,
    });
    const payload = data?.createSkillGroup;
    return {
      createSkillGroup: {
        ok: Boolean(payload?.ok),
        error: payload?.error ? String(payload.error) : null,
        skillGroup: payload?.skillGroup ? toSkillGroupPayload(payload.skillGroup) : null,
      },
    };
  }

  if (query === UPDATE_SKILL_GROUP_MUTATION) {
    const data = await executeRawGraphQL(COMPANY_API_UPDATE_SKILL_GROUP_MUTATION, {
      companyId: resolveLegacyId(variables?.companyId),
      id: resolveLegacyId(variables?.id),
      name: resolveLegacyId(variables?.name),
      parentSkillGroupId: resolveLegacyId(variables?.parentSkillGroupId) || null,
    });
    const payload = data?.updateSkillGroup;
    return {
      updateSkillGroup: {
        ok: Boolean(payload?.ok),
        error: payload?.error ? String(payload.error) : null,
        skillGroup: payload?.skillGroup ? toSkillGroupPayload(payload.skillGroup) : null,
      },
    };
  }

  if (query === DELETE_SKILL_GROUP_MUTATION) {
    const data = await executeRawGraphQL(COMPANY_API_DELETE_SKILL_GROUP_MUTATION, {
      companyId: resolveLegacyId(variables?.companyId),
      id: resolveLegacyId(variables?.id),
    });
    const payload = data?.deleteSkillGroup;
    return {
      deleteSkillGroup: {
        ok: Boolean(payload?.ok),
        error: payload?.error ? String(payload.error) : null,
        deletedSkillGroupId: resolveLegacyId(payload?.deletedSkillGroupId) || null,
      },
    };
  }

  if (query === ADD_SKILL_TO_GROUP_MUTATION) {
    const data = await executeRawGraphQL(COMPANY_API_ADD_SKILL_TO_GROUP_MUTATION, {
      companyId: resolveLegacyId(variables?.companyId),
      skillGroupId: resolveLegacyId(variables?.skillGroupId),
      skillId: resolveLegacyId(variables?.skillId),
    });
    const payload = data?.addSkillToSkillGroup;
    return {
      addSkillToGroup: {
        ok: Boolean(payload?.ok),
        error: payload?.error ? String(payload.error) : null,
      },
    };
  }

  if (query === REMOVE_SKILL_FROM_GROUP_MUTATION) {
    const data = await executeRawGraphQL(COMPANY_API_REMOVE_SKILL_FROM_GROUP_MUTATION, {
      companyId: resolveLegacyId(variables?.companyId),
      skillGroupId: resolveLegacyId(variables?.skillGroupId),
      skillId: resolveLegacyId(variables?.skillId),
    });
    const payload = data?.removeSkillFromSkillGroup;
    return {
      removeSkillFromGroup: {
        ok: Boolean(payload?.ok),
        error: payload?.error ? String(payload.error) : null,
      },
    };
  }

  if (query === CREATE_ROLE_MUTATION) {
    const data = await executeRawGraphQL(COMPANY_API_CREATE_ROLE_MUTATION, {
      companyId: resolveLegacyId(variables?.companyId),
      name: resolveLegacyId(variables?.name),
      parentRoleId: resolveLegacyId(variables?.parentRoleId) || null,
    });
    const payload = data?.createRole;
    return {
      createRole: {
        ok: Boolean(payload?.ok),
        error: payload?.error ? String(payload.error) : null,
        role: payload?.role ? toRolePayload(payload.role) : null,
      },
    };
  }

  if (query === UPDATE_ROLE_MUTATION) {
    const data = await executeRawGraphQL(COMPANY_API_UPDATE_ROLE_MUTATION, {
      companyId: resolveLegacyId(variables?.companyId),
      id: resolveLegacyId(variables?.id),
      name: resolveLegacyId(variables?.name),
      parentRoleId: resolveLegacyId(variables?.parentRoleId) || null,
    });
    const payload = data?.updateRole;
    return {
      updateRole: {
        ok: Boolean(payload?.ok),
        error: payload?.error ? String(payload.error) : null,
        role: payload?.role ? toRolePayload(payload.role) : null,
      },
    };
  }

  if (query === DELETE_ROLE_MUTATION) {
    const data = await executeRawGraphQL(COMPANY_API_DELETE_ROLE_MUTATION, {
      companyId: resolveLegacyId(variables?.companyId),
      id: resolveLegacyId(variables?.id),
    });
    const payload = data?.deleteRole;
    return {
      deleteRole: {
        ok: Boolean(payload?.ok),
        error: payload?.error ? String(payload.error) : null,
        deletedRoleId: resolveLegacyId(payload?.deletedRoleId) || null,
      },
    };
  }

  if (query === ADD_SKILL_TO_ROLE_MUTATION) {
    const data = await executeRawGraphQL(COMPANY_API_ADD_SKILL_TO_ROLE_MUTATION, {
      companyId: resolveLegacyId(variables?.companyId),
      roleId: resolveLegacyId(variables?.roleId),
      skillId: resolveLegacyId(variables?.skillId),
    });
    const payload = data?.addSkillToRole;
    return {
      addSkillToRole: {
        ok: Boolean(payload?.ok),
        error: payload?.error ? String(payload.error) : null,
      },
    };
  }

  if (query === REMOVE_SKILL_FROM_ROLE_MUTATION) {
    const data = await executeRawGraphQL(COMPANY_API_REMOVE_SKILL_FROM_ROLE_MUTATION, {
      companyId: resolveLegacyId(variables?.companyId),
      roleId: resolveLegacyId(variables?.roleId),
      skillId: resolveLegacyId(variables?.skillId),
    });
    const payload = data?.removeSkillFromRole;
    return {
      removeSkillFromRole: {
        ok: Boolean(payload?.ok),
        error: payload?.error ? String(payload.error) : null,
      },
    };
  }

  if (query === ADD_SKILL_GROUP_TO_ROLE_MUTATION) {
    const data = await executeRawGraphQL(COMPANY_API_ADD_SKILL_GROUP_TO_ROLE_MUTATION, {
      companyId: resolveLegacyId(variables?.companyId),
      roleId: resolveLegacyId(variables?.roleId),
      skillGroupId: resolveLegacyId(variables?.skillGroupId),
    });
    const payload = data?.addSkillGroupToRole;
    return {
      addSkillGroupToRole: {
        ok: Boolean(payload?.ok),
        error: payload?.error ? String(payload.error) : null,
      },
    };
  }

  if (query === REMOVE_SKILL_GROUP_FROM_ROLE_MUTATION) {
    const data = await executeRawGraphQL(COMPANY_API_REMOVE_SKILL_GROUP_FROM_ROLE_MUTATION, {
      companyId: resolveLegacyId(variables?.companyId),
      roleId: resolveLegacyId(variables?.roleId),
      skillGroupId: resolveLegacyId(variables?.skillGroupId),
    });
    const payload = data?.removeSkillGroupFromRole;
    return {
      removeSkillGroupFromRole: {
        ok: Boolean(payload?.ok),
        error: payload?.error ? String(payload.error) : null,
      },
    };
  }

  if (query === ADD_MCP_SERVER_TO_ROLE_MUTATION) {
    const data = await executeRawGraphQL(COMPANY_API_ADD_MCP_SERVER_TO_ROLE_MUTATION, {
      companyId: resolveLegacyId(variables?.companyId),
      roleId: resolveLegacyId(variables?.roleId),
      mcpServerId: resolveLegacyId(variables?.mcpServerId),
    });
    const payload = data?.addMcpServerToRole;
    return {
      addMcpServerToRole: {
        ok: Boolean(payload?.ok),
        error: payload?.error ? String(payload.error) : null,
      },
    };
  }

  if (query === REMOVE_MCP_SERVER_FROM_ROLE_MUTATION) {
    const data = await executeRawGraphQL(COMPANY_API_REMOVE_MCP_SERVER_FROM_ROLE_MUTATION, {
      companyId: resolveLegacyId(variables?.companyId),
      roleId: resolveLegacyId(variables?.roleId),
      mcpServerId: resolveLegacyId(variables?.mcpServerId),
    });
    const payload = data?.removeMcpServerFromRole;
    return {
      removeMcpServerFromRole: {
        ok: Boolean(payload?.ok),
        error: payload?.error ? String(payload.error) : null,
      },
    };
  }

  if (query === LIST_TASKS_QUERY) {
    const data = await executeRawGraphQL(COMPANY_API_LIST_TASKS_QUERY, {
      companyId: resolveLegacyId(variables?.companyId),
    });
    return {
      tasks: Array.isArray(data?.tasks)
        ? data.tasks.map((task: any) => toTaskPayload(task))
        : [],
    };
  }

  if (query === LIST_TASK_ASSIGNABLE_PRINCIPALS_QUERY) {
    const data = await executeRawGraphQL(COMPANY_API_LIST_TASK_ASSIGNABLE_PRINCIPALS_QUERY, {
      companyId: resolveLegacyId(variables?.companyId),
    });
    return {
      taskAssignablePrincipals: Array.isArray(data?.taskAssignablePrincipals)
        ? data.taskAssignablePrincipals
            .map((principal: any) => toPrincipalPayload(principal))
            .filter((principal: any) => principal?.id)
        : [],
    };
  }

  if (query === LIST_MCP_SERVERS_QUERY) {
    const data = await executeRawGraphQL(COMPANY_API_LIST_MCP_SERVERS_QUERY, {
      companyId: resolveLegacyId(variables?.companyId),
    });
    return {
      mcpServers: Array.isArray(data?.mcpServers)
        ? data.mcpServers.map((mcpServer: any) => toMcpServerPayload(mcpServer))
        : [],
    };
  }

  if (query === LIST_SECRETS_QUERY) {
    const data = await executeRawGraphQL(COMPANY_API_LIST_SECRETS_QUERY, {
      companyId: resolveLegacyId(variables?.companyId),
    });
    return {
      secrets: Array.isArray(data?.secrets)
        ? data.secrets.map((secret: any) => toSecretPayload(secret))
        : [],
    };
  }

  if (query === LIST_SECRET_VALUE_QUERY) {
    const data = await executeRawGraphQL(COMPANY_API_LIST_SECRET_VALUE_QUERY, {
      companyId: resolveLegacyId(variables?.companyId),
      secretId: resolveLegacyId(variables?.secretId),
    });
    const payload = data?.secretValue;
    return {
      secretValue: {
        ok: Boolean(payload?.ok),
        error: payload?.error ? String(payload.error) : null,
        value: payload?.value == null ? null : String(payload.value),
      },
    };
  }

  if (query === LIST_SECRET_ACCESS_LOGS_QUERY) {
    const data = await executeRawGraphQL(COMPANY_API_LIST_SECRET_ACCESS_LOGS_QUERY, {
      companyId: resolveLegacyId(variables?.companyId),
      secretId: resolveLegacyId(variables?.secretId),
      first: typeof variables?.first === "number" ? variables.first : null,
    });
    return {
      secretAccessLogs: Array.isArray(data?.secretAccessLogs)
        ? data.secretAccessLogs.map((secretAccessLog: any) => toSecretAccessLogPayload(secretAccessLog))
        : [],
    };
  }

  if (query === LIST_APPROVALS_QUERY) {
    const requestedStatus = resolveLegacyId(variables?.status).toLowerCase();
    const normalizedStatus =
      requestedStatus === "pending" || requestedStatus === "approved" || requestedStatus === "rejected"
        ? requestedStatus
        : null;
    const data = await executeRawGraphQL(COMPANY_API_LIST_APPROVALS_QUERY, {
      companyId: resolveLegacyId(variables?.companyId),
      status: normalizedStatus,
      first: typeof variables?.first === "number" ? variables.first : null,
    });
    return {
      approvals: Array.isArray(data?.approvals)
        ? data.approvals.map((approval: any) => toApprovalPayload(approval))
        : [],
    };
  }

  if (query === DELETE_GITHUB_INSTALLATION_MUTATION) {
    const data = await executeRawGraphQL(COMPANY_API_DELETE_GITHUB_INSTALLATION_MUTATION, {
      companyId: resolveLegacyId(variables?.companyId),
      installationId: resolveLegacyId(variables?.installationId),
    });
    const payload = data?.deleteGithubInstallation;
    return {
      deleteGithubInstallation: {
        ok: Boolean(payload?.ok),
        error: payload?.error ? String(payload.error) : null,
        deletedInstallationId: resolveLegacyId(payload?.deletedInstallationId) || null,
      },
    };
  }

  if (query === REFRESH_GITHUB_INSTALLATION_REPOSITORIES_MUTATION) {
    const data = await executeRawGraphQL(
      COMPANY_API_REFRESH_GITHUB_INSTALLATION_REPOSITORIES_MUTATION,
      {
        companyId: resolveLegacyId(variables?.companyId),
        installationId: resolveLegacyId(variables?.installationId),
      },
    );
    const payload = data?.refreshGithubInstallationRepositories;
    return {
      refreshGithubInstallationRepositories: {
        ok: Boolean(payload?.ok),
        error: payload?.error ? String(payload.error) : null,
        repositories: Array.isArray(payload?.repositories)
          ? payload.repositories.map((repository: any) => ({
            id: resolveLegacyId(repository?.id),
            companyId: resolveLegacyId(repository?.company?.id),
            provider: resolveLegacyId(repository?.provider) || "github",
            externalId: resolveLegacyId(repository?.externalId),
            githubInstallationId: resolveLegacyId(repository?.githubInstallation?.installationId),
            name: resolveLegacyId(repository?.name),
            fullName: resolveLegacyId(repository?.fullName),
            htmlUrl: resolveLegacyId(repository?.htmlUrl) || null,
            isPrivate: Boolean(repository?.isPrivate),
            defaultBranch: resolveLegacyId(repository?.defaultBranch) || null,
            archived: Boolean(repository?.archived),
            createdAt: String(repository?.createdAt || ""),
            updatedAt: String(repository?.updatedAt || ""),
          }))
          : [],
      },
    };
  }

  if (query === CREATE_TASK_MUTATION) {
    const data = await executeRawGraphQL(COMPANY_API_CREATE_TASK_MUTATION, {
      companyId: resolveLegacyId(variables?.companyId),
      name: String(variables?.name || "").trim(),
      description: String(variables?.description || "").trim() || null,
      acceptanceCriteria: String(variables?.acceptanceCriteria || "").trim() || null,
      status: resolveLegacyId(variables?.status) || null,
      assigneePrincipalId: resolveLegacyId(variables?.assigneePrincipalId) || null,
      parentTaskId: resolveLegacyId(variables?.parentTaskId) || null,
      dependencyTaskIds: normalizeUniqueStringList(variables?.dependencyTaskIds || []),
    });
    const payload = data?.createTask;
    return {
      createTask: {
        ok: Boolean(payload?.ok),
        error: payload?.error ? String(payload.error) : null,
        task: payload?.task ? toTaskPayload(payload.task) : null,
      },
    };
  }

  if (query === SET_TASK_PARENT_MUTATION) {
    const data = await executeRawGraphQL(COMPANY_API_SET_TASK_PARENT_MUTATION, {
      companyId: resolveLegacyId(variables?.companyId),
      taskId: resolveLegacyId(variables?.taskId),
      parentTaskId: resolveLegacyId(variables?.parentTaskId) || null,
    });
    const payload = data?.setTaskParent;
    return {
      setTaskParent: {
        ok: Boolean(payload?.ok),
        error: payload?.error ? String(payload.error) : null,
        task: payload?.task ? toTaskPayload(payload.task) : null,
      },
    };
  }

  if (query === SET_TASK_ASSIGNEE_PRINCIPAL_MUTATION) {
    const data = await executeRawGraphQL(COMPANY_API_SET_TASK_ASSIGNEE_PRINCIPAL_MUTATION, {
      companyId: resolveLegacyId(variables?.companyId),
      taskId: resolveLegacyId(variables?.taskId),
      assigneePrincipalId: resolveLegacyId(variables?.assigneePrincipalId) || null,
    });
    const payload = data?.setTaskAssigneePrincipal;
    return {
      setTaskAssigneePrincipal: {
        ok: Boolean(payload?.ok),
        error: payload?.error ? String(payload.error) : null,
        task: payload?.task ? toTaskPayload(payload.task) : null,
      },
    };
  }

  if (query === SET_TASK_STATUS_MUTATION) {
    const data = await executeRawGraphQL(COMPANY_API_SET_TASK_STATUS_MUTATION, {
      companyId: resolveLegacyId(variables?.companyId),
      taskId: resolveLegacyId(variables?.taskId),
      status: resolveLegacyId(variables?.status),
    });
    const payload = data?.setTaskStatus;
    return {
      setTaskStatus: {
        ok: Boolean(payload?.ok),
        error: payload?.error ? String(payload.error) : null,
        task: payload?.task ? toTaskPayload(payload.task) : null,
      },
    };
  }

  if (query === ADD_TASK_DEPENDENCY_MUTATION) {
    const data = await executeRawGraphQL(COMPANY_API_ADD_TASK_DEPENDENCY_MUTATION, {
      companyId: resolveLegacyId(variables?.companyId),
      taskId: resolveLegacyId(variables?.taskId),
      dependencyTaskId: resolveLegacyId(variables?.dependencyTaskId),
    });
    const payload = data?.addTaskDependency;
    return {
      addTaskDependency: {
        ok: Boolean(payload?.ok),
        error: payload?.error ? String(payload.error) : null,
        task: payload?.task ? toTaskPayload(payload.task) : null,
      },
    };
  }

  if (query === REMOVE_TASK_DEPENDENCY_MUTATION) {
    const data = await executeRawGraphQL(COMPANY_API_REMOVE_TASK_DEPENDENCY_MUTATION, {
      companyId: resolveLegacyId(variables?.companyId),
      taskId: resolveLegacyId(variables?.taskId),
      dependencyTaskId: resolveLegacyId(variables?.dependencyTaskId),
    });
    const payload = data?.removeTaskDependency;
    return {
      removeTaskDependency: {
        ok: Boolean(payload?.ok),
        error: payload?.error ? String(payload.error) : null,
        task: payload?.task ? toTaskPayload(payload.task) : null,
      },
    };
  }

  if (query === DELETE_TASK_MUTATION) {
    const data = await executeRawGraphQL(COMPANY_API_DELETE_TASK_MUTATION, {
      companyId: resolveLegacyId(variables?.companyId),
      id: resolveLegacyId(variables?.id),
    });
    const payload = data?.deleteTask;
    return {
      deleteTask: {
        ok: Boolean(payload?.ok),
        error: payload?.error ? String(payload.error) : null,
        deletedTaskId: resolveLegacyId(payload?.deletedTaskId) || null,
      },
    };
  }

  if (query === BATCH_DELETE_TASKS_MUTATION) {
    const data = await executeRawGraphQL(COMPANY_API_BATCH_DELETE_TASKS_MUTATION, {
      companyId: resolveLegacyId(variables?.companyId),
      ids: normalizeUniqueStringList(variables?.ids || []),
    });
    const payload = data?.batchDeleteTasks;
    return {
      batchDeleteTasks: {
        ok: Boolean(payload?.ok),
        error: payload?.error ? String(payload.error) : null,
        deletedTaskIds: Array.isArray(payload?.deletedTaskIds)
          ? payload.deletedTaskIds.map((taskId: any) => resolveLegacyId(taskId)).filter(Boolean)
          : [],
      },
    };
  }

  if (query === BATCH_EXECUTE_TASKS_MUTATION) {
    const data = await executeRawGraphQL(COMPANY_API_BATCH_EXECUTE_TASKS_MUTATION, {
      taskIds: normalizeUniqueStringList(variables?.taskIds || []),
      agentId: resolveLegacyId(variables?.agentId),
    });
    const payload = data?.batchExecuteTasks;
    return {
      batchExecuteTasks: {
        ok: Boolean(payload?.ok),
        error: payload?.error ? String(payload.error) : null,
        tasks: Array.isArray(payload?.tasks)
          ? payload.tasks.map((task: any) => toTaskPayload(task))
          : [],
      },
    };
  }

  if (query === CREATE_TASK_COMMENT_MUTATION) {
    const data = await executeRawGraphQL(COMPANY_API_CREATE_TASK_COMMENT_MUTATION, {
      companyId: resolveLegacyId(variables?.companyId),
      taskId: resolveLegacyId(variables?.taskId),
      comment: String(variables?.comment || "").trim(),
    });
    const payload = data?.createTaskComment;
    return {
      createTaskComment: {
        ok: Boolean(payload?.ok),
        error: payload?.error ? String(payload.error) : null,
        taskComment: payload?.taskComment ? toTaskCommentPayload(payload.taskComment) : null,
      },
    };
  }

  if (query === CREATE_SKILL_MUTATION) {
    return {
      ...unsupportedMutation("createSkill"),
      createSkill: {
        ...unsupportedMutation("createSkill").createSkill,
        skill: null,
      },
    };
  }

  if (query === UPDATE_SKILL_MUTATION) {
    return {
      ...unsupportedMutation("updateSkill"),
      updateSkill: {
        ...unsupportedMutation("updateSkill").updateSkill,
        skill: null,
      },
    };
  }

  if (query === DELETE_SKILL_MUTATION) {
    return {
      ...unsupportedMutation("deleteSkill"),
      deleteSkill: {
        ...unsupportedMutation("deleteSkill").deleteSkill,
        deletedSkillId: null,
      },
    };
  }

  if (query === CREATE_MCP_SERVER_MUTATION) {
    const data = await executeRawGraphQL(COMPANY_API_CREATE_MCP_SERVER_MUTATION, {
      companyId: resolveLegacyId(variables?.companyId),
      name: resolveLegacyId(variables?.name),
      transportType: resolveLegacyId(variables?.transportType) || null,
      url: resolveLegacyId(variables?.url) || null,
      command: resolveLegacyId(variables?.command) || null,
      args: Array.isArray(variables?.args)
        ? variables.args.map((arg: any) => String(arg || "").trim()).filter(Boolean)
        : [],
      envVars: Array.isArray(variables?.envVars)
        ? variables.envVars
            .map((envVar: any) => ({
              key: String(envVar?.key || "").trim(),
              value: String(envVar?.value || "").trim(),
            }))
            .filter((envVar: any) => envVar.key)
        : [],
      authType: resolveLegacyId(variables?.authType) || null,
      bearerTokenSecretId: resolveLegacyId(variables?.bearerTokenSecretId) || null,
      customHeaders: Array.isArray(variables?.customHeaders)
        ? variables.customHeaders
            .map((header: any) => ({
              key: String(header?.key || "").trim(),
              value: String(header?.value || "").trim(),
            }))
            .filter((header: any) => header.key && header.value)
        : [],
      enabled: typeof variables?.enabled === "boolean" ? variables.enabled : null,
    });
    const payload = data?.createMcpServer;
    return {
      createMcpServer: {
        ok: Boolean(payload?.ok),
        error: payload?.error ? String(payload.error) : null,
        mcpServer: payload?.mcpServer ? toMcpServerPayload(payload.mcpServer) : null,
      },
    };
  }

  if (query === UPDATE_MCP_SERVER_MUTATION) {
    const data = await executeRawGraphQL(COMPANY_API_UPDATE_MCP_SERVER_MUTATION, {
      companyId: resolveLegacyId(variables?.companyId),
      id: resolveLegacyId(variables?.id),
      name: resolveLegacyId(variables?.name),
      transportType: resolveLegacyId(variables?.transportType) || null,
      url: resolveLegacyId(variables?.url) || null,
      command: resolveLegacyId(variables?.command) || null,
      args: Array.isArray(variables?.args)
        ? variables.args.map((arg: any) => String(arg || "").trim()).filter(Boolean)
        : [],
      envVars: Array.isArray(variables?.envVars)
        ? variables.envVars
            .map((envVar: any) => ({
              key: String(envVar?.key || "").trim(),
              value: String(envVar?.value || "").trim(),
            }))
            .filter((envVar: any) => envVar.key)
        : [],
      authType: resolveLegacyId(variables?.authType) || null,
      bearerTokenSecretId: resolveLegacyId(variables?.bearerTokenSecretId) || null,
      customHeaders: Array.isArray(variables?.customHeaders)
        ? variables.customHeaders
            .map((header: any) => ({
              key: String(header?.key || "").trim(),
              value: String(header?.value || "").trim(),
            }))
            .filter((header: any) => header.key && header.value)
        : [],
      enabled: typeof variables?.enabled === "boolean" ? variables.enabled : null,
    });
    const payload = data?.updateMcpServer;
    return {
      updateMcpServer: {
        ok: Boolean(payload?.ok),
        error: payload?.error ? String(payload.error) : null,
        mcpServer: payload?.mcpServer ? toMcpServerPayload(payload.mcpServer) : null,
      },
    };
  }

  if (query === DELETE_MCP_SERVER_MUTATION) {
    const data = await executeRawGraphQL(COMPANY_API_DELETE_MCP_SERVER_MUTATION, {
      companyId: resolveLegacyId(variables?.companyId),
      id: resolveLegacyId(variables?.id),
    });
    const payload = data?.deleteMcpServer;
    return {
      deleteMcpServer: {
        ok: Boolean(payload?.ok),
        error: payload?.error ? String(payload.error) : null,
        deletedMcpServerId: resolveLegacyId(payload?.deletedMcpServerId) || null,
      },
    };
  }

  if (query === CREATE_SECRET_MUTATION) {
    const data = await executeRawGraphQL(COMPANY_API_CREATE_SECRET_MUTATION, {
      companyId: resolveLegacyId(variables?.companyId),
      name: resolveLegacyId(variables?.name),
      description: resolveLegacyId(variables?.description),
      value: String(variables?.value || ""),
    });
    const payload = data?.createSecret;
    return {
      createSecret: {
        ok: Boolean(payload?.ok),
        error: payload?.error ? String(payload.error) : null,
        secret: payload?.secret ? toSecretPayload(payload.secret) : null,
      },
    };
  }

  if (query === UPDATE_SECRET_MUTATION) {
    const nextVariables: any = {
      companyId: resolveLegacyId(variables?.companyId),
      id: resolveLegacyId(variables?.id),
      name: resolveLegacyId(variables?.name),
      description: resolveLegacyId(variables?.description),
    };
    if (Object.prototype.hasOwnProperty.call(variables || {}, "value")) {
      const nextValue = variables?.value;
      nextVariables.value = nextValue == null ? null : String(nextValue);
    }

    const data = await executeRawGraphQL(COMPANY_API_UPDATE_SECRET_MUTATION, nextVariables);
    const payload = data?.updateSecret;
    return {
      updateSecret: {
        ok: Boolean(payload?.ok),
        error: payload?.error ? String(payload.error) : null,
        secret: payload?.secret ? toSecretPayload(payload.secret) : null,
      },
    };
  }

  if (query === DELETE_SECRET_MUTATION) {
    const data = await executeRawGraphQL(COMPANY_API_DELETE_SECRET_MUTATION, {
      companyId: resolveLegacyId(variables?.companyId),
      id: resolveLegacyId(variables?.id),
    });
    const payload = data?.deleteSecret;
    return {
      deleteSecret: {
        ok: Boolean(payload?.ok),
        error: payload?.error ? String(payload.error) : null,
        deletedSecretId: resolveLegacyId(payload?.deletedSecretId) || null,
      },
    };
  }

  if (query === APPROVE_APPROVAL_MUTATION) {
    const data = await executeRawGraphQL(COMPANY_API_APPROVE_APPROVAL_MUTATION, {
      companyId: resolveLegacyId(variables?.companyId),
      id: resolveLegacyId(variables?.id),
    });
    const payload = data?.approveApproval;
    return {
      approveApproval: {
        ok: Boolean(payload?.ok),
        error: payload?.error ? String(payload.error) : null,
        approval: payload?.approval ? toApprovalPayload(payload.approval) : null,
      },
    };
  }

  if (query === REJECT_APPROVAL_MUTATION) {
    const nextVariables: any = {
      companyId: resolveLegacyId(variables?.companyId),
      id: resolveLegacyId(variables?.id),
    };
    if (Object.prototype.hasOwnProperty.call(variables || {}, "rejectionReason")) {
      const nextRejectionReason = String(variables?.rejectionReason || "").trim();
      nextVariables.rejectionReason = nextRejectionReason || null;
    }
    const data = await executeRawGraphQL(COMPANY_API_REJECT_APPROVAL_MUTATION, nextVariables);
    const payload = data?.rejectApproval;
    return {
      rejectApproval: {
        ok: Boolean(payload?.ok),
        error: payload?.error ? String(payload.error) : null,
        approval: payload?.approval ? toApprovalPayload(payload.approval) : null,
      },
    };
  }

  if (query === DELETE_APPROVAL_MUTATION) {
    const data = await executeRawGraphQL(COMPANY_API_DELETE_APPROVAL_MUTATION, {
      companyId: resolveLegacyId(variables?.companyId),
      id: resolveLegacyId(variables?.id),
    });
    const payload = data?.deleteApproval;
    return {
      deleteApproval: {
        ok: Boolean(payload?.ok),
        error: payload?.error ? String(payload.error) : null,
        deletedApprovalId: resolveLegacyId(payload?.deletedApprovalId) || null,
      },
    };
  }

  if (query === INITIALIZE_AGENT_MUTATION) {
    return unsupportedMutation("initializeAgentRunner");
  }

  if (query === RETRY_AGENT_SKILL_INSTALL_MUTATION) {
    return {
      ...unsupportedMutation("retryAgentSkillInstall"),
      retryAgentSkillInstall: {
        ...unsupportedMutation("retryAgentSkillInstall").retryAgentSkillInstall,
        requestId: null,
        installedSkill: null,
      },
    };
  }

  throw new Error("Unsupported frontend operation for companyhelm-api.");
}

function waitForCanonicalThreadViaSubscription({
  companyId,
  agentId,
  requestedThreadId,
  knownThreadIds,
  timeoutMs = 15000,
}: any) {
  return new Promise((resolve: any) => {
    let settled = false;
    const knownIds = new Set(
      (Array.isArray(knownThreadIds) ? knownThreadIds : [])
        .map((threadId: any) => String(threadId || "").trim())
        .filter(Boolean),
    );

    const finalize = (threadOrNull: any) => {
      if (settled) {
        return;
      }
      settled = true;
      clearTimeout(timeoutId);
      unsubscribe();
      resolve(threadOrNull);
    };

    const resolveFromThreadNodes = (threadNodes: any) => {
      const nextSessions = threadNodes.map((threadNode: any) => toLegacyThreadPayload(threadNode));
      const readyRequestedThread = nextSessions.find(
        (thread: any) => thread.id === requestedThreadId && thread.status === "ready",
      );
      const readyNewThread = nextSessions.find(
        (thread: any) => !knownIds.has(thread.id) && thread.status === "ready",
      );
      const remappedThread = nextSessions.find(
        (thread: any) => !knownIds.has(thread.id) && thread.id !== requestedThreadId,
      );
      const resolvedThread = readyRequestedThread || readyNewThread || remappedThread || null;
      if (resolvedThread) {
        finalize(resolvedThread);
      }
    };

    const timeoutId = setTimeout(() => finalize(null), timeoutMs);

    const unsubscribe = subscribeGraphQL({
      query: AGENT_THREADS_SUBSCRIPTION,
      variables: {
        companyId,
        agentId,
        first: 500,
      },
      onData: (payload: any) => {
        const nextThreadNodes = toConnectionNodes(payload?.agentThreadsUpdated);
        resolveFromThreadNodes(nextThreadNodes);
      },
      onError: () => {},
    });

    executeRawGraphQL(COMPANY_API_LIST_THREADS_CONNECTION_QUERY, {
      companyId,
      agentId,
      first: 500,
    })
      .then((data: any) => {
        if (settled) {
          return;
        }
        const initialThreadNodes = toConnectionNodes(data?.threads);
        resolveFromThreadNodes(initialThreadNodes);
      })
      .catch(() => {});
  });
}

function App() {
  const [activePage, setActivePage] = useState<any>(() => getPageFromPathname());
  const [agentsRoute, setAgentsRoute] = useState<any>(() => getAgentsRouteFromPathname());
  const [skillsRoute, setSkillsRoute] = useState<any>(() => getSkillsRouteFromPathname());
  const [rolesRoute, setRolesRoute] = useState<any>(() => getRolesRouteFromPathname());
  const [gitSkillPackagesRoute, setGitSkillPackagesRoute] = useState<any>(
    () => getGitSkillPackagesRouteFromPathname(),
  );
  const [runnersRoute, setRunnersRoute] = useState<any>(() => getRunnersRouteFromPathname());
  const [chatsRoute, setChatsRoute] = useState<any>(() => getChatsRouteFromLocation());
  const [companies, setCompanies] = useState<any>([]);
  const [isLoadingCompanies, setIsLoadingCompanies] = useState<any>(true);
  const [companyError, setCompanyError] = useState<any>("");
  const [selectedCompanyId, setSelectedCompanyId] = useState<any>(() => getPersistedCompanyId());
  const [newCompanyName, setNewCompanyName] = useState<any>("");
  const [isCreatingCompany, setIsCreatingCompany] = useState<any>(false);
  const [isDeletingCompany, setIsDeletingCompany] = useState<any>(false);
  const [githubAppConfig, setGithubAppConfig] = useState<any>({
    appClientId: "",
    appLink: DEFAULT_GITHUB_APP_INSTALL_URL,
  });
  const [isLoadingGithubAppConfig, setIsLoadingGithubAppConfig] = useState<any>(false);
  const [githubAppConfigError, setGithubAppConfigError] = useState<any>("");
  const [githubInstallations, setGithubInstallations] = useState<any>([]);
  const [githubRepositories, setGithubRepositories] = useState<any>([]);
  const [isLoadingGithubInstallations, setIsLoadingGithubInstallations] = useState<any>(false);
  const [isLoadingGithubRepositories, setIsLoadingGithubRepositories] = useState<any>(false);
  const [githubInstallationError, setGithubInstallationError] = useState<any>("");
  const [githubInstallationNotice, setGithubInstallationNotice] = useState<any>("");
  const [isAddingGithubInstallationFromCallback, setIsAddingGithubInstallationFromCallback] = useState<any>(false);
  const [deletingGithubInstallationId, setDeletingGithubInstallationId] = useState<any>("");
  const [refreshingGithubInstallationId, setRefreshingGithubInstallationId] = useState<any>("");
  const [pendingGithubInstallCallback, setPendingGithubInstallCallback] = useState<any>(
    () => parseGithubInstallCallbackFromLocation(),
  );
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLoadingCurrentUser, setIsLoadingCurrentUser] = useState<any>(false);
  const [currentUserError, setCurrentUserError] = useState<any>("");
  const [tasks, setTasks] = useState<any>([]);
  const [skills, setSkills] = useState<any>([]);
  const [roles, setRoles] = useState<any>([]);
  const [skillGroups, setSkillGroups] = useState<any>([]);
  const [gitSkillPackages, setGitSkillPackages] = useState<any>([]);
  const [secrets, setSecrets] = useState<any>([]);
  const [approvals, setApprovals] = useState<any>([]);
  const [mcpServers, setMcpServers] = useState<any>([]);
  const [agentRunners, setAgentRunners] = useState<any>([]);
  const [hasLoadedAgentRunners, setHasLoadedAgentRunners] = useState<any>(false);
  const [hasLoadedSkills, setHasLoadedSkills] = useState<any>(false);
  const [hasLoadedRoles, setHasLoadedRoles] = useState<any>(false);
  const [hasLoadedSkillGroups, setHasLoadedSkillGroups] = useState<any>(false);
  const [hasLoadedSecrets, setHasLoadedSecrets] = useState<any>(false);
  const [hasLoadedMcpServers, setHasLoadedMcpServers] = useState<any>(false);
  const [agents, setAgents] = useState<any>([]);
  const [taskAssignablePrincipals, setTaskAssignablePrincipals] = useState<any>([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState<any>(false);
  const [isLoadingSkills, setIsLoadingSkills] = useState<any>(false);
  const [isLoadingRoles, setIsLoadingRoles] = useState<any>(false);
  const [isLoadingSkillGroups, setIsLoadingSkillGroups] = useState<any>(false);
  const [isLoadingGitSkillPackages, setIsLoadingGitSkillPackages] = useState<any>(false);
  const [isLoadingSecrets, setIsLoadingSecrets] = useState<any>(false);
  const [isLoadingApprovals, setIsLoadingApprovals] = useState<any>(false);
  const [isLoadingMcpServers, setIsLoadingMcpServers] = useState<any>(false);
  const [isLoadingRunners, setIsLoadingRunners] = useState<any>(false);
  const [isLoadingAgents, setIsLoadingAgents] = useState<any>(false);
  const [taskError, setTaskError] = useState<any>("");
  const [skillError, setSkillError] = useState<any>("");
  const [secretError, setSecretError] = useState<any>("");
  const [approvalError, setApprovalError] = useState<any>("");
  const [mcpServerError, setMcpServerError] = useState<any>("");
  const [runnerError, setRunnerError] = useState<any>("");
  const [agentError, setAgentError] = useState<any>("");
  const [isSubmittingTask, setIsSubmittingTask] = useState<any>(false);
  const [isCreatingSkill, setIsCreatingSkill] = useState<any>(false);
  const [isCreatingSecret, setIsCreatingSecret] = useState<any>(false);
  const [isCreatingMcpServer, setIsCreatingMcpServer] = useState<any>(false);
  const [savingTaskId, setSavingTaskId] = useState<any>(null);
  const [commentingTaskId, setCommentingTaskId] = useState<any>(null);
  const [savingSkillId, setSavingSkillId] = useState<any>(null);
  const [savingSecretId, setSavingSecretId] = useState<any>(null);
  const [approvingApprovalId, setApprovingApprovalId] = useState<any>(null);
  const [rejectingApprovalId, setRejectingApprovalId] = useState<any>(null);
  const [savingMcpServerId, setSavingMcpServerId] = useState<any>(null);
  const [deletingTaskId, setDeletingTaskId] = useState<any>(null);
  const [deletingSkillId, setDeletingSkillId] = useState<any>(null);
  const [deletingSecretId, setDeletingSecretId] = useState<any>(null);
  const [deletingApprovalId, setDeletingApprovalId] = useState<any>(null);
  const [deletingMcpServerId, setDeletingMcpServerId] = useState<any>(null);
  const [deletingRunnerId, setDeletingRunnerId] = useState<any>(null);
  const [regeneratingRunnerId, setRegeneratingRunnerId] = useState<any>(null);
  const [isCreatingRunner, setIsCreatingRunner] = useState<any>(false);
  const [runnerNameDraft, setRunnerNameDraft] = useState<any>("");
  const [runnerSecretsById, setRunnerSecretsById] = useState<any>({});
  const [isCreatingAgent, setIsCreatingAgent] = useState<any>(false);
  const [savingAgentId, setSavingAgentId] = useState<any>(null);
  const [deletingAgentId, setDeletingAgentId] = useState<any>(null);
  const [initializingAgentId, setInitializingAgentId] = useState<any>(null);
  const [retryingAgentSkillInstallKey, setRetryingAgentSkillInstallKey] = useState<any>("");
  const [name, setName] = useState<any>("");
  const [description, setDescription] = useState<any>("");
  const [taskAssigneePrincipalId, setTaskAssigneePrincipalId] = useState<any>("");
  const [taskStatus, setTaskStatus] = useState<any>("draft");
  const [parentTaskId, setParentTaskId] = useState<any>("");
  const [dependencyTaskIds, setDependencyTaskIds] = useState<any>([]);
  const [relationshipDrafts, setRelationshipDrafts] = useState<any>({});
  const [skillName, setSkillName] = useState<any>("");
  const [skillType, setSkillType] = useState<any>(SKILL_TYPE_TEXT);
  const [skillSkillsMpPackageName, setSkillSkillsMpPackageName] = useState<any>("");
  const [skillDescription, setSkillDescription] = useState<any>("");
  const [skillInstructions, setSkillInstructions] = useState<any>("");
  const [skillDrafts, setSkillDrafts] = useState<any>({});
  const [secretName, setSecretName] = useState<any>("");
  const [secretDescription, setSecretDescription] = useState<any>("");
  const [secretValue, setSecretValue] = useState<any>("");
  const [secretDrafts, setSecretDrafts] = useState<any>({});
  const [rejectionReasonDraftByApprovalId, setRejectionReasonDraftByApprovalId] = useState<any>({});
  const [secretAccessLogsBySecretId, setSecretAccessLogsBySecretId] = useState<any>({});
  const [isLoadingSecretAccessLogsBySecretId, setIsLoadingSecretAccessLogsBySecretId] = useState<any>({});
  const [secretAccessLogErrorBySecretId, setSecretAccessLogErrorBySecretId] = useState<any>({});
  const [secretValuesBySecretId, setSecretValuesBySecretId] = useState<any>({});
  const [isLoadingSecretValuesBySecretId, setIsLoadingSecretValuesBySecretId] = useState<any>({});
  const [secretValueErrorBySecretId, setSecretValueErrorBySecretId] = useState<any>({});
  const [mcpServerName, setMcpServerName] = useState<any>("");
  const [mcpServerTransportType, setMcpServerTransportType] = useState<any>(
    MCP_TRANSPORT_TYPE_STREAMABLE_HTTP,
  );
  const [mcpServerUrl, setMcpServerUrl] = useState<any>("");
  const [mcpServerCommand, setMcpServerCommand] = useState<any>("");
  const [mcpServerArgsText, setMcpServerArgsText] = useState<any>("");
  const [mcpServerEnvVarsText, setMcpServerEnvVarsText] = useState<any>("");
  const [mcpServerAuthType, setMcpServerAuthType] = useState<any>(MCP_AUTH_TYPE_NONE);
  const [mcpServerBearerTokenSecretId, setMcpServerBearerTokenSecretId] = useState<any>("");
  const [mcpServerCustomHeadersText, setMcpServerCustomHeadersText] = useState<any>("");
  const [mcpServerEnabled, setMcpServerEnabled] = useState<any>(true);
  const [mcpServerDrafts, setMcpServerDrafts] = useState<any>({});
  const [agentName, setAgentName] = useState<any>("");
  const [agentRunnerId, setAgentRunnerId] = useState<any>("");
  const [agentRoleIds, setAgentRoleIds] = useState<any>([]);
  const [agentMcpServerIds, setAgentMcpServerIds] = useState<any>([]);
  const [roleSkillGroupIdsByRoleId, setRoleSkillGroupIdsByRoleId] = useState<any>({});
  const [roleMcpServerIdsByRoleId, setRoleMcpServerIdsByRoleId] = useState<any>({});
  const [agentSdk, setAgentSdk] = useState<any>(DEFAULT_AGENT_SDK);
  const [agentModel, setAgentModel] = useState<any>("");
  const [agentModelReasoningLevel, setAgentModelReasoningLevel] = useState<any>("");
  const [agentDefaultAdditionalModelInstructions, setAgentDefaultAdditionalModelInstructions] = useState<any>("");
  const [agentDrafts, setAgentDrafts] = useState<any>({});
  const [pendingEditAgentId, setPendingEditAgentId] = useState<any>("");
  const [chatAgentId, setChatAgentId] = useState<any>("");
  const [chatSessions, setChatSessions] = useState<any>([]);
  const [chatSessionsByAgent, setChatSessionsByAgent] = useState<any>({});
  const [chatSessionRunningById, setChatSessionRunningById] = useState<any>({});
  const [chatSessionId, setChatSessionId] = useState<any>("");
  const [chatSessionTitleDraft, setChatSessionTitleDraft] = useState<any>("");
  const [chatSessionAdditionalModelInstructionsDraft, setChatSessionAdditionalModelInstructionsDraft] = useState<any>("");
  const [chatSessionRenameDraft, setChatSessionRenameDraft] = useState<any>("");
  const [chatTurns, setChatTurns] = useState<any>([]);
  const [queuedChatMessages, setQueuedChatMessages] = useState<any>([]);
  const [chatDraftMessage, setChatDraftMessage] = useState<any>("");
  const [deletingChatSessionKey, setDeletingChatSessionKey] = useState<any>("");
  const [chatError, setChatError] = useState<any>("");
  const [chatIndexError, setChatIndexError] = useState<any>("");
  const [isLoadingChatIndex, setIsLoadingChatIndex] = useState<any>(false);
  const [isLoadingChatSessions, setIsLoadingChatSessions] = useState<any>(false);
  const [isCreatingChatSession, setIsCreatingChatSession] = useState<any>(false);
  const [isLoadingChat, setIsLoadingChat] = useState<any>(false);
  const [isSendingChatMessage, setIsSendingChatMessage] = useState<any>(false);
  const [isInterruptingChatTurn, setIsInterruptingChatTurn] = useState<any>(false);
  const [isUpdatingChatTitle, setIsUpdatingChatTitle] = useState<any>(false);
  const [steeringQueuedMessageId, setSteeringQueuedMessageId] = useState<any>(null);
  const [deletingQueuedMessageId, setDeletingQueuedMessageId] = useState<any>(null);
  const [isSideMenuCollapsed, setIsSideMenuCollapsed] = useState<any>(() =>
    matchesMediaQuery(SIDEBAR_COLLAPSE_MEDIA_QUERY),
  );
  const isNavigatingToChatsRef = useRef<any>(false);
  const turnLifecycleSignatureBySessionIdRef = useRef<any>(new Map<any, any>());
  const runCreateChatSessionSingleFlight = useMemo(() => createSingleFlightByKey(), []);
  const hasCompanies = companies.length > 0;
  const handleChatSessionRenameDraftChange = useCallback((nextTitle: any) => {
    setChatSessionRenameDraft(String(nextTitle || "").slice(0, THREAD_TITLE_MAX_LENGTH));
  }, []);

  const selectedCompany = useMemo(() => {
    return companies.find((company: any) => company.id === selectedCompanyId) || null;
  }, [companies, selectedCompanyId]);

  const activeSkill = useMemo(() => {
    const skillId = String(skillsRoute.skillId || "").trim();
    if (!skillId) {
      return null;
    }
    return skills.find((skill: any) => skill.id === skillId) || null;
  }, [skills, skillsRoute.skillId]);

  const activeRole = useMemo(() => {
    const roleId = String(rolesRoute.roleId || "").trim();
    if (!roleId) {
      return null;
    }
    return roles.find((role: any) => role.id === roleId) || null;
  }, [rolesRoute.roleId, roles]);

  const activeGitSkillPackage = useMemo(() => {
    const packageId = String(gitSkillPackagesRoute.packageId || "").trim();
    if (!packageId) {
      return null;
    }
    return gitSkillPackages.find((gitSkillPackage: any) => gitSkillPackage.id === packageId) || null;
  }, [gitSkillPackages, gitSkillPackagesRoute.packageId]);

  const githubAppInstallUrl = useMemo(() => {
    return buildGithubAppInstallUrl({
      appLink: githubAppConfig.appLink,
      companyId: selectedCompanyId,
    });
  }, [githubAppConfig.appLink, selectedCompanyId]);

  const agentRunnerLookup = useMemo(() => {
    return agentRunners.reduce((map: any, runner: any) => {
      map.set(runner.id, runner);
      return map;
    }, new Map<any, any>());
  }, [agentRunners]);

  const runnerCodexModelEntriesById = useMemo(() => {
    return agentRunners.reduce((map: any, runner: any) => {
      map.set(runner.id, normalizeRunnerCodexAvailableModels(runner));
      return map;
    }, new Map<any, any>());
  }, [agentRunners]);

  const getChatCreateBlockedReasonForAgent = useCallback(
    (agent: any) => getChatCreateBlockedReason(agent, agentRunnerLookup),
    [agentRunnerLookup],
  );

  const getChatCreateBlockedReasonByAgentId = useCallback(
    (agentId: any) => {
      const resolvedAgentId = String(agentId || "").trim();
      if (!resolvedAgentId) {
        return "Select an agent before creating a chat.";
      }
      const selectedAgent = agents.find((agent: any) => agent.id === resolvedAgentId) || null;
      if (!selectedAgent) {
        return `Agent ${resolvedAgentId} was not found for this company.`;
      }
      return getChatCreateBlockedReasonForAgent(selectedAgent);
    },
    [agents, getChatCreateBlockedReasonForAgent],
  );

  const resolvedChatSessionId = useMemo(
    () => resolveLegacyId(chatSessionId, agentsRoute.sessionId, chatsRoute.threadId),
    [chatSessionId, agentsRoute.sessionId, chatsRoute.threadId],
  );

  const selectedChatSession = useMemo(() => {
    const existingSession = chatSessions.find((session: any) => session.id === resolvedChatSessionId);
    if (existingSession) {
      return existingSession;
    }

    const resolvedSessionId = String(resolvedChatSessionId || "").trim();
    if (!resolvedSessionId || !chatAgentId || !selectedCompanyId) {
      return null;
    }

    const metadata = companyApiThreadMetadataById.get(resolvedSessionId) || {};
    const nowIso = new Date().toISOString();
    return {
      id: resolvedSessionId,
      threadId: resolvedSessionId,
      companyId: selectedCompanyId,
      agentId: chatAgentId,
      runnerId: resolveLegacyId(metadata.runnerId) || null,
      title: resolveLegacyId(metadata.title) || `Thread ${resolvedSessionId.slice(0, 8)}`,
      status: "ready",
      currentModelId: resolveLegacyId(metadata.currentModelId) || null,
      currentModelName: resolveLegacyId(metadata.currentModelName) || null,
      currentReasoningLevel: resolveLegacyId(metadata.currentReasoningLevel) || null,
      additionalModelInstructions:
        normalizeOptionalInstructions(metadata.additionalModelInstructions) || null,
      createdAt: resolveLegacyId(metadata.createdAt) || nowIso,
      updatedAt: resolveLegacyId(metadata.updatedAt) || nowIso,
    };
  }, [chatSessions, resolvedChatSessionId, chatAgentId, selectedCompanyId]);

  const setChatSessionRunningState = useCallback((sessionId: any, isRunning: any) => {
    const resolvedSessionId = String(sessionId || "").trim();
    if (!resolvedSessionId) {
      return;
    }
    setChatSessionRunningById((currentState: any) => {
      const currentlyRunning = Boolean(currentState[resolvedSessionId]);
      if (currentlyRunning === isRunning) {
        return currentState;
      }
      if (isRunning) {
        return {
          ...currentState,
          [resolvedSessionId]: true,
        };
      }
      if (!(resolvedSessionId in currentState)) {
        return currentState;
      }
      const nextState = { ...currentState };
      delete nextState[resolvedSessionId];
      return nextState;
    });
  }, []);

  const syncChatSessionRunningStateFromSessions = useCallback((sessions: any) => {
    const sessionsSnapshot = Array.isArray(sessions) ? sessions : [];
    if (sessionsSnapshot.length === 0) {
      return;
    }

    setChatSessionRunningById((currentState: any) => {
      let nextState = currentState;
      let hasChanges = false;

      for (const session of sessionsSnapshot) {
        const sessionId = String(session?.id || "").trim();
        if (!sessionId) {
          continue;
        }

        const shouldBeRunning = normalizeChatStatus(session?.status) === "running";
        const currentlyRunning = Boolean(nextState[sessionId]);
        if (shouldBeRunning === currentlyRunning) {
          continue;
        }

        if (nextState === currentState) {
          nextState = { ...currentState };
        }

        if (shouldBeRunning) {
          nextState[sessionId] = true;
        } else {
          delete nextState[sessionId];
        }
        hasChanges = true;
      }

      return hasChanges ? nextState : currentState;
    });
  }, []);

  const applyChatSessionsSnapshotForAgent = useCallback((agentId: any, sessions: any) => {
    const resolvedAgentId = String(agentId || "").trim();
    const sessionsSnapshot = Array.isArray(sessions) ? sessions : [];
    if (!resolvedAgentId) {
      return;
    }

    setChatSessionsByAgent((currentSessionsByAgent: any) => ({
      ...currentSessionsByAgent,
      [resolvedAgentId]: sessionsSnapshot,
    }));

    if (chatAgentId === resolvedAgentId) {
      setChatSessions(sessionsSnapshot);
    }

    syncChatSessionRunningStateFromSessions(sessionsSnapshot);
  }, [chatAgentId, syncChatSessionRunningStateFromSessions]);

  const breadcrumbItems = useMemo(() => {
    const currentPageLabel = NAV_ITEM_LOOKUP.get(activePage)?.label || "Dashboard";

    const getAgentLabel = (agentId: any) => {
      const resolvedAgentId = String(agentId || "").trim();
      if (!resolvedAgentId) {
        return "Agent";
      }
      const matchingAgent = agents.find((agent: any) => agent.id === resolvedAgentId);
      return matchingAgent?.name || `Agent ${resolvedAgentId.slice(0, 8)}`;
    };

    const getChatLabel = (sessionId: any) => {
      const resolvedSessionId = String(sessionId || "").trim();
      if (!resolvedSessionId) {
        return "Chat";
      }
      const chatTitle = String(selectedChatSession?.title || "").trim();
      return chatTitle || `Chat ${resolvedSessionId.slice(0, 8)}`;
    };

    const getSkillLabel = (skillId: any) => {
      const resolvedSkillId = String(skillId || "").trim();
      if (!resolvedSkillId) {
        return "Skill";
      }
      const matchingSkill = skills.find((skill: any) => skill.id === resolvedSkillId);
      return matchingSkill?.name || `Skill ${resolvedSkillId.slice(0, 8)}`;
    };

    const getRoleLabel = (roleId: any) => {
      const resolvedRoleId = String(roleId || "").trim();
      if (!resolvedRoleId) {
        return "Role";
      }
      const matchingRole = roles.find((role: any) => role.id === resolvedRoleId);
      return matchingRole?.name || `Role ${resolvedRoleId.slice(0, 8)}`;
    };

    const getGitSkillPackageLabel = (packageId: any) => {
      const resolvedPackageId = String(packageId || "").trim();
      if (!resolvedPackageId) {
        return "Git Skill Package";
      }
      const matchingPackage = gitSkillPackages.find((pkg: any) => pkg.id === resolvedPackageId);
      return matchingPackage?.packageName || `Package ${resolvedPackageId.slice(0, 8)}`;
    };

    if (activePage === "agents") {
      if (agentsRoute.view === "list" || !agentsRoute.agentId) {
        return [{ label: "Agents", href: "/agents" }];
      }

      const agentHref = `/agents/${agentsRoute.agentId}`;
      const items = [
        { label: "Agents", href: "/agents" },
        { label: getAgentLabel(agentsRoute.agentId), href: agentHref },
      ];

      if (agentsRoute.view === "chat" && agentsRoute.sessionId) {
        const chatHref = getChatsPath({
          agentId: agentsRoute.agentId,
          threadId: agentsRoute.sessionId,
        });
        return [
          ...items,
          { label: getChatLabel(agentsRoute.sessionId), href: chatHref },
        ];
      }

      return items;
    }

    if (activePage === "chats") {
      const items = [{ label: "Chats", href: "/chats" }];
      if (chatAgentId && resolvedChatSessionId) {
        items.push({ label: getAgentLabel(chatAgentId), href: getChatsPath({ agentId: chatAgentId }) });
        items.push({
          label: getChatLabel(resolvedChatSessionId),
          href: getChatsPath({ agentId: chatAgentId, threadId: resolvedChatSessionId }),
        });
      }
      return items;
    }

    if (activePage === "skills" && skillsRoute.view === "detail" && skillsRoute.skillId) {
      return [
        { label: "Skills", href: "/skills" },
        { label: getSkillLabel(skillsRoute.skillId), href: `/skills/${skillsRoute.skillId}` },
      ];
    }

    if (activePage === "roles" && rolesRoute.view === "detail" && rolesRoute.roleId) {
      return [
        { label: "Roles", href: "/roles" },
        { label: getRoleLabel(rolesRoute.roleId), href: `/roles/${rolesRoute.roleId}` },
      ];
    }

    if (
      activePage === "gitskillpackages"
      && gitSkillPackagesRoute.view === "detail"
      && gitSkillPackagesRoute.packageId
    ) {
      return [
        { label: "Git Skill Packages", href: "/gitSkillPackages" },
        {
          label: getGitSkillPackageLabel(gitSkillPackagesRoute.packageId),
          href: `/gitSkillPackages/${gitSkillPackagesRoute.packageId}`,
        },
      ];
    }

    if (
      activePage === "agent-runner"
      && runnersRoute.view === "detail"
      && runnersRoute.runnerId
    ) {
      const getRunnerLabel = (runnerId: any) => {
        const matchingRunner = agentRunners.find((r: any) => r.id === runnerId);
        return matchingRunner?.name || `Runner ${runnerId.slice(0, 8)}`;
      };
      return [
        { label: "Runners", href: "/agent-runner" },
        {
          label: getRunnerLabel(runnersRoute.runnerId),
          href: `/agent-runner/${runnersRoute.runnerId}`,
        },
      ];
    }

    return [{ label: currentPageLabel, href: getPathForPage(activePage) }];
  }, [
    activePage,
    agents,
    agentRunners,
    agentsRoute.agentId,
    agentsRoute.sessionId,
    agentsRoute.view,
    chatAgentId,
    gitSkillPackages,
    gitSkillPackagesRoute.packageId,
    gitSkillPackagesRoute.view,
    resolvedChatSessionId,
    runnersRoute.runnerId,
    runnersRoute.view,
    skills,
    skillsRoute.skillId,
    skillsRoute.view,
    selectedChatSession?.title,
    rolesRoute.roleId,
    rolesRoute.view,
    roles,
  ]);

  const isChatsConversationView = activePage === "chats" && Boolean(chatAgentId) && Boolean(resolvedChatSessionId);
  const isAgentConversationView =
    activePage === "agents" && agentsRoute.view === "chat" && Boolean(resolvedChatSessionId);
  const isChatConversationRoute = isChatsConversationView || isAgentConversationView;
  const shouldSubscribeChatIndex = activePage === "chats";
  const shouldSubscribeChatSessions =
    activePage === "agents" && (agentsRoute.view === "agent" || agentsRoute.view === "chats" || agentsRoute.view === "chat");
  const shouldSubscribeChatTurns = isChatConversationRoute;
  const shouldLoadGithubPageData = activePage === "settings" || activePage === "repos";
  const shouldLoadGithubRepositoryData = activePage === "repos";
  const shouldLoadCurrentUserData = activePage === "profile";
  const shouldLoadTaskData = activePage === "dashboard" || activePage === "tasks" || activePage === "profile";
  const shouldLoadSkillData =
    activePage === "skills"
    || activePage === "roles"
    || activePage === "skill-groups"
    || activePage === "gitskillpackages"
    || activePage === "agents"
    || activePage === "profile";
  const shouldLoadRoleData =
    activePage === "skills"
    || activePage === "roles"
    || activePage === "skill-groups"
    || activePage === "gitskillpackages"
    || activePage === "agents"
    || activePage === "profile";
  const shouldLoadSkillGroupData =
    activePage === "skill-groups"
    || activePage === "roles"
    || activePage === "gitskillpackages";
  const shouldLoadGitSkillPackageData = activePage === "skills" || activePage === "gitskillpackages";
  const shouldLoadSecretData =
    activePage === "secrets"
    || activePage === "mcp-servers";
  const shouldLoadApprovalData = activePage === "approvals";
  const shouldLoadMcpServerData =
    activePage === "mcp-servers"
    || activePage === "skills"
    || activePage === "roles"
    || activePage === "agents"
    || activePage === "profile";
  const shouldLoadRunnerData =
    activePage === "dashboard" ||
    activePage === "agent-runner" ||
    activePage === "profile";
  const shouldLoadAgentData =
    activePage === "tasks" ||
    activePage === "agents" ||
    activePage === "profile";
  const shouldSubscribeAgentRunners = activePage === "dashboard" || activePage === "agent-runner";
  useEffect(() => {
    const nextAssignments = {};
    for (const role of roles) {
      const roleId = String(role?.id || "").trim();
      if (!roleId) {
        continue;
      }
      const skillGroupIds = normalizeUniqueStringList(
        (role?.skillGroups || []).map((skillGroup: any) => skillGroup?.id),
      );
      nextAssignments[roleId] = skillGroupIds;
    }
    setRoleSkillGroupIdsByRoleId(nextAssignments);
  }, [roles]);

  useEffect(() => {
    const nextAssignments = {};
    for (const role of roles) {
      const roleId = String(role?.id || "").trim();
      if (!roleId) {
        continue;
      }
      const mcpServerIds = normalizeUniqueStringList(
        (role?.mcpServers || []).map((mcpServer: any) => mcpServer?.id),
      );
      nextAssignments[roleId] = mcpServerIds;
    }
    setRoleMcpServerIdsByRoleId(nextAssignments);
  }, [roles]);

  const loadCompanies = useCallback(async () => {
    try {
      setCompanyError("");
      setIsLoadingCompanies(true);
      const data = await executeGraphQL(LIST_COMPANIES_QUERY);
      const nextCompanies = data.companies || [];
      setCompanies(nextCompanies);
      setSelectedCompanyId((currentId: any) => {
        const preferredId = currentId || getPersistedCompanyId();
        if (preferredId && nextCompanies.some((company: any) => company.id === preferredId)) {
          return preferredId;
        }
        return nextCompanies[0]?.id || "";
      });
    } catch (loadError: any) {
      setCompanyError(loadError.message);
    } finally {
      setIsLoadingCompanies(false);
    }
  }, []);

  const loadCurrentUser = useCallback(async () => {
    try {
      setCurrentUserError("");
      setIsLoadingCurrentUser(true);
      const data = await executeGraphQL(ME_QUERY);
      const nextUser = data?.currentUser || null;
      setCurrentUser(nextUser
        ? {
          id: resolveLegacyId(nextUser.id),
          email: resolveLegacyId(nextUser.email),
          firstName: resolveLegacyId(nextUser.firstName),
          lastName: resolveLegacyId(nextUser.lastName) || null,
        }
        : null);
    } catch (loadError: any) {
      setCurrentUser(null);
      setCurrentUserError(loadError.message);
    } finally {
      setIsLoadingCurrentUser(false);
    }
  }, []);

  const loadGithubAppConfig = useCallback(async () => {
    try {
      setGithubAppConfigError("");
      setIsLoadingGithubAppConfig(true);
      const data = await executeGraphQL(LIST_GITHUB_APP_CONFIG_QUERY);
      const nextConfig = data?.githubAppConfig || {};
      setGithubAppConfig({
        appClientId: resolveLegacyId(nextConfig.appClientId),
        appLink: resolveLegacyId(nextConfig.appLink) || DEFAULT_GITHUB_APP_INSTALL_URL,
      });
    } catch (loadError: any) {
      setGithubAppConfig((current: any) => ({
        appClientId: current.appClientId,
        appLink: current.appLink || DEFAULT_GITHUB_APP_INSTALL_URL,
      }));
      setGithubAppConfigError(loadError.message);
    } finally {
      setIsLoadingGithubAppConfig(false);
    }
  }, []);

  const loadGithubInstallations = useCallback(async () => {
    if (!selectedCompanyId) {
      setGithubInstallations([]);
      setGithubInstallationError("");
      setIsLoadingGithubInstallations(false);
      return;
    }

    try {
      setGithubInstallationError("");
      setIsLoadingGithubInstallations(true);
      const data = await executeGraphQL(LIST_GITHUB_INSTALLATIONS_QUERY, {
        companyId: selectedCompanyId,
      });
      setGithubInstallations(data.githubInstallations || []);
    } catch (loadError: any) {
      setGithubInstallationError(loadError.message);
    } finally {
      setIsLoadingGithubInstallations(false);
    }
  }, [selectedCompanyId]);

  const loadGithubRepositories = useCallback(async () => {
    if (!selectedCompanyId) {
      setGithubRepositories([]);
      setGithubInstallationError("");
      setIsLoadingGithubRepositories(false);
      return;
    }

    try {
      setGithubInstallationError("");
      setIsLoadingGithubRepositories(true);
      const data = await executeGraphQL(LIST_REPOSITORIES_QUERY, {
        companyId: selectedCompanyId,
        provider: "github",
      });
      setGithubRepositories(data.repositories || []);
    } catch (loadError: any) {
      setGithubInstallationError(loadError.message);
    } finally {
      setIsLoadingGithubRepositories(false);
    }
  }, [selectedCompanyId]);

  const loadTasks = useCallback(async () => {
    if (!selectedCompanyId) {
      setTaskError("");
      setTasks([]);
      setRelationshipDrafts({});
      setIsLoadingTasks(false);
      return;
    }

    try {
      setTaskError("");
      setIsLoadingTasks(true);
      const data = await executeGraphQL(LIST_TASKS_QUERY, { companyId: selectedCompanyId });
      const nextTasks = data.tasks || [];
      setTasks(nextTasks);
      setRelationshipDrafts(createRelationshipDrafts(nextTasks));
    } catch (loadError: any) {
      setTaskError(loadError.message);
    } finally {
      setIsLoadingTasks(false);
    }
  }, [selectedCompanyId]);

  const loadTaskAssignablePrincipals = useCallback(async () => {
    if (!selectedCompanyId) {
      setTaskAssignablePrincipals([]);
      return;
    }

    try {
      const data = await executeGraphQL(LIST_TASK_ASSIGNABLE_PRINCIPALS_QUERY, {
        companyId: selectedCompanyId,
      });
      const nextPrincipals = Array.isArray(data?.taskAssignablePrincipals)
        ? data.taskAssignablePrincipals
        : [];
      setTaskAssignablePrincipals(nextPrincipals);
    } catch (loadError: any) {
      setTaskError(loadError.message);
    }
  }, [selectedCompanyId]);

  const loadSkills = useCallback(async () => {
    if (!selectedCompanyId) {
      setSkillError("");
      setSkills([]);
      setSkillDrafts({});
      setHasLoadedSkills(false);
      setIsLoadingSkills(false);
      return;
    }

    try {
      setSkillError("");
      setIsLoadingSkills(true);
      const data = await executeGraphQL(LIST_SKILLS_QUERY, { companyId: selectedCompanyId });
      const nextSkills = data.skills || [];
      setSkills(nextSkills);
      setSkillDrafts(createSkillDrafts(nextSkills));
      setHasLoadedSkills(true);
    } catch (loadError: any) {
      setHasLoadedSkills(false);
      setSkillError(loadError.message);
    } finally {
      setIsLoadingSkills(false);
    }
  }, [selectedCompanyId]);

  const loadRoles = useCallback(async () => {
    if (!selectedCompanyId) {
      setRoles([]);
      setHasLoadedRoles(false);
      setIsLoadingRoles(false);
      return;
    }

    try {
      setIsLoadingRoles(true);
      const data = await executeGraphQL(LIST_ROLES_QUERY, { companyId: selectedCompanyId });
      setRoles(data.roles || []);
      setHasLoadedRoles(true);
    } catch (loadError: any) {
      setHasLoadedRoles(false);
      setSkillError(loadError.message);
    } finally {
      setIsLoadingRoles(false);
    }
  }, [selectedCompanyId]);

  const loadSkillGroups = useCallback(async () => {
    if (!selectedCompanyId) {
      setSkillGroups([]);
      setHasLoadedSkillGroups(false);
      setIsLoadingSkillGroups(false);
      return;
    }

    try {
      setIsLoadingSkillGroups(true);
      const data = await executeGraphQL(LIST_SKILL_GROUPS_QUERY, { companyId: selectedCompanyId });
      setSkillGroups(data.skillGroups || []);
      setHasLoadedSkillGroups(true);
    } catch (loadError: any) {
      setHasLoadedSkillGroups(false);
      setSkillError(loadError.message);
    } finally {
      setIsLoadingSkillGroups(false);
    }
  }, [selectedCompanyId]);

  const loadGitSkillPackages = useCallback(async () => {
    if (!selectedCompanyId) {
      setGitSkillPackages([]);
      setIsLoadingGitSkillPackages(false);
      return;
    }

    try {
      setIsLoadingGitSkillPackages(true);
      const data = await executeGraphQL(LIST_GIT_SKILL_PACKAGES_QUERY, {
        companyId: selectedCompanyId,
      });
      setGitSkillPackages(data.gitSkillPackages || []);
    } catch (loadError: any) {
      setSkillError(loadError.message);
    } finally {
      setIsLoadingGitSkillPackages(false);
    }
  }, [selectedCompanyId]);

  const loadSecrets = useCallback(async () => {
    if (!selectedCompanyId) {
      setSecretError("");
      setSecrets([]);
      setSecretDrafts({});
      setSecretAccessLogsBySecretId({});
      setIsLoadingSecretAccessLogsBySecretId({});
      setSecretAccessLogErrorBySecretId({});
      setSecretValuesBySecretId({});
      setIsLoadingSecretValuesBySecretId({});
      setSecretValueErrorBySecretId({});
      setHasLoadedSecrets(false);
      setIsLoadingSecrets(false);
      return;
    }

    try {
      setSecretError("");
      setIsLoadingSecrets(true);
      const data = await executeGraphQL(LIST_SECRETS_QUERY, { companyId: selectedCompanyId });
      const nextSecrets = data.secrets || [];
      setSecrets(nextSecrets);
      setSecretDrafts(createSecretDrafts(nextSecrets));
      const validSecretIds = new Set(
        (Array.isArray(nextSecrets) ? nextSecrets : [])
          .map((secret: any) => String(secret?.id || "").trim())
          .filter(Boolean),
      );
      setSecretAccessLogsBySecretId((currentLogsBySecretId: any) =>
        Object.fromEntries(
          Object.entries(currentLogsBySecretId || {}).filter(([secretId]) => validSecretIds.has(secretId)),
        ),
      );
      setIsLoadingSecretAccessLogsBySecretId((currentLoadingBySecretId: any) =>
        Object.fromEntries(
          Object.entries(currentLoadingBySecretId || {}).filter(([secretId]) => validSecretIds.has(secretId)),
        ),
      );
      setSecretAccessLogErrorBySecretId((currentErrorBySecretId: any) =>
        Object.fromEntries(
          Object.entries(currentErrorBySecretId || {}).filter(([secretId]) => validSecretIds.has(secretId)),
        ),
      );
      setSecretValuesBySecretId((currentValuesBySecretId: any) =>
        Object.fromEntries(
          Object.entries(currentValuesBySecretId || {}).filter(([secretId]) => validSecretIds.has(secretId)),
        ),
      );
      setIsLoadingSecretValuesBySecretId((currentLoadingBySecretId: any) =>
        Object.fromEntries(
          Object.entries(currentLoadingBySecretId || {}).filter(([secretId]) => validSecretIds.has(secretId)),
        ),
      );
      setSecretValueErrorBySecretId((currentErrorBySecretId: any) =>
        Object.fromEntries(
          Object.entries(currentErrorBySecretId || {}).filter(([secretId]) => validSecretIds.has(secretId)),
        ),
      );
      setHasLoadedSecrets(true);
    } catch (loadError: any) {
      setHasLoadedSecrets(false);
      setSecretError(loadError.message);
    } finally {
      setIsLoadingSecrets(false);
    }
  }, [selectedCompanyId]);

  const loadApprovals = useCallback(async () => {
    if (!selectedCompanyId) {
      setApprovalError("");
      setApprovals([]);
      setRejectionReasonDraftByApprovalId({});
      setIsLoadingApprovals(false);
      return;
    }

    try {
      setApprovalError("");
      setIsLoadingApprovals(true);
      const data = await executeGraphQL(LIST_APPROVALS_QUERY, {
        companyId: selectedCompanyId,
        first: 200,
      });
      const nextApprovals = Array.isArray(data?.approvals) ? data.approvals : [];
      setApprovals(nextApprovals);
      const validApprovalIds = new Set(
        nextApprovals
          .map((approval: any) => String(approval?.id || "").trim())
          .filter(Boolean),
      );
      setRejectionReasonDraftByApprovalId((currentByApprovalId: any) =>
        Object.fromEntries(
          Object.entries(currentByApprovalId || {}).filter(([approvalId]) => validApprovalIds.has(approvalId)),
        ),
      );
    } catch (loadError: any) {
      setApprovalError(loadError.message);
    } finally {
      setIsLoadingApprovals(false);
    }
  }, [selectedCompanyId]);

  const loadMcpServers = useCallback(async () => {
    if (!selectedCompanyId) {
      setMcpServerError("");
      setMcpServers([]);
      setMcpServerDrafts({});
      setHasLoadedMcpServers(false);
      setIsLoadingMcpServers(false);
      return;
    }

    try {
      setMcpServerError("");
      setIsLoadingMcpServers(true);
      const data = await executeGraphQL(LIST_MCP_SERVERS_QUERY, { companyId: selectedCompanyId });
      const nextMcpServers = data.mcpServers || [];
      setMcpServers(nextMcpServers);
      setMcpServerDrafts(createMcpServerDrafts(nextMcpServers));
      setHasLoadedMcpServers(true);
    } catch (loadError: any) {
      setHasLoadedMcpServers(false);
      setMcpServerError(loadError.message);
    } finally {
      setIsLoadingMcpServers(false);
    }
  }, [selectedCompanyId]);

  const loadSecretAccessLogs = useCallback(async (secretId: any, { first = 50 }: any = {}) => {
    const normalizedSecretId = String(secretId || "").trim();
    if (!selectedCompanyId || !normalizedSecretId) {
      return;
    }

    const normalizedFirst = Number.isFinite(first) ? Number(first) : 50;
    const clampedFirst = Math.max(1, Math.min(200, Math.floor(normalizedFirst)));

    try {
      setIsLoadingSecretAccessLogsBySecretId((currentBySecretId: any) => ({
        ...(currentBySecretId || {}),
        [normalizedSecretId]: true,
      }));
      setSecretAccessLogErrorBySecretId((currentBySecretId: any) => ({
        ...(currentBySecretId || {}),
        [normalizedSecretId]: "",
      }));
      const data = await executeGraphQL(LIST_SECRET_ACCESS_LOGS_QUERY, {
        companyId: selectedCompanyId,
        secretId: normalizedSecretId,
        first: clampedFirst,
      });
      setSecretAccessLogsBySecretId((currentBySecretId: any) => ({
        ...(currentBySecretId || {}),
        [normalizedSecretId]: Array.isArray(data?.secretAccessLogs) ? data.secretAccessLogs : [],
      }));
    } catch (loadError: any) {
      setSecretAccessLogsBySecretId((currentBySecretId: any) => ({
        ...(currentBySecretId || {}),
        [normalizedSecretId]: [],
      }));
      setSecretAccessLogErrorBySecretId((currentBySecretId: any) => ({
        ...(currentBySecretId || {}),
        [normalizedSecretId]: loadError?.message || "Failed to load access logs.",
      }));
    } finally {
      setIsLoadingSecretAccessLogsBySecretId((currentBySecretId: any) => ({
        ...(currentBySecretId || {}),
        [normalizedSecretId]: false,
      }));
    }
  }, [selectedCompanyId]);

  const loadSecretValue = useCallback(async (secretId: any) => {
    const normalizedSecretId = String(secretId || "").trim();
    if (!selectedCompanyId || !normalizedSecretId) {
      return null;
    }

    try {
      setIsLoadingSecretValuesBySecretId((currentBySecretId: any) => ({
        ...(currentBySecretId || {}),
        [normalizedSecretId]: true,
      }));
      setSecretValueErrorBySecretId((currentBySecretId: any) => ({
        ...(currentBySecretId || {}),
        [normalizedSecretId]: "",
      }));

      const data = await executeGraphQL(LIST_SECRET_VALUE_QUERY, {
        companyId: selectedCompanyId,
        secretId: normalizedSecretId,
      });
      const payload = data?.secretValue;
      if (!payload?.ok) {
        throw new Error(payload?.error || "Failed to load secret value.");
      }

      const value = payload?.value == null ? "" : String(payload.value);
      setSecretValuesBySecretId((currentBySecretId: any) => ({
        ...(currentBySecretId || {}),
        [normalizedSecretId]: value,
      }));
      return value;
    } catch (loadError: any) {
      setSecretValuesBySecretId((currentBySecretId: any) => ({
        ...(currentBySecretId || {}),
        [normalizedSecretId]: "",
      }));
      setSecretValueErrorBySecretId((currentBySecretId: any) => ({
        ...(currentBySecretId || {}),
        [normalizedSecretId]: loadError?.message || "Failed to load secret value.",
      }));
      return null;
    } finally {
      setIsLoadingSecretValuesBySecretId((currentBySecretId: any) => ({
        ...(currentBySecretId || {}),
        [normalizedSecretId]: false,
      }));
    }
  }, [selectedCompanyId]);

  const loadAgentRunners = useCallback(async ({ silently = false }: any = {}) => {
    if (!selectedCompanyId) {
      setAgentRunners([]);
      setHasLoadedAgentRunners(false);
      if (!silently) {
        setRunnerError("");
        setIsLoadingRunners(false);
      }
      return;
    }

    try {
      if (!silently) {
        setRunnerError("");
        setIsLoadingRunners(true);
      }
      const data = await executeGraphQL(LIST_AGENT_RUNNERS_QUERY, {
        companyId: selectedCompanyId,
      });
      setAgentRunners((currentRunners: any) =>
        mergeAgentRunnerPayloadList(currentRunners, data.agentRunners || []),
      );
      setHasLoadedAgentRunners(true);
    } catch (loadError: any) {
      if (!silently) {
        setRunnerError(loadError.message);
      }
    } finally {
      if (!silently) {
        setIsLoadingRunners(false);
      }
    }
  }, [selectedCompanyId]);

  const loadAgents = useCallback(async () => {
    if (!selectedCompanyId) {
      setAgentError("");
      setAgents([]);
      setAgentDrafts({});
      setAgentRunners([]);
      setHasLoadedAgentRunners(false);
      setAgentRunnerId("");
      setAgentRoleIds([]);
      setAgentMcpServerIds([]);
      setAgentSdk(DEFAULT_AGENT_SDK);
      setAgentModel("");
      setAgentModelReasoningLevel("");
      setAgentDefaultAdditionalModelInstructions("");
      setIsLoadingAgents(false);
      return [];
    }

    try {
      setAgentError("");
      setIsLoadingAgents(true);
      const data = await executeGraphQL(LIST_AGENTS_QUERY, { companyId: selectedCompanyId });
      const nextAgents = data.agents || [];
      const nextRunners = data.agentRunners || [];
      setAgents(nextAgents);
      setAgentDrafts(createAgentDrafts(nextAgents));
      if (nextRunners.length > 0) {
        setAgentRunners((currentRunners: any) =>
          mergeAgentRunnerPayloadList(currentRunners, nextRunners),
        );
      }
      return nextAgents;
    } catch (loadError: any) {
      setAgentError(loadError.message);
      return [];
    } finally {
      setIsLoadingAgents(false);
    }
  }, [selectedCompanyId]);

  const loadChatsBootstrapData = useCallback(async ({ silently = false }: any = {}) => {
    if (!selectedCompanyId) {
      setAgentError("");
      setChatIndexError("");
      setAgents([]);
      setAgentDrafts({});
      setChatSessionsByAgent({});
      setChatSessions([]);
      if (!silently) {
        setIsLoadingAgents(false);
        setIsLoadingChatIndex(false);
      }
      return {
        agents: [],
        sessionsByAgent: {},
      };
    }

    try {
      if (!silently) {
        setAgentError("");
        setChatIndexError("");
        setIsLoadingAgents(true);
        setIsLoadingChatIndex(true);
      }
      const bootstrapPayload = await loadCompanyApiAgentsWithThreads({
        companyId: selectedCompanyId,
        agentLimit: 500,
        threadLimit: 500,
      });
      const nextAgents = bootstrapPayload.agents || [];
      const nextSessionsByAgent = bootstrapPayload.sessionsByAgent || {};
      const nextRunners = bootstrapPayload.agentRunners || [];

      setAgents(nextAgents);
      setAgentDrafts(createAgentDrafts(nextAgents));
      if (nextRunners.length > 0) {
        setAgentRunners((currentRunners: any) =>
          mergeAgentRunnerPayloadList(currentRunners, nextRunners),
        );
      }
      setChatSessionsByAgent(nextSessionsByAgent);

      const resolvedActiveAgentId = resolveLegacyId(chatAgentId, nextAgents[0]?.id);
      const activeSessions = resolvedActiveAgentId
        ? nextSessionsByAgent[resolvedActiveAgentId]
        : [];
      setChatSessions(Array.isArray(activeSessions) ? activeSessions : []);
      syncChatSessionRunningStateFromSessions(
        Object.values(nextSessionsByAgent).flatMap((sessionsForAgent: any) =>
          Array.isArray(sessionsForAgent) ? sessionsForAgent : [],
        ),
      );

      return {
        agents: nextAgents,
        sessionsByAgent: nextSessionsByAgent,
      };
    } catch (loadError: any) {
      if (!silently) {
        const errorMessage = loadError.message || "Failed to load chats.";
        setAgentError(errorMessage);
        setChatIndexError(errorMessage);
      }
      return {
        agents: [],
        sessionsByAgent: {},
      };
    } finally {
      if (!silently) {
        setIsLoadingAgents(false);
        setIsLoadingChatIndex(false);
      }
    }
  }, [selectedCompanyId, chatAgentId, syncChatSessionRunningStateFromSessions]);

  const ensureAgentEditorData = useCallback(async () => {
    if (!selectedCompanyId) {
      return;
    }

    const pendingLoads: any[] = [];
    if (!hasLoadedAgentRunners && !isLoadingRunners) {
      pendingLoads.push(loadAgentRunners({ silently: true }));
    }
    if (!hasLoadedSkills && !isLoadingSkills) {
      pendingLoads.push(loadSkills());
    }
    if (!hasLoadedRoles && !isLoadingRoles) {
      pendingLoads.push(loadRoles());
    }
    if (!hasLoadedMcpServers && !isLoadingMcpServers) {
      pendingLoads.push(loadMcpServers());
    }
    if (pendingLoads.length === 0) {
      return;
    }

    await Promise.allSettled(pendingLoads);
  }, [
    hasLoadedAgentRunners,
    hasLoadedMcpServers,
    hasLoadedRoles,
    hasLoadedSkills,
    isLoadingMcpServers,
    isLoadingRunners,
    isLoadingRoles,
    isLoadingSkills,
    loadAgentRunners,
    loadMcpServers,
    loadRoles,
    loadSkills,
    selectedCompanyId,
  ]);

  const loadAgentChatSessions = useCallback(
    async ({ silently = false, agentIdOverride = null }: any = {}) => {
      const targetAgentId = String(agentIdOverride || chatAgentId || "").trim();
      if (!selectedCompanyId || !targetAgentId) {
        setChatSessions([]);
        setChatSessionId("");
        if (!silently) {
          setChatError("");
          setIsLoadingChatSessions(false);
        }
        return;
      }

      try {
        if (!silently) {
          setChatError("");
          setIsLoadingChatSessions(true);
        }
        const nextSessions = await loadCompanyApiAgentThreads({
          companyId: selectedCompanyId,
          agentId: targetAgentId,
          limit: 200,
        });
        applyChatSessionsSnapshotForAgent(targetAgentId, nextSessions);
      } catch (loadError: any) {
        if (!silently) {
          setChatError(loadError.message);
        }
      } finally {
        if (!silently) {
          setIsLoadingChatSessions(false);
        }
      }
    },
    [selectedCompanyId, chatAgentId, applyChatSessionsSnapshotForAgent],
  );

  const loadAgentChatTurns = useCallback(
    async ({ silently = false, agentIdOverride = null, sessionIdOverride = null }: any = {}) => {
      const targetAgentId = String(agentIdOverride || chatAgentId || "").trim();
      const targetSessionId = String(sessionIdOverride || resolvedChatSessionId || "").trim();
      if (!selectedCompanyId || !targetAgentId || !targetSessionId) {
        setChatTurns([]);
        setQueuedChatMessages([]);
        if (!silently) {
          setChatError("");
          setIsLoadingChat(false);
        }
        return;
      }

      try {
        if (!silently) {
          setChatError("");
          setIsLoadingChat(true);
        }
        const metadata = companyApiThreadMetadataById.get(targetSessionId) || {};
        const runnerId = resolveLegacyId(metadata.runnerId) || null;
        const threadSnapshotPayload = await executeRawGraphQL(
          COMPANY_API_LIST_THREAD_TURNS_WITH_QUEUED_QUERY,
          {
            threadId: targetSessionId,
            firstTurns: 200,
            firstQueuedUserMessages: 200,
          },
        );
        const nextTurns = toConnectionNodes(threadSnapshotPayload?.threadTurns).map((turnNode: any) =>
          toLegacyTurnPayload(turnNode, { runnerId }),
        );
        const nextQueuedMessages = Array.isArray(threadSnapshotPayload?.queuedUserMessages)
          ? threadSnapshotPayload.queuedUserMessages.map((queuedMessage: any) =>
              toLegacyQueuedUserMessagePayload(queuedMessage),
            )
          : [];
        const nextTurnLifecycleSignature = getTurnLifecycleSignature(nextTurns);
        setChatTurns(nextTurns);
        setQueuedChatMessages(nextQueuedMessages);
        turnLifecycleSignatureBySessionIdRef.current.set(targetSessionId, nextTurnLifecycleSignature);
        setChatSessionRunningState(targetSessionId, hasRunningChatTurns(nextTurns));
      } catch (loadError: any) {
        if (!silently) {
          setChatError(loadError.message);
        }
      } finally {
        if (!silently) {
          setIsLoadingChat(false);
        }
      }
    },
    [selectedCompanyId, chatAgentId, resolvedChatSessionId, setChatSessionRunningState],
  );

  const loadChatSessionIndexByAgent = useCallback(
    async ({ silently = false }: any = {}) => {
      if (!selectedCompanyId) {
        setChatSessionsByAgent({});
        setChatIndexError("");
        setIsLoadingChatIndex(false);
        return {};
      }

      const agentsToLoad = Array.isArray(agents) ? agents : [];
      if (agentsToLoad.length === 0) {
        setChatSessionsByAgent({});
        if (!silently) {
          setChatIndexError("");
          setIsLoadingChatIndex(false);
        }
        return {};
      }

      try {
        if (!silently) {
          setChatIndexError("");
          setIsLoadingChatIndex(true);
        }
        const nextSessionsByAgent = {};
        for (const agentEntry of agentsToLoad) {
          const resolvedAgentId = String(agentEntry?.id || "").trim();
          if (resolvedAgentId) {
            nextSessionsByAgent[resolvedAgentId] = [];
          }
        }

        const threadNodes = await fetchCompanyApiConnectionNodes({
          query: COMPANY_API_LIST_THREADS_CONNECTION_QUERY,
          rootField: "threads",
          variables: {
            companyId: selectedCompanyId,
            agentId: null,
          },
          limit: 2000,
        });

        for (const threadNode of threadNodes) {
          const session = toLegacyThreadPayload(threadNode);
          const sessionAgentId = String(session?.agentId || "").trim();
          if (!sessionAgentId) {
            continue;
          }
          if (!nextSessionsByAgent[sessionAgentId]) {
            nextSessionsByAgent[sessionAgentId] = [];
          }
          nextSessionsByAgent[sessionAgentId].push(session);
        }

        setChatSessionsByAgent(nextSessionsByAgent);
        syncChatSessionRunningStateFromSessions(
          Object.values(nextSessionsByAgent).flatMap((sessionsForAgent: any) =>
            Array.isArray(sessionsForAgent) ? sessionsForAgent : []),
        );
        return nextSessionsByAgent;
      } catch (loadError: any) {
        if (!silently) {
          setChatIndexError(loadError.message);
        }
        return {};
      } finally {
        if (!silently) {
          setIsLoadingChatIndex(false);
        }
      }
    },
    [agents, selectedCompanyId, syncChatSessionRunningStateFromSessions],
  );

  const handleAgentRunnersSubscriptionData = useCallback((payload: any) => {
    if (!payload?.agentRunnersUpdated) {
      return;
    }
    const nextRunnerNodes = toConnectionNodes(payload?.agentRunnersUpdated);
    const nextRunnerPayload = nextRunnerNodes.map((runnerNode: any) => toLegacyRunnerPayload(runnerNode));
    setAgentRunners((currentRunners: any) =>
      mergeAgentRunnerPayloadList(currentRunners, nextRunnerPayload),
    );
    setRunnerError("");
    setIsLoadingRunners(false);
  }, []);

  const handleAgentRunnersSubscriptionError = useCallback((error: any) => {
    setRunnerError(error.message);
    setIsLoadingRunners(false);
  }, []);

  const handleAgentChatSessionsSubscriptionData = useCallback((payload: any) => {
    if (!payload?.agentThreadsUpdated) {
      return;
    }
    const nextThreadNodes = toConnectionNodes(payload?.agentThreadsUpdated);
    const nextSessions = nextThreadNodes.map((threadNode: any) => toLegacyThreadPayload(threadNode));
    const sessionsByAgentId = {};

    for (const session of nextSessions) {
      const sessionAgentId = String(session?.agentId || "").trim();
      if (!sessionAgentId) {
        continue;
      }
      if (!sessionsByAgentId[sessionAgentId]) {
        sessionsByAgentId[sessionAgentId] = [];
      }
      sessionsByAgentId[sessionAgentId].push(session);
    }

    if (activePage === "chats") {
      const knownAgentIds = [...new Set(
        (Array.isArray(agents) ? agents : [])
          .map((agentEntry: any) => String(agentEntry?.id || "").trim())
          .filter(Boolean),
      )];
      if (knownAgentIds.length > 0) {
        setChatSessionsByAgent((currentSessionsByAgent: any) =>
          mergeChatSessionsByAgentSnapshot({
            currentSessionsByAgent,
            snapshotSessionsByAgent: sessionsByAgentId,
            knownAgentIds,
          }),
        );
        if (chatAgentId && Object.prototype.hasOwnProperty.call(sessionsByAgentId, chatAgentId)) {
          setChatSessions(sessionsByAgentId[chatAgentId] || []);
        }
      }
      syncChatSessionRunningStateFromSessions(nextSessions);
      setChatIndexError("");
      setIsLoadingChatIndex(false);
      setChatError("");
      setIsLoadingChatSessions(false);
      return;
    }

    const subscriptionAgentId = resolveLegacyId(nextSessions[0]?.agentId, chatAgentId) || "";
    applyChatSessionsSnapshotForAgent(subscriptionAgentId, nextSessions);
    setChatError("");
    setIsLoadingChatSessions(false);
  }, [
    activePage,
    agents,
    applyChatSessionsSnapshotForAgent,
    chatAgentId,
    syncChatSessionRunningStateFromSessions,
  ]);

  const handleAgentChatTurnsSubscriptionData = useCallback((payload: any) => {
    if (!payload?.agentTurnsUpdated) {
      return;
    }
    const nextTurnNodes = toConnectionNodes(payload?.agentTurnsUpdated);
    const threadMetadata = companyApiThreadMetadataById.get(resolvedChatSessionId) || {};
    const nextTurns = nextTurnNodes.map((turnNode: any) =>
      toLegacyTurnPayload(turnNode, { runnerId: threadMetadata.runnerId }),
    );
    setChatTurns(nextTurns);
    const targetSessionId = String(resolvedChatSessionId || "").trim();
    if (targetSessionId) {
      const nextTurnLifecycleSignature = getTurnLifecycleSignature(nextTurns);
      const previousTurnLifecycleSignature =
        turnLifecycleSignatureBySessionIdRef.current.get(targetSessionId) || "";
      if (nextTurnLifecycleSignature !== previousTurnLifecycleSignature) {
        turnLifecycleSignatureBySessionIdRef.current.set(targetSessionId, nextTurnLifecycleSignature);
      }
      setChatSessionRunningState(targetSessionId, hasRunningChatTurns(nextTurns));
    }
    setChatError("");
    setIsLoadingChat(false);
  }, [resolvedChatSessionId, setChatSessionRunningState]);

  const handleAgentQueuedMessagesSubscriptionData = useCallback((payload: any) => {
    if (!payload?.queuedUserMessagesUpdated) {
      return;
    }

    const nextQueuedMessages = Array.isArray(payload.queuedUserMessagesUpdated)
      ? payload.queuedUserMessagesUpdated.map((queuedMessage: any) =>
          toLegacyQueuedUserMessagePayload(queuedMessage),
        )
      : [];

    setQueuedChatMessages(nextQueuedMessages);
    setChatError("");
    setIsLoadingChat(false);
  }, []);

  const handleAgentChatSubscriptionError = useCallback((error: any) => {
    setChatError(error.message);
    setIsLoadingChat(false);
    setIsLoadingChatSessions(false);
  }, []);

  useGraphQLSubscription({
    enabled: Boolean(selectedCompanyId && shouldSubscribeAgentRunners && hasLoadedAgentRunners),
    query: AGENT_RUNNERS_SUBSCRIPTION,
    variables: selectedCompanyId ? { first: 200 } : undefined,
    onData: handleAgentRunnersSubscriptionData,
    onError: handleAgentRunnersSubscriptionError,
  });

  useGraphQLSubscription({
    enabled: Boolean(selectedCompanyId && (shouldSubscribeChatIndex || (chatAgentId && shouldSubscribeChatSessions))),
    query: AGENT_THREADS_SUBSCRIPTION,
    variables:
      selectedCompanyId
        ? {
            first: 500,
            ...(shouldSubscribeChatIndex
              ? {}
              : chatAgentId
                ? { agentId: chatAgentId }
                : {}),
          }
        : undefined,
    onData: handleAgentChatSessionsSubscriptionData,
    onError: handleAgentChatSubscriptionError,
  });

  useGraphQLSubscription({
    enabled: Boolean(selectedCompanyId && chatAgentId && resolvedChatSessionId && shouldSubscribeChatTurns),
    query: AGENT_TURNS_SUBSCRIPTION,
    variables:
      selectedCompanyId && chatAgentId && resolvedChatSessionId
        ? {
            agentId: chatAgentId,
            threadId: resolvedChatSessionId,
            first: 100,
          }
        : undefined,
    onData: handleAgentChatTurnsSubscriptionData,
    onError: handleAgentChatSubscriptionError,
  });

  useGraphQLSubscription({
    enabled: Boolean(selectedCompanyId && chatAgentId && resolvedChatSessionId && shouldSubscribeChatTurns),
    query: AGENT_QUEUED_USER_MESSAGES_SUBSCRIPTION,
    variables:
      selectedCompanyId && chatAgentId && resolvedChatSessionId
        ? {
            agentId: chatAgentId,
            threadId: resolvedChatSessionId,
            first: 200,
          }
        : undefined,
    onData: handleAgentQueuedMessagesSubscriptionData,
    onError: handleAgentChatSubscriptionError,
  });

  useEffect(() => {
    loadCompanies();
  }, [loadCompanies]);

  useEffect(() => {
    setActiveCompanyId(selectedCompanyId);
    persistCompanyId(selectedCompanyId);
    turnLifecycleSignatureBySessionIdRef.current.clear();
  }, [selectedCompanyId]);

  useEffect(() => {
    setAgentRunners([]);
    setAgentRunnerId("");
    setAgentRoleIds([]);
    setAgentSdk(DEFAULT_AGENT_SDK);
    setAgentModel("");
    setAgentModelReasoningLevel("");
    setAgentDefaultAdditionalModelInstructions("");
    setRunnerNameDraft("");
    setRunnerSecretsById({});
    setHasLoadedAgentRunners(false);
    setRegeneratingRunnerId(null);
    setGithubInstallations([]);
    setGithubRepositories([]);
    setGithubInstallationError("");
    setGithubInstallationNotice("");
    setDeletingGithubInstallationId("");
    setRefreshingGithubInstallationId("");
    setSkillName("");
    setSkillType(SKILL_TYPE_TEXT);
    setSkillSkillsMpPackageName("");
    setSkillDescription("");
    setSkillInstructions("");
    setHasLoadedSkills(false);
    setRoles([]);
    setHasLoadedRoles(false);
    setSkillGroups([]);
    setHasLoadedSkillGroups(false);
    setRoleSkillGroupIdsByRoleId({});
    setRoleMcpServerIdsByRoleId({});
    setGitSkillPackages([]);
    setSecrets([]);
    setSecretDrafts({});
    setSecretAccessLogsBySecretId({});
    setIsLoadingSecretAccessLogsBySecretId({});
    setSecretAccessLogErrorBySecretId({});
    setHasLoadedSecrets(false);
    setSecretName("");
    setSecretDescription("");
    setSecretValue("");
    setSecretError("");
    setIsLoadingSecrets(false);
    setIsCreatingSecret(false);
    setSavingSecretId(null);
    setDeletingSecretId(null);
    setMcpServers([]);
    setMcpServerDrafts({});
    setHasLoadedMcpServers(false);
    setMcpServerName("");
    setMcpServerTransportType(MCP_TRANSPORT_TYPE_STREAMABLE_HTTP);
    setMcpServerUrl("");
    setMcpServerCommand("");
    setMcpServerArgsText("");
    setMcpServerEnvVarsText("");
    setMcpServerAuthType(MCP_AUTH_TYPE_NONE);
    setMcpServerBearerTokenSecretId("");
    setMcpServerCustomHeadersText("");
    setMcpServerEnabled(true);
    setMcpServerError("");
    setChatAgentId("");
    setChatSessions([]);
    setChatSessionsByAgent({});
    setChatSessionRunningById({});
    setChatSessionId("");
    setChatSessionTitleDraft("");
    setChatSessionAdditionalModelInstructionsDraft("");
    setChatSessionRenameDraft("");
    setChatTurns([]);
    setQueuedChatMessages([]);
    setChatDraftMessage("");
    setChatError("");
    setChatIndexError("");
    setIsInterruptingChatTurn(false);
    setIsUpdatingChatTitle(false);
    setIsLoadingChatIndex(false);
    setAgentMcpServerIds([]);
    setRetryingAgentSkillInstallKey("");
  }, [selectedCompanyId]);

  useEffect(() => {
    if (!isAvailableAgentSdk(agentSdk)) {
      setAgentSdk(DEFAULT_AGENT_SDK);
    }

    const selectedRunnerCodexModels = getRunnerCodexModelEntriesForRunner(
      runnerCodexModelEntriesById,
      agentRunnerId,
    );
    const resolvedSelection = resolveRunnerBackedModelSelection({
      codexModelEntries: selectedRunnerCodexModels,
      requestedModel: agentModel,
      requestedReasoning: agentModelReasoningLevel,
    });

    if (resolvedSelection.model !== agentModel) {
      setAgentModel(resolvedSelection.model);
    }
    if (resolvedSelection.modelReasoningLevel !== agentModelReasoningLevel) {
      setAgentModelReasoningLevel(resolvedSelection.modelReasoningLevel);
    }
  }, [
    agentModel,
    agentModelReasoningLevel,
    agentRunnerId,
    agentSdk,
    runnerCodexModelEntriesById,
  ]);

  useEffect(() => {
    const validMcpServerIds = new Set(mcpServers.map((mcpServer: any) => mcpServer.id));

    setAgentMcpServerIds((currentIds: any) => {
      const normalizedIds = normalizeUniqueStringList(currentIds).filter((id: any) => validMcpServerIds.has(id));
      if (
        normalizedIds.length === currentIds.length &&
        normalizedIds.every((id: any, index: any) => id === currentIds[index])
      ) {
        return currentIds;
      }
      return normalizedIds;
    });

    setAgentDrafts((currentDrafts: any) => {
      let changed = false;
      const nextDrafts = {};
      for (const [agentId, draft] of Object.entries(currentDrafts)) {
        if (!draft || typeof draft !== "object") {
          nextDrafts[agentId] = draft;
          continue;
        }

        const currentMcpServerIds = Array.isArray(draft.mcpServerIds) ? draft.mcpServerIds : [];
        const normalizedMcpServerIds = normalizeUniqueStringList(currentMcpServerIds).filter((id: any) =>
          validMcpServerIds.has(id),
        );

        if (
          normalizedMcpServerIds.length === currentMcpServerIds.length &&
          normalizedMcpServerIds.every((id: any, index: any) => id === currentMcpServerIds[index])
        ) {
          nextDrafts[agentId] = draft;
          continue;
        }

        changed = true;
        nextDrafts[agentId] = {
          ...draft,
          mcpServerIds: normalizedMcpServerIds,
        };
      }

      return changed ? nextDrafts : currentDrafts;
    });
  }, [mcpServers]);

  useEffect(() => {
    const validRoleIds = new Set(roles.map((role: any) => role.id));

    setAgentRoleIds((currentIds: any) => {
      const normalizedIds = normalizeUniqueStringList(currentIds).filter((id: any) =>
        validRoleIds.has(id),
      );
      if (
        normalizedIds.length === currentIds.length
        && normalizedIds.every((id: any, index: any) => id === currentIds[index])
      ) {
        return currentIds;
      }
      return normalizedIds;
    });

    setAgentDrafts((currentDrafts: any) => {
      let changed = false;
      const nextDrafts = {};
      for (const [agentId, draft] of Object.entries(currentDrafts)) {
        if (!draft || typeof draft !== "object") {
          nextDrafts[agentId] = draft;
          continue;
        }

        const currentRoleIds = Array.isArray(draft.roleIds)
          ? draft.roleIds
          : [];
        const normalizedRoleIds = normalizeUniqueStringList(currentRoleIds).filter((id: any) =>
          validRoleIds.has(id),
        );

        if (
          normalizedRoleIds.length === currentRoleIds.length
          && normalizedRoleIds.every((id: any, index: any) => id === currentRoleIds[index])
        ) {
          nextDrafts[agentId] = draft;
          continue;
        }

        changed = true;
        nextDrafts[agentId] = {
          ...draft,
          roleIds: normalizedRoleIds,
        };
      }

      return changed ? nextDrafts : currentDrafts;
    });
  }, [roles]);

  useEffect(() => {
    if (!hasLoadedSecrets) {
      return;
    }

    const validSecretIds = new Set(
      secrets
        .map((secret: any) => String(secret?.id || "").trim())
        .filter(Boolean),
    );

    setMcpServerBearerTokenSecretId((currentSecretId: any) => {
      const normalizedCurrentSecretId = String(currentSecretId || "").trim();
      if (!normalizedCurrentSecretId || validSecretIds.has(normalizedCurrentSecretId)) {
        return currentSecretId;
      }
      return "";
    });

    setMcpServerDrafts((currentDrafts: any) => {
      let changed = false;
      const nextDrafts: any = {};
      for (const [mcpServerId, draft] of Object.entries(currentDrafts || {})) {
        if (!draft || typeof draft !== "object") {
          nextDrafts[mcpServerId] = draft;
          continue;
        }

        const currentSecretId = String((draft as any).bearerTokenSecretId || "").trim();
        if (!currentSecretId || validSecretIds.has(currentSecretId)) {
          nextDrafts[mcpServerId] = draft;
          continue;
        }

        changed = true;
        nextDrafts[mcpServerId] = {
          ...draft,
          bearerTokenSecretId: "",
        };
      }

      return changed ? nextDrafts : currentDrafts;
    });
  }, [hasLoadedSecrets, secrets]);

  useEffect(() => {
    if (!shouldLoadGithubPageData || !selectedCompanyId) {
      return;
    }
    loadGithubAppConfig();
  }, [loadGithubAppConfig, selectedCompanyId, shouldLoadGithubPageData]);

  useEffect(() => {
    if (!selectedCompanyId || !shouldLoadGithubPageData) {
      return;
    }
    loadGithubInstallations();
  }, [
    loadGithubInstallations,
    selectedCompanyId,
    shouldLoadGithubPageData,
  ]);

  useEffect(() => {
    if (!selectedCompanyId || !shouldLoadGithubRepositoryData) {
      return;
    }
    loadGithubRepositories();
  }, [
    loadGithubRepositories,
    selectedCompanyId,
    shouldLoadGithubRepositoryData,
  ]);

  useEffect(() => {
    if (!shouldLoadCurrentUserData) {
      return;
    }
    loadCurrentUser();
  }, [loadCurrentUser, shouldLoadCurrentUserData]);

  useEffect(() => {
    if (!selectedCompanyId) {
      setTaskAssignablePrincipals([]);
      return;
    }
    if (!shouldLoadTaskData) {
      return;
    }
    loadTasks();
    loadTaskAssignablePrincipals();
  }, [loadTaskAssignablePrincipals, loadTasks, selectedCompanyId, shouldLoadTaskData]);

  useEffect(() => {
    if (!selectedCompanyId || !shouldLoadSkillData) {
      return;
    }
    loadSkills();
  }, [loadSkills, selectedCompanyId, shouldLoadSkillData]);

  useEffect(() => {
    if (!selectedCompanyId || !shouldLoadRoleData) {
      return;
    }
    loadRoles();
  }, [loadRoles, selectedCompanyId, shouldLoadRoleData]);

  useEffect(() => {
    if (!selectedCompanyId || !shouldLoadSkillGroupData) {
      return;
    }
    loadSkillGroups();
  }, [loadSkillGroups, selectedCompanyId, shouldLoadSkillGroupData]);

  useEffect(() => {
    if (!selectedCompanyId || !shouldLoadGitSkillPackageData) {
      return;
    }
    loadGitSkillPackages();
  }, [loadGitSkillPackages, selectedCompanyId, shouldLoadGitSkillPackageData]);

  useEffect(() => {
    if (!selectedCompanyId || !shouldLoadSecretData) {
      return;
    }
    loadSecrets();
  }, [loadSecrets, selectedCompanyId, shouldLoadSecretData]);

  useEffect(() => {
    if (!selectedCompanyId || !shouldLoadApprovalData) {
      return;
    }
    loadApprovals();
  }, [loadApprovals, selectedCompanyId, shouldLoadApprovalData]);

  useEffect(() => {
    if (!selectedCompanyId || !shouldLoadMcpServerData) {
      return;
    }
    loadMcpServers();
  }, [loadMcpServers, selectedCompanyId, shouldLoadMcpServerData]);

  useEffect(() => {
    if (!selectedCompanyId || !shouldLoadRunnerData) {
      return;
    }
    loadAgentRunners();
  }, [loadAgentRunners, selectedCompanyId, shouldLoadRunnerData]);

  useEffect(() => {
    if (!selectedCompanyId || !shouldLoadAgentData) {
      return;
    }
    loadAgents();
  }, [loadAgents, selectedCompanyId, shouldLoadAgentData]);

  useEffect(() => {
    if (!selectedCompanyId || activePage !== "chats") {
      return;
    }
    void loadChatsBootstrapData();
  }, [activePage, loadChatsBootstrapData, selectedCompanyId]);

  useEffect(() => {
    if (!selectedCompanyId || activePage !== "chats" || !chatAgentId) {
      return;
    }
    const nextSessions = Array.isArray(chatSessionsByAgent[chatAgentId])
      ? chatSessionsByAgent[chatAgentId]
      : [];
    setChatSessions(nextSessions);
  }, [activePage, chatAgentId, chatSessionsByAgent, selectedCompanyId]);

  useEffect(() => {
    if (
      !selectedCompanyId
      || activePage !== "chats"
      || !chatAgentId
      || !resolvedChatSessionId
    ) {
      return;
    }
    loadAgentChatTurns({
      silently: true,
      agentIdOverride: chatAgentId,
      sessionIdOverride: resolvedChatSessionId,
    });
  }, [
    activePage,
    chatAgentId,
    resolvedChatSessionId,
    loadAgentChatTurns,
    selectedCompanyId,
  ]);

  useEffect(() => {
    setSteeringQueuedMessageId(null);
  }, [resolvedChatSessionId]);

  useEffect(() => {
    if (!resolvedChatSessionId) {
      setChatSessionRenameDraft("");
      setIsUpdatingChatTitle(false);
      return;
    }

    const nextTitle = String(selectedChatSession?.title || "");
    const normalizedNextTitle = nextTitle.slice(0, THREAD_TITLE_MAX_LENGTH);
    setChatSessionRenameDraft((currentTitle: any) =>
      currentTitle === normalizedNextTitle ? currentTitle : normalizedNextTitle,
    );
  }, [resolvedChatSessionId, selectedChatSession?.title]);

  useEffect(() => {
    const isAgentChatDetailRoute = activePage === "agents" && agentsRoute.view === "chat";
    if (!selectedCompanyId || !isAgentChatDetailRoute) {
      return;
    }
    loadChatSessionIndexByAgent();
  }, [activePage, agentsRoute.view, loadChatSessionIndexByAgent, selectedCompanyId]);

  useEffect(() => {
    if (activePage !== "chats") {
      return;
    }
    void navigateToChatsConversation({ replace: true });
  }, [activePage, chatsRoute.agentId, chatsRoute.threadId]);

  useEffect(() => {
    if (!selectedCompanyId) {
      setChatAgentId("");
      setChatTurns([]);
      setQueuedChatMessages([]);
      return;
    }

    const routeAgentId = activePage === "chats" ? String(chatsRoute.agentId || "").trim() : "";
    setChatAgentId((currentAgentId: any) => {
      if (routeAgentId) {
        if (agents.length === 0 || agents.some((agent: any) => agent.id === routeAgentId)) {
          return routeAgentId;
        }
      }
      if (currentAgentId && agents.some((agent: any) => agent.id === currentAgentId)) {
        return currentAgentId;
      }
      return agents[0]?.id || "";
    });
  }, [activePage, agents, chatsRoute.agentId, selectedCompanyId]);

  useEffect(() => {
    if (!chatAgentId) {
      setChatSessionId((currentSessionId: any) => (currentSessionId ? "" : currentSessionId));
      setChatSessions((currentSessions: any) => (currentSessions.length > 0 ? [] : currentSessions));
      setChatTurns((currentTurns: any) => (currentTurns.length > 0 ? [] : currentTurns));
      setQueuedChatMessages((currentMessages: any) => (currentMessages.length > 0 ? [] : currentMessages));
      return;
    }

    if (activePage === "chats") {
      const routeThreadId = String(chatsRoute.threadId || "").trim();
      if (routeThreadId) {
        setChatSessionId(routeThreadId);
        return;
      }
      setChatSessionId((currentSessionId: any) => {
        if (!currentSessionId) {
          return "";
        }
        if (chatSessions.some((session: any) => session.id === currentSessionId)) {
          return currentSessionId;
        }
        return "";
      });
      if (!chatSessionId) {
        setChatTurns((currentTurns: any) => (currentTurns.length > 0 ? [] : currentTurns));
        setQueuedChatMessages((currentMessages: any) => (currentMessages.length > 0 ? [] : currentMessages));
      }
      return;
    }

    if (activePage === "agents" && agentsRoute.view === "chat" && agentsRoute.sessionId) {
      setChatSessionId(agentsRoute.sessionId);
      return;
    }

    if (activePage === "agents" && (agentsRoute.view === "agent" || agentsRoute.view === "chats")) {
      setChatSessionId("");
      setChatTurns([]);
      setQueuedChatMessages([]);
      return;
    }

    setChatSessionId((currentSessionId: any) => {
      if (currentSessionId && chatSessions.some((session: any) => session.id === currentSessionId)) {
        return currentSessionId;
      }
      return chatSessions[0]?.id || "";
    });
  }, [
    activePage,
    agentsRoute.sessionId,
    agentsRoute.view,
    chatAgentId,
    chatSessionId,
    chatSessions,
    chatsRoute.threadId,
  ]);

  useEffect(() => {
    const legacyHashRoute = String(window.location.hash || "")
      .replace(/^#/, "")
      .trim();
    if (legacyHashRoute) {
      setBrowserPath(`/${legacyHashRoute}`, { replace: true });
      return;
    }

    if (normalizePathname(window.location.pathname) === "/") {
      setBrowserPath(`/${NAV_ITEMS[0].id}`, { replace: true });
      return;
    }

    const handlePopState = () => {
      setActivePage(getPageFromPathname());
      setAgentsRoute(getAgentsRouteFromPathname());
      setSkillsRoute(getSkillsRouteFromPathname());
      setRolesRoute(getRolesRouteFromPathname());
      setGitSkillPackagesRoute(getGitSkillPackagesRouteFromPathname());
      setRunnersRoute(getRunnersRouteFromPathname());
      setChatsRoute(getChatsRouteFromLocation());
    };

    handlePopState();
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return undefined;
    }
    const mediaQueryList = window.matchMedia(SIDEBAR_COLLAPSE_MEDIA_QUERY);
    const handleMediaQueryChange = (event: any) => {
      if (event.matches) {
        setIsSideMenuCollapsed(true);
      }
    };
    if (mediaQueryList.matches) {
      setIsSideMenuCollapsed(true);
    }
    if (typeof mediaQueryList.addEventListener === "function") {
      mediaQueryList.addEventListener("change", handleMediaQueryChange);
      return () => mediaQueryList.removeEventListener("change", handleMediaQueryChange);
    }
    mediaQueryList.addListener(handleMediaQueryChange);
    return () => mediaQueryList.removeListener(handleMediaQueryChange);
  }, []);

  useEffect(() => {
    if (activePage !== "agents" || agentsRoute.view !== "chat") {
      return;
    }

    const routeAgentId = String(agentsRoute.agentId || "").trim();
    const routeSessionId = String(agentsRoute.sessionId || "").trim();
    if (!routeAgentId || !routeSessionId) {
      return;
    }

    setBrowserPath(
      getChatsPath({
        agentId: routeAgentId,
        threadId: routeSessionId,
      }),
      { replace: true },
    );
  }, [activePage, agentsRoute.agentId, agentsRoute.sessionId, agentsRoute.view]);

  useEffect(() => {
    if (activePage !== "agents" || !selectedCompanyId) {
      return;
    }
    if (agentsRoute.view === "agent" || agentsRoute.view === "chats" || agentsRoute.view === "chat") {
      if (agentsRoute.agentId) {
        setChatAgentId(agentsRoute.agentId);
      }
      if (agentsRoute.view === "agent" || agentsRoute.view === "chats") {
        setChatSessionId("");
        setChatTurns([]);
        setQueuedChatMessages([]);
      }
      if (agentsRoute.view === "chat" && agentsRoute.sessionId) {
        setChatSessionId(agentsRoute.sessionId);
      }
    }
  }, [activePage, agentsRoute.agentId, agentsRoute.sessionId, agentsRoute.view, selectedCompanyId]);

  useEffect(() => {
    if (activePage !== "agents" || !selectedCompanyId || !agentsRoute.agentId) {
      return;
    }

    if (agentsRoute.view === "agent" || agentsRoute.view === "chats") {
      loadAgentChatSessions({
        silently: true,
        agentIdOverride: agentsRoute.agentId,
      });
      return;
    }

    if (agentsRoute.view === "chat" && agentsRoute.sessionId) {
      loadAgentChatSessions({
        silently: true,
        agentIdOverride: agentsRoute.agentId,
      });
      loadAgentChatTurns({
        silently: true,
        agentIdOverride: agentsRoute.agentId,
        sessionIdOverride: agentsRoute.sessionId,
      });
    }
  }, [
    activePage,
    agentsRoute.agentId,
    agentsRoute.sessionId,
    agentsRoute.view,
    loadAgentChatSessions,
    loadAgentChatTurns,
    selectedCompanyId,
  ]);

  useEffect(() => {
    if (isLoadingCompanies) {
      return;
    }
    const activeItem = NAV_ITEM_LOOKUP.get(activePage);
    if (activeItem?.requiresCompany && !selectedCompanyId) {
      navigateTo("settings");
    }
  }, [activePage, isLoadingCompanies, selectedCompanyId]);

  useEffect(() => {
    if (!pendingGithubInstallCallback) {
      return;
    }

    navigateTo("settings");

    const installationId = String(pendingGithubInstallCallback.installationId || "").trim();
    const setupAction = String(pendingGithubInstallCallback.setupAction || "").trim();
    const callbackStateCompanyId = String(pendingGithubInstallCallback.state || "").trim();
    if (callbackStateCompanyId && isLoadingCompanies) {
      return;
    }

    const callbackCompanyId =
      callbackStateCompanyId && companies.some((company: any) => company.id === callbackStateCompanyId)
        ? callbackStateCompanyId
        : "";
    const targetCompanyId = callbackCompanyId || selectedCompanyId;

    if (callbackCompanyId && callbackCompanyId !== selectedCompanyId) {
      setSelectedCompanyId(callbackCompanyId);
    }

    if (!installationId) {
      setGithubInstallationError("GitHub install callback is missing installation_id.");
      setPendingGithubInstallCallback(null);
      clearGithubInstallCallbackFromLocation();
      return;
    }

    if (!targetCompanyId) {
      setGithubInstallationError(
        `Select a company to link GitHub installation ${installationId}.`,
      );
      return;
    }

    let isCancelled = false;
    const linkGithubInstallation = async () => {
      try {
        setIsAddingGithubInstallationFromCallback(true);
        setGithubInstallationError("");
        setGithubInstallationNotice("");
        const data = await executeGraphQL(ADD_GITHUB_INSTALLATION_MUTATION, {
          companyId: targetCompanyId,
          installationId,
          setupAction: setupAction || null,
        });
        const result = data.addGithubInstallation;
        if (!result.ok) {
          throw new Error(result.error || "Failed to link GitHub installation.");
        }

        if (!isCancelled) {
          setGithubInstallationNotice(`Linked GitHub installation ${installationId}.`);
          await loadGithubInstallations();
        }
      } catch (linkError: any) {
        if (!isCancelled) {
          setGithubInstallationError(linkError.message);
        }
      } finally {
        if (!isCancelled) {
          setIsAddingGithubInstallationFromCallback(false);
          setPendingGithubInstallCallback(null);
          clearGithubInstallCallbackFromLocation();
        }
      }
    };

    linkGithubInstallation();
    return () => {
      isCancelled = true;
    };
  }, [
    companies,
    isLoadingCompanies,
    loadGithubInstallations,
    pendingGithubInstallCallback,
    selectedCompanyId,
  ]);

  async function handleCreateCompany(event: any) {
    event.preventDefault();
    if (!newCompanyName.trim()) {
      setCompanyError("Company name is required.");
      return;
    }

    try {
      setIsCreatingCompany(true);
      setCompanyError("");
      const data = await executeGraphQL(CREATE_COMPANY_MUTATION, {
        name: newCompanyName.trim(),
      });
      const result = data.createCompany;
      if (!result.ok) {
        throw new Error(result.error || "Company creation failed.");
      }
      const createdCompany = result.company;
      setNewCompanyName("");
      await loadCompanies();
      setSelectedCompanyId(createdCompany.id);
    } catch (createError: any) {
      setCompanyError(createError.message);
    } finally {
      setIsCreatingCompany(false);
    }
  }

  async function handleDeleteCompany() {
    if (!selectedCompany) {
      setCompanyError("Select a company before deleting.");
      return;
    }

    const confirmed = window.confirm(
      `Delete company "${selectedCompany.name}"? This will also delete all tasks, skills, secrets, MCP servers, agents, and agent runners in that company.`,
    );
    if (!confirmed) {
      return;
    }

    try {
      setIsDeletingCompany(true);
      setCompanyError("");
      const data = await executeGraphQL(DELETE_COMPANY_MUTATION, {
        id: selectedCompany.id,
      });
      const result = data.deleteCompany;
      if (!result.ok) {
        throw new Error(result.error || "Company deletion failed.");
      }

      setTasks([]);
      setRelationshipDrafts({});
      setSkills([]);
      setSkillDrafts({});
      setRoles([]);
      setSkillGroups([]);
      setHasLoadedSkillGroups(false);
      setGitSkillPackages([]);
      setSecrets([]);
      setSecretDrafts({});
      setHasLoadedSecrets(false);
      setMcpServers([]);
      setMcpServerDrafts({});
      setAgents([]);
      setAgentDrafts({});
      setAgentRunners([]);
      await loadCompanies();
    } catch (deleteError: any) {
      setCompanyError(deleteError.message);
    } finally {
      setIsDeletingCompany(false);
    }
  }

  async function handleDeleteGithubInstallation(installationId: any) {
    if (!selectedCompanyId) {
      setGithubInstallationError("Select a company before deleting GitHub installations.");
      return;
    }

    const resolvedInstallationId = String(installationId || "").trim();
    if (!resolvedInstallationId) {
      setGithubInstallationError("installationId is required.");
      return;
    }

    const confirmed = window.confirm(
      `Delete GitHub installation ${resolvedInstallationId} from this company?`,
    );
    if (!confirmed) {
      return;
    }

    try {
      setDeletingGithubInstallationId(resolvedInstallationId);
      setGithubInstallationError("");
      setGithubInstallationNotice("");
      const data = await executeGraphQL(DELETE_GITHUB_INSTALLATION_MUTATION, {
        companyId: selectedCompanyId,
        installationId: resolvedInstallationId,
      });
      const result = data.deleteGithubInstallation;
      if (!result.ok) {
        throw new Error(result.error || "Failed to delete GitHub installation.");
      }
      setGithubInstallationNotice(`Deleted GitHub installation ${resolvedInstallationId}.`);
      await loadGithubInstallations();
      if (activePage === "repos") {
        await loadGithubRepositories();
      }
    } catch (deleteError: any) {
      setGithubInstallationError(deleteError.message);
    } finally {
      setDeletingGithubInstallationId("");
    }
  }

  async function handleRefreshGithubInstallationRepositories(installationId: any) {
    if (!selectedCompanyId) {
      setGithubInstallationError("Select a company before refreshing repositories.");
      return;
    }

    const resolvedInstallationId = String(installationId || "").trim();
    if (!resolvedInstallationId) {
      setGithubInstallationError("installationId is required.");
      return;
    }

    try {
      setRefreshingGithubInstallationId(resolvedInstallationId);
      setGithubInstallationError("");
      setGithubInstallationNotice("");
      const data = await executeGraphQL(REFRESH_GITHUB_INSTALLATION_REPOSITORIES_MUTATION, {
        companyId: selectedCompanyId,
        installationId: resolvedInstallationId,
      });
      const result = data.refreshGithubInstallationRepositories;
      if (!result.ok) {
        throw new Error(result.error || "Failed to refresh repositories.");
      }
      const refreshedRepositories = result.repositories || [];
      setGithubInstallationNotice(
        `Refreshed ${refreshedRepositories.length} repos for installation ${resolvedInstallationId}.`,
      );
      await loadGithubRepositories();
    } catch (refreshError: any) {
      setGithubInstallationError(refreshError.message);
    } finally {
      setRefreshingGithubInstallationId("");
    }
  }

  async function handleCreateTask(event: any) {
    event.preventDefault();
    if (!selectedCompanyId) {
      setTaskError("Select a company before creating tasks.");
      return false;
    }
    if (!name.trim()) {
      setTaskError("Task name is required.");
      return false;
    }

    try {
      setIsSubmittingTask(true);
      setTaskError("");
      const data = await executeGraphQL(CREATE_TASK_MUTATION, {
        companyId: selectedCompanyId,
        name: name.trim(),
        description: description.trim() || null,
        status: String(taskStatus || "").trim() || "draft",
        assigneePrincipalId: String(taskAssigneePrincipalId || "").trim() || null,
        parentTaskId: String(parentTaskId || "").trim() || null,
        dependencyTaskIds: normalizeUniqueStringList(dependencyTaskIds),
      });

      const result = data.createTask;
      if (!result.ok) {
        throw new Error(result.error || "Task creation failed.");
      }

      setName("");
      setDescription("");
      setTaskAssigneePrincipalId("");
      setTaskStatus("draft");
      setParentTaskId("");
      setDependencyTaskIds([]);
      await loadTasks();
      return true;
    } catch (submitError: any) {
      setTaskError(submitError.message);
      return false;
    } finally {
      setIsSubmittingTask(false);
    }
  }

  async function handleCreateAndExecuteTask(event: any, agentId: any) {
    event.preventDefault();
    if (!selectedCompanyId) {
      setTaskError("Select a company before creating tasks.");
      return false;
    }
    if (!name.trim()) {
      setTaskError("Task name is required.");
      return false;
    }
    const normalizedAgentId = String(agentId || "").trim();
    if (!normalizedAgentId) {
      setTaskError("Select an agent to execute the task.");
      return false;
    }

    try {
      setIsSubmittingTask(true);
      setTaskError("");
      const data = await executeGraphQL(CREATE_TASK_MUTATION, {
        companyId: selectedCompanyId,
        name: name.trim(),
        description: description.trim() || null,
        status: String(taskStatus || "").trim() || "draft",
        assigneePrincipalId: String(taskAssigneePrincipalId || "").trim() || null,
        parentTaskId: String(parentTaskId || "").trim() || null,
        dependencyTaskIds: normalizeUniqueStringList(dependencyTaskIds),
      });

      const result = data.createTask;
      if (!result.ok) {
        throw new Error(result.error || "Task creation failed.");
      }

      const createdTaskId = String(result.task?.id || "").trim();
      if (!createdTaskId) {
        throw new Error("Task was created but no ID was returned.");
      }

      const execData = await executeGraphQL(BATCH_EXECUTE_TASKS_MUTATION, {
        taskIds: [createdTaskId],
        agentId: normalizedAgentId,
      });
      const execResult = execData.batchExecuteTasks;
      if (!execResult.ok) {
        throw new Error(execResult.error || "Task created but execution failed.");
      }

      setName("");
      setDescription("");
      setTaskAssigneePrincipalId("");
      setTaskStatus("draft");
      setParentTaskId("");
      setDependencyTaskIds([]);
      await loadTasks();
      return true;
    } catch (submitError: any) {
      setTaskError(submitError.message);
      return false;
    } finally {
      setIsSubmittingTask(false);
    }
  }

  async function handleDeleteTask(taskId: any, taskName: any) {
    if (!selectedCompanyId) {
      setTaskError("Select a company before deleting tasks.");
      return;
    }

    const confirmed = window.confirm(`Delete task "${taskName}" (#${taskId})?`);
    if (!confirmed) {
      return;
    }

    try {
      setDeletingTaskId(taskId);
      setTaskError("");
      const data = await executeGraphQL(DELETE_TASK_MUTATION, {
        companyId: selectedCompanyId,
        id: taskId,
      });
      const result = data.deleteTask;
      if (!result.ok) {
        throw new Error(result.error || "Task deletion failed.");
      }
      await loadTasks();
    } catch (deleteError: any) {
      setTaskError(deleteError.message);
    } finally {
      setDeletingTaskId(null);
    }
  }

  async function handleBatchDeleteTasks(taskIds: any[]) {
    if (!selectedCompanyId) {
      setTaskError("Select a company before deleting tasks.");
      return false;
    }

    const normalizedTaskIds = normalizeUniqueStringList(taskIds || []);
    if (normalizedTaskIds.length === 0) {
      setTaskError("Select at least one task to delete.");
      return false;
    }

    const confirmed = window.confirm(
      `Delete ${normalizedTaskIds.length} selected task${normalizedTaskIds.length === 1 ? "" : "s"}?`,
    );
    if (!confirmed) {
      return false;
    }

    try {
      setDeletingTaskId("batch");
      setTaskError("");
      const data = await executeGraphQL(BATCH_DELETE_TASKS_MUTATION, {
        companyId: selectedCompanyId,
        ids: normalizedTaskIds,
      });
      const result = data.batchDeleteTasks;
      if (!result.ok) {
        throw new Error(result.error || "Batch task deletion failed.");
      }
      await loadTasks();
      return true;
    } catch (deleteError: any) {
      setTaskError(deleteError.message);
      return false;
    } finally {
      setDeletingTaskId(null);
    }
  }

  async function handleBatchExecuteTasks(taskIds: any[], fallbackAgentId: any = "") {
    if (!selectedCompanyId) {
      setTaskError("Select a company before executing tasks.");
      return false;
    }

    const normalizedTaskIds = normalizeUniqueStringList(taskIds || []);
    if (normalizedTaskIds.length === 0) {
      setTaskError("Select at least one task to execute.");
      return false;
    }

    const executionPlan = buildTaskExecutionPlan({
      taskIds: normalizedTaskIds,
      tasks,
      fallbackAgentId: String(fallbackAgentId || "").trim(),
    });

    if (executionPlan.missingTaskIds.length > 0) {
      setTaskError("Select a fallback agent for tasks without an assigned agent.");
      return false;
    }

    try {
      setSavingTaskId("batch");
      setTaskError("");
      for (const group of executionPlan.groups) {
        const data = await executeGraphQL(BATCH_EXECUTE_TASKS_MUTATION, {
          taskIds: group.taskIds,
          agentId: group.agentId,
        });
        const result = data.batchExecuteTasks;
        if (!result.ok) {
          throw new Error(result.error || "Batch task execution failed.");
        }
      }
      await loadTasks();
      return true;
    } catch (executeError: any) {
      setTaskError(executeError.message);
      return false;
    } finally {
      setSavingTaskId(null);
    }
  }

  async function handleRelationshipSave(taskId: any) {
    if (!selectedCompanyId) {
      setTaskError("Select a company before updating tasks.");
      return false;
    }
    const currentTask = tasks.find((task: any) => task.id === taskId);
    if (!currentTask) {
      setTaskError("Task not found.");
      return false;
    }
    const draft = relationshipDrafts[taskId] || {
      dependencyTaskIds: [],
      parentTaskId: String(currentTask.parentTaskId || "").trim(),
      childTaskIds: [],
      assigneePrincipalId: String(currentTask.assigneePrincipalId || "").trim(),
      status: String(currentTask.status || "").trim() || "draft",
    };

    try {
      setSavingTaskId(taskId);
      setTaskError("");

      const currentDependencyTaskIds = normalizeUniqueStringList(currentTask.dependencyTaskIds || []);
      const draftDependencyTaskIds = normalizeUniqueStringList(draft.dependencyTaskIds || [])
        .filter((dependencyTaskId: any) => dependencyTaskId !== taskId);
      const draftDependencyTaskIdSet = new Set(draftDependencyTaskIds);

      const dependencyTaskIdsToAdd = draftDependencyTaskIds
        .filter((dependencyTaskId: any) => !currentDependencyTaskIds.includes(dependencyTaskId));
      const dependencyTaskIdsToRemove = currentDependencyTaskIds
        .filter((dependencyTaskId: any) => !draftDependencyTaskIdSet.has(dependencyTaskId));
      const currentParentTaskId = String(currentTask.parentTaskId || "").trim();
      const draftParentTaskId = String(draft.parentTaskId || "").trim();
      const nextParentTaskId = draftParentTaskId && draftParentTaskId !== taskId
        ? draftParentTaskId
        : "";
      const currentChildTaskIds = normalizeUniqueStringList(
        tasks
          .filter((task: any) => String(task?.parentTaskId || "").trim() === taskId)
          .map((task: any) => String(task?.id || "").trim()),
      );
      const draftChildTaskIds = normalizeUniqueStringList(draft.childTaskIds || [])
        .filter((childTaskId: any) => childTaskId !== taskId && childTaskId !== nextParentTaskId);
      const draftChildTaskIdSet = new Set(draftChildTaskIds);
      const childTaskIdsToClearParent = currentChildTaskIds
        .filter((childTaskId: any) => !draftChildTaskIdSet.has(childTaskId));
      const childTaskIdsToAssign = draftChildTaskIds
        .filter((childTaskId: any) => !currentChildTaskIds.includes(childTaskId));
      const currentAssigneePrincipalId = String(currentTask.assigneePrincipalId || "").trim();
      const nextAssigneePrincipalId = String(draft.assigneePrincipalId || "").trim();
      const currentStatus = String(currentTask.status || "").trim() || "draft";
      const nextStatus = String(draft.status || "").trim() || "draft";

      if (currentAssigneePrincipalId !== nextAssigneePrincipalId) {
        const assigneeData = await executeGraphQL(SET_TASK_ASSIGNEE_PRINCIPAL_MUTATION, {
          companyId: selectedCompanyId,
          taskId,
          assigneePrincipalId: nextAssigneePrincipalId || null,
        });
        const assigneeResult = assigneeData.setTaskAssigneePrincipal;
        if (!assigneeResult.ok) {
          throw new Error(assigneeResult.error || "Task assignee update failed.");
        }
      }

      if (currentStatus !== nextStatus) {
        const statusData = await executeGraphQL(SET_TASK_STATUS_MUTATION, {
          companyId: selectedCompanyId,
          taskId,
          status: nextStatus,
        });
        const statusResult = statusData.setTaskStatus;
        if (!statusResult.ok) {
          throw new Error(statusResult.error || "Task status update failed.");
        }
      }

      for (const dependencyTaskId of dependencyTaskIdsToAdd) {
        const addData = await executeGraphQL(ADD_TASK_DEPENDENCY_MUTATION, {
          companyId: selectedCompanyId,
          taskId,
          dependencyTaskId,
        });
        const addResult = addData.addTaskDependency;
        if (!addResult.ok) {
          throw new Error(addResult.error || "Task dependency update failed.");
        }
      }

      for (const dependencyTaskId of dependencyTaskIdsToRemove) {
        const removeData = await executeGraphQL(REMOVE_TASK_DEPENDENCY_MUTATION, {
          companyId: selectedCompanyId,
          taskId,
          dependencyTaskId,
        });
        const removeResult = removeData.removeTaskDependency;
        if (!removeResult.ok) {
          throw new Error(removeResult.error || "Task dependency update failed.");
        }
      }

      for (const childTaskId of childTaskIdsToClearParent) {
        const clearParentData = await executeGraphQL(SET_TASK_PARENT_MUTATION, {
          companyId: selectedCompanyId,
          taskId: childTaskId,
          parentTaskId: null,
        });
        const clearParentResult = clearParentData.setTaskParent;
        if (!clearParentResult.ok) {
          throw new Error(clearParentResult.error || "Task parent update failed.");
        }
      }

      if (currentParentTaskId !== nextParentTaskId) {
        const setParentData = await executeGraphQL(SET_TASK_PARENT_MUTATION, {
          companyId: selectedCompanyId,
          taskId,
          parentTaskId: nextParentTaskId || null,
        });
        const setParentResult = setParentData.setTaskParent;
        if (!setParentResult.ok) {
          throw new Error(setParentResult.error || "Task parent update failed.");
        }
      }

      for (const childTaskId of childTaskIdsToAssign) {
        const assignChildData = await executeGraphQL(SET_TASK_PARENT_MUTATION, {
          companyId: selectedCompanyId,
          taskId: childTaskId,
          parentTaskId: taskId,
        });
        const assignChildResult = assignChildData.setTaskParent;
        if (!assignChildResult.ok) {
          throw new Error(assignChildResult.error || "Task parent update failed.");
        }
      }

      await loadTasks();
      return true;
    } catch (updateError: any) {
      setTaskError(updateError.message);
      return false;
    } finally {
      setSavingTaskId(null);
    }
  }

  async function handleAddTaskDependency(taskId: any, dependencyTaskId: any) {
    if (!selectedCompanyId) return;
    const currentTask = tasks.find((t: any) => t.id === taskId);
    if (!currentTask) return;
    const currentDeps = normalizeUniqueStringList(currentTask.dependencyTaskIds || []);
    if (currentDeps.includes(dependencyTaskId) || dependencyTaskId === taskId) return;
    try {
      setSavingTaskId(taskId);
      setTaskError("");
      const addData = await executeGraphQL(ADD_TASK_DEPENDENCY_MUTATION, {
        companyId: selectedCompanyId,
        taskId,
        dependencyTaskId,
      });
      const addResult = addData.addTaskDependency;
      if (!addResult.ok) throw new Error(addResult.error || "Failed to add dependency.");
      await loadTasks();
    } catch (err: any) {
      setTaskError(err.message);
    } finally {
      setSavingTaskId(null);
    }
  }

  async function handleCreateTaskComment(taskId: any, comment: any) {
    if (!selectedCompanyId) {
      setTaskError("Select a company before commenting on tasks.");
      return false;
    }

    const normalizedTaskId = String(taskId || "").trim();
    const normalizedComment = String(comment || "").trim();
    if (!normalizedTaskId) {
      setTaskError("Task id is required to add a comment.");
      return false;
    }
    if (!normalizedComment) {
      setTaskError("Comment text is required.");
      return false;
    }

    try {
      setCommentingTaskId(normalizedTaskId);
      setTaskError("");
      const data = await executeGraphQL(CREATE_TASK_COMMENT_MUTATION, {
        companyId: selectedCompanyId,
        taskId: normalizedTaskId,
        comment: normalizedComment,
      });
      const result = data.createTaskComment;
      if (!result.ok) {
        throw new Error(result.error || "Task comment creation failed.");
      }
      await loadTasks();
      return true;
    } catch (createError: any) {
      setTaskError(createError.message);
      return false;
    } finally {
      setCommentingTaskId(null);
    }
  }

  function resolveSkillMutationPayload({
    name: rawName,
    skillType: rawSkillType,
    skillsMpPackageName: rawSkillsMpPackageName,
    description: rawDescription,
    instructions: rawInstructions,
  }: any) {
    const name = String(rawName || "").trim();
    const resolvedSkillType = normalizeSkillType(rawSkillType);
    const skillsMpPackageName = String(rawSkillsMpPackageName || "").trim();
    const description = String(rawDescription || "").trim();
    const instructions = String(rawInstructions || "").trim();

    if (!name) {
      return { payload: null, error: "Skill name is required." };
    }

    if (resolvedSkillType === SKILL_TYPE_SKILLSMP) {
      if (!skillsMpPackageName) {
        return {
          payload: null,
          error: "SkillsMP package is required (for example: upstash/context7).",
        };
      }
      return {
        payload: {
          name,
          skillType: resolvedSkillType,
          skillsMpPackageName,
          description: description || null,
          instructions: instructions || null,
        },
        error: "",
      };
    }

    if (!description || !instructions) {
      return {
        payload: null,
        error: "Text skills require both description and instructions.",
      };
    }

    return {
      payload: {
        name,
        skillType: resolvedSkillType,
        skillsMpPackageName: null,
        description,
        instructions,
      },
      error: "",
    };
  }

  async function handleCreateSkill(event: any) {
    event.preventDefault();
    if (!selectedCompanyId) {
      setSkillError("Select a company before creating skills.");
      return false;
    }

    const { payload, error } = resolveSkillMutationPayload({
      name: skillName,
      skillType,
      skillsMpPackageName: skillSkillsMpPackageName,
      description: skillDescription,
      instructions: skillInstructions,
    });
    if (error) {
      setSkillError(error);
      return false;
    }

    try {
      setIsCreatingSkill(true);
      setSkillError("");
      const data = await executeGraphQL(CREATE_SKILL_MUTATION, {
        companyId: selectedCompanyId,
        ...payload,
      });
      const result = data.createSkill;
      if (!result.ok) {
        throw new Error(result.error || "Skill creation failed.");
      }
      setSkillName("");
      setSkillType(SKILL_TYPE_TEXT);
      setSkillSkillsMpPackageName("");
      setSkillDescription("");
      setSkillInstructions("");
      await loadSkills();
      return true;
    } catch (createError: any) {
      setSkillError(createError.message);
      return false;
    } finally {
      setIsCreatingSkill(false);
    }
  }

  async function handleSaveSkill(skillId: any) {
    if (!selectedCompanyId) {
      setSkillError("Select a company before updating skills.");
      return;
    }
    const draft = skillDrafts[skillId] || {
      name: "",
      skillType: SKILL_TYPE_TEXT,
      skillsMpPackageName: "",
      description: "",
      instructions: "",
    };

    const { payload, error } = resolveSkillMutationPayload({
      name: draft.name,
      skillType: draft.skillType,
      skillsMpPackageName: draft.skillsMpPackageName,
      description: draft.description,
      instructions: draft.instructions,
    });
    if (error) {
      setSkillError(error);
      return;
    }

    try {
      setSavingSkillId(skillId);
      setSkillError("");
      const data = await executeGraphQL(UPDATE_SKILL_MUTATION, {
        companyId: selectedCompanyId,
        id: skillId,
        ...payload,
      });
      const result = data.updateSkill;
      if (!result.ok) {
        throw new Error(result.error || "Skill update failed.");
      }
      await loadSkills();
    } catch (updateError: any) {
      setSkillError(updateError.message);
    } finally {
      setSavingSkillId(null);
    }
  }

  async function handleDeleteSkill(skillId: any, skillDisplayName: any) {
    if (!selectedCompanyId) {
      setSkillError("Select a company before deleting skills.");
      return;
    }

    const confirmed = window.confirm(`Delete skill "${skillDisplayName}"?`);
    if (!confirmed) {
      return;
    }

    try {
      setDeletingSkillId(skillId);
      setSkillError("");
      const data = await executeGraphQL(DELETE_SKILL_MUTATION, {
        companyId: selectedCompanyId,
        id: skillId,
      });
      const result = data.deleteSkill;
      if (!result.ok) {
        throw new Error(result.error || "Skill deletion failed.");
      }
      await loadSkills();
    } catch (deleteError: any) {
      setSkillError(deleteError.message);
    } finally {
      setDeletingSkillId(null);
    }
  }

  async function handlePreviewGitSkillPackage(gitRepositoryUrl: any) {
    const repositoryUrl = String(gitRepositoryUrl || "").trim();
    if (!repositoryUrl) {
      throw new Error("Git repository URL is required.");
    }

    const data = await executeGraphQL(PREVIEW_GIT_SKILL_PACKAGE_MUTATION, {
      gitRepositoryUrl: repositoryUrl,
    });
    const payload = data.previewGitSkillPackage;
    if (!payload?.ok) {
      throw new Error(payload?.error || "Failed to preview git skill package.");
    }
    return payload;
  }

  async function handleCreateGitSkillPackage({ gitRepositoryUrl, gitReference }: any) {
    if (!selectedCompanyId) {
      throw new Error("Select a company before importing git skill packages.");
    }

    const repositoryUrl = String(gitRepositoryUrl || "").trim();
    const reference = String(gitReference || "").trim();
    if (!repositoryUrl) {
      throw new Error("Git repository URL is required.");
    }
    if (!reference) {
      throw new Error("Select a branch or tag before importing.");
    }

    const data = await executeGraphQL(CREATE_GIT_SKILL_PACKAGE_MUTATION, {
      companyId: selectedCompanyId,
      gitRepositoryUrl: repositoryUrl,
      gitReference: reference,
    });
    const payload = data.createGitSkillPackage;
    if (!payload?.ok) {
      throw new Error(payload?.error || "Failed to create git skill package.");
    }

    await Promise.all([loadSkills(), loadRoles(), loadSkillGroups(), loadGitSkillPackages()]);
    return payload;
  }

  async function handleDeleteGitSkillPackage(gitSkillPackageId: any, packageName: any) {
    if (!selectedCompanyId) {
      setSkillError("Select a company before deleting git skill packages.");
      return false;
    }

    const resolvedPackageId = String(gitSkillPackageId || "").trim();
    if (!resolvedPackageId) {
      setSkillError("Package id is required.");
      return false;
    }

    const confirmed = window.confirm(`Delete git skill package "${packageName}"?`);
    if (!confirmed) {
      return false;
    }

    try {
      setSkillError("");
      const data = await executeGraphQL(DELETE_GIT_SKILL_PACKAGE_MUTATION, {
        companyId: selectedCompanyId,
        id: resolvedPackageId,
      });
      const payload = data.deleteGitSkillPackage;
      if (!payload?.ok) {
        throw new Error(payload?.error || "Failed to delete git skill package.");
      }

      await Promise.all([loadSkills(), loadRoles(), loadSkillGroups(), loadGitSkillPackages()]);
      return true;
    } catch (deleteError: any) {
      setSkillError(deleteError.message);
      return false;
    }
  }

  async function handleCreateSkillGroup({ name, parentSkillGroupId }: any) {
    if (!selectedCompanyId) {
      throw new Error("Select a company before creating skill groups.");
    }

    const normalizedName = String(name || "").trim();
    if (!normalizedName) {
      throw new Error("Skill group name is required.");
    }

    const data = await executeGraphQL(CREATE_SKILL_GROUP_MUTATION, {
      companyId: selectedCompanyId,
      name: normalizedName,
      parentSkillGroupId: resolveLegacyId(parentSkillGroupId) || null,
    });
    const payload = data.createSkillGroup;
    if (!payload?.ok) {
      throw new Error(payload?.error || "Failed to create skill group.");
    }

    await Promise.all([loadSkillGroups(), loadRoles()]);
    return payload.skillGroup;
  }

  async function handleDeleteSkillGroup(skillGroupId: any, skillGroupName: any) {
    if (!selectedCompanyId) {
      setSkillError("Select a company before deleting skill groups.");
      return false;
    }

    const resolvedSkillGroupId = String(skillGroupId || "").trim();
    if (!resolvedSkillGroupId) {
      setSkillError("Skill group id is required.");
      return false;
    }

    const confirmed = window.confirm(`Delete skill group "${skillGroupName}"?`);
    if (!confirmed) {
      return false;
    }

    try {
      setSkillError("");
      const data = await executeGraphQL(DELETE_SKILL_GROUP_MUTATION, {
        companyId: selectedCompanyId,
        id: resolvedSkillGroupId,
      });
      const payload = data.deleteSkillGroup;
      if (!payload?.ok) {
        throw new Error(payload?.error || "Failed to delete skill group.");
      }

      await Promise.all([loadSkillGroups(), loadRoles(), loadSkills()]);
      return true;
    } catch (deleteError: any) {
      setSkillError(deleteError.message);
      return false;
    }
  }

  async function handleUpdateSkillGroup({ id, name, parentSkillGroupId }: any) {
    if (!selectedCompanyId) {
      throw new Error("Select a company before updating skill groups.");
    }

    const resolvedSkillGroupId = String(id || "").trim();
    const normalizedName = String(name || "").trim();
    if (!resolvedSkillGroupId) {
      throw new Error("Skill group id is required.");
    }
    if (!normalizedName) {
      throw new Error("Skill group name is required.");
    }

    const data = await executeGraphQL(UPDATE_SKILL_GROUP_MUTATION, {
      companyId: selectedCompanyId,
      id: resolvedSkillGroupId,
      name: normalizedName,
      parentSkillGroupId: resolveLegacyId(parentSkillGroupId) || null,
    });
    const payload = data.updateSkillGroup;
    if (!payload?.ok) {
      throw new Error(payload?.error || "Failed to update skill group.");
    }

    await Promise.all([loadSkillGroups(), loadRoles(), loadSkills()]);
    return payload.skillGroup;
  }

  async function handleAddSkillToGroup(skillGroupId: any, skillId: any) {
    if (!selectedCompanyId) {
      throw new Error("Select a company before updating skill groups.");
    }

    const resolvedSkillGroupId = String(skillGroupId || "").trim();
    const resolvedSkillId = String(skillId || "").trim();
    if (!resolvedSkillGroupId || !resolvedSkillId) {
      throw new Error("Skill group and skill ids are required.");
    }

    const data = await executeGraphQL(ADD_SKILL_TO_GROUP_MUTATION, {
      companyId: selectedCompanyId,
      skillGroupId: resolvedSkillGroupId,
      skillId: resolvedSkillId,
    });
    const payload = data.addSkillToGroup;
    if (!payload?.ok) {
      throw new Error(payload?.error || "Failed to add skill to group.");
    }

    await Promise.all([loadSkillGroups(), loadRoles(), loadSkills()]);
  }

  async function handleRemoveSkillFromGroup(skillGroupId: any, skillId: any) {
    if (!selectedCompanyId) {
      throw new Error("Select a company before updating skill groups.");
    }

    const resolvedSkillGroupId = String(skillGroupId || "").trim();
    const resolvedSkillId = String(skillId || "").trim();
    if (!resolvedSkillGroupId || !resolvedSkillId) {
      throw new Error("Skill group and skill ids are required.");
    }

    const data = await executeGraphQL(REMOVE_SKILL_FROM_GROUP_MUTATION, {
      companyId: selectedCompanyId,
      skillGroupId: resolvedSkillGroupId,
      skillId: resolvedSkillId,
    });
    const payload = data.removeSkillFromGroup;
    if (!payload?.ok) {
      throw new Error(payload?.error || "Failed to remove skill from group.");
    }

    await Promise.all([loadSkillGroups(), loadRoles(), loadSkills()]);
  }

  async function handleCreateRole({ name, parentRoleId }: any) {
    if (!selectedCompanyId) {
      throw new Error("Select a company before creating roles.");
    }

    const normalizedName = String(name || "").trim();
    if (!normalizedName) {
      throw new Error("Role name is required.");
    }

    const data = await executeGraphQL(CREATE_ROLE_MUTATION, {
      companyId: selectedCompanyId,
      name: normalizedName,
      parentRoleId: resolveLegacyId(parentRoleId) || null,
    });
    const payload = data.createRole;
    if (!payload?.ok) {
      throw new Error(payload?.error || "Failed to create role.");
    }

    await loadRoles();
    return payload.role;
  }

  async function handleDeleteRole(roleId: any, roleName: any) {
    if (!selectedCompanyId) {
      setSkillError("Select a company before deleting roles.");
      return false;
    }

    const resolvedRoleId = String(roleId || "").trim();
    if (!resolvedRoleId) {
      setSkillError("Role id is required.");
      return false;
    }

    const confirmed = window.confirm(`Delete role "${roleName}"?`);
    if (!confirmed) {
      return false;
    }

    try {
      setSkillError("");
      const data = await executeGraphQL(DELETE_ROLE_MUTATION, {
        companyId: selectedCompanyId,
        id: resolvedRoleId,
      });
      const payload = data.deleteRole;
      if (!payload?.ok) {
        throw new Error(payload?.error || "Failed to delete role.");
      }

      await Promise.all([loadRoles(), loadAgents()]);
      return true;
    } catch (deleteError: any) {
      setSkillError(deleteError.message);
      return false;
    }
  }

  async function handleUpdateRole({ id, name, parentRoleId }: any) {
    if (!selectedCompanyId) {
      throw new Error("Select a company before updating roles.");
    }

    const resolvedRoleId = String(id || "").trim();
    const normalizedName = String(name || "").trim();
    if (!resolvedRoleId) {
      throw new Error("Role id is required.");
    }
    if (!normalizedName) {
      throw new Error("Role name is required.");
    }

    const data = await executeGraphQL(UPDATE_ROLE_MUTATION, {
      companyId: selectedCompanyId,
      id: resolvedRoleId,
      name: normalizedName,
      parentRoleId: resolveLegacyId(parentRoleId) || null,
    });
    const payload = data.updateRole;
    if (!payload?.ok) {
      throw new Error(payload?.error || "Failed to update role.");
    }

    await Promise.all([loadRoles(), loadAgents()]);
    return payload.role;
  }

  async function handleAddSkillToRole(roleId: any, skillId: any) {
    if (!selectedCompanyId) {
      throw new Error("Select a company before updating roles.");
    }

    const resolvedRoleId = String(roleId || "").trim();
    const resolvedSkillId = String(skillId || "").trim();
    if (!resolvedRoleId || !resolvedSkillId) {
      throw new Error("Role and skill ids are required.");
    }

    const data = await executeGraphQL(ADD_SKILL_TO_ROLE_MUTATION, {
      companyId: selectedCompanyId,
      roleId: resolvedRoleId,
      skillId: resolvedSkillId,
    });
    const payload = data.addSkillToRole;
    if (!payload?.ok) {
      throw new Error(payload?.error || "Failed to add skill to role.");
    }

    await Promise.all([loadRoles(), loadSkills()]);
  }

  async function handleRemoveSkillFromRole(roleId: any, skillId: any) {
    if (!selectedCompanyId) {
      throw new Error("Select a company before updating roles.");
    }

    const resolvedRoleId = String(roleId || "").trim();
    const resolvedSkillId = String(skillId || "").trim();
    if (!resolvedRoleId || !resolvedSkillId) {
      throw new Error("Role and skill ids are required.");
    }

    const data = await executeGraphQL(REMOVE_SKILL_FROM_ROLE_MUTATION, {
      companyId: selectedCompanyId,
      roleId: resolvedRoleId,
      skillId: resolvedSkillId,
    });
    const payload = data.removeSkillFromRole;
    if (!payload?.ok) {
      throw new Error(payload?.error || "Failed to remove skill from role.");
    }

    await Promise.all([loadRoles(), loadSkills()]);
  }

  async function handleRoleSkillGroupIdsChange(roleId: any, nextSkillGroupIds: any) {
    const normalizedRoleId = String(roleId || "").trim();
    if (!normalizedRoleId) {
      return;
    }

    if (!selectedCompanyId) {
      setSkillError("Select a company before updating roles.");
      return;
    }

    const normalizedNextSkillGroupIds = normalizeUniqueStringList(nextSkillGroupIds || []);
    const currentSkillGroupIds = normalizeUniqueStringList(
      roleSkillGroupIdsByRoleId?.[normalizedRoleId] || [],
    );
    const currentSet = new Set(currentSkillGroupIds);
    const nextSet = new Set(normalizedNextSkillGroupIds);
    const skillGroupIdsToAdd = normalizedNextSkillGroupIds.filter((skillGroupId: any) => !currentSet.has(skillGroupId));
    const skillGroupIdsToRemove = currentSkillGroupIds.filter((skillGroupId: any) => !nextSet.has(skillGroupId));

    if (skillGroupIdsToAdd.length === 0 && skillGroupIdsToRemove.length === 0) {
      return;
    }

    try {
      setSkillError("");
      for (const skillGroupId of skillGroupIdsToRemove) {
        const data = await executeGraphQL(REMOVE_SKILL_GROUP_FROM_ROLE_MUTATION, {
          companyId: selectedCompanyId,
          roleId: normalizedRoleId,
          skillGroupId,
        });
        const payload = data?.removeSkillGroupFromRole;
        if (!payload?.ok) {
          throw new Error(payload?.error || "Failed to remove skill group from role.");
        }
      }

      for (const skillGroupId of skillGroupIdsToAdd) {
        const data = await executeGraphQL(ADD_SKILL_GROUP_TO_ROLE_MUTATION, {
          companyId: selectedCompanyId,
          roleId: normalizedRoleId,
          skillGroupId,
        });
        const payload = data?.addSkillGroupToRole;
        if (!payload?.ok) {
          throw new Error(payload?.error || "Failed to add skill group to role.");
        }
      }

      await Promise.all([loadRoles(), loadSkillGroups()]);
    } catch (error: any) {
      setSkillError((error && error.message) || "Failed to update role skill groups.");
    }
  }

  async function handleRoleMcpServerIdsChange(roleId: any, nextMcpServerIds: any) {
    const normalizedRoleId = String(roleId || "").trim();
    if (!normalizedRoleId) {
      return;
    }

    if (!selectedCompanyId) {
      setSkillError("Select a company before updating roles.");
      return;
    }

    const normalizedNextMcpServerIds = normalizeUniqueStringList(nextMcpServerIds || []);
    const currentMcpServerIds = normalizeUniqueStringList(
      roleMcpServerIdsByRoleId?.[normalizedRoleId] || [],
    );
    const currentSet = new Set(currentMcpServerIds);
    const nextSet = new Set(normalizedNextMcpServerIds);
    const mcpServerIdsToAdd = normalizedNextMcpServerIds.filter((mcpServerId: any) => !currentSet.has(mcpServerId));
    const mcpServerIdsToRemove = currentMcpServerIds.filter((mcpServerId: any) => !nextSet.has(mcpServerId));

    if (mcpServerIdsToAdd.length === 0 && mcpServerIdsToRemove.length === 0) {
      return;
    }

    try {
      setSkillError("");
      for (const mcpServerId of mcpServerIdsToRemove) {
        const data = await executeGraphQL(REMOVE_MCP_SERVER_FROM_ROLE_MUTATION, {
          companyId: selectedCompanyId,
          roleId: normalizedRoleId,
          mcpServerId,
        });
        const payload = data?.removeMcpServerFromRole;
        if (!payload?.ok) {
          throw new Error(payload?.error || "Failed to remove MCP server from role.");
        }
      }

      for (const mcpServerId of mcpServerIdsToAdd) {
        const data = await executeGraphQL(ADD_MCP_SERVER_TO_ROLE_MUTATION, {
          companyId: selectedCompanyId,
          roleId: normalizedRoleId,
          mcpServerId,
        });
        const payload = data?.addMcpServerToRole;
        if (!payload?.ok) {
          throw new Error(payload?.error || "Failed to add MCP server to role.");
        }
      }

      await Promise.all([loadRoles(), loadAgents()]);
    } catch (error: any) {
      setSkillError((error && error.message) || "Failed to update role MCP servers.");
    }
  }

  async function handleCreateSecret(event: any) {
    event.preventDefault();
    if (!selectedCompanyId) {
      setSecretError("Select a company before creating secrets.");
      return false;
    }

    const requestedName = String(secretName || "").trim();
    const requestedDescription = String(secretDescription || "").trim();
    const requestedValue = String(secretValue || "");

    if (!requestedName) {
      setSecretError("Secret name is required.");
      return false;
    }
    if (!requestedDescription) {
      setSecretError("Secret description is required.");
      return false;
    }
    if (!requestedValue.trim()) {
      setSecretError("Secret value is required.");
      return false;
    }

    try {
      setIsCreatingSecret(true);
      setSecretError("");
      const data = await executeGraphQL(CREATE_SECRET_MUTATION, {
        companyId: selectedCompanyId,
        name: requestedName,
        description: requestedDescription,
        value: requestedValue,
      });
      const result = data.createSecret;
      if (!result.ok) {
        throw new Error(result.error || "Secret creation failed.");
      }
      setSecretName("");
      setSecretDescription("");
      setSecretValue("");
      await loadSecrets();
      return true;
    } catch (createError: any) {
      setSecretError(createError.message);
      return false;
    } finally {
      setIsCreatingSecret(false);
    }
  }

  function handleSecretDraftChange(secretId: any, field: any, value: any) {
    setSecretDrafts((currentDrafts: any) => {
      const currentDraft = currentDrafts[secretId] || {
        name: "",
        description: "",
        value: "",
      };
      return {
        ...currentDrafts,
        [secretId]: {
          ...currentDraft,
          [field]: value,
        },
      };
    });
  }

  async function handleSaveSecret(secretId: any) {
    if (!selectedCompanyId) {
      setSecretError("Select a company before updating secrets.");
      return;
    }

    const draft = secretDrafts[secretId] || {
      name: "",
      description: "",
      value: "",
    };
    const requestedName = String(draft.name || "").trim();
    const requestedDescription = String(draft.description || "").trim();
    const requestedValue = String(draft.value || "");
    const nextValue = requestedValue.trim() ? requestedValue : null;

    if (!requestedName) {
      setSecretError("Secret name is required.");
      return;
    }
    if (!requestedDescription) {
      setSecretError("Secret description is required.");
      return;
    }

    try {
      setSavingSecretId(secretId);
      setSecretError("");
      const data = await executeGraphQL(UPDATE_SECRET_MUTATION, {
        companyId: selectedCompanyId,
        id: secretId,
        name: requestedName,
        description: requestedDescription,
        value: nextValue,
      });
      const result = data.updateSecret;
      if (!result.ok) {
        throw new Error(result.error || "Secret update failed.");
      }
      await loadSecrets();
    } catch (updateError: any) {
      setSecretError(updateError.message);
    } finally {
      setSavingSecretId(null);
    }
  }

  async function handleDeleteSecret(secretId: any, secretDisplayName: any) {
    if (!selectedCompanyId) {
      setSecretError("Select a company before deleting secrets.");
      return;
    }

    const confirmed = window.confirm(`Delete secret "${secretDisplayName}"?`);
    if (!confirmed) {
      return;
    }

    try {
      setDeletingSecretId(secretId);
      setSecretError("");
      const data = await executeGraphQL(DELETE_SECRET_MUTATION, {
        companyId: selectedCompanyId,
        id: secretId,
      });
      const result = data.deleteSecret;
      if (!result.ok) {
        throw new Error(result.error || "Secret deletion failed.");
      }
      await loadSecrets();
    } catch (deleteError: any) {
      setSecretError(deleteError.message);
    } finally {
      setDeletingSecretId(null);
    }
  }

  function handleApprovalRejectionReasonChange(approvalId: any, value: any) {
    const normalizedApprovalId = String(approvalId || "").trim();
    if (!normalizedApprovalId) {
      return;
    }
    setRejectionReasonDraftByApprovalId((currentByApprovalId: any) => ({
      ...(currentByApprovalId || {}),
      [normalizedApprovalId]: String(value || ""),
    }));
  }

  async function handleApproveApproval(approvalId: any) {
    const normalizedApprovalId = String(approvalId || "").trim();
    if (!selectedCompanyId || !normalizedApprovalId) {
      return;
    }

    try {
      setApprovingApprovalId(normalizedApprovalId);
      setApprovalError("");
      const data = await executeGraphQL(APPROVE_APPROVAL_MUTATION, {
        companyId: selectedCompanyId,
        id: normalizedApprovalId,
      });
      const payload = data?.approveApproval;
      if (!payload?.ok) {
        throw new Error(payload?.error || "Failed to approve approval.");
      }
      await loadApprovals();
    } catch (error: any) {
      setApprovalError(error?.message || "Failed to approve approval.");
    } finally {
      setApprovingApprovalId(null);
    }
  }

  async function handleRejectApproval(approvalId: any) {
    const normalizedApprovalId = String(approvalId || "").trim();
    if (!selectedCompanyId || !normalizedApprovalId) {
      return;
    }

    const rejectionReason = String(rejectionReasonDraftByApprovalId?.[normalizedApprovalId] || "").trim();

    try {
      setRejectingApprovalId(normalizedApprovalId);
      setApprovalError("");
      const data = await executeGraphQL(REJECT_APPROVAL_MUTATION, {
        companyId: selectedCompanyId,
        id: normalizedApprovalId,
        rejectionReason: rejectionReason || null,
      });
      const payload = data?.rejectApproval;
      if (!payload?.ok) {
        throw new Error(payload?.error || "Failed to reject approval.");
      }
      setRejectionReasonDraftByApprovalId((currentByApprovalId: any) => ({
        ...(currentByApprovalId || {}),
        [normalizedApprovalId]: "",
      }));
      await loadApprovals();
    } catch (error: any) {
      setApprovalError(error?.message || "Failed to reject approval.");
    } finally {
      setRejectingApprovalId(null);
    }
  }

  async function handleDeleteApproval(approvalId: any) {
    const normalizedApprovalId = String(approvalId || "").trim();
    if (!selectedCompanyId || !normalizedApprovalId) {
      return;
    }

    const confirmed = window.confirm("Delete this approval?");
    if (!confirmed) {
      return;
    }

    try {
      setDeletingApprovalId(normalizedApprovalId);
      setApprovalError("");
      const data = await executeGraphQL(DELETE_APPROVAL_MUTATION, {
        companyId: selectedCompanyId,
        id: normalizedApprovalId,
      });
      const payload = data?.deleteApproval;
      if (!payload?.ok) {
        throw new Error(payload?.error || "Failed to delete approval.");
      }
      await loadApprovals();
    } catch (error: any) {
      setApprovalError(error?.message || "Failed to delete approval.");
    } finally {
      setDeletingApprovalId(null);
    }
  }

  function resolveMcpServerMutationPayload({
    name: rawName,
    transportType: rawTransportType,
    url: rawUrl,
    command: rawCommand,
    argsText: rawArgsText,
    envVarsText: rawEnvVarsText,
    authType: rawAuthType,
    bearerTokenSecretId: rawBearerTokenSecretId,
    customHeadersText: rawCustomHeadersText,
    enabled: rawEnabled,
  }: any) {
    const name = String(rawName || "").trim();
    const transportType = normalizeMcpTransportType(rawTransportType);
    const url = String(rawUrl || "").trim();
    const command = String(rawCommand || "").trim();
    const argsText = String(rawArgsText || "");
    const envVarsText = String(rawEnvVarsText || "");
    const authType = normalizeMcpAuthType(rawAuthType);
    const bearerTokenSecretId = String(rawBearerTokenSecretId || "").trim();
    const customHeadersText = String(rawCustomHeadersText || "");

    if (!name) {
      return { payload: null, error: "MCP server name is required." };
    }

    if (transportType === MCP_TRANSPORT_TYPE_STDIO) {
      if (!command) {
        return { payload: null, error: "MCP server command is required for stdio transport." };
      }
      const parsedArgs = parseMcpArgsText(argsText);
      if (parsedArgs.error) {
        return { payload: null, error: parsedArgs.error };
      }
      const parsedEnvVars = parseMcpEnvVarsText(envVarsText);
      if (parsedEnvVars.error) {
        return { payload: null, error: parsedEnvVars.error };
      }

      return {
        payload: {
          name,
          transportType,
          url: null,
          command,
          args: parsedArgs.args,
          envVars: parsedEnvVars.envVars,
          authType: MCP_AUTH_TYPE_NONE,
          bearerTokenSecretId: null,
          customHeaders: [],
          enabled: Boolean(rawEnabled),
        },
        error: "",
      };
    }

    if (!url) {
      return { payload: null, error: "MCP server URL is required for streamable HTTP transport." };
    }

    let customHeaders: any[] = [];
    if (authType === MCP_AUTH_TYPE_CUSTOM_HEADERS) {
      const parsed = parseMcpHeadersText(customHeadersText);
      if (parsed.error) {
        return { payload: null, error: parsed.error };
      }
      if (parsed.headers.length === 0) {
        return { payload: null, error: "At least one custom header is required." };
      }
      customHeaders = parsed.headers;
    } else if (customHeadersText.trim()) {
      const parsed = parseMcpHeadersText(customHeadersText);
      if (parsed.error) {
        return { payload: null, error: parsed.error };
      }
    }

    if (authType === MCP_AUTH_TYPE_BEARER_TOKEN && !bearerTokenSecretId) {
      return { payload: null, error: "Bearer token secret is required when auth type is Bearer token." };
    }

    return {
      payload: {
        name,
        transportType,
        url,
        command: null,
        args: [],
        envVars: [],
        authType,
        bearerTokenSecretId: authType === MCP_AUTH_TYPE_BEARER_TOKEN ? bearerTokenSecretId : null,
        customHeaders: authType === MCP_AUTH_TYPE_CUSTOM_HEADERS ? customHeaders : [],
        enabled: Boolean(rawEnabled),
      },
      error: "",
    };
  }

  async function handleCreateMcpServer(event: any) {
    event.preventDefault();
    if (!selectedCompanyId) {
      setMcpServerError("Select a company before creating MCP servers.");
      return false;
    }

    const { payload, error } = resolveMcpServerMutationPayload({
      name: mcpServerName,
      transportType: mcpServerTransportType,
      url: mcpServerUrl,
      command: mcpServerCommand,
      argsText: mcpServerArgsText,
      envVarsText: mcpServerEnvVarsText,
      authType: mcpServerAuthType,
      bearerTokenSecretId: mcpServerBearerTokenSecretId,
      customHeadersText: mcpServerCustomHeadersText,
      enabled: mcpServerEnabled,
    });
    if (error) {
      setMcpServerError(error);
      return false;
    }

    try {
      setIsCreatingMcpServer(true);
      setMcpServerError("");
      const data = await executeGraphQL(CREATE_MCP_SERVER_MUTATION, {
        companyId: selectedCompanyId,
        ...payload,
      });
      const result = data.createMcpServer;
      if (!result.ok) {
        throw new Error(result.error || "MCP server creation failed.");
      }
      setMcpServerName("");
      setMcpServerTransportType(MCP_TRANSPORT_TYPE_STREAMABLE_HTTP);
      setMcpServerUrl("");
      setMcpServerCommand("");
      setMcpServerArgsText("");
      setMcpServerEnvVarsText("");
      setMcpServerAuthType(MCP_AUTH_TYPE_NONE);
      setMcpServerBearerTokenSecretId("");
      setMcpServerCustomHeadersText("");
      setMcpServerEnabled(true);
      await loadMcpServers();
      return true;
    } catch (createError: any) {
      setMcpServerError(createError.message);
      return false;
    } finally {
      setIsCreatingMcpServer(false);
    }
  }

  function handleMcpServerDraftChange(mcpServerId: any, field: any, value: any) {
    setMcpServerDrafts((currentDrafts: any) => {
      const currentDraft = currentDrafts[mcpServerId] || {
        name: "",
        transportType: MCP_TRANSPORT_TYPE_STREAMABLE_HTTP,
        url: "",
        command: "",
        argsText: "",
        envVarsText: "",
        authType: MCP_AUTH_TYPE_NONE,
        bearerTokenSecretId: "",
        customHeadersText: "",
        enabled: true,
      };

      const nextDraft = {
        ...currentDraft,
        [field]: value,
      };

      if (field === "authType") {
        nextDraft.authType = normalizeMcpAuthType(value);
      }
      if (field === "transportType") {
        nextDraft.transportType = normalizeMcpTransportType(value);
        if (nextDraft.transportType === MCP_TRANSPORT_TYPE_STDIO) {
          nextDraft.authType = MCP_AUTH_TYPE_NONE;
        }
      }
      if (field === "enabled") {
        nextDraft.enabled = Boolean(value);
      }

      return {
        ...currentDrafts,
        [mcpServerId]: nextDraft,
      };
    });
  }

  async function handleSaveMcpServer(mcpServerId: any) {
    if (!selectedCompanyId) {
      setMcpServerError("Select a company before updating MCP servers.");
      return;
    }
    const draft = mcpServerDrafts[mcpServerId] || {
      name: "",
      transportType: MCP_TRANSPORT_TYPE_STREAMABLE_HTTP,
      url: "",
      command: "",
      argsText: "",
      envVarsText: "",
      authType: MCP_AUTH_TYPE_NONE,
      bearerTokenSecretId: "",
      customHeadersText: "",
      enabled: true,
    };

    const { payload, error } = resolveMcpServerMutationPayload(draft);
    if (error) {
      setMcpServerError(error);
      return;
    }

    try {
      setSavingMcpServerId(mcpServerId);
      setMcpServerError("");
      const data = await executeGraphQL(UPDATE_MCP_SERVER_MUTATION, {
        companyId: selectedCompanyId,
        id: mcpServerId,
        ...payload,
      });
      const result = data.updateMcpServer;
      if (!result.ok) {
        throw new Error(result.error || "MCP server update failed.");
      }
      await loadMcpServers();
    } catch (updateError: any) {
      setMcpServerError(updateError.message);
    } finally {
      setSavingMcpServerId(null);
    }
  }

  async function handleDeleteMcpServer(mcpServerId: any, mcpServerDisplayName: any) {
    if (!selectedCompanyId) {
      setMcpServerError("Select a company before deleting MCP servers.");
      return;
    }

    const confirmed = window.confirm(`Delete MCP server "${mcpServerDisplayName}"?`);
    if (!confirmed) {
      return;
    }

    try {
      setDeletingMcpServerId(mcpServerId);
      setMcpServerError("");
      const data = await executeGraphQL(DELETE_MCP_SERVER_MUTATION, {
        companyId: selectedCompanyId,
        id: mcpServerId,
      });
      const result = data.deleteMcpServer;
      if (!result.ok) {
        throw new Error(result.error || "MCP server deletion failed.");
      }
      await loadMcpServers();
    } catch (deleteError: any) {
      setMcpServerError(deleteError.message);
    } finally {
      setDeletingMcpServerId(null);
    }
  }

  async function handleRegenerateRunnerSecret(runnerId: any) {
    if (!selectedCompanyId) {
      setRunnerError("Select a company before regenerating runner keys.");
      return;
    }

    const confirmed = window.confirm(
      `Regenerate API key for runner ${runnerId}? Existing runner processes using the old key will need to reconnect with the new key.`,
    );
    if (!confirmed) {
      return;
    }

    try {
      setRegeneratingRunnerId(runnerId);
      setRunnerError("");
      const data = await executeGraphQL(REGENERATE_AGENT_RUNNER_SECRET_MUTATION, {
        companyId: selectedCompanyId,
        id: runnerId,
      });
      const result = data.regenerateAgentRunnerSecret;
      if (!result.ok) {
        throw new Error(result.error || "Runner key regeneration failed.");
      }

      const regeneratedSecret = result.provisionedAuthSecret || "";
      if (!regeneratedSecret) {
        throw new Error("Runner key regeneration failed: missing secret.");
      }
      setRunnerSecretsById((currentSecrets: any) => ({
        ...currentSecrets,
        [runnerId]: regeneratedSecret,
      }));
      await loadAgentRunners({ silently: true });
    } catch (regenerateError: any) {
      setRunnerError(regenerateError.message);
    } finally {
      setRegeneratingRunnerId(null);
    }
  }

  async function handleDeleteRunner(runnerId: any) {
    if (!selectedCompanyId) {
      setRunnerError("Select a company before deleting runners.");
      return;
    }

    const confirmed = window.confirm(`Delete runner ${runnerId}?`);
    if (!confirmed) {
      return;
    }

    try {
      setDeletingRunnerId(runnerId);
      setRunnerError("");
      const data = await executeGraphQL(DELETE_AGENT_RUNNER_MUTATION, {
        companyId: selectedCompanyId,
        id: runnerId,
      });
      const result = data.deleteAgentRunner;
      if (!result.ok) {
        throw new Error(result.error || "Runner deletion failed.");
      }
      setRunnerSecretsById((currentSecrets: any) => {
        if (!(runnerId in currentSecrets)) {
          return currentSecrets;
        }
        const nextSecrets = { ...currentSecrets };
        delete nextSecrets[runnerId];
        return nextSecrets;
      });
      await loadAgentRunners();
    } catch (deleteError: any) {
      setRunnerError(deleteError.message);
    } finally {
      setDeletingRunnerId(null);
    }
  }

  async function handleCreateRunner(event: any) {
    event.preventDefault();
    if (!selectedCompanyId) {
      setRunnerError("Select a company before creating runners.");
      return false;
    }
    const requestedRunnerName = runnerNameDraft.trim();
    if (!requestedRunnerName) {
      setRunnerError("Runner name is required.");
      return false;
    }

    try {
      setIsCreatingRunner(true);
      setRunnerError("");
      const data = await executeGraphQL(CREATE_AGENT_RUNNER_MUTATION, {
        companyId: selectedCompanyId,
        name: requestedRunnerName,
      });
      const result = data.createAgentRunner;
      if (!result.ok) {
        throw new Error(result.error || "Runner creation failed.");
      }

      const createdRunnerId = result.agentRunner?.id;
      const provisionedRunnerSecret = result.provisionedAuthSecret || "";
      if (createdRunnerId && provisionedRunnerSecret) {
        setRunnerSecretsById((currentSecrets: any) => ({
          ...currentSecrets,
          [createdRunnerId]: provisionedRunnerSecret,
        }));
      }

      setRunnerNameDraft("");
      await loadAgentRunners();
      return true;
    } catch (createError: any) {
      setRunnerError(createError.message);
      return false;
    } finally {
      setIsCreatingRunner(false);
    }
  }

  async function handleCreateAgent(event: any) {
    event.preventDefault();
    if (!selectedCompanyId) {
      setAgentError("Select a company before creating agents.");
      return false;
    }
    if (agentRunners.length === 0) {
      setAgentError("Register at least one runner before creating an agent.");
      return false;
    }
    if (!agentName.trim()) {
      setAgentError("Agent name is required.");
      return false;
    }
    if (!agentRunnerId) {
      setAgentError("Assign a runner before creating an agent.");
      return false;
    }

    const selectedRunner = agentRunnerLookup.get(agentRunnerId);
    if (!selectedRunner) {
      setAgentError(`Assigned runner ${agentRunnerId} was not found for this company.`);
      return false;
    }

    const normalizedSdk = normalizeAgentSdkValue(agentSdk);
    if (!isAvailableAgentSdk(normalizedSdk)) {
      setAgentError(`agentSdk must be one of: ${AVAILABLE_AGENT_SDKS.join(", ")}.`);
      return false;
    }

    const selectedRunnerCodexModels = getRunnerCodexModelEntriesForRunner(
      runnerCodexModelEntriesById,
      agentRunnerId,
    );
    if (selectedRunnerCodexModels.length === 0) {
      setAgentError(`Runner ${agentRunnerId} has not reported any available models yet.`);
      return false;
    }

    const normalizedModel = String(agentModel || "").trim();
    if (!normalizedModel) {
      setAgentError("Model is required.");
      return false;
    }
    if (!getRunnerModelNames(selectedRunnerCodexModels).includes(normalizedModel)) {
      setAgentError(
        `Model "${normalizedModel}" is not available on runner ${agentRunnerId}. Wait for runner model updates and try again.`,
      );
      return false;
    }

    const normalizedReasoning = String(agentModelReasoningLevel || "").trim();
    if (!normalizedReasoning) {
      setAgentError("Model reasoning level is required.");
      return false;
    }
    if (!getRunnerReasoningLevels(selectedRunnerCodexModels, normalizedModel).includes(normalizedReasoning)) {
      setAgentError(
        `Reasoning "${normalizedReasoning}" is not available for model "${normalizedModel}" on runner ${agentRunnerId}.`,
      );
      return false;
    }
    const { agentRunnerSdkId, defaultModelId } = resolveRunnerSdkAndModelIds({
      runner: selectedRunner,
      sdkName: normalizedSdk,
      modelName: normalizedModel,
    });
    if (!agentRunnerSdkId) {
      setAgentError(
        `Runner ${agentRunnerId} did not provide SDK metadata for "${normalizedSdk}". Refresh runners and try again.`,
      );
      return false;
    }
    if (!defaultModelId) {
      setAgentError(
        `Runner ${agentRunnerId} did not provide model metadata for "${normalizedModel}". Refresh runners and try again.`,
      );
      return false;
    }

    try {
      setIsCreatingAgent(true);
      setAgentError("");
      const cleanAgentMcpServerIds = resolveEffectiveRoleMcpServerIds(
        agentRoleIds,
        roles,
        roleMcpServerIdsByRoleId,
      );
      const normalizedDefaultAdditionalModelInstructions = normalizeOptionalInstructions(
        agentDefaultAdditionalModelInstructions,
      );
      const data = await executeGraphQL(CREATE_AGENT_MUTATION, {
        companyId: selectedCompanyId,
        agentRunnerId: agentRunnerId || null,
        roleIds: agentRoleIds,
        mcpServerIds: cleanAgentMcpServerIds,
        defaultAdditionalModelInstructions: normalizedDefaultAdditionalModelInstructions,
        name: agentName.trim(),
        agentSdk: normalizedSdk,
        model: normalizedModel,
        modelReasoningLevel: normalizedReasoning,
        agentRunnerSdkId,
        defaultModelId,
        defaultReasoningLevel: normalizedReasoning,
      });
      const result = data.createAgent;
      if (!result.ok) {
        throw new Error(result.error || "Agent creation failed.");
      }
      setAgentName("");
      setAgentRunnerId("");
      setAgentRoleIds([]);
      setAgentMcpServerIds([]);
      setAgentSdk(DEFAULT_AGENT_SDK);
      setAgentModel("");
      setAgentModelReasoningLevel("");
      setAgentDefaultAdditionalModelInstructions("");
      await loadAgents();
      return true;
    } catch (createError: any) {
      setAgentError(createError.message);
      return false;
    } finally {
      setIsCreatingAgent(false);
    }
  }

  async function handleSaveAgent(agentId: any) {
    if (!selectedCompanyId) {
      setAgentError("Select a company before updating agents.");
      return false;
    }
    const draft = agentDrafts[agentId] || {
      agentRunnerId: "",
      roleIds: [],
      mcpServerIds: [],
      name: "",
      agentSdk: DEFAULT_AGENT_SDK,
      model: "",
      modelReasoningLevel: "",
      defaultAdditionalModelInstructions: "",
    };
    if (!draft.name.trim()) {
      setAgentError("Agent name is required to save.");
      return false;
    }
    if (!draft.agentRunnerId) {
      setAgentError("Assigned runner is required to save an agent.");
      return false;
    }

    const assignedRunner = agentRunnerLookup.get(draft.agentRunnerId);
    if (!assignedRunner) {
      setAgentError(`Assigned runner ${draft.agentRunnerId} was not found for this company.`);
      return false;
    }

    const normalizedSdk = normalizeAgentSdkValue(draft.agentSdk);
    if (!isAvailableAgentSdk(normalizedSdk)) {
      setAgentError(`agentSdk must be one of: ${AVAILABLE_AGENT_SDKS.join(", ")}.`);
      return false;
    }

    const selectedRunnerCodexModels = getRunnerCodexModelEntriesForRunner(
      runnerCodexModelEntriesById,
      draft.agentRunnerId,
    );
    if (selectedRunnerCodexModels.length === 0) {
      setAgentError(`Runner ${draft.agentRunnerId} has not reported any available models yet.`);
      return false;
    }

    const normalizedModel = String(draft.model || "").trim();
    if (!normalizedModel) {
      setAgentError("Model is required to save.");
      return false;
    }
    if (!getRunnerModelNames(selectedRunnerCodexModels).includes(normalizedModel)) {
      setAgentError(
        `Model "${normalizedModel}" is not available on runner ${draft.agentRunnerId}.`,
      );
      return false;
    }

    const normalizedReasoning = String(draft.modelReasoningLevel || "").trim();
    if (!normalizedReasoning) {
      setAgentError("Model reasoning level is required to save.");
      return false;
    }
    if (!getRunnerReasoningLevels(selectedRunnerCodexModels, normalizedModel).includes(normalizedReasoning)) {
      setAgentError(
        `Reasoning "${normalizedReasoning}" is not available for model "${normalizedModel}" on runner ${draft.agentRunnerId}.`,
      );
      return false;
    }
    const { agentRunnerSdkId, defaultModelId } = resolveRunnerSdkAndModelIds({
      runner: assignedRunner,
      sdkName: normalizedSdk,
      modelName: normalizedModel,
    });
    if (!agentRunnerSdkId) {
      setAgentError(
        `Runner ${draft.agentRunnerId} did not provide SDK metadata for "${normalizedSdk}". Refresh runners and try again.`,
      );
      return false;
    }
    if (!defaultModelId) {
      setAgentError(
        `Runner ${draft.agentRunnerId} did not provide model metadata for "${normalizedModel}". Refresh runners and try again.`,
      );
      return false;
    }

    try {
      setSavingAgentId(agentId);
      setAgentError("");
      const cleanDraftMcpServerIds = resolveEffectiveRoleMcpServerIds(
        draft.roleIds || [],
        roles,
        roleMcpServerIdsByRoleId,
      );
      const normalizedDefaultAdditionalModelInstructions = normalizeOptionalInstructions(
        draft.defaultAdditionalModelInstructions,
      );
      const data = await executeGraphQL(UPDATE_AGENT_MUTATION, {
        companyId: selectedCompanyId,
        id: agentId,
        agentRunnerId: draft.agentRunnerId || null,
        roleIds: draft.roleIds || [],
        mcpServerIds: cleanDraftMcpServerIds,
        defaultAdditionalModelInstructions: normalizedDefaultAdditionalModelInstructions,
        name: draft.name.trim(),
        agentSdk: normalizedSdk,
        model: normalizedModel,
        modelReasoningLevel: normalizedReasoning,
        agentRunnerSdkId,
        defaultModelId,
        defaultReasoningLevel: normalizedReasoning,
      });
      const result = data.updateAgent;
      if (!result.ok) {
        throw new Error(result.error || "Agent update failed.");
      }
      await loadAgents();
      return true;
    } catch (updateError: any) {
      setAgentError(updateError.message);
      return false;
    } finally {
      setSavingAgentId(null);
    }
  }

  async function handleDeleteAgent(agentId: any, agentDisplayName: any, forceDelete: any = false) {
    if (!selectedCompanyId) {
      setAgentError("Select a company before deleting agents.");
      return false;
    }

    try {
      setDeletingAgentId(agentId);
      setAgentError("");
      const data = await executeGraphQL(DELETE_AGENT_MUTATION, {
        companyId: selectedCompanyId,
        id: agentId,
        force: Boolean(forceDelete),
      });
      const result = data.deleteAgent;
      if (!result.ok) {
        throw new Error(result.error || `Agent deletion failed for "${agentDisplayName}".`);
      }
      await loadAgents();
      return true;
    } catch (deleteError: any) {
      setAgentError(deleteError.message);
      return false;
    } finally {
      setDeletingAgentId(null);
    }
  }

  async function handleInitializeAgent(agentId: any) {
    if (!selectedCompanyId) {
      setAgentError("Select a company before initializing agents.");
      return;
    }

    const agent = agents.find((candidate: any) => candidate.id === agentId);
    if (!agent) {
      setAgentError(`Agent ${agentId} not found in the current list.`);
      return;
    }

    const assignedRunner = agent.agentRunnerId ? agentRunnerLookup.get(agent.agentRunnerId) : null;
    if (agent.agentRunnerId && !assignedRunner) {
      setAgentError(`Assigned runner ${agent.agentRunnerId} was not found for this company.`);
      return;
    }

    const readyRunner = assignedRunner
      ? normalizeRunnerStatus(assignedRunner.status) === "ready"
        ? assignedRunner
        : null
      : agentRunners.find((runner: any) => normalizeRunnerStatus(runner.status) === "ready");
    if (!readyRunner) {
      setAgentError(
        assignedRunner
          ? `Assigned runner ${assignedRunner.id} is not ready.`
          : "No ready runner found. Start a runner before initializing agents.",
      );
      return;
    }

    try {
      setInitializingAgentId(agentId);
      setAgentError("");
      const data = await executeGraphQL(INITIALIZE_AGENT_MUTATION, {
        companyId: selectedCompanyId,
        runnerId: readyRunner.id,
        agentId,
      });
      const result = data.initializeAgentRunner;
      if (!result.ok) {
        throw new Error(result.error || "Initialize agent failed.");
      }
      await loadAgentRunners({ silently: true });
      await loadAgents();
    } catch (initializeError: any) {
      setAgentError(initializeError.message);
    } finally {
      setInitializingAgentId(null);
    }
  }

  async function handleRetryAgentSkillInstall(agentId: any, skillId: any) {
    if (!selectedCompanyId) {
      setAgentError("Select a company before retrying skill installs.");
      return;
    }

    const resolvedAgentId = String(agentId || "").trim();
    const resolvedSkillId = String(skillId || "").trim();
    if (!resolvedAgentId || !resolvedSkillId) {
      setAgentError("Agent id and skill id are required to retry installation.");
      return;
    }

    const selectedAgent = agents.find((agent: any) => agent.id === resolvedAgentId) || null;
    if (!selectedAgent) {
      setAgentError(`Agent ${resolvedAgentId} was not found.`);
      return;
    }
    if (!selectedAgent.agentRunnerId) {
      setAgentError("Assign a runner to this agent before retrying install.");
      return;
    }

    const retryKey = `${resolvedAgentId}:${resolvedSkillId}`;
    try {
      setRetryingAgentSkillInstallKey(retryKey);
      setAgentError("");
      const data = await executeGraphQL(RETRY_AGENT_SKILL_INSTALL_MUTATION, {
        companyId: selectedCompanyId,
        agentId: resolvedAgentId,
        skillId: resolvedSkillId,
        runnerId: selectedAgent.agentRunnerId,
      });
      const result = data.retryAgentSkillInstall;
      if (!result.ok) {
        throw new Error(result.error || "Retry skill install failed.");
      }
      await loadAgents();
    } catch (retryError: any) {
      setAgentError(retryError.message);
    } finally {
      setRetryingAgentSkillInstallKey("");
    }
  }

  async function handleInterruptChatTurn() {
    if (isSendingChatMessage) {
      return;
    }
    if (!selectedCompanyId) {
      setChatError("Select a company before interrupting a turn.");
      return;
    }
    if (!chatAgentId) {
      setChatError("Select an agent before interrupting a turn.");
      return;
    }
    if (!resolvedChatSessionId) {
      setChatError("Select a chat before interrupting a turn.");
      return;
    }

    const latestRunningTurn = getLatestRunningChatTurn(chatTurns);
    if (!latestRunningTurn) {
      setChatError("No running turn to interrupt.");
      return;
    }

    const selectedAgentForChat = agents.find((agent: any) => agent.id === chatAgentId) || null;

    try {
      setIsInterruptingChatTurn(true);
      setChatError("");
      const data = await executeGraphQL(INTERRUPT_AGENT_TURN_MUTATION, {
        companyId: selectedCompanyId,
        agentId: chatAgentId,
        threadId: resolvedChatSessionId,
        runnerId: selectedAgentForChat?.agentRunnerId || null,
      });
      const result = data.interruptAgentTurn;
      if (!result?.ok) {
        throw new Error(result?.error || "Failed to interrupt running turn.");
      }
      setChatSessionRunningState(resolvedChatSessionId, true);
    } catch (interruptError: any) {
      setChatError(interruptError.message);
    } finally {
      setIsInterruptingChatTurn(false);
    }
  }

  async function handleSteerQueuedChatMessage(queuedMessageId: any) {
    const resolvedQueuedMessageId = String(queuedMessageId || "").trim();
    if (!resolvedQueuedMessageId) {
      return;
    }
    if (!selectedCompanyId) {
      setChatError("Select a company before steering queued messages.");
      return;
    }
    if (!chatAgentId) {
      setChatError("Select an agent before steering queued messages.");
      return;
    }
    if (!resolvedChatSessionId) {
      setChatError("Select a chat before steering queued messages.");
      return;
    }

    try {
      setSteeringQueuedMessageId(resolvedQueuedMessageId);
      setChatError("");
      await executeRawGraphQL(COMPANY_API_STEER_QUEUED_USER_MESSAGE_MUTATION, {
        queuedMessageId: resolvedQueuedMessageId,
      });
      await loadAgentChatTurns({
        agentIdOverride: chatAgentId,
        sessionIdOverride: resolvedChatSessionId,
      });
    } catch (steerError: any) {
      setChatError(steerError.message);
    } finally {
      setSteeringQueuedMessageId(null);
    }
  }

  async function handleDeleteQueuedChatMessage(queuedMessageId: any) {
    const resolvedQueuedMessageId = String(queuedMessageId || "").trim();
    if (!resolvedQueuedMessageId) {
      return;
    }
    if (!selectedCompanyId) {
      setChatError("Select a company before deleting queued messages.");
      return;
    }
    if (!chatAgentId) {
      setChatError("Select an agent before deleting queued messages.");
      return;
    }
    if (!resolvedChatSessionId) {
      setChatError("Select a chat before deleting queued messages.");
      return;
    }

    const queuedMessage = queuedChatMessages.find((entry: any) => String(entry?.id || "").trim() === resolvedQueuedMessageId);
    const queuedMessageStatus = String(queuedMessage?.status || "").trim().toLowerCase();
    if (queuedMessageStatus === "submitted" || queuedMessageStatus === "processed") {
      setChatError("Submitted or processed queued messages cannot be deleted.");
      return;
    }

    try {
      setDeletingQueuedMessageId(resolvedQueuedMessageId);
      setChatError("");
      const data = await executeRawGraphQL(COMPANY_API_DELETE_QUEUED_USER_MESSAGE_MUTATION, {
        queuedMessageId: resolvedQueuedMessageId,
      });
      if (!data?.deleteQueuedUserMessage) {
        throw new Error("Queued message not found or already processing.");
      }
      await loadAgentChatTurns({
        agentIdOverride: chatAgentId,
        sessionIdOverride: resolvedChatSessionId,
      });
    } catch (deleteError: any) {
      setChatError(deleteError.message);
    } finally {
      setDeletingQueuedMessageId(null);
    }
  }

  async function handleSendChatMessage(event: any, modeOverride: any = "queue") {
    if (event?.preventDefault) {
      event.preventDefault();
    }
    if (isInterruptingChatTurn) {
      return;
    }
    if (!selectedCompanyId) {
      setChatError("Select a company before sending chat messages.");
      return;
    }
    if (!chatAgentId) {
      setChatError("Select an agent before sending a message.");
      return;
    }
    if (!chatDraftMessage.trim()) {
      setChatError("Message cannot be empty.");
      return;
    }

    const selectedAgentForChat = agents.find((agent: any) => agent.id === chatAgentId) || null;
    const latestRunningTurn = getLatestRunningChatTurn(chatTurns);
    const hasRunningTurn = Boolean(latestRunningTurn);
    let targetSessionId = resolvedChatSessionId;
    if (!targetSessionId) {
      targetSessionId = await handleCreateChatSession({
        title: chatSessionTitleDraft || null,
        additionalModelInstructions: chatSessionAdditionalModelInstructionsDraft || null,
        preferredRunnerId: selectedAgentForChat?.agentRunnerId || null,
      });
      if (!targetSessionId) {
        return;
      }
    }

    try {
      setIsSendingChatMessage(true);
      setChatError("");
      const runnerId = selectedAgentForChat?.agentRunnerId || null;
      const nextMode = resolveChatSendMode({
        modeOverride,
        hasRunningTurn,
        sessionId: targetSessionId,
        chatSessionRunningById,
      });
      const payloadText = chatDraftMessage.trim();
      const data =
        nextMode === "steer"
          ? await executeGraphQL(STEER_AGENT_TURN_MUTATION, {
              companyId: selectedCompanyId,
              agentId: chatAgentId,
              threadId: targetSessionId,
              turnId: latestRunningTurn.id,
              message: payloadText,
              runnerId,
            })
          : await executeGraphQL(CREATE_AGENT_TURN_MUTATION, {
              companyId: selectedCompanyId,
              agentId: chatAgentId,
              threadId: targetSessionId,
              text: payloadText,
              runnerId,
            });
      const result = nextMode === "steer" ? data.steerAgentTurn : data.createAgentTurn;
      if (!result.ok) {
        throw new Error(
          result.error || (nextMode === "steer" ? "Failed to steer running turn." : "Failed to create turn."),
        );
      }
      setChatSessionRunningState(
        targetSessionId,
        Boolean(hasRunningTurn || result.turnId || result.queuedUserMessageId),
      );
      if (result.threadId) {
        setChatSessionId(result.threadId);
      }
      setChatDraftMessage("");
      await loadAgentChatSessions({ silently: true });
      await loadAgentChatTurns();
    } catch (sendError: any) {
      setChatError(sendError.message);
    } finally {
      setIsSendingChatMessage(false);
    }
  }

  async function handleCreateChatSession({
    agentId = null,
    title = null,
    additionalModelInstructions = null,
    preferredRunnerId = null,
  }: any = {}) {
    const targetAgentId = String(agentId || chatAgentId || "").trim();
    if (!selectedCompanyId) {
      setChatError("Select a company before creating a chat.");
      return null;
    }
    if (!targetAgentId) {
      setChatError("Select an agent before creating a chat.");
      return null;
    }

    const selectedAgentForChat = agents.find((agent: any) => agent.id === targetAgentId) || null;
    if (!selectedAgentForChat) {
      setChatError(`Agent ${targetAgentId} was not found for this company.`);
      return null;
    }
    const createChatBlockedReason = getChatCreateBlockedReasonForAgent(selectedAgentForChat);
    if (createChatBlockedReason) {
      setChatError(createChatBlockedReason);
      return null;
    }
    const normalizedAdditionalModelInstructions = normalizeOptionalInstructions(
      additionalModelInstructions,
    );
    const knownThreadIds = new Set(
      (Array.isArray(chatSessionsByAgent[targetAgentId]) ? chatSessionsByAgent[targetAgentId] : []).map(
        (session: any) => String(session?.id || "").trim(),
      ),
    );
    const createChatSessionKey = `${selectedCompanyId}:${targetAgentId}`;

    return runCreateChatSessionSingleFlight(createChatSessionKey, async () => {
      try {
        setIsCreatingChatSession(true);
        setChatError("");
        const data = await executeGraphQL(CREATE_AGENT_THREAD_MUTATION, {
          companyId: selectedCompanyId,
          agentId: targetAgentId,
          title: title ? title.trim() : null,
          additionalModelInstructions: normalizedAdditionalModelInstructions,
          runnerId: preferredRunnerId || selectedAgentForChat?.agentRunnerId || null,
        });
        const result = data.createAgentThread;
        if (!result.ok || !result.thread) {
          throw new Error(result.error || "Failed to create chat.");
        }

        let canonicalThread = result.thread;
        if (String(canonicalThread?.status || "").trim().toLowerCase() !== "ready") {
          const resolvedThread = await waitForCanonicalThreadViaSubscription({
            companyId: selectedCompanyId,
            agentId: targetAgentId,
            requestedThreadId: canonicalThread.id,
            knownThreadIds: [...knownThreadIds],
            timeoutMs: 15000,
          });
          if (resolvedThread) {
            canonicalThread = {
              ...canonicalThread,
              ...resolvedThread,
              title: canonicalThread.title || resolvedThread.title,
              additionalModelInstructions:
                canonicalThread.additionalModelInstructions
                  || resolvedThread.additionalModelInstructions
                  || normalizedAdditionalModelInstructions,
              runnerId: canonicalThread.runnerId || resolvedThread.runnerId || null,
            };
          }
        }

        const sessionsForAgent = await loadCompanyApiAgentThreads({
          companyId: selectedCompanyId,
          agentId: targetAgentId,
          limit: 200,
        });
        const requestedThreadId = String(canonicalThread?.id || result.thread.id || "").trim();

        const isReadySession = (session: any) => String(session?.status || "").trim().toLowerCase() === "ready";
        const isNewSession = (session: any) => !knownThreadIds.has(String(session?.id || "").trim());
        const requestedSession = sessionsForAgent.find(
          (session: any) => String(session?.id || "").trim() === requestedThreadId,
        );
        const readyRequestedSession = requestedSession && isReadySession(requestedSession) ? requestedSession : null;
        const readyNewSession = sessionsForAgent.find((session: any) => isNewSession(session) && isReadySession(session));
        const remappedSession = sessionsForAgent.find(
          (session: any) =>
            isNewSession(session) && String(session?.id || "").trim() !== requestedThreadId,
        );
        const resolvedThread =
          readyRequestedSession || readyNewSession || remappedSession || requestedSession || canonicalThread;
        const resolvedThreadId = String(resolvedThread?.id || requestedThreadId || "").trim();

        let nextSessionsForAgent = sessionsForAgent;
        if (
          resolvedThreadId
          && !sessionsForAgent.some((session: any) => String(session?.id || "").trim() === resolvedThreadId)
        ) {
          nextSessionsForAgent = [resolvedThread, ...sessionsForAgent];
        }

        setChatAgentId(targetAgentId);
        setChatSessions(nextSessionsForAgent);
        setChatSessionsByAgent((currentSessionsByAgent: any) => ({
          ...currentSessionsByAgent,
          [targetAgentId]: nextSessionsForAgent,
        }));
        setChatSessionTitleDraft("");
        setChatSessionAdditionalModelInstructionsDraft("");
        setChatSessionId(resolvedThreadId);
        return resolvedThreadId;
      } catch (createError: any) {
        setChatError(createError.message);
        return null;
      } finally {
        setIsCreatingChatSession(false);
      }
    });
  }

  async function handleUpdateChatSessionTitle(event: any) {
    if (event?.preventDefault) {
      event.preventDefault();
    }

    const targetSessionId = String(resolvedChatSessionId || "").trim();
    if (!targetSessionId) {
      setChatError("Select a chat before updating its title.");
      return false;
    }

    try {
      setIsUpdatingChatTitle(true);
      setChatError("");
      const normalizedRenameTitle = String(chatSessionRenameDraft || "").trim();
      const cappedRenameTitle = normalizedRenameTitle.slice(0, THREAD_TITLE_MAX_LENGTH);
      const data = await executeGraphQL(UPDATE_AGENT_THREAD_MUTATION, {
        threadId: targetSessionId,
        title: cappedRenameTitle || null,
      });
      const result = data?.updateAgentThread;
      if (!result?.ok || !result?.thread) {
        throw new Error(result?.error || "Failed to update chat title.");
      }

      const updatedSession = result.thread;
      const upsertSessionList = (sessions: any) => {
        let matched = false;
        const nextSessions = (Array.isArray(sessions) ? sessions : []).map((session: any) => {
          const sessionId = String(session?.id || "").trim();
          if (sessionId !== targetSessionId) {
            return session;
          }
          matched = true;
          return {
            ...session,
            ...updatedSession,
          };
        });

        if (!matched) {
          nextSessions.unshift(updatedSession);
        }
        return nextSessions;
      };

      setChatSessions((currentSessions: any) => upsertSessionList(currentSessions));

      const targetAgentId = resolveLegacyId(updatedSession?.agentId, chatAgentId);
      if (targetAgentId) {
        setChatSessionsByAgent((currentSessionsByAgent: any) => ({
          ...currentSessionsByAgent,
          [targetAgentId]: upsertSessionList(currentSessionsByAgent[targetAgentId]),
        }));
      }

      setChatSessionRenameDraft(String(updatedSession?.title || ""));
      return true;
    } catch (updateError: any) {
      setChatError(updateError.message);
      return false;
    } finally {
      setIsUpdatingChatTitle(false);
    }
  }

  function handleOpenChatFromList({ agentId, sessionId, sessionsForAgent = [] }: any) {
    const resolvedAgentId = String(agentId || "").trim();
    const resolvedSessionId = String(sessionId || "").trim();
    if (!resolvedAgentId || !resolvedSessionId) {
      return;
    }
    if (isSameChatSelection({
      currentAgentId: chatAgentId,
      currentSessionId: resolvedChatSessionId,
      nextAgentId: resolvedAgentId,
      nextSessionId: resolvedSessionId,
    })) {
      return;
    }

    setChatAgentId(resolvedAgentId);
    setChatSessions(Array.isArray(sessionsForAgent) ? sessionsForAgent : []);
    setChatSessionId(resolvedSessionId);
    setChatTurns([]);
    setQueuedChatMessages([]);
    setChatError("");
    setBrowserPath(getChatsPath({ agentId: resolvedAgentId, threadId: resolvedSessionId }));
  }

  async function handleCreateChatForAgent(agentId: any) {
    const resolvedAgentId = String(agentId || "").trim();
    if (!resolvedAgentId) {
      return;
    }
    setChatAgentId(resolvedAgentId);
    setChatSessionId("");
    setChatTurns([]);
    setQueuedChatMessages([]);
    const createdSessionId = await handleCreateChatSession({ agentId: resolvedAgentId });
    if (createdSessionId) {
      setBrowserPath(getChatsPath({ agentId: resolvedAgentId, threadId: createdSessionId }));
    }
  }

  async function handleDeleteChatSession({
    agentId = null,
    sessionId = null,
    title = null,
  }: any = {}) {
    const targetAgentId = String(agentId || chatAgentId || "").trim();
    const targetSessionId = String(sessionId || "").trim();
    if (!selectedCompanyId) {
      const errorMessage = "Select a company before deleting chats.";
      setChatError(errorMessage);
      setChatIndexError(errorMessage);
      return false;
    }
    if (!targetAgentId || !targetSessionId) {
      return false;
    }

    const agentSessions = Array.isArray(chatSessionsByAgent[targetAgentId])
      ? chatSessionsByAgent[targetAgentId]
      : [];
    const matchingSession = agentSessions.find((session: any) => String(session?.id || "").trim() === targetSessionId)
      || chatSessions.find((session: any) => String(session?.id || "").trim() === targetSessionId)
      || null;
    const resolvedTitle = String(title || matchingSession?.title || "").trim();
    const confirmationLabel = resolvedTitle
      ? `"${resolvedTitle}" (${targetSessionId})`
      : targetSessionId;
    const confirmed = window.confirm(`Delete chat ${confirmationLabel}?`);
    if (!confirmed) {
      return false;
    }

    const targetChatSessionKey = `${targetAgentId}:${targetSessionId}`;
    try {
      setDeletingChatSessionKey(targetChatSessionKey);
      setChatError("");
      setChatIndexError("");
      const data = await executeGraphQL(DELETE_AGENT_THREAD_MUTATION, {
        companyId: selectedCompanyId,
        agentId: targetAgentId,
        threadId: targetSessionId,
      });
      const result = data.deleteAgentThread;
      if (!result?.ok) {
        throw new Error(result?.error || "Chat deletion failed.");
      }

      const nowIso = new Date().toISOString();
      const deletingSession = result?.thread
        ? {
            ...matchingSession,
            ...result.thread,
            id: resolveLegacyId(result?.thread?.id) || targetSessionId,
            threadId: resolveLegacyId(result?.thread?.threadId, result?.thread?.id) || targetSessionId,
            agentId: resolveLegacyId(result?.thread?.agentId, targetAgentId) || targetAgentId,
            title:
              resolveLegacyId(result?.thread?.title)
              || resolvedTitle
              || String(matchingSession?.title || "").trim()
              || `Thread ${targetSessionId.slice(0, 8)}`,
            status: "deleting",
            updatedAt: resolveLegacyId(result?.thread?.updatedAt) || nowIso,
          }
        : {
            ...matchingSession,
            id: targetSessionId,
            threadId: targetSessionId,
            agentId: targetAgentId,
            title: resolvedTitle || String(matchingSession?.title || "").trim() || `Thread ${targetSessionId.slice(0, 8)}`,
            status: "deleting",
            updatedAt: nowIso,
          };

      const upsertDeletingSession = (sessions: any) => {
        const nextSessions = Array.isArray(sessions) ? [...sessions] : [];
        const targetIndex = nextSessions.findIndex(
          (session: any) => String(session?.id || "").trim() === targetSessionId,
        );

        if (targetIndex >= 0) {
          nextSessions[targetIndex] = {
            ...nextSessions[targetIndex],
            ...deletingSession,
            status: "deleting",
          };
        } else {
          nextSessions.unshift(deletingSession);
        }

        return sortChatSessionsForChatNavigation(nextSessions);
      };

      setChatSessionRunningState(targetSessionId, false);
      setChatSessions((currentSessions: any) => {
        if (targetAgentId !== chatAgentId) {
          return currentSessions;
        }
        return upsertDeletingSession(currentSessions);
      });
      setChatSessionsByAgent((currentSessionsByAgent: any) => {
        return {
          ...currentSessionsByAgent,
          [targetAgentId]: upsertDeletingSession(currentSessionsByAgent[targetAgentId]),
        };
      });

      if (resolvedChatSessionId === targetSessionId) {
        setChatSessionId(targetSessionId);
      }
      return true;
    } catch (deleteError: any) {
      const errorMessage = deleteError?.message || "Chat deletion failed.";
      setChatIndexError(errorMessage);
      setChatError(errorMessage);
      return false;
    } finally {
      setDeletingChatSessionKey("");
    }
  }

  function handleDraftChange(taskId: any, field: any, value: any) {
    setRelationshipDrafts((currentDrafts: any) => {
      const currentDraft = currentDrafts[taskId] || {
        dependencyTaskIds: [],
        parentTaskId: "",
        childTaskIds: [],
        assigneePrincipalId: "",
        status: "draft",
      };
      const nextDraft = {
        ...currentDraft,
        [field]: value,
      };
      if (field === "dependencyTaskIds") {
        nextDraft.dependencyTaskIds = normalizeUniqueStringList(value || []);
      }
      if (field === "parentTaskId") {
        nextDraft.parentTaskId = String(value || "").trim();
        if (nextDraft.parentTaskId === String(taskId || "").trim()) {
          nextDraft.parentTaskId = "";
        }
      }
      if (field === "childTaskIds") {
        nextDraft.childTaskIds = normalizeUniqueStringList(value || [])
          .filter((childTaskId: any) => childTaskId !== String(taskId || "").trim());
      }
      if (field === "assigneePrincipalId") {
        nextDraft.assigneePrincipalId = String(value || "").trim();
      }
      if (field === "status") {
        nextDraft.status = String(value || "").trim() || "draft";
      }

      const normalizedTaskId = String(taskId || "").trim();
      if (nextDraft.parentTaskId === normalizedTaskId) {
        nextDraft.parentTaskId = "";
      }
      if (nextDraft.parentTaskId) {
        nextDraft.childTaskIds = normalizeUniqueStringList(nextDraft.childTaskIds || [])
          .filter((childTaskId: any) => childTaskId !== nextDraft.parentTaskId);
      }

      return {
        ...currentDrafts,
        [taskId]: nextDraft,
      };
    });
  }

  function handleSkillDraftChange(skillId: any, field: any, value: any) {
    setSkillDrafts((currentDrafts: any) => {
      const currentDraft = currentDrafts[skillId] || {
        name: "",
        skillType: SKILL_TYPE_TEXT,
        skillsMpPackageName: "",
        description: "",
        instructions: "",
      };
      const nextDraft = {
        ...currentDraft,
        [field]: value,
      };
      if (field === "skillType") {
        nextDraft.skillType = normalizeSkillType(value);
      }
      return {
        ...currentDrafts,
        [skillId]: nextDraft,
      };
    });
  }

  function handleCreateAgentRunnerChange(nextRunnerId: any) {
    const normalizedRunnerId = String(nextRunnerId || "").trim();
    setAgentRunnerId(normalizedRunnerId);

    const selectedRunnerCodexModels = getRunnerCodexModelEntriesForRunner(
      runnerCodexModelEntriesById,
      normalizedRunnerId,
    );
    const resolvedSelection = resolveRunnerBackedModelSelection({
      codexModelEntries: selectedRunnerCodexModels,
      requestedModel: agentModel,
      requestedReasoning: agentModelReasoningLevel,
    });

    setAgentSdk(DEFAULT_AGENT_SDK);
    setAgentModel(resolvedSelection.model);
    setAgentModelReasoningLevel(resolvedSelection.modelReasoningLevel);
  }

  function handleCreateAgentSdkChange(nextSdk: any) {
    if (!isAvailableAgentSdk(nextSdk)) {
      setAgentSdk(DEFAULT_AGENT_SDK);
      return;
    }
    setAgentSdk(normalizeAgentSdkValue(nextSdk));
  }

  function handleCreateAgentModelChange(nextModel: any) {
    const normalizedModel = String(nextModel || "").trim();
    const selectedRunnerCodexModels = getRunnerCodexModelEntriesForRunner(
      runnerCodexModelEntriesById,
      agentRunnerId,
    );
    const resolvedSelection = resolveRunnerBackedModelSelection({
      codexModelEntries: selectedRunnerCodexModels,
      requestedModel: normalizedModel,
      requestedReasoning: agentModelReasoningLevel,
    });

    setAgentModel(resolvedSelection.model);
    setAgentModelReasoningLevel(resolvedSelection.modelReasoningLevel);
  }

  function handleCreateAgentReasoningLevelChange(nextReasoningLevel: any) {
    setAgentModelReasoningLevel(String(nextReasoningLevel || "").trim());
  }

  function handleCreateAgentRoleIdsChange(nextRoleIds: any) {
    setAgentRoleIds(normalizeUniqueStringList(nextRoleIds));
  }

  function handleAgentDraftChange(agentId: any, field: any, value: any) {
    setAgentDrafts((currentDrafts: any) => {
      const currentDraft = currentDrafts[agentId] || {
        agentRunnerId: "",
        roleIds: [],
        mcpServerIds: [],
        name: "",
        agentSdk: DEFAULT_AGENT_SDK,
        model: "",
        modelReasoningLevel: "",
        defaultAdditionalModelInstructions: "",
      };

      const nextDraft = {
        ...currentDraft,
        [field]: value,
      };

      if (field === "agentSdk" && !isAvailableAgentSdk(nextDraft.agentSdk)) {
        nextDraft.agentSdk = DEFAULT_AGENT_SDK;
      }

      if (field === "agentRunnerId") {
        nextDraft.agentRunnerId = String(value || "").trim();
      }
      if (field === "roleIds") {
        nextDraft.roleIds = normalizeUniqueStringList(value);
      }
      if (field === "mcpServerIds") {
        nextDraft.mcpServerIds = normalizeUniqueStringList(value);
      }
      if (field === "model") {
        nextDraft.model = String(value || "").trim();
      }
      if (field === "modelReasoningLevel") {
        nextDraft.modelReasoningLevel = String(value || "").trim();
      }
      if (field === "defaultAdditionalModelInstructions") {
        nextDraft.defaultAdditionalModelInstructions = String(value || "");
      }

      if (field === "agentRunnerId" || field === "model" || field === "modelReasoningLevel") {
        const selectedRunnerCodexModels = getRunnerCodexModelEntriesForRunner(
          runnerCodexModelEntriesById,
          nextDraft.agentRunnerId,
        );
        const resolvedSelection = resolveRunnerBackedModelSelection({
          codexModelEntries: selectedRunnerCodexModels,
          requestedModel: nextDraft.model,
          requestedReasoning: nextDraft.modelReasoningLevel,
        });
        nextDraft.model = resolvedSelection.model;
        nextDraft.modelReasoningLevel = resolvedSelection.modelReasoningLevel;
      }

      return {
        ...currentDrafts,
        [agentId]: nextDraft,
      };
    });
  }

  const collapseSideMenuOnCompactViewport = useCallback(() => {
    if (matchesMediaQuery(SIDEBAR_COLLAPSE_MEDIA_QUERY)) {
      setIsSideMenuCollapsed(true);
    }
  }, []);

  async function navigateToChatsConversation({ replace = false }: any = {}) {
    if (isNavigatingToChatsRef.current) {
      return;
    }
    isNavigatingToChatsRef.current = true;

    try {
      if (!selectedCompanyId) {
        setBrowserPath("/settings", { replace });
        return;
      }

      const requestedAgentId = String(chatsRoute.agentId || "").trim();
      const requestedThreadId = String(chatsRoute.threadId || "").trim();
      if (requestedAgentId && requestedThreadId) {
        setChatAgentId(requestedAgentId);
        setChatSessionId(requestedThreadId);
        setChatTurns([]);
        setQueuedChatMessages([]);
        setChatError("");
        setBrowserPath(
          getChatsPath({ agentId: requestedAgentId, threadId: requestedThreadId }),
          { replace },
        );
        return;
      }

      let availableAgents = Array.isArray(agents) ? agents : [];
      let sessionsByAgentSnapshot = chatSessionsByAgent;
      if (availableAgents.length === 0) {
        const bootstrapPayload = await loadChatsBootstrapData({ silently: true });
        availableAgents = Array.isArray(bootstrapPayload.agents) ? bootstrapPayload.agents : [];
        sessionsByAgentSnapshot = bootstrapPayload.sessionsByAgent || {};
      }

      let targetAgentId = requestedAgentId;
      if (!targetAgentId) {
        const firstAgent = sortAgentsForChatNavigation(availableAgents)[0] || null;
        targetAgentId = String(firstAgent?.id || "").trim();
      }
      if (!targetAgentId) {
        setBrowserPath("/agents", { replace });
        return;
      }

      const hasLoadedSessionsForAgent = Array.isArray(sessionsByAgentSnapshot[targetAgentId]);
      if (!hasLoadedSessionsForAgent) {
        const bootstrapPayload = await loadChatsBootstrapData({ silently: true });
        if (availableAgents.length === 0) {
          availableAgents = Array.isArray(bootstrapPayload.agents) ? bootstrapPayload.agents : [];
        }
        sessionsByAgentSnapshot = bootstrapPayload.sessionsByAgent || {};
      }

      const sessionsForAgent = sortChatSessionsForChatNavigation(
        Array.isArray(sessionsByAgentSnapshot[targetAgentId]) ? sessionsByAgentSnapshot[targetAgentId] : [],
      );
      if (requestedThreadId) {
        const hasRequestedSession = sessionsForAgent.some(
          (session: any) => String(session?.id || "").trim() === requestedThreadId,
        );
        if (hasRequestedSession) {
          setChatAgentId(targetAgentId);
          setChatSessionId(requestedThreadId);
          setChatTurns([]);
          setQueuedChatMessages([]);
          setChatError("");
          setBrowserPath(
            getChatsPath({ agentId: targetAgentId, threadId: requestedThreadId }),
            { replace },
          );
          return;
        }
      }
      const firstSessionId = String(sessionsForAgent[0]?.id || "").trim();

      if (firstSessionId) {
        setChatAgentId(targetAgentId);
        setChatSessionId(firstSessionId);
        setChatTurns([]);
        setQueuedChatMessages([]);
        setChatError("");
        setBrowserPath(getChatsPath({ agentId: targetAgentId, threadId: firstSessionId }), { replace });
        return;
      }

      setChatAgentId(targetAgentId);
      setChatSessionId("");
      setChatTurns([]);
      setQueuedChatMessages([]);
      setChatError("");
      setBrowserPath(getChatsPath({ agentId: targetAgentId }), { replace });
    } finally {
      isNavigatingToChatsRef.current = false;
    }
  }

  function navigateTo(pageId: any) {
    if (String(pageId || "").trim().toLowerCase() === "chats") {
      setChatSessionId("");
      setChatTurns([]);
      setQueuedChatMessages([]);
      void navigateToChatsConversation();
      return;
    }
    setBrowserPath(getPathForPage(pageId));
  }

  function handleOpenAgentSessions(agentId: any) {
    const resolvedAgentId = String(agentId || "").trim();
    if (!resolvedAgentId) {
      navigateTo("agents");
      return;
    }
    setChatAgentId(resolvedAgentId);
    setChatSessionId("");
    setChatTurns([]);
    setQueuedChatMessages([]);
    setBrowserPath(`/agents/${resolvedAgentId}`);
  }

  const taskLookup = useMemo(() => {
    return tasks.reduce((map: any, task: any) => {
      map.set(task.id, task);
      return map;
    }, new Map<any, any>());
  }, [tasks]);

  const taskCountLabel = useMemo(() => {
    if (tasks.length === 0) {
      return "No tasks yet";
    }
    if (tasks.length === 1) {
      return "1 task";
    }
    return `${tasks.length} tasks`;
  }, [tasks.length]);

  const skillCountLabel = useMemo(() => {
    if (skills.length === 0) {
      return "No skills";
    }
    if (skills.length === 1) {
      return "1 skill";
    }
    return `${skills.length} skills`;
  }, [skills.length]);

  const mcpServerCountLabel = useMemo(() => {
    if (mcpServers.length === 0) {
      return "No MCP servers";
    }
    if (mcpServers.length === 1) {
      return "1 MCP server";
    }
    return `${mcpServers.length} MCP servers`;
  }, [mcpServers.length]);

  const secretCountLabel = useMemo(() => {
    if (secrets.length === 0) {
      return "No secrets";
    }
    if (secrets.length === 1) {
      return "1 secret";
    }
    return `${secrets.length} secrets`;
  }, [secrets.length]);

  const approvalCountLabel = useMemo(() => {
    if (approvals.length === 0) {
      return "No approvals";
    }
    if (approvals.length === 1) {
      return "1 approval";
    }
    return `${approvals.length} approvals`;
  }, [approvals.length]);

  const runnerCountLabel = useMemo(() => {
    if (agentRunners.length === 0) {
      return "No runners";
    }
    if (agentRunners.length === 1) {
      return "1 runner";
    }
    return `${agentRunners.length} runners`;
  }, [agentRunners.length]);

  const agentCountLabel = useMemo(() => {
    if (agents.length === 0) {
      return "No agents";
    }
    if (agents.length === 1) {
      return "1 agent";
    }
    return `${agents.length} agents`;
  }, [agents.length]);

  const renderTaskLink = useCallback(
    (taskId: any) => {
      if (taskId == null) {
        return "none";
      }
      const linkedTask = taskLookup.get(taskId);
      if (linkedTask == null) {
        return `#${taskId}`;
      }
      return `#${linkedTask.id} ${linkedTask.name}`;
    },
    [taskLookup],
  );

  const handleOpenTaskThread = useCallback(async (threadId: string) => {
    const resolvedThreadId = String(threadId || "").trim();
    if (!resolvedThreadId) {
      return;
    }

    const findAgentIdForThread = (sessionsByAgentSnapshot: any) => {
      const agentEntries = Object.entries(sessionsByAgentSnapshot || {});
      for (const [agentId, sessions] of agentEntries) {
        const hasThread = Array.isArray(sessions)
          && sessions.some((session: any) => String(session?.id || "").trim() === resolvedThreadId);
        if (hasThread) {
          return String(agentId || "").trim();
        }
      }
      return "";
    };

    let targetAgentId = findAgentIdForThread(chatSessionsByAgent);

    if (!targetAgentId && selectedCompanyId) {
      const bootstrapPayload = await loadChatsBootstrapData({ silently: true });
      targetAgentId = findAgentIdForThread(bootstrapPayload.sessionsByAgent || {});
    }

    setBrowserPath(
      getChatsPath({
        agentId: targetAgentId,
        threadId: resolvedThreadId,
      }),
    );
  }, [chatSessionsByAgent, loadChatsBootstrapData, selectedCompanyId]);

  const activePrimaryNavItemId =
    activePage === "agents" && agentsRoute.view === "chat" ? "chats" : activePage;
  const showFirstCompanyOnboarding = !isLoadingCompanies && !hasCompanies;

  return (
    <PageActionsProvider>
      <div
        className={`layout-shell${isSideMenuCollapsed && !showFirstCompanyOnboarding ? " layout-shell-menu-collapsed" : ""}${showFirstCompanyOnboarding ? " layout-shell-onboarding" : ""}`}
      >
        {showFirstCompanyOnboarding ? null : (
          <aside className="side-menu">
            {isSideMenuCollapsed ? (
              <button
                type="button"
                className="side-menu-icon-btn"
                onClick={() => setIsSideMenuCollapsed(false)}
                aria-label="Open menu"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </svg>
              </button>
            ) : null}
            <div className="side-brand">
              <div className="side-brand-lockup">
                <img className="side-brand-logo" src="/logos/logo-only.svg" alt="CompanyHelm logo" />
                <div>
                  <p className="side-overline">Control Plane</p>
                  <h2>CompanyHelm</h2>
                </div>
              </div>
            </div>
            <button
              type="button"
              className="side-menu-icon-btn side-menu-collapse-btn"
              onClick={() => setIsSideMenuCollapsed(true)}
              aria-label="Collapse menu"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>

            <div className="side-company-scope">
              <select
                className="side-company-select"
                value={selectedCompanyId}
                onChange={(event: any) => setSelectedCompanyId(event.target.value)}
                disabled={isLoadingCompanies}
              >
                <option value="">
                  {isLoadingCompanies ? "Loading..." : "Select company"}
                </option>
                {companies.map((company: any) => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
              {companyError ? <p className="side-error">{companyError}</p> : null}
            </div>

            {NAV_SECTIONS.map((section: any) => (
              <div key={section.label} className="side-nav-section">
                <p className="side-nav-label">{section.label}</p>
                <nav className="side-nav" aria-label={`${section.label} navigation`}>
                  {section.items.map((item: any) => {
                    const isDisabled = item.requiresCompany && !selectedCompanyId;
                    return (
                      <a
                        key={item.id}
                        href={item.href}
                        aria-disabled={isDisabled ? "true" : undefined}
                        onClick={(event: any) => {
                          event.preventDefault();
                          if (isDisabled) {
                            navigateTo("settings");
                            collapseSideMenuOnCompactViewport();
                            return;
                          }
                          navigateTo(item.id);
                          collapseSideMenuOnCompactViewport();
                        }}
                        className={`nav-link ${
                          activePrimaryNavItemId === item.id ? "nav-link-active" : ""
                        } ${isDisabled ? "nav-link-disabled" : ""}`}
                      >
                        {item.label}
                      </a>
                    );
                  })}
                </nav>
              </div>
            ))}

            <nav className="side-nav side-nav-bottom" aria-label="Utility navigation">
              {BOTTOM_NAV_ITEMS.map((item: any) => (
                <a
                  key={item.id}
                  href={item.href}
                  onClick={(event: any) => {
                    event.preventDefault();
                    navigateTo(item.id);
                    collapseSideMenuOnCompactViewport();
                  }}
                  className={`nav-link ${
                    activePrimaryNavItemId === item.id ? "nav-link-active" : ""
                  }`}
                >
                  {item.label}
                </a>
              ))}
            </nav>
          </aside>
        )}

        <main
          className={`page-shell${isChatConversationRoute && !showFirstCompanyOnboarding ? " page-shell-chat-layout" : ""}${showFirstCompanyOnboarding ? " first-company-onboarding-shell" : ""}`}
        >
          {showFirstCompanyOnboarding ? (
            <FirstCompanyOnboardingPage
              companyError={companyError}
              newCompanyName={newCompanyName}
              isCreatingCompany={isCreatingCompany}
              onNewCompanyNameChange={setNewCompanyName}
              onCreateCompany={handleCreateCompany}
            />
          ) : (
            <>
              <Breadcrumbs items={breadcrumbItems} onNavigate={setBrowserPath} />

              {!isLoadingCompanies && !selectedCompanyId && activePage !== "settings" && activePage !== "profile" ? (
                <CompanyRequiredPanel hasCompanies={hasCompanies} />
              ) : null}

        {selectedCompanyId && activePage === "dashboard" ? (
          <DashboardPage
            selectedCompanyId={selectedCompanyId}
            selectedCompany={selectedCompany}
            tasks={tasks}
            agentRunners={agentRunners}
            isLoadingTasks={isLoadingTasks}
            isLoadingRunners={isLoadingRunners}
            taskError={taskError}
            runnerError={runnerError}
            onNavigate={navigateTo}
          />
        ) : null}

        {selectedCompanyId && activePage === "tasks" ? (
          <TasksPage
            selectedCompanyId={selectedCompanyId}
            tasks={tasks}
            agents={agents}
            principals={taskAssignablePrincipals}
            isLoadingTasks={isLoadingTasks}
            taskError={taskError}
            isSubmittingTask={isSubmittingTask}
            savingTaskId={savingTaskId}
            commentingTaskId={commentingTaskId}
            deletingTaskId={deletingTaskId}
            name={name}
            description={description}
            assigneePrincipalId={taskAssigneePrincipalId}
            status={taskStatus}
            parentTaskId={parentTaskId}
            dependencyTaskIds={dependencyTaskIds}
            relationshipDrafts={relationshipDrafts}
            taskCountLabel={taskCountLabel}
            onNameChange={setName}
            onDescriptionChange={setDescription}
            onAssigneePrincipalIdChange={setTaskAssigneePrincipalId}
            onStatusChange={setTaskStatus}
            onParentTaskIdChange={setParentTaskId}
            onDependencyTaskIdsChange={setDependencyTaskIds}
            onCreateTask={handleCreateTask}
            onCreateAndExecuteTask={handleCreateAndExecuteTask}
            onDraftChange={handleDraftChange}
            onSaveRelationships={handleRelationshipSave}
            onAddDependency={handleAddTaskDependency}
            onCreateTaskComment={handleCreateTaskComment}
            onDeleteTask={handleDeleteTask}
            onBatchDeleteTasks={handleBatchDeleteTasks}
            onBatchExecuteTasks={handleBatchExecuteTasks}
            onOpenTaskThread={handleOpenTaskThread}
            renderTaskLink={renderTaskLink}
          />
        ) : null}

        {selectedCompanyId && activePage === "skills" ? (
          <SkillsPage
            selectedCompanyId={selectedCompanyId}
            skills={skills}
            roles={roles}
            mcpServers={mcpServers}
            roleMcpServerIdsByRoleId={roleMcpServerIdsByRoleId}
            activeSkill={activeSkill}
            isLoadingSkills={isLoadingSkills}
            isLoadingRoles={isLoadingRoles}
            skillError={skillError}
            onOpenSkill={(skillId: any) => setBrowserPath(`/skills/${skillId}`)}
            onBackToSkills={() => setBrowserPath("/skills")}
            onCreateRole={handleCreateRole}
            onUpdateRole={handleUpdateRole}
            onDeleteRole={handleDeleteRole}
            onAddSkillToRole={handleAddSkillToRole}
            onRemoveSkillFromRole={handleRemoveSkillFromRole}
            onRoleMcpServerIdsChange={handleRoleMcpServerIdsChange}
            onOpenGitSkillPackage={(packageId: any) => setBrowserPath(`/gitSkillPackages/${packageId}`)}
          />
        ) : null}

        {selectedCompanyId && activePage === "roles" ? (
          <RolesPage
            roles={roles}
            skills={skills}
            skillGroups={skillGroups}
            mcpServers={mcpServers}
            roleSkillGroupIdsByRoleId={roleSkillGroupIdsByRoleId}
            roleMcpServerIdsByRoleId={roleMcpServerIdsByRoleId}
            activeRole={activeRole}
            isLoadingRoles={isLoadingRoles}
            roleError={skillError}
            onOpenRole={(roleId: any) => setBrowserPath(`/roles/${roleId}`)}
            onBackToRoles={() => setBrowserPath("/roles")}
            onCreateRole={handleCreateRole}
            onUpdateRole={handleUpdateRole}
            onDeleteRole={handleDeleteRole}
            onAddSkillToRole={handleAddSkillToRole}
            onRemoveSkillFromRole={handleRemoveSkillFromRole}
            onRoleSkillGroupIdsChange={(roleId: any, nextSkillGroupIds: any) => {
              void handleRoleSkillGroupIdsChange(roleId, nextSkillGroupIds);
            }}
            onRoleMcpServerIdsChange={(roleId: any, nextMcpServerIds: any) => {
              void handleRoleMcpServerIdsChange(roleId, nextMcpServerIds);
            }}
          />
        ) : null}

        {selectedCompanyId && activePage === "skill-groups" ? (
          <SkillGroupsPage
            skillGroups={skillGroups}
            skills={skills}
            isLoadingSkillGroups={isLoadingSkillGroups}
            isLoadingSkills={isLoadingSkills}
            skillError={skillError}
            onCreateSkillGroup={handleCreateSkillGroup}
            onUpdateSkillGroup={handleUpdateSkillGroup}
            onDeleteSkillGroup={handleDeleteSkillGroup}
            onAddSkillToGroup={handleAddSkillToGroup}
            onRemoveSkillFromGroup={handleRemoveSkillFromGroup}
            onOpenSkill={(skillId: any) => setBrowserPath(`/skills/${skillId}`)}
          />
        ) : null}

        {selectedCompanyId && activePage === "gitskillpackages" ? (
          <GitSkillPackagesPage
            selectedCompanyId={selectedCompanyId}
            gitSkillPackages={gitSkillPackages}
            activeGitSkillPackage={activeGitSkillPackage}
            isLoadingGitSkillPackages={isLoadingGitSkillPackages}
            skillError={skillError}
            onOpenGitSkillPackage={(packageId: any) => setBrowserPath(`/gitSkillPackages/${packageId}`)}
            onBackToGitSkillPackages={() => setBrowserPath("/gitSkillPackages")}
            onPreviewGitSkillPackage={handlePreviewGitSkillPackage}
            onCreateGitSkillPackage={handleCreateGitSkillPackage}
            onDeleteGitSkillPackage={handleDeleteGitSkillPackage}
            onOpenSkill={(skillId: any) => setBrowserPath(`/skills/${skillId}`)}
          />
        ) : null}

        {selectedCompanyId && activePage === "secrets" ? (
          <SecretsPage
            secrets={secrets}
            isLoadingSecrets={isLoadingSecrets}
            secretError={secretError}
            isCreatingSecret={isCreatingSecret}
            savingSecretId={savingSecretId}
            deletingSecretId={deletingSecretId}
            secretName={secretName}
            secretDescription={secretDescription}
            secretValue={secretValue}
            secretDrafts={secretDrafts}
            secretValuesBySecretId={secretValuesBySecretId}
            secretAccessLogsBySecretId={secretAccessLogsBySecretId}
            isLoadingSecretValuesBySecretId={isLoadingSecretValuesBySecretId}
            isLoadingSecretAccessLogsBySecretId={isLoadingSecretAccessLogsBySecretId}
            secretValueErrorBySecretId={secretValueErrorBySecretId}
            secretAccessLogErrorBySecretId={secretAccessLogErrorBySecretId}
            secretCountLabel={secretCountLabel}
            onSecretNameChange={setSecretName}
            onSecretDescriptionChange={setSecretDescription}
            onSecretValueChange={setSecretValue}
            onCreateSecret={handleCreateSecret}
            onSecretDraftChange={handleSecretDraftChange}
            onLoadSecretValue={loadSecretValue}
            onLoadSecretAccessLogs={loadSecretAccessLogs}
            onSaveSecret={handleSaveSecret}
            onDeleteSecret={handleDeleteSecret}
          />
        ) : null}

        {selectedCompanyId && activePage === "approvals" ? (
          <ApprovalsPage
            approvals={approvals}
            isLoadingApprovals={isLoadingApprovals}
            approvalError={approvalError}
            approvingApprovalId={approvingApprovalId}
            rejectingApprovalId={rejectingApprovalId}
            deletingApprovalId={deletingApprovalId}
            rejectionReasonDraftByApprovalId={rejectionReasonDraftByApprovalId}
            approvalCountLabel={approvalCountLabel}
            onRejectionReasonChange={handleApprovalRejectionReasonChange}
            onApproveApproval={handleApproveApproval}
            onRejectApproval={handleRejectApproval}
            onDeleteApproval={handleDeleteApproval}
          />
        ) : null}

        {selectedCompanyId && activePage === "mcp-servers" ? (
          <McpServersPage
            selectedCompanyId={selectedCompanyId}
            secrets={secrets}
            mcpServers={mcpServers}
            isLoadingMcpServers={isLoadingMcpServers}
            mcpServerError={mcpServerError}
            isCreatingMcpServer={isCreatingMcpServer}
            savingMcpServerId={savingMcpServerId}
            deletingMcpServerId={deletingMcpServerId}
            mcpServerName={mcpServerName}
            mcpServerTransportType={mcpServerTransportType}
            mcpServerUrl={mcpServerUrl}
            mcpServerCommand={mcpServerCommand}
            mcpServerArgsText={mcpServerArgsText}
            mcpServerEnvVarsText={mcpServerEnvVarsText}
            mcpServerAuthType={mcpServerAuthType}
            mcpServerBearerTokenSecretId={mcpServerBearerTokenSecretId}
            mcpServerCustomHeadersText={mcpServerCustomHeadersText}
            mcpServerEnabled={mcpServerEnabled}
            mcpServerDrafts={mcpServerDrafts}
            mcpServerCountLabel={mcpServerCountLabel}
            onMcpServerNameChange={setMcpServerName}
            onMcpServerTransportTypeChange={(value: any) =>
              setMcpServerTransportType(normalizeMcpTransportType(value))
            }
            onMcpServerUrlChange={setMcpServerUrl}
            onMcpServerCommandChange={setMcpServerCommand}
            onMcpServerArgsTextChange={setMcpServerArgsText}
            onMcpServerEnvVarsTextChange={setMcpServerEnvVarsText}
            onMcpServerAuthTypeChange={(value: any) => setMcpServerAuthType(normalizeMcpAuthType(value))}
            onMcpServerBearerTokenSecretIdChange={setMcpServerBearerTokenSecretId}
            onMcpServerCustomHeadersTextChange={setMcpServerCustomHeadersText}
            onMcpServerEnabledChange={setMcpServerEnabled}
            onOpenSecretsPage={() => navigateTo("secrets")}
            onCreateMcpServer={handleCreateMcpServer}
            onMcpServerDraftChange={handleMcpServerDraftChange}
            onSaveMcpServer={handleSaveMcpServer}
            onDeleteMcpServer={handleDeleteMcpServer}
          />
        ) : null}

        {selectedCompanyId && activePage === "agent-runner" ? (
          runnersRoute.view === "detail" && runnersRoute.runnerId ? (() => {
            const detailRunner = agentRunners.find((r: any) => r.id === runnersRoute.runnerId);
            if (!detailRunner) {
              return <p className="empty-hint">Runner not found.</p>;
            }
            return (
              <AgentRunnerDetailPage
                runner={detailRunner}
                agents={agents}
                agentRunnerLookup={agentRunnerLookup}
                runnerGrpcTarget={DEFAULT_RUNNER_GRPC_TARGET}
                runnerSecretsById={runnerSecretsById}
                regeneratingRunnerId={regeneratingRunnerId}
                deletingRunnerId={deletingRunnerId}
                onRunnerCommandSecretChange={(runnerId: any, value: any) =>
                  setRunnerSecretsById((currentSecrets: any) => ({
                    ...currentSecrets,
                    [runnerId]: value,
                  }))
                }
                onRegenerateRunnerSecret={handleRegenerateRunnerSecret}
                onDeleteRunner={handleDeleteRunner}
              />
            );
          })() : (
            <AgentRunnerPage
              selectedCompanyId={selectedCompanyId}
              agentRunners={agentRunners}
              isLoadingRunners={isLoadingRunners}
              runnerError={runnerError}
              isCreatingRunner={isCreatingRunner}
              runnerNameDraft={runnerNameDraft}
              regeneratingRunnerId={regeneratingRunnerId}
              deletingRunnerId={deletingRunnerId}
              runnerCountLabel={runnerCountLabel}
              onRunnerNameChange={setRunnerNameDraft}
              onCreateRunner={handleCreateRunner}
              onDeleteRunner={handleDeleteRunner}
            />
          )
        ) : null}

        {selectedCompanyId && activePage === "chats" ? (
          <AgentChatPage
            selectedCompanyId={selectedCompanyId}
            agent={agents.find((agent: any) => agent.id === chatAgentId) || null}
            agents={agents}
            session={selectedChatSession}
            chatSessionsByAgent={chatSessionsByAgent}
            chatSessionRunningById={chatSessionRunningById}
            isLoadingChatIndex={isLoadingChatIndex}
            isCreatingChatSession={isCreatingChatSession}
            showChatSidebar
            chatSessionRenameDraft={chatSessionRenameDraft}
            chatTurns={chatTurns}
            queuedChatMessages={queuedChatMessages}
            isLoadingChat={isLoadingChat}
            chatError={chatError}
            chatDraftMessage={chatDraftMessage}
            isSendingChatMessage={isSendingChatMessage}
            isInterruptingChatTurn={isInterruptingChatTurn}
            isUpdatingChatTitle={isUpdatingChatTitle}
            deletingChatSessionKey={deletingChatSessionKey}
            steeringQueuedMessageId={steeringQueuedMessageId}
            deletingQueuedMessageId={deletingQueuedMessageId}
            getCreateChatDisabledReason={getChatCreateBlockedReasonByAgentId}
            onChatSessionRenameDraftChange={handleChatSessionRenameDraftChange}
            onChatDraftMessageChange={setChatDraftMessage}
            onBackToChats={() => {}}
            onDeleteChat={handleDeleteChatSession}
            onSaveChatSessionTitle={handleUpdateChatSessionTitle}
            onSendChatMessage={handleSendChatMessage}
            onInterruptChatTurn={handleInterruptChatTurn}
            onSteerQueuedMessage={handleSteerQueuedChatMessage}
            onDeleteQueuedMessage={handleDeleteQueuedChatMessage}
            onCreateChatForAgent={handleCreateChatForAgent}
            onOpenChatFromList={handleOpenChatFromList}
          />
        ) : null}

        {selectedCompanyId && activePage === "agents" ? (
          agentsRoute.view === "agent" || agentsRoute.view === "chats" ? (
            <AgentChatsPage
              selectedCompanyId={selectedCompanyId}
              agent={agents.find((agent: any) => agent.id === chatAgentId) || null}
              agents={agents}
              chatSessions={chatSessions}
              chatSessionRunningById={chatSessionRunningById}
              isLoadingChatSessions={isLoadingChatSessions}
              isCreatingChatSession={isCreatingChatSession}
              deletingChatSessionKey={deletingChatSessionKey}
              chatError={chatError}
              createChatDisabledReason={getChatCreateBlockedReasonByAgentId(chatAgentId)}
              chatSessionTitleDraft={chatSessionTitleDraft}
              chatSessionAdditionalModelInstructionsDraft={chatSessionAdditionalModelInstructionsDraft}
              onChatSessionTitleDraftChange={setChatSessionTitleDraft}
              onChatSessionAdditionalModelInstructionsDraftChange={
                setChatSessionAdditionalModelInstructionsDraft
              }
              onCreateChatSession={handleCreateChatSession}
              onOpenChat={(sessionId: any) => {
                if (!chatAgentId || !sessionId) {
                  return;
                }
                setBrowserPath(getChatsPath({ agentId: chatAgentId, threadId: sessionId }));
              }}
              onSetChatDraftMessage={setChatDraftMessage}
              onDeleteChat={handleDeleteChatSession}
              onBackToAgents={() => {
                navigateTo("agents");
              }}
              agentRunners={agentRunners}
              roles={roles}
              mcpServers={mcpServers}
              roleMcpServerIdsByRoleId={roleMcpServerIdsByRoleId}
              runnerCodexModelEntriesById={runnerCodexModelEntriesById}
              agentDrafts={agentDrafts}
              savingAgentId={savingAgentId}
              deletingAgentId={deletingAgentId}
              initializingAgentId={initializingAgentId}
              onAgentDraftChange={handleAgentDraftChange}
              onSaveAgent={handleSaveAgent}
              onEnsureAgentEditorData={ensureAgentEditorData}
            />
          ) : agentsRoute.view === "chat" ? (
            <AgentChatPage
              selectedCompanyId={selectedCompanyId}
              agent={agents.find((agent: any) => agent.id === chatAgentId) || null}
              agents={agents}
              session={selectedChatSession}
              chatSessionsByAgent={chatSessionsByAgent}
              chatSessionRunningById={chatSessionRunningById}
              isLoadingChatIndex={isLoadingChatIndex}
              isCreatingChatSession={isCreatingChatSession}
              showChatSidebar
              chatSessionRenameDraft={chatSessionRenameDraft}
              chatTurns={chatTurns}
              queuedChatMessages={queuedChatMessages}
              isLoadingChat={isLoadingChat}
              chatError={chatError}
              chatDraftMessage={chatDraftMessage}
              isSendingChatMessage={isSendingChatMessage}
              isInterruptingChatTurn={isInterruptingChatTurn}
              isUpdatingChatTitle={isUpdatingChatTitle}
              deletingChatSessionKey={deletingChatSessionKey}
              steeringQueuedMessageId={steeringQueuedMessageId}
              deletingQueuedMessageId={deletingQueuedMessageId}
              getCreateChatDisabledReason={getChatCreateBlockedReasonByAgentId}
              onChatSessionRenameDraftChange={handleChatSessionRenameDraftChange}
              onChatDraftMessageChange={setChatDraftMessage}
              onBackToChats={() => {
                if (!chatAgentId) {
                  navigateTo("agents");
                  return;
                }
                setBrowserPath(getChatsPath({ agentId: chatAgentId }));
              }}
              onDeleteChat={handleDeleteChatSession}
              onSaveChatSessionTitle={handleUpdateChatSessionTitle}
              onSendChatMessage={handleSendChatMessage}
              onInterruptChatTurn={handleInterruptChatTurn}
              onSteerQueuedMessage={handleSteerQueuedChatMessage}
              onDeleteQueuedMessage={handleDeleteQueuedChatMessage}
              onCreateChatForAgent={handleCreateChatForAgent}
              onOpenChatFromList={handleOpenChatFromList}
            />
          ) : (
            <AgentsPage
              selectedCompanyId={selectedCompanyId}
              agents={agents}
              skills={skills}
              roles={roles}
              mcpServers={mcpServers}
              agentRunners={agentRunners}
              agentRunnerLookup={agentRunnerLookup}
              runnerCodexModelEntriesById={runnerCodexModelEntriesById}
              isLoadingAgents={isLoadingAgents}
              agentError={agentError}
              isCreatingAgent={isCreatingAgent}
              savingAgentId={savingAgentId}
              deletingAgentId={deletingAgentId}
              initializingAgentId={initializingAgentId}
              retryingAgentSkillInstallKey={retryingAgentSkillInstallKey}
              hasLoadedAgentRunners={hasLoadedAgentRunners}
              agentRunnerId={agentRunnerId}
              agentRoleIds={agentRoleIds}
              roleMcpServerIdsByRoleId={roleMcpServerIdsByRoleId}
              agentName={agentName}
              agentSdk={agentSdk}
              agentModel={agentModel}
              agentModelReasoningLevel={agentModelReasoningLevel}
              agentDefaultAdditionalModelInstructions={agentDefaultAdditionalModelInstructions}
              agentDrafts={agentDrafts}
              agentCountLabel={agentCountLabel}
              onAgentRunnerChange={handleCreateAgentRunnerChange}
              onAgentRoleIdsChange={handleCreateAgentRoleIdsChange}
              onAgentNameChange={setAgentName}
              onAgentSdkChange={handleCreateAgentSdkChange}
              onAgentModelChange={handleCreateAgentModelChange}
              onAgentModelReasoningLevelChange={handleCreateAgentReasoningLevelChange}
              onAgentDefaultAdditionalModelInstructionsChange={
                setAgentDefaultAdditionalModelInstructions
              }
              onCreateAgent={handleCreateAgent}
              onAgentDraftChange={handleAgentDraftChange}
              onEnsureAgentEditorData={ensureAgentEditorData}
              onSaveAgent={handleSaveAgent}
              onInitializeAgent={handleInitializeAgent}
              onRetryAgentSkillInstall={handleRetryAgentSkillInstall}
              onOpenAgentSessions={handleOpenAgentSessions}
              onDeleteAgent={handleDeleteAgent}
              pendingEditAgentId={pendingEditAgentId}
              onClearPendingEditAgentId={() => setPendingEditAgentId("")}
            />
          )
        ) : null}

        {activePage === "settings" ? (
          <SettingsPage
            hasCompanies={hasCompanies}
            selectedCompanyId={selectedCompanyId}
            selectedCompany={selectedCompany}
            companyError={companyError}
            newCompanyName={newCompanyName}
            isCreatingCompany={isCreatingCompany}
            isDeletingCompany={isDeletingCompany}
            onNewCompanyNameChange={setNewCompanyName}
            onCreateCompany={handleCreateCompany}
            onDeleteCompany={handleDeleteCompany}
            githubAppInstallUrl={githubAppInstallUrl}
            isLoadingGithubAppConfig={isLoadingGithubAppConfig}
            githubAppConfigError={githubAppConfigError}
            githubInstallations={githubInstallations}
            isLoadingGithubInstallations={isLoadingGithubInstallations}
            githubInstallationError={githubInstallationError}
            githubInstallationNotice={githubInstallationNotice}
            isAddingGithubInstallationFromCallback={isAddingGithubInstallationFromCallback}
            pendingGithubInstallCallback={pendingGithubInstallCallback}
            deletingGithubInstallationId={deletingGithubInstallationId}
            onDeleteGithubInstallation={handleDeleteGithubInstallation}
          />
        ) : null}

        {selectedCompanyId && activePage === "repos" ? (
          <ReposPage
            selectedCompanyId={selectedCompanyId}
            githubAppInstallUrl={githubAppInstallUrl}
            isLoadingGithubAppConfig={isLoadingGithubAppConfig}
            githubAppConfigError={githubAppConfigError}
            githubInstallations={githubInstallations}
            githubRepositories={githubRepositories}
            isLoadingGithubInstallations={isLoadingGithubInstallations}
            isLoadingGithubRepositories={isLoadingGithubRepositories}
            githubInstallationError={githubInstallationError}
            githubInstallationNotice={githubInstallationNotice}
            isAddingGithubInstallationFromCallback={isAddingGithubInstallationFromCallback}
            pendingGithubInstallCallback={pendingGithubInstallCallback}
            deletingGithubInstallationId={deletingGithubInstallationId}
            refreshingGithubInstallationId={refreshingGithubInstallationId}
            onDeleteGithubInstallation={handleDeleteGithubInstallation}
            onRefreshGithubInstallationRepositories={handleRefreshGithubInstallationRepositories}
          />
        ) : null}

        {activePage === "profile" ? (
          <ProfilePage
            currentUser={currentUser}
            currentUserError={currentUserError}
            isLoadingCurrentUser={isLoadingCurrentUser}
            selectedCompany={selectedCompany}
            tasks={tasks}
            skills={skills}
            agents={agents}
            agentRunners={agentRunners}
            onSignOut={() => authProvider.signOut()}
          />
        ) : null}
          </>
        )}
      </main>
    </div>
    </PageActionsProvider>
  );
}

export default App;
