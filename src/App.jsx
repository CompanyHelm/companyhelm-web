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
} from "./utils/constants.js";

import { matchesMediaQuery } from "./utils/media.js";

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
  LIST_AGENT_RUNNERS_QUERY,
  CREATE_AGENT_RUNNER_MUTATION,
  REGENERATE_AGENT_RUNNER_SECRET_MUTATION,
  LIST_AGENTS_QUERY,
  LIST_SKILLS_QUERY,
  LIST_ROLES_QUERY,
  LIST_SKILL_GROUPS_QUERY,
  LIST_GIT_SKILL_PACKAGES_QUERY,
  LIST_MCP_SERVERS_QUERY,
  CREATE_TASK_MUTATION,
  ADD_TASK_DEPENDENCY_MUTATION,
  REMOVE_TASK_DEPENDENCY_MUTATION,
  DELETE_TASK_MUTATION,
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
  COMPANY_API_REFRESH_GITHUB_INSTALLATION_REPOSITORIES_MUTATION,
  COMPANY_API_LIST_TASKS_QUERY,
  COMPANY_API_CREATE_TASK_MUTATION,
  COMPANY_API_ADD_TASK_DEPENDENCY_MUTATION,
  COMPANY_API_REMOVE_TASK_DEPENDENCY_MUTATION,
  COMPANY_API_DELETE_TASK_MUTATION,
  COMPANY_API_CREATE_TASK_COMMENT_MUTATION,
  COMPANY_API_LIST_SKILLS_QUERY,
  COMPANY_API_LIST_ROLES_QUERY,
  COMPANY_API_LIST_SKILL_GROUPS_QUERY,
  COMPANY_API_LIST_GIT_SKILL_PACKAGES_QUERY,
  COMPANY_API_LIST_MCP_SERVERS_QUERY,
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
  COMPANY_API_LIST_QUEUED_USER_MESSAGES_QUERY,
  COMPANY_API_QUEUE_USER_MESSAGE_MUTATION,
  COMPANY_API_STEER_QUEUED_USER_MESSAGE_MUTATION,
  COMPANY_API_DELETE_QUEUED_USER_MESSAGE_MUTATION,
  COMPANY_API_INTERRUPT_TURN_MUTATION,
} from "./utils/graphql.js";

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
} from "./utils/normalization.js";

import { normalizeRunnerStatus, normalizeChatStatus } from "./utils/formatting.js";

import {
  hasRunningChatTurns,
  getLatestRunningChatTurn,
  compareTurnsByTimestamp,
  getTurnLifecycleSignature,
  isSameChatSelection,
} from "./utils/chat.js";

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
} from "./utils/path.js";

import { getPersistedCompanyId, persistCompanyId } from "./utils/persistence.js";
import { setActiveCompanyId } from "./utils/company-context.js";
import { createSingleFlightByKey } from "./utils/single-flight.js";

import { buildRunnerStartCommand } from "./utils/shell.js";

import {
  createRelationshipDrafts,
  createAgentDrafts,
  createSkillDrafts,
  createMcpServerDrafts,
} from "./utils/drafts.js";

import { subscribeGraphQL, useGraphQLSubscription } from "./hooks/useGraphQLSubscription.js";
import { executeRelayGraphQL } from "./relay/client.js";

import { Breadcrumbs } from "./components/Breadcrumbs.jsx";
import { PageActionsProvider } from "./components/PageActionsContext.jsx";
import { CompanyRequiredPanel } from "./components/CompanyRequiredPanel.jsx";
import { FirstCompanyOnboardingPage } from "./components/FirstCompanyOnboardingPage.jsx";

import { DashboardPage } from "./pages/DashboardPage.jsx";
import { TasksPage } from "./pages/TasksPage.jsx";
import { AgentRunnerPage } from "./pages/AgentRunnerPage.jsx";
import { AgentRunnerDetailPage } from "./pages/AgentRunnerDetailPage.jsx";
import { AgentsPage } from "./pages/AgentsPage.jsx";
import { SkillsPage } from "./pages/SkillsPage.jsx";
import { SkillGroupsPage } from "./pages/SkillGroupsPage.jsx";
import { RolesPage } from "./pages/RolesPage.jsx";
import { GitSkillPackagesPage } from "./pages/GitSkillPackagesPage.jsx";
import { McpServersPage } from "./pages/McpServersPage.jsx";
import { AgentChatsPage } from "./pages/AgentChatsPage.jsx";
import { AgentChatPage } from "./pages/AgentChatPage.jsx";
import { SettingsPage } from "./pages/SettingsPage.jsx";
import { ReposPage } from "./pages/ReposPage.jsx";
import { ProfilePage } from "./pages/ProfilePage.jsx";

// --- Module-level mutable state (shared by adapter functions and executeGraphQL) ---
const companyApiThreadMetadataById = new Map();
const companyApiRunnerMetadataById = new Map();


async function executeRawGraphQL(query, variables, options = {}) {
  return executeRelayGraphQL({
    query,
    variables,
    operationKind: options.operationKind,
    force: options.force,
  });
}

function normalizeCompanyApiRunnerStatus(value) {
  return String(value || "").trim().toLowerCase() === "connected" ? "ready" : "disconnected";
}

function resolveLegacyId(...values) {
  for (const value of values) {
    const resolved = String(value || "").trim();
    if (resolved) {
      return resolved;
    }
  }
  return "";
}

function getChatCreateBlockedReason(agent, agentRunnerLookup) {
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

function sortAgentsForChatNavigation(agentList) {
  return [...(Array.isArray(agentList) ? agentList : [])].sort((leftAgent, rightAgent) => {
    const leftName = String(leftAgent?.name || "");
    const rightName = String(rightAgent?.name || "");
    const byName = leftName.localeCompare(rightName);
    if (byName !== 0) {
      return byName;
    }
    return String(leftAgent?.id || "").localeCompare(String(rightAgent?.id || ""));
  });
}

function sortChatSessionsForChatNavigation(sessionList) {
  return [...(Array.isArray(sessionList) ? sessionList : [])].sort((leftChat, rightChat) =>
    compareTurnsByTimestamp(
      { createdAt: leftChat?.updatedAt, id: leftChat?.id },
      { createdAt: rightChat?.updatedAt, id: rightChat?.id },
    ),
  );
}

function toConnectionNodes(connection) {
  if (!connection || !Array.isArray(connection.edges)) {
    return [];
  }
  return connection.edges.map((edge) => edge?.node).filter(Boolean);
}

async function fetchCompanyApiConnectionNodes({
  query,
  rootField,
  variables = {},
  limit = null,
}) {
  const nodes = [];
  const seenCursors = new Set();
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
}) {
  const threadNodes = await fetchCompanyApiConnectionNodes({
    query: COMPANY_API_LIST_THREADS_CONNECTION_QUERY,
    rootField: "threads",
    variables: {
      companyId,
      agentId,
    },
    limit,
  });

  return threadNodes.map((threadNode) => toLegacyThreadPayload(threadNode));
}

async function loadCompanyApiAgentsWithThreads({
  companyId,
  agentLimit = null,
  threadLimit = 500,
}) {
  const agentNodes = await fetchCompanyApiConnectionNodes({
    query: COMPANY_API_LIST_AGENTS_WITH_THREADS_CONNECTION_QUERY,
    rootField: "agents",
    variables: {
      companyId,
      firstThreads: threadLimit,
    },
    limit: agentLimit,
  });

  const agentRunnersById = new Map();
  const sessionsByAgent = {};
  const legacyAgents = agentNodes.map((agentNode) => {
    const legacyAgent = toAgentPayload(agentNode);
    const legacyRunner = agentNode?.runner ? toLegacyRunnerPayload(agentNode.runner) : null;
    const resolvedRunnerId = resolveLegacyId(legacyRunner?.id);
    if (resolvedRunnerId) {
      agentRunnersById.set(resolvedRunnerId, legacyRunner);
    }
    const resolvedAgentId = resolveLegacyId(legacyAgent?.id);
    if (resolvedAgentId) {
      sessionsByAgent[resolvedAgentId] = toConnectionNodes(agentNode?.threads).map((threadNode) =>
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
}) {
  const turnNodes = await fetchCompanyApiConnectionNodes({
    query: COMPANY_API_LIST_THREAD_TURNS_CONNECTION_QUERY,
    rootField: "threadTurns",
    variables: { threadId },
    limit,
  });

  return turnNodes.map((turnNode) => toLegacyTurnPayload(turnNode, { runnerId }));
}

function toLegacyRunnerPayload(agentRunner) {
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

function toAgentPayload(agent) {
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
          .map((role) => ({
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
          .filter((role) => role.id)
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

function toSkillGroupPayload(skillGroup) {
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
          .map((skill) => ({
            id: resolveLegacyId(skill?.id),
            name: resolveLegacyId(skill?.name),
          }))
          .filter((skill) => skill.id)
      : [],
  };
}

function toRolePayload(role) {
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
          .map((subRole) => ({
            id: resolveLegacyId(subRole?.id),
            name: resolveLegacyId(subRole?.name),
          }))
          .filter((subRole) => subRole.id)
      : [],
    skills: Array.isArray(role?.skills)
      ? role.skills
          .map((skill) => ({
            id: resolveLegacyId(skill?.id),
            name: resolveLegacyId(skill?.name),
          }))
          .filter((skill) => skill.id)
      : [],
    skillGroups: Array.isArray(role?.skillGroups)
      ? role.skillGroups
          .map((skillGroup) => ({
            id: resolveLegacyId(skillGroup?.id),
            name: resolveLegacyId(skillGroup?.name),
          }))
          .filter((skillGroup) => skillGroup.id)
      : [],
    effectiveSkills: Array.isArray(role?.effectiveSkills)
      ? role.effectiveSkills
          .map((skill) => ({
            id: resolveLegacyId(skill?.id),
            name: resolveLegacyId(skill?.name),
          }))
          .filter((skill) => skill.id)
      : [],
    mcpServers: Array.isArray(role?.mcpServers)
      ? role.mcpServers
          .map((mcpServer) => ({
            id: resolveLegacyId(mcpServer?.id),
            name: resolveLegacyId(mcpServer?.name),
          }))
          .filter((mcpServer) => mcpServer.id)
      : [],
    effectiveMcpServers: Array.isArray(role?.effectiveMcpServers)
      ? role.effectiveMcpServers
          .map((mcpServer) => ({
            id: resolveLegacyId(mcpServer?.id),
            name: resolveLegacyId(mcpServer?.name),
          }))
          .filter((mcpServer) => mcpServer.id)
      : [],
  };
}

function collectRoleAndSubroleIds(roleIds, roles) {
  const normalizedRoleIds = normalizeUniqueStringList(roleIds || []);
  if (normalizedRoleIds.length === 0) {
    return [];
  }

  const childRoleIdsByParentId = new Map();
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

    const childRoleIds = childRoleIdsByParentId.get(nextRoleId) || [];
    for (const childRoleId of childRoleIds) {
      if (!visitedRoleIds.has(childRoleId)) {
        queue.push(childRoleId);
      }
    }
  }

  return expandedRoleIds;
}

function resolveEffectiveRoleMcpServerIds(roleIds, roles, roleMcpServerIdsByRoleId) {
  const expandedRoleIds = collectRoleAndSubroleIds(roleIds, roles);
  const mcpServerIds = [];
  const seenMcpServerIds = new Set();

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

function toGitSkillPackagePayload(gitSkillPackage) {
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
          .map((skill) => ({
            id: resolveLegacyId(skill?.id),
            name: resolveLegacyId(skill?.name),
          }))
          .filter((skill) => skill.id)
      : [],
  };
}

function toMcpServerPayload(mcpServer) {
  return {
    id: resolveLegacyId(mcpServer?.id),
    companyId: resolveLegacyId(mcpServer?.company?.id, mcpServer?.companyId),
    name: resolveLegacyId(mcpServer?.name),
    transportType: normalizeMcpTransportType(mcpServer?.transportType),
    url: String(mcpServer?.url || "").trim(),
    command: String(mcpServer?.command || "").trim(),
    args: Array.isArray(mcpServer?.args)
      ? mcpServer.args.map((arg) => String(arg || "").trim()).filter(Boolean)
      : [],
    envVars: Array.isArray(mcpServer?.envVars)
      ? mcpServer.envVars
          .map((envVar) => ({
            key: String(envVar?.key || "").trim(),
            value: String(envVar?.value || "").trim(),
          }))
          .filter((envVar) => envVar.key)
      : [],
    authType: normalizeMcpAuthType(mcpServer?.authType),
    bearerToken: String(mcpServer?.bearerToken || "").trim(),
    customHeaders: Array.isArray(mcpServer?.customHeaders)
      ? mcpServer.customHeaders
          .map((header) => ({
            key: String(header?.key || "").trim(),
            value: String(header?.value || "").trim(),
          }))
          .filter((header) => header.key && header.value)
      : [],
    enabled: mcpServer?.enabled !== false,
  };
}

function toTaskCommentPayload(taskComment) {
  return {
    id: resolveLegacyId(taskComment?.id),
    taskId: resolveLegacyId(taskComment?.taskId),
    companyId: resolveLegacyId(taskComment?.company?.id, taskComment?.companyId),
    comment: String(taskComment?.comment || ""),
    authorPrincipalId: resolveLegacyId(taskComment?.authorPrincipalId) || null,
    createdAt: resolveLegacyId(taskComment?.createdAt),
    updatedAt: resolveLegacyId(taskComment?.updatedAt),
  };
}

function toTaskPayload(task) {
  return {
    id: resolveLegacyId(task?.id),
    companyId: resolveLegacyId(task?.company?.id, task?.companyId),
    name: resolveLegacyId(task?.name),
    description: String(task?.description || ""),
    acceptanceCriteria: String(task?.acceptanceCriteria || ""),
    assigneePrincipalId: resolveLegacyId(task?.assigneePrincipalId) || null,
    threadId: resolveLegacyId(task?.threadId) || null,
    status: resolveLegacyId(task?.status) || "draft",
    createdAt: resolveLegacyId(task?.createdAt),
    updatedAt: resolveLegacyId(task?.updatedAt),
    dependencyTaskIds: normalizeUniqueStringList(task?.dependencyTaskIds || []),
    comments: Array.isArray(task?.comments)
      ? task.comments
          .map((comment) => toTaskCommentPayload(comment))
          .filter((comment) => comment.id)
      : [],
  };
}

function toSkillPayload(skill) {
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
      ? skill.fileList.map((filePath) => String(filePath || "").trim()).filter(Boolean)
      : [],
    gitSkillPackagePath: resolveLegacyId(skill?.gitSkillPackagePath) || null,
    roles: Array.isArray(skill?.roles)
      ? skill.roles
          .map((role) => ({
            id: resolveLegacyId(role?.id),
            name: resolveLegacyId(role?.name),
          }))
          .filter((role) => role.id)
      : [],
    gitSkillPackage: skill?.gitSkillPackage ? toGitSkillPackagePayload(skill.gitSkillPackage) : null,
  };
}

function toLegacyThreadPayload(thread, { metadataOverride } = {}) {
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
  const nextMetadata = {
    createdAt: currentMetadata.createdAt || nowIso,
    updatedAt: nowIso,
    title: resolvedTitle,
    runnerId: resolveLegacyId(metadataOverride?.runnerId, currentMetadata.runnerId) || null,
    currentModelId: resolvedCurrentModelId,
    currentModelName: resolvedCurrentModelName,
    currentReasoningLevel: resolvedCurrentReasoningLevel,
    additionalModelInstructions: resolvedAdditionalModelInstructions,
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
    currentModelId: nextMetadata.currentModelId,
    currentModelName: nextMetadata.currentModelName,
    currentReasoningLevel: nextMetadata.currentReasoningLevel,
    additionalModelInstructions: nextMetadata.additionalModelInstructions,
    createdAt: nextMetadata.createdAt,
    updatedAt: nextMetadata.updatedAt,
  };
}

function toLegacyTurnItemRole(itemType) {
  const normalizedType = String(itemType || "").trim().toLowerCase();
  if (normalizedType === "user_message") {
    return "user";
  }
  if (normalizedType === "agent_message") {
    return "assistant";
  }
  return "system";
}

function toLegacyTurnPayload(turn, { runnerId } = {}) {
  const resolvedTurnId = resolveLegacyId(turn?.id);
  const resolvedThreadId = resolveLegacyId(turn?.thread?.id);
  const resolvedCompanyId = resolveLegacyId(turn?.company?.id);
  const resolvedAgentId = resolveLegacyId(turn?.agent?.id);
  const resolvedRunnerId = resolveLegacyId(runnerId) || null;
  const resolvedStartedAt = resolveLegacyId(turn?.startedAt) || null;
  const resolvedEndedAt = resolveLegacyId(turn?.endedAt) || null;
  const fallbackTimestamp = resolvedStartedAt || resolvedEndedAt || new Date().toISOString();

  const items = (Array.isArray(turn?.items) ? turn.items : []).map((item) => {
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

function toLegacyQueuedUserMessagePayload(queuedMessage) {
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

function unsupportedMutation(resultKey) {
  return {
    [resultKey]: {
      ok: false,
      error: COMPANY_API_NOT_IMPLEMENTED_ERROR,
    },
  };
}

async function executeGraphQL(query, variables = {}) {
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
      companies: companies.map((company) => ({
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
      githubInstallations: githubInstallations.map((installation) => ({
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
      agentRunners: runners.map((runner) => toLegacyRunnerPayload(runner)),
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
              backendGrpcTarget: DEFAULT_RUNNER_GRPC_TARGET,
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
              backendGrpcTarget: DEFAULT_RUNNER_GRPC_TARGET,
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
    const agentRunnersById = new Map();
    const legacyAgents = agents.map((agent) => {
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
          .map((errorMessage) => String(errorMessage || "").trim())
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
    const previousThreadIds = new Set(previousThreads.map((thread) => resolveLegacyId(thread?.id)));

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

    const pickCanonicalThread = (threadsSnapshot) => {
      const requestedThread = threadsSnapshot.find(
        (thread) => resolveLegacyId(thread?.id) === requestedThreadId,
      );
      const newlyCreatedThreads = threadsSnapshot.filter(
        (thread) => !previousThreadIds.has(resolveLegacyId(thread?.id)),
      );
      const readyRequestedThread = requestedThread
        && resolveLegacyId(requestedThread?.status) === "ready"
        ? requestedThread
        : null;
      const readyCreatedThread = newlyCreatedThreads.find(
        (thread) => resolveLegacyId(thread?.status) === "ready",
      );
      const idChangedCreatedThread = newlyCreatedThreads.find(
        (thread) => resolveLegacyId(thread?.id) !== requestedThreadId,
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
    const ok = Boolean(data?.deleteThread);
    if (ok && threadId) {
      companyApiThreadMetadataById.delete(threadId);
    }
    return {
      deleteAgentThread: {
        ok,
        error: ok ? null : "Failed to delete chat.",
        deletedThreadId: ok ? threadId : null,
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
      repositories: repositories.map((repository) => ({
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
      skills: skills.map((skill) => toSkillPayload(skill)),
    };
  }

  if (query === LIST_ROLES_QUERY) {
    const data = await executeRawGraphQL(COMPANY_API_LIST_ROLES_QUERY, {
      companyId: resolveLegacyId(variables?.companyId),
    });
    const roles = Array.isArray(data?.roles) ? data.roles : [];
    return {
      roles: roles.map((role) => toRolePayload(role)),
    };
  }

  if (query === LIST_SKILL_GROUPS_QUERY) {
    const data = await executeRawGraphQL(COMPANY_API_LIST_SKILL_GROUPS_QUERY, {
      companyId: resolveLegacyId(variables?.companyId),
    });
    const skillGroups = Array.isArray(data?.skillGroups) ? data.skillGroups : [];
    return {
      skillGroups: skillGroups.map((skillGroup) => toSkillGroupPayload(skillGroup)),
    };
  }

  if (query === LIST_GIT_SKILL_PACKAGES_QUERY) {
    const data = await executeRawGraphQL(COMPANY_API_LIST_GIT_SKILL_PACKAGES_QUERY, {
      companyId: resolveLegacyId(variables?.companyId),
    });
    const gitSkillPackages = Array.isArray(data?.gitSkillPackages) ? data.gitSkillPackages : [];
    return {
      gitSkillPackages: gitSkillPackages.map((gitSkillPackage) =>
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
          ? payload.branches.map((reference) => ({
              kind: resolveLegacyId(reference?.kind) || "branch",
              name: resolveLegacyId(reference?.name),
              fullRef: resolveLegacyId(reference?.fullRef),
            }))
          : [],
        tags: Array.isArray(payload?.tags)
          ? payload.tags.map((reference) => ({
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
          ? payload.warnings.map((warning) => String(warning || "")).filter(Boolean)
          : [],
        packageId: resolveLegacyId(payload?.packageId) || null,
        gitSkillPackage: payload?.gitSkillPackage
          ? toGitSkillPackagePayload(payload.gitSkillPackage)
          : null,
        skills: Array.isArray(payload?.skills)
          ? payload.skills.map((skill) => toSkillPayload(skill))
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
        ? data.tasks.map((task) => toTaskPayload(task))
        : [],
    };
  }

  if (query === LIST_MCP_SERVERS_QUERY) {
    const data = await executeRawGraphQL(COMPANY_API_LIST_MCP_SERVERS_QUERY, {
      companyId: resolveLegacyId(variables?.companyId),
    });
    return {
      mcpServers: Array.isArray(data?.mcpServers)
        ? data.mcpServers.map((mcpServer) => toMcpServerPayload(mcpServer))
        : [],
    };
  }

  if (query === DELETE_GITHUB_INSTALLATION_MUTATION) {
    return {
      ...unsupportedMutation("deleteGithubInstallation"),
      deleteGithubInstallation: {
        ...unsupportedMutation("deleteGithubInstallation").deleteGithubInstallation,
        deletedInstallationId: null,
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
          ? payload.repositories.map((repository) => ({
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
        ? variables.args.map((arg) => String(arg || "").trim()).filter(Boolean)
        : [],
      envVars: Array.isArray(variables?.envVars)
        ? variables.envVars
            .map((envVar) => ({
              key: String(envVar?.key || "").trim(),
              value: String(envVar?.value || "").trim(),
            }))
            .filter((envVar) => envVar.key)
        : [],
      authType: resolveLegacyId(variables?.authType) || null,
      bearerToken: String(variables?.bearerToken || "").trim() || null,
      customHeaders: Array.isArray(variables?.customHeaders)
        ? variables.customHeaders
            .map((header) => ({
              key: String(header?.key || "").trim(),
              value: String(header?.value || "").trim(),
            }))
            .filter((header) => header.key && header.value)
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
        ? variables.args.map((arg) => String(arg || "").trim()).filter(Boolean)
        : [],
      envVars: Array.isArray(variables?.envVars)
        ? variables.envVars
            .map((envVar) => ({
              key: String(envVar?.key || "").trim(),
              value: String(envVar?.value || "").trim(),
            }))
            .filter((envVar) => envVar.key)
        : [],
      authType: resolveLegacyId(variables?.authType) || null,
      bearerToken: String(variables?.bearerToken || "").trim() || null,
      customHeaders: Array.isArray(variables?.customHeaders)
        ? variables.customHeaders
            .map((header) => ({
              key: String(header?.key || "").trim(),
              value: String(header?.value || "").trim(),
            }))
            .filter((header) => header.key && header.value)
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
}) {
  return new Promise((resolve) => {
    let settled = false;
    const knownIds = new Set(
      (Array.isArray(knownThreadIds) ? knownThreadIds : [])
        .map((threadId) => String(threadId || "").trim())
        .filter(Boolean),
    );

    const finalize = (threadOrNull) => {
      if (settled) {
        return;
      }
      settled = true;
      clearTimeout(timeoutId);
      unsubscribe();
      resolve(threadOrNull);
    };

    const resolveFromThreadNodes = (threadNodes) => {
      const nextSessions = threadNodes.map((threadNode) => toLegacyThreadPayload(threadNode));
      const readyRequestedThread = nextSessions.find(
        (thread) => thread.id === requestedThreadId && thread.status === "ready",
      );
      const readyNewThread = nextSessions.find(
        (thread) => !knownIds.has(thread.id) && thread.status === "ready",
      );
      const remappedThread = nextSessions.find(
        (thread) => !knownIds.has(thread.id) && thread.id !== requestedThreadId,
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
      onData: (payload) => {
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
      .then((data) => {
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
  const [activePage, setActivePage] = useState(() => getPageFromPathname());
  const [agentsRoute, setAgentsRoute] = useState(() => getAgentsRouteFromPathname());
  const [skillsRoute, setSkillsRoute] = useState(() => getSkillsRouteFromPathname());
  const [rolesRoute, setRolesRoute] = useState(() => getRolesRouteFromPathname());
  const [gitSkillPackagesRoute, setGitSkillPackagesRoute] = useState(
    () => getGitSkillPackagesRouteFromPathname(),
  );
  const [runnersRoute, setRunnersRoute] = useState(() => getRunnersRouteFromPathname());
  const [chatsRoute, setChatsRoute] = useState(() => getChatsRouteFromLocation());
  const [companies, setCompanies] = useState([]);
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(true);
  const [companyError, setCompanyError] = useState("");
  const [selectedCompanyId, setSelectedCompanyId] = useState(() => getPersistedCompanyId());
  const [newCompanyName, setNewCompanyName] = useState("");
  const [isCreatingCompany, setIsCreatingCompany] = useState(false);
  const [isDeletingCompany, setIsDeletingCompany] = useState(false);
  const [githubAppConfig, setGithubAppConfig] = useState({
    appClientId: "",
    appLink: DEFAULT_GITHUB_APP_INSTALL_URL,
  });
  const [isLoadingGithubAppConfig, setIsLoadingGithubAppConfig] = useState(false);
  const [githubAppConfigError, setGithubAppConfigError] = useState("");
  const [githubInstallations, setGithubInstallations] = useState([]);
  const [githubRepositories, setGithubRepositories] = useState([]);
  const [isLoadingGithubInstallations, setIsLoadingGithubInstallations] = useState(false);
  const [isLoadingGithubRepositories, setIsLoadingGithubRepositories] = useState(false);
  const [githubInstallationError, setGithubInstallationError] = useState("");
  const [githubInstallationNotice, setGithubInstallationNotice] = useState("");
  const [isAddingGithubInstallationFromCallback, setIsAddingGithubInstallationFromCallback] = useState(false);
  const [deletingGithubInstallationId, setDeletingGithubInstallationId] = useState("");
  const [refreshingGithubInstallationId, setRefreshingGithubInstallationId] = useState("");
  const [pendingGithubInstallCallback, setPendingGithubInstallCallback] = useState(
    () => parseGithubInstallCallbackFromLocation(),
  );
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoadingCurrentUser, setIsLoadingCurrentUser] = useState(false);
  const [currentUserError, setCurrentUserError] = useState("");
  const [tasks, setTasks] = useState([]);
  const [skills, setSkills] = useState([]);
  const [roles, setRoles] = useState([]);
  const [skillGroups, setSkillGroups] = useState([]);
  const [gitSkillPackages, setGitSkillPackages] = useState([]);
  const [mcpServers, setMcpServers] = useState([]);
  const [agentRunners, setAgentRunners] = useState([]);
  const [hasLoadedAgentRunners, setHasLoadedAgentRunners] = useState(false);
  const [hasLoadedSkills, setHasLoadedSkills] = useState(false);
  const [hasLoadedRoles, setHasLoadedRoles] = useState(false);
  const [hasLoadedSkillGroups, setHasLoadedSkillGroups] = useState(false);
  const [hasLoadedMcpServers, setHasLoadedMcpServers] = useState(false);
  const [agents, setAgents] = useState([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);
  const [isLoadingSkills, setIsLoadingSkills] = useState(false);
  const [isLoadingRoles, setIsLoadingRoles] = useState(false);
  const [isLoadingSkillGroups, setIsLoadingSkillGroups] = useState(false);
  const [isLoadingGitSkillPackages, setIsLoadingGitSkillPackages] = useState(false);
  const [isLoadingMcpServers, setIsLoadingMcpServers] = useState(false);
  const [isLoadingRunners, setIsLoadingRunners] = useState(false);
  const [isLoadingAgents, setIsLoadingAgents] = useState(false);
  const [taskError, setTaskError] = useState("");
  const [skillError, setSkillError] = useState("");
  const [mcpServerError, setMcpServerError] = useState("");
  const [runnerError, setRunnerError] = useState("");
  const [agentError, setAgentError] = useState("");
  const [isSubmittingTask, setIsSubmittingTask] = useState(false);
  const [isCreatingSkill, setIsCreatingSkill] = useState(false);
  const [isCreatingMcpServer, setIsCreatingMcpServer] = useState(false);
  const [savingTaskId, setSavingTaskId] = useState(null);
  const [commentingTaskId, setCommentingTaskId] = useState(null);
  const [savingSkillId, setSavingSkillId] = useState(null);
  const [savingMcpServerId, setSavingMcpServerId] = useState(null);
  const [deletingTaskId, setDeletingTaskId] = useState(null);
  const [deletingSkillId, setDeletingSkillId] = useState(null);
  const [deletingMcpServerId, setDeletingMcpServerId] = useState(null);
  const [deletingRunnerId, setDeletingRunnerId] = useState(null);
  const [regeneratingRunnerId, setRegeneratingRunnerId] = useState(null);
  const [isCreatingRunner, setIsCreatingRunner] = useState(false);
  const [runnerNameDraft, setRunnerNameDraft] = useState("");
  const [runnerSecretsById, setRunnerSecretsById] = useState({});
  const [isCreatingAgent, setIsCreatingAgent] = useState(false);
  const [savingAgentId, setSavingAgentId] = useState(null);
  const [deletingAgentId, setDeletingAgentId] = useState(null);
  const [initializingAgentId, setInitializingAgentId] = useState(null);
  const [retryingAgentSkillInstallKey, setRetryingAgentSkillInstallKey] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [dependencyTaskIds, setDependencyTaskIds] = useState([]);
  const [relationshipDrafts, setRelationshipDrafts] = useState({});
  const [skillName, setSkillName] = useState("");
  const [skillType, setSkillType] = useState(SKILL_TYPE_TEXT);
  const [skillSkillsMpPackageName, setSkillSkillsMpPackageName] = useState("");
  const [skillDescription, setSkillDescription] = useState("");
  const [skillInstructions, setSkillInstructions] = useState("");
  const [skillDrafts, setSkillDrafts] = useState({});
  const [mcpServerName, setMcpServerName] = useState("");
  const [mcpServerTransportType, setMcpServerTransportType] = useState(
    MCP_TRANSPORT_TYPE_STREAMABLE_HTTP,
  );
  const [mcpServerUrl, setMcpServerUrl] = useState("");
  const [mcpServerCommand, setMcpServerCommand] = useState("");
  const [mcpServerArgsText, setMcpServerArgsText] = useState("");
  const [mcpServerEnvVarsText, setMcpServerEnvVarsText] = useState("");
  const [mcpServerAuthType, setMcpServerAuthType] = useState(MCP_AUTH_TYPE_NONE);
  const [mcpServerBearerToken, setMcpServerBearerToken] = useState("");
  const [mcpServerCustomHeadersText, setMcpServerCustomHeadersText] = useState("");
  const [mcpServerEnabled, setMcpServerEnabled] = useState(true);
  const [mcpServerDrafts, setMcpServerDrafts] = useState({});
  const [agentName, setAgentName] = useState("");
  const [agentRunnerId, setAgentRunnerId] = useState("");
  const [agentRoleIds, setAgentRoleIds] = useState([]);
  const [agentMcpServerIds, setAgentMcpServerIds] = useState([]);
  const [roleSkillGroupIdsByRoleId, setRoleSkillGroupIdsByRoleId] = useState({});
  const [roleMcpServerIdsByRoleId, setRoleMcpServerIdsByRoleId] = useState({});
  const [agentSdk, setAgentSdk] = useState(DEFAULT_AGENT_SDK);
  const [agentModel, setAgentModel] = useState("");
  const [agentModelReasoningLevel, setAgentModelReasoningLevel] = useState("");
  const [agentDefaultAdditionalModelInstructions, setAgentDefaultAdditionalModelInstructions] = useState("");
  const [agentDrafts, setAgentDrafts] = useState({});
  const [pendingEditAgentId, setPendingEditAgentId] = useState("");
  const [chatAgentId, setChatAgentId] = useState("");
  const [chatSessions, setChatSessions] = useState([]);
  const [chatSessionsByAgent, setChatSessionsByAgent] = useState({});
  const [chatSessionRunningById, setChatSessionRunningById] = useState({});
  const [chatSessionId, setChatSessionId] = useState("");
  const [chatSessionTitleDraft, setChatSessionTitleDraft] = useState("");
  const [chatSessionAdditionalModelInstructionsDraft, setChatSessionAdditionalModelInstructionsDraft] = useState("");
  const [chatSessionRenameDraft, setChatSessionRenameDraft] = useState("");
  const [chatTurns, setChatTurns] = useState([]);
  const [queuedChatMessages, setQueuedChatMessages] = useState([]);
  const [chatDraftMessage, setChatDraftMessage] = useState("");
  const [deletingChatSessionKey, setDeletingChatSessionKey] = useState("");
  const [chatError, setChatError] = useState("");
  const [chatIndexError, setChatIndexError] = useState("");
  const [isLoadingChatIndex, setIsLoadingChatIndex] = useState(false);
  const [isLoadingChatSessions, setIsLoadingChatSessions] = useState(false);
  const [isCreatingChatSession, setIsCreatingChatSession] = useState(false);
  const [isLoadingChat, setIsLoadingChat] = useState(false);
  const [isSendingChatMessage, setIsSendingChatMessage] = useState(false);
  const [isInterruptingChatTurn, setIsInterruptingChatTurn] = useState(false);
  const [isUpdatingChatTitle, setIsUpdatingChatTitle] = useState(false);
  const [steeringQueuedMessageId, setSteeringQueuedMessageId] = useState(null);
  const [deletingQueuedMessageId, setDeletingQueuedMessageId] = useState(null);
  const [isSideMenuCollapsed, setIsSideMenuCollapsed] = useState(() =>
    matchesMediaQuery(SIDEBAR_COLLAPSE_MEDIA_QUERY),
  );
  const isNavigatingToChatsRef = useRef(false);
  const activeChatSessionIdRef = useRef("");
  const turnLifecycleSignatureBySessionIdRef = useRef(new Map());
  const queuedRefreshInFlightBySessionIdRef = useRef(new Map());
  const runCreateChatSessionSingleFlight = useMemo(() => createSingleFlightByKey(), []);
  const hasCompanies = companies.length > 0;
  const handleChatSessionRenameDraftChange = useCallback((nextTitle) => {
    setChatSessionRenameDraft(String(nextTitle || "").slice(0, THREAD_TITLE_MAX_LENGTH));
  }, []);

  const selectedCompany = useMemo(() => {
    return companies.find((company) => company.id === selectedCompanyId) || null;
  }, [companies, selectedCompanyId]);

  const activeSkill = useMemo(() => {
    const skillId = String(skillsRoute.skillId || "").trim();
    if (!skillId) {
      return null;
    }
    return skills.find((skill) => skill.id === skillId) || null;
  }, [skills, skillsRoute.skillId]);

  const activeRole = useMemo(() => {
    const roleId = String(rolesRoute.roleId || "").trim();
    if (!roleId) {
      return null;
    }
    return roles.find((role) => role.id === roleId) || null;
  }, [rolesRoute.roleId, roles]);

  const activeGitSkillPackage = useMemo(() => {
    const packageId = String(gitSkillPackagesRoute.packageId || "").trim();
    if (!packageId) {
      return null;
    }
    return gitSkillPackages.find((gitSkillPackage) => gitSkillPackage.id === packageId) || null;
  }, [gitSkillPackages, gitSkillPackagesRoute.packageId]);

  const githubAppInstallUrl = useMemo(() => {
    return buildGithubAppInstallUrl({
      appLink: githubAppConfig.appLink,
      companyId: selectedCompanyId,
    });
  }, [githubAppConfig.appLink, selectedCompanyId]);

  const agentRunnerLookup = useMemo(() => {
    return agentRunners.reduce((map, runner) => {
      map.set(runner.id, runner);
      return map;
    }, new Map());
  }, [agentRunners]);

  const runnerCodexModelEntriesById = useMemo(() => {
    return agentRunners.reduce((map, runner) => {
      map.set(runner.id, normalizeRunnerCodexAvailableModels(runner));
      return map;
    }, new Map());
  }, [agentRunners]);

  const getChatCreateBlockedReasonForAgent = useCallback(
    (agent) => getChatCreateBlockedReason(agent, agentRunnerLookup),
    [agentRunnerLookup],
  );

  const getChatCreateBlockedReasonByAgentId = useCallback(
    (agentId) => {
      const resolvedAgentId = String(agentId || "").trim();
      if (!resolvedAgentId) {
        return "Select an agent before creating a chat.";
      }
      const selectedAgent = agents.find((agent) => agent.id === resolvedAgentId) || null;
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

  useEffect(() => {
    activeChatSessionIdRef.current = String(resolvedChatSessionId || "").trim();
  }, [resolvedChatSessionId]);

  const refreshQueuedChatMessagesForSession = useCallback((sessionId) => {
    const resolvedSessionId = String(sessionId || "").trim();
    if (!resolvedSessionId) {
      return Promise.resolve();
    }

    const inFlightRequest = queuedRefreshInFlightBySessionIdRef.current.get(resolvedSessionId);
    if (inFlightRequest) {
      return inFlightRequest;
    }

    const requestPromise = executeRawGraphQL(COMPANY_API_LIST_QUEUED_USER_MESSAGES_QUERY, {
      threadId: resolvedSessionId,
      first: 200,
    })
      .then((queuedUserMessagesPayload) => {
        if (activeChatSessionIdRef.current !== resolvedSessionId) {
          return;
        }
        const nextQueuedMessages = Array.isArray(queuedUserMessagesPayload?.queuedUserMessages)
          ? queuedUserMessagesPayload.queuedUserMessages.map((queuedMessage) =>
              toLegacyQueuedUserMessagePayload(queuedMessage),
            )
          : [];
        setQueuedChatMessages(nextQueuedMessages);
      })
      .catch(() => {})
      .finally(() => {
        if (queuedRefreshInFlightBySessionIdRef.current.get(resolvedSessionId) === requestPromise) {
          queuedRefreshInFlightBySessionIdRef.current.delete(resolvedSessionId);
        }
      });

    queuedRefreshInFlightBySessionIdRef.current.set(resolvedSessionId, requestPromise);
    return requestPromise;
  }, []);

  const selectedChatSession = useMemo(() => {
    const existingSession = chatSessions.find((session) => session.id === resolvedChatSessionId);
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

  const setChatSessionRunningState = useCallback((sessionId, isRunning) => {
    const resolvedSessionId = String(sessionId || "").trim();
    if (!resolvedSessionId) {
      return;
    }
    setChatSessionRunningById((currentState) => {
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

  const syncChatSessionRunningStateFromSessions = useCallback((sessions) => {
    const sessionsSnapshot = Array.isArray(sessions) ? sessions : [];
    if (sessionsSnapshot.length === 0) {
      return;
    }

    setChatSessionRunningById((currentState) => {
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

  const applyChatSessionsSnapshotForAgent = useCallback((agentId, sessions) => {
    const resolvedAgentId = String(agentId || "").trim();
    const sessionsSnapshot = Array.isArray(sessions) ? sessions : [];
    if (!resolvedAgentId) {
      return;
    }

    setChatSessionsByAgent((currentSessionsByAgent) => ({
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

    const getAgentLabel = (agentId) => {
      const resolvedAgentId = String(agentId || "").trim();
      if (!resolvedAgentId) {
        return "Agent";
      }
      const matchingAgent = agents.find((agent) => agent.id === resolvedAgentId);
      return matchingAgent?.name || `Agent ${resolvedAgentId.slice(0, 8)}`;
    };

    const getChatLabel = (sessionId) => {
      const resolvedSessionId = String(sessionId || "").trim();
      if (!resolvedSessionId) {
        return "Chat";
      }
      const chatTitle = String(selectedChatSession?.title || "").trim();
      return chatTitle || `Chat ${resolvedSessionId.slice(0, 8)}`;
    };

    const getSkillLabel = (skillId) => {
      const resolvedSkillId = String(skillId || "").trim();
      if (!resolvedSkillId) {
        return "Skill";
      }
      const matchingSkill = skills.find((skill) => skill.id === resolvedSkillId);
      return matchingSkill?.name || `Skill ${resolvedSkillId.slice(0, 8)}`;
    };

    const getRoleLabel = (roleId) => {
      const resolvedRoleId = String(roleId || "").trim();
      if (!resolvedRoleId) {
        return "Role";
      }
      const matchingRole = roles.find((role) => role.id === resolvedRoleId);
      return matchingRole?.name || `Role ${resolvedRoleId.slice(0, 8)}`;
    };

    const getGitSkillPackageLabel = (packageId) => {
      const resolvedPackageId = String(packageId || "").trim();
      if (!resolvedPackageId) {
        return "Git Skill Package";
      }
      const matchingPackage = gitSkillPackages.find((pkg) => pkg.id === resolvedPackageId);
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
      const getRunnerLabel = (runnerId) => {
        const matchingRunner = agentRunners.find((r) => r.id === runnerId);
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
  const shouldLoadGithubData = activePage === "settings" || activePage === "repos";
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
        (role?.skillGroups || []).map((skillGroup) => skillGroup?.id),
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
        (role?.mcpServers || []).map((mcpServer) => mcpServer?.id),
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
      setSelectedCompanyId((currentId) => {
        const preferredId = currentId || getPersistedCompanyId();
        if (preferredId && nextCompanies.some((company) => company.id === preferredId)) {
          return preferredId;
        }
        return nextCompanies[0]?.id || "";
      });
    } catch (loadError) {
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
    } catch (loadError) {
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
    } catch (loadError) {
      setGithubAppConfig((current) => ({
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
    } catch (loadError) {
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
    } catch (loadError) {
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
    } catch (loadError) {
      setTaskError(loadError.message);
    } finally {
      setIsLoadingTasks(false);
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
    } catch (loadError) {
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
    } catch (loadError) {
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
    } catch (loadError) {
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
    } catch (loadError) {
      setSkillError(loadError.message);
    } finally {
      setIsLoadingGitSkillPackages(false);
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
    } catch (loadError) {
      setHasLoadedMcpServers(false);
      setMcpServerError(loadError.message);
    } finally {
      setIsLoadingMcpServers(false);
    }
  }, [selectedCompanyId]);

  const loadAgentRunners = useCallback(async ({ silently = false } = {}) => {
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
      setAgentRunners((currentRunners) =>
        mergeAgentRunnerPayloadList(currentRunners, data.agentRunners || []),
      );
      setHasLoadedAgentRunners(true);
    } catch (loadError) {
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
        setAgentRunners((currentRunners) =>
          mergeAgentRunnerPayloadList(currentRunners, nextRunners),
        );
      }
      return nextAgents;
    } catch (loadError) {
      setAgentError(loadError.message);
      return [];
    } finally {
      setIsLoadingAgents(false);
    }
  }, [selectedCompanyId]);

  const loadChatsBootstrapData = useCallback(async ({ silently = false } = {}) => {
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
        setAgentRunners((currentRunners) =>
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
        Object.values(nextSessionsByAgent).flatMap((sessionsForAgent) =>
          Array.isArray(sessionsForAgent) ? sessionsForAgent : [],
        ),
      );

      return {
        agents: nextAgents,
        sessionsByAgent: nextSessionsByAgent,
      };
    } catch (loadError) {
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

    const pendingLoads = [];
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
    async ({ silently = false, agentIdOverride = null } = {}) => {
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
      } catch (loadError) {
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
    async ({ silently = false, agentIdOverride = null, sessionIdOverride = null } = {}) => {
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
        const nextTurns = toConnectionNodes(threadSnapshotPayload?.threadTurns).map((turnNode) =>
          toLegacyTurnPayload(turnNode, { runnerId }),
        );
        const nextQueuedMessages = Array.isArray(threadSnapshotPayload?.queuedUserMessages)
          ? threadSnapshotPayload.queuedUserMessages.map((queuedMessage) =>
              toLegacyQueuedUserMessagePayload(queuedMessage),
            )
          : [];
        const nextTurnLifecycleSignature = getTurnLifecycleSignature(nextTurns);
        setChatTurns(nextTurns);
        setQueuedChatMessages(nextQueuedMessages);
        turnLifecycleSignatureBySessionIdRef.current.set(targetSessionId, nextTurnLifecycleSignature);
        queuedRefreshInFlightBySessionIdRef.current.delete(targetSessionId);
        setChatSessionRunningState(targetSessionId, hasRunningChatTurns(nextTurns));
      } catch (loadError) {
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
    async ({ silently = false } = {}) => {
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
          Object.values(nextSessionsByAgent).flatMap((sessionsForAgent) =>
            Array.isArray(sessionsForAgent) ? sessionsForAgent : []),
        );
        return nextSessionsByAgent;
      } catch (loadError) {
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

  const handleAgentRunnersSubscriptionData = useCallback((payload) => {
    if (!payload?.agentRunnersUpdated) {
      return;
    }
    const nextRunnerNodes = toConnectionNodes(payload?.agentRunnersUpdated);
    const nextRunnerPayload = nextRunnerNodes.map((runnerNode) => toLegacyRunnerPayload(runnerNode));
    setAgentRunners((currentRunners) =>
      mergeAgentRunnerPayloadList(currentRunners, nextRunnerPayload),
    );
    setRunnerError("");
    setIsLoadingRunners(false);
  }, []);

  const handleAgentRunnersSubscriptionError = useCallback((error) => {
    setRunnerError(error.message);
    setIsLoadingRunners(false);
  }, []);

  const handleAgentChatSessionsSubscriptionData = useCallback((payload) => {
    if (!payload?.agentThreadsUpdated) {
      return;
    }
    const nextThreadNodes = toConnectionNodes(payload?.agentThreadsUpdated);
    const nextSessions = nextThreadNodes.map((threadNode) => toLegacyThreadPayload(threadNode));
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
          .map((agentEntry) => String(agentEntry?.id || "").trim())
          .filter(Boolean),
      )];
      if (knownAgentIds.length > 0) {
        setChatSessionsByAgent((currentSessionsByAgent) => {
          const nextSessionsByAgent = { ...currentSessionsByAgent };
          for (const agentId of knownAgentIds) {
            nextSessionsByAgent[agentId] = sessionsByAgentId[agentId] || [];
          }
          return nextSessionsByAgent;
        });
        if (chatAgentId) {
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

  const handleAgentChatTurnsSubscriptionData = useCallback((payload) => {
    if (!payload?.agentTurnsUpdated) {
      return;
    }
    const nextTurnNodes = toConnectionNodes(payload?.agentTurnsUpdated);
    const threadMetadata = companyApiThreadMetadataById.get(resolvedChatSessionId) || {};
    const nextTurns = nextTurnNodes.map((turnNode) =>
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
        void refreshQueuedChatMessagesForSession(targetSessionId);
      }
      setChatSessionRunningState(targetSessionId, hasRunningChatTurns(nextTurns));
    }
    setChatError("");
    setIsLoadingChat(false);
  }, [refreshQueuedChatMessagesForSession, resolvedChatSessionId, setChatSessionRunningState]);

  const handleAgentChatSubscriptionError = useCallback((error) => {
    setChatError(error.message);
    setIsLoadingChat(false);
    setIsLoadingChatSessions(false);
  }, []);

  useGraphQLSubscription({
    enabled: Boolean(selectedCompanyId && shouldSubscribeAgentRunners && hasLoadedAgentRunners),
    query: AGENT_RUNNERS_SUBSCRIPTION,
    variables: selectedCompanyId ? { companyId: selectedCompanyId, first: 200 } : undefined,
    onData: handleAgentRunnersSubscriptionData,
    onError: handleAgentRunnersSubscriptionError,
  });

  useGraphQLSubscription({
    enabled: Boolean(selectedCompanyId && (shouldSubscribeChatIndex || (chatAgentId && shouldSubscribeChatSessions))),
    query: AGENT_THREADS_SUBSCRIPTION,
    variables:
      selectedCompanyId
        ? {
            companyId: selectedCompanyId,
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
            companyId: selectedCompanyId,
            agentId: chatAgentId,
            threadId: resolvedChatSessionId,
            first: 100,
          }
        : undefined,
    onData: handleAgentChatTurnsSubscriptionData,
    onError: handleAgentChatSubscriptionError,
  });

  useEffect(() => {
    loadCompanies();
  }, [loadCompanies]);

  useEffect(() => {
    setActiveCompanyId(selectedCompanyId);
    persistCompanyId(selectedCompanyId);
    activeChatSessionIdRef.current = "";
    turnLifecycleSignatureBySessionIdRef.current.clear();
    queuedRefreshInFlightBySessionIdRef.current.clear();
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
    setMcpServerBearerToken("");
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
    const validMcpServerIds = new Set(mcpServers.map((mcpServer) => mcpServer.id));

    setAgentMcpServerIds((currentIds) => {
      const normalizedIds = normalizeUniqueStringList(currentIds).filter((id) => validMcpServerIds.has(id));
      if (
        normalizedIds.length === currentIds.length &&
        normalizedIds.every((id, index) => id === currentIds[index])
      ) {
        return currentIds;
      }
      return normalizedIds;
    });

    setAgentDrafts((currentDrafts) => {
      let changed = false;
      const nextDrafts = {};
      for (const [agentId, draft] of Object.entries(currentDrafts)) {
        if (!draft || typeof draft !== "object") {
          nextDrafts[agentId] = draft;
          continue;
        }

        const currentMcpServerIds = Array.isArray(draft.mcpServerIds) ? draft.mcpServerIds : [];
        const normalizedMcpServerIds = normalizeUniqueStringList(currentMcpServerIds).filter((id) =>
          validMcpServerIds.has(id),
        );

        if (
          normalizedMcpServerIds.length === currentMcpServerIds.length &&
          normalizedMcpServerIds.every((id, index) => id === currentMcpServerIds[index])
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
    const validRoleIds = new Set(roles.map((role) => role.id));

    setAgentRoleIds((currentIds) => {
      const normalizedIds = normalizeUniqueStringList(currentIds).filter((id) =>
        validRoleIds.has(id),
      );
      if (
        normalizedIds.length === currentIds.length
        && normalizedIds.every((id, index) => id === currentIds[index])
      ) {
        return currentIds;
      }
      return normalizedIds;
    });

    setAgentDrafts((currentDrafts) => {
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
        const normalizedRoleIds = normalizeUniqueStringList(currentRoleIds).filter((id) =>
          validRoleIds.has(id),
        );

        if (
          normalizedRoleIds.length === currentRoleIds.length
          && normalizedRoleIds.every((id, index) => id === currentRoleIds[index])
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
    if (!shouldLoadGithubData) {
      return;
    }
    loadGithubAppConfig();
  }, [loadGithubAppConfig, shouldLoadGithubData]);

  useEffect(() => {
    if (!selectedCompanyId || !shouldLoadGithubData) {
      return;
    }
    loadGithubInstallations();
    loadGithubRepositories();
  }, [
    loadGithubInstallations,
    loadGithubRepositories,
    selectedCompanyId,
    shouldLoadGithubData,
  ]);

  useEffect(() => {
    if (!shouldLoadCurrentUserData) {
      return;
    }
    loadCurrentUser();
  }, [loadCurrentUser, shouldLoadCurrentUserData]);

  useEffect(() => {
    if (!selectedCompanyId || !shouldLoadTaskData) {
      return;
    }
    loadTasks();
  }, [loadTasks, selectedCompanyId, shouldLoadTaskData]);

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
    setChatSessionRenameDraft((currentTitle) =>
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
    setChatAgentId((currentAgentId) => {
      if (routeAgentId) {
        if (agents.length === 0 || agents.some((agent) => agent.id === routeAgentId)) {
          return routeAgentId;
        }
      }
      if (currentAgentId && agents.some((agent) => agent.id === currentAgentId)) {
        return currentAgentId;
      }
      return agents[0]?.id || "";
    });
  }, [activePage, agents, chatsRoute.agentId, selectedCompanyId]);

  useEffect(() => {
    if (!chatAgentId) {
      setChatSessionId((currentSessionId) => (currentSessionId ? "" : currentSessionId));
      setChatSessions((currentSessions) => (currentSessions.length > 0 ? [] : currentSessions));
      setChatTurns((currentTurns) => (currentTurns.length > 0 ? [] : currentTurns));
      setQueuedChatMessages((currentMessages) => (currentMessages.length > 0 ? [] : currentMessages));
      return;
    }

    if (activePage === "chats") {
      const routeThreadId = String(chatsRoute.threadId || "").trim();
      if (routeThreadId) {
        setChatSessionId(routeThreadId);
        return;
      }
      setChatSessionId((currentSessionId) => {
        if (!currentSessionId) {
          return "";
        }
        if (chatSessions.some((session) => session.id === currentSessionId)) {
          return currentSessionId;
        }
        return "";
      });
      if (!chatSessionId) {
        setChatTurns((currentTurns) => (currentTurns.length > 0 ? [] : currentTurns));
        setQueuedChatMessages((currentMessages) => (currentMessages.length > 0 ? [] : currentMessages));
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

    setChatSessionId((currentSessionId) => {
      if (currentSessionId && chatSessions.some((session) => session.id === currentSessionId)) {
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
    const handleMediaQueryChange = (event) => {
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
      callbackStateCompanyId && companies.some((company) => company.id === callbackStateCompanyId)
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
          await loadGithubRepositories();
        }
      } catch (linkError) {
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
    loadGithubRepositories,
    pendingGithubInstallCallback,
    selectedCompanyId,
  ]);

  async function handleCreateCompany(event) {
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
    } catch (createError) {
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
      `Delete company "${selectedCompany.name}"? This will also delete all tasks, skills, MCP servers, agents, and agent runners in that company.`,
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
      setMcpServers([]);
      setMcpServerDrafts({});
      setAgents([]);
      setAgentDrafts({});
      setAgentRunners([]);
      await loadCompanies();
    } catch (deleteError) {
      setCompanyError(deleteError.message);
    } finally {
      setIsDeletingCompany(false);
    }
  }

  async function handleDeleteGithubInstallation(installationId) {
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
      await loadGithubRepositories();
    } catch (deleteError) {
      setGithubInstallationError(deleteError.message);
    } finally {
      setDeletingGithubInstallationId("");
    }
  }

  async function handleRefreshGithubInstallationRepositories(installationId) {
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
    } catch (refreshError) {
      setGithubInstallationError(refreshError.message);
    } finally {
      setRefreshingGithubInstallationId("");
    }
  }

  async function handleCreateTask(event) {
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
        dependencyTaskIds: normalizeUniqueStringList(dependencyTaskIds),
      });

      const result = data.createTask;
      if (!result.ok) {
        throw new Error(result.error || "Task creation failed.");
      }

      setName("");
      setDescription("");
      setDependencyTaskIds([]);
      await loadTasks();
      return true;
    } catch (submitError) {
      setTaskError(submitError.message);
      return false;
    } finally {
      setIsSubmittingTask(false);
    }
  }

  async function handleDeleteTask(taskId, taskName) {
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
    } catch (deleteError) {
      setTaskError(deleteError.message);
    } finally {
      setDeletingTaskId(null);
    }
  }

  async function handleRelationshipSave(taskId) {
    if (!selectedCompanyId) {
      setTaskError("Select a company before updating tasks.");
      return false;
    }
    const currentTask = tasks.find((task) => task.id === taskId);
    if (!currentTask) {
      setTaskError("Task not found.");
      return false;
    }
    const draft = relationshipDrafts[taskId] || {
      dependencyTaskIds: [],
    };

    try {
      setSavingTaskId(taskId);
      setTaskError("");

      const currentDependencyTaskIds = normalizeUniqueStringList(currentTask.dependencyTaskIds || []);
      const draftDependencyTaskIds = normalizeUniqueStringList(draft.dependencyTaskIds || [])
        .filter((dependencyTaskId) => dependencyTaskId !== taskId);
      const draftDependencyTaskIdSet = new Set(draftDependencyTaskIds);

      const dependencyTaskIdsToAdd = draftDependencyTaskIds
        .filter((dependencyTaskId) => !currentDependencyTaskIds.includes(dependencyTaskId));
      const dependencyTaskIdsToRemove = currentDependencyTaskIds
        .filter((dependencyTaskId) => !draftDependencyTaskIdSet.has(dependencyTaskId));

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

      await loadTasks();
      return true;
    } catch (updateError) {
      setTaskError(updateError.message);
      return false;
    } finally {
      setSavingTaskId(null);
    }
  }

  async function handleCreateTaskComment(taskId, comment) {
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
    } catch (createError) {
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
  }) {
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

  async function handleCreateSkill(event) {
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
    } catch (createError) {
      setSkillError(createError.message);
      return false;
    } finally {
      setIsCreatingSkill(false);
    }
  }

  async function handleSaveSkill(skillId) {
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
    } catch (updateError) {
      setSkillError(updateError.message);
    } finally {
      setSavingSkillId(null);
    }
  }

  async function handleDeleteSkill(skillId, skillDisplayName) {
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
    } catch (deleteError) {
      setSkillError(deleteError.message);
    } finally {
      setDeletingSkillId(null);
    }
  }

  async function handlePreviewGitSkillPackage(gitRepositoryUrl) {
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

  async function handleCreateGitSkillPackage({ gitRepositoryUrl, gitReference }) {
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

  async function handleDeleteGitSkillPackage(gitSkillPackageId, packageName) {
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
    } catch (deleteError) {
      setSkillError(deleteError.message);
      return false;
    }
  }

  async function handleCreateSkillGroup({ name, parentSkillGroupId }) {
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

  async function handleDeleteSkillGroup(skillGroupId, skillGroupName) {
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
    } catch (deleteError) {
      setSkillError(deleteError.message);
      return false;
    }
  }

  async function handleUpdateSkillGroup({ id, name, parentSkillGroupId }) {
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

  async function handleAddSkillToGroup(skillGroupId, skillId) {
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

  async function handleRemoveSkillFromGroup(skillGroupId, skillId) {
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

  async function handleCreateRole({ name, parentRoleId }) {
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

  async function handleDeleteRole(roleId, roleName) {
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
    } catch (deleteError) {
      setSkillError(deleteError.message);
      return false;
    }
  }

  async function handleUpdateRole({ id, name, parentRoleId }) {
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

  async function handleAddSkillToRole(roleId, skillId) {
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

  async function handleRemoveSkillFromRole(roleId, skillId) {
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

  async function handleRoleSkillGroupIdsChange(roleId, nextSkillGroupIds) {
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
    const skillGroupIdsToAdd = normalizedNextSkillGroupIds.filter((skillGroupId) => !currentSet.has(skillGroupId));
    const skillGroupIdsToRemove = currentSkillGroupIds.filter((skillGroupId) => !nextSet.has(skillGroupId));

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
    } catch (error) {
      setSkillError((error && error.message) || "Failed to update role skill groups.");
    }
  }

  async function handleRoleMcpServerIdsChange(roleId, nextMcpServerIds) {
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
    const mcpServerIdsToAdd = normalizedNextMcpServerIds.filter((mcpServerId) => !currentSet.has(mcpServerId));
    const mcpServerIdsToRemove = currentMcpServerIds.filter((mcpServerId) => !nextSet.has(mcpServerId));

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
    } catch (error) {
      setSkillError((error && error.message) || "Failed to update role MCP servers.");
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
    bearerToken: rawBearerToken,
    customHeadersText: rawCustomHeadersText,
    enabled: rawEnabled,
  }) {
    const name = String(rawName || "").trim();
    const transportType = normalizeMcpTransportType(rawTransportType);
    const url = String(rawUrl || "").trim();
    const command = String(rawCommand || "").trim();
    const argsText = String(rawArgsText || "");
    const envVarsText = String(rawEnvVarsText || "");
    const authType = normalizeMcpAuthType(rawAuthType);
    const bearerToken = String(rawBearerToken || "").trim();
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
          bearerToken: null,
          customHeaders: [],
          enabled: Boolean(rawEnabled),
        },
        error: "",
      };
    }

    if (!url) {
      return { payload: null, error: "MCP server URL is required for streamable HTTP transport." };
    }

    let customHeaders = [];
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

    if (authType === MCP_AUTH_TYPE_BEARER_TOKEN && !bearerToken) {
      return { payload: null, error: "Bearer token is required when auth type is Bearer token." };
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
        bearerToken: authType === MCP_AUTH_TYPE_BEARER_TOKEN ? bearerToken : null,
        customHeaders: authType === MCP_AUTH_TYPE_CUSTOM_HEADERS ? customHeaders : [],
        enabled: Boolean(rawEnabled),
      },
      error: "",
    };
  }

  async function handleCreateMcpServer(event) {
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
      bearerToken: mcpServerBearerToken,
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
      setMcpServerBearerToken("");
      setMcpServerCustomHeadersText("");
      setMcpServerEnabled(true);
      await loadMcpServers();
      return true;
    } catch (createError) {
      setMcpServerError(createError.message);
      return false;
    } finally {
      setIsCreatingMcpServer(false);
    }
  }

  function handleMcpServerDraftChange(mcpServerId, field, value) {
    setMcpServerDrafts((currentDrafts) => {
      const currentDraft = currentDrafts[mcpServerId] || {
        name: "",
        transportType: MCP_TRANSPORT_TYPE_STREAMABLE_HTTP,
        url: "",
        command: "",
        argsText: "",
        envVarsText: "",
        authType: MCP_AUTH_TYPE_NONE,
        bearerToken: "",
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

  async function handleSaveMcpServer(mcpServerId) {
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
      bearerToken: "",
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
    } catch (updateError) {
      setMcpServerError(updateError.message);
    } finally {
      setSavingMcpServerId(null);
    }
  }

  async function handleDeleteMcpServer(mcpServerId, mcpServerDisplayName) {
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
    } catch (deleteError) {
      setMcpServerError(deleteError.message);
    } finally {
      setDeletingMcpServerId(null);
    }
  }

  async function handleRegenerateRunnerSecret(runnerId) {
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
      setRunnerSecretsById((currentSecrets) => ({
        ...currentSecrets,
        [runnerId]: regeneratedSecret,
      }));
      await loadAgentRunners({ silently: true });
    } catch (regenerateError) {
      setRunnerError(regenerateError.message);
    } finally {
      setRegeneratingRunnerId(null);
    }
  }

  async function handleDeleteRunner(runnerId) {
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
      setRunnerSecretsById((currentSecrets) => {
        if (!(runnerId in currentSecrets)) {
          return currentSecrets;
        }
        const nextSecrets = { ...currentSecrets };
        delete nextSecrets[runnerId];
        return nextSecrets;
      });
      await loadAgentRunners();
    } catch (deleteError) {
      setRunnerError(deleteError.message);
    } finally {
      setDeletingRunnerId(null);
    }
  }

  async function handleCreateRunner(event) {
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
        setRunnerSecretsById((currentSecrets) => ({
          ...currentSecrets,
          [createdRunnerId]: provisionedRunnerSecret,
        }));
      }

      setRunnerNameDraft("");
      await loadAgentRunners();
      return true;
    } catch (createError) {
      setRunnerError(createError.message);
      return false;
    } finally {
      setIsCreatingRunner(false);
    }
  }

  async function handleCreateAgent(event) {
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
    } catch (createError) {
      setAgentError(createError.message);
      return false;
    } finally {
      setIsCreatingAgent(false);
    }
  }

  async function handleSaveAgent(agentId) {
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
    } catch (updateError) {
      setAgentError(updateError.message);
      return false;
    } finally {
      setSavingAgentId(null);
    }
  }

  async function handleDeleteAgent(agentId, agentDisplayName, forceDelete = false) {
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
    } catch (deleteError) {
      setAgentError(deleteError.message);
      return false;
    } finally {
      setDeletingAgentId(null);
    }
  }

  async function handleInitializeAgent(agentId) {
    if (!selectedCompanyId) {
      setAgentError("Select a company before initializing agents.");
      return;
    }

    const agent = agents.find((candidate) => candidate.id === agentId);
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
      : agentRunners.find((runner) => normalizeRunnerStatus(runner.status) === "ready");
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
    } catch (initializeError) {
      setAgentError(initializeError.message);
    } finally {
      setInitializingAgentId(null);
    }
  }

  async function handleRetryAgentSkillInstall(agentId, skillId) {
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

    const selectedAgent = agents.find((agent) => agent.id === resolvedAgentId) || null;
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
    } catch (retryError) {
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

    const selectedAgentForChat = agents.find((agent) => agent.id === chatAgentId) || null;

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
    } catch (interruptError) {
      setChatError(interruptError.message);
    } finally {
      setIsInterruptingChatTurn(false);
    }
  }

  async function handleSteerQueuedChatMessage(queuedMessageId) {
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
    } catch (steerError) {
      setChatError(steerError.message);
    } finally {
      setSteeringQueuedMessageId(null);
    }
  }

  async function handleDeleteQueuedChatMessage(queuedMessageId) {
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

    const queuedMessage = queuedChatMessages.find((entry) => String(entry?.id || "").trim() === resolvedQueuedMessageId);
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
    } catch (deleteError) {
      setChatError(deleteError.message);
    } finally {
      setDeletingQueuedMessageId(null);
    }
  }

  async function handleSendChatMessage(event, modeOverride = "queue") {
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

    const selectedAgentForChat = agents.find((agent) => agent.id === chatAgentId) || null;
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
      const normalizedModeOverride = String(modeOverride || "").trim().toLowerCase();
      const shouldSteerMode = normalizedModeOverride === "steer" || normalizedModeOverride === "turn";
      const nextMode = hasRunningTurn && shouldSteerMode ? "steer" : "queue";
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
    } catch (sendError) {
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
  } = {}) {
    const targetAgentId = String(agentId || chatAgentId || "").trim();
    if (!selectedCompanyId) {
      setChatError("Select a company before creating a chat.");
      return null;
    }
    if (!targetAgentId) {
      setChatError("Select an agent before creating a chat.");
      return null;
    }

    const selectedAgentForChat = agents.find((agent) => agent.id === targetAgentId) || null;
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
        (session) => String(session?.id || "").trim(),
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

        const isReadySession = (session) => String(session?.status || "").trim().toLowerCase() === "ready";
        const isNewSession = (session) => !knownThreadIds.has(String(session?.id || "").trim());
        const requestedSession = sessionsForAgent.find(
          (session) => String(session?.id || "").trim() === requestedThreadId,
        );
        const readyRequestedSession = requestedSession && isReadySession(requestedSession) ? requestedSession : null;
        const readyNewSession = sessionsForAgent.find((session) => isNewSession(session) && isReadySession(session));
        const remappedSession = sessionsForAgent.find(
          (session) =>
            isNewSession(session) && String(session?.id || "").trim() !== requestedThreadId,
        );
        const resolvedThread =
          readyRequestedSession || readyNewSession || remappedSession || requestedSession || canonicalThread;
        const resolvedThreadId = String(resolvedThread?.id || requestedThreadId || "").trim();

        let nextSessionsForAgent = sessionsForAgent;
        if (
          resolvedThreadId
          && !sessionsForAgent.some((session) => String(session?.id || "").trim() === resolvedThreadId)
        ) {
          nextSessionsForAgent = [resolvedThread, ...sessionsForAgent];
        }

        setChatAgentId(targetAgentId);
        setChatSessions(nextSessionsForAgent);
        setChatSessionsByAgent((currentSessionsByAgent) => ({
          ...currentSessionsByAgent,
          [targetAgentId]: nextSessionsForAgent,
        }));
        setChatSessionTitleDraft("");
        setChatSessionAdditionalModelInstructionsDraft("");
        setChatSessionId(resolvedThreadId);
        return resolvedThreadId;
      } catch (createError) {
        setChatError(createError.message);
        return null;
      } finally {
        setIsCreatingChatSession(false);
      }
    });
  }

  async function handleUpdateChatSessionTitle(event) {
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
      const upsertSessionList = (sessions) => {
        let matched = false;
        const nextSessions = (Array.isArray(sessions) ? sessions : []).map((session) => {
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

      setChatSessions((currentSessions) => upsertSessionList(currentSessions));

      const targetAgentId = resolveLegacyId(updatedSession?.agentId, chatAgentId);
      if (targetAgentId) {
        setChatSessionsByAgent((currentSessionsByAgent) => ({
          ...currentSessionsByAgent,
          [targetAgentId]: upsertSessionList(currentSessionsByAgent[targetAgentId]),
        }));
      }

      setChatSessionRenameDraft(String(updatedSession?.title || ""));
      return true;
    } catch (updateError) {
      setChatError(updateError.message);
      return false;
    } finally {
      setIsUpdatingChatTitle(false);
    }
  }

  function handleOpenChatFromList({ agentId, sessionId, sessionsForAgent = [] }) {
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

  async function handleCreateChatForAgent(agentId) {
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
  } = {}) {
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
    const remainingSessionsForTargetAgent = agentSessions.filter(
      (session) => String(session?.id || "").trim() !== targetSessionId,
    );
    const matchingSession = agentSessions.find((session) => String(session?.id || "").trim() === targetSessionId)
      || chatSessions.find((session) => String(session?.id || "").trim() === targetSessionId)
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
    const isOverviewRoute = activePage === "chats" && !resolvedChatSessionId;
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

      companyApiThreadMetadataById.delete(targetSessionId);
      setChatSessionRunningState(targetSessionId, false);
      setChatSessions((currentSessions) =>
        currentSessions.filter((session) => String(session?.id || "").trim() !== targetSessionId),
      );
      setChatSessionsByAgent((currentSessionsByAgent) => {
        const existingSessions = Array.isArray(currentSessionsByAgent[targetAgentId])
          ? currentSessionsByAgent[targetAgentId]
          : [];
        return {
          ...currentSessionsByAgent,
          [targetAgentId]: existingSessions.filter(
            (session) => String(session?.id || "").trim() !== targetSessionId,
          ),
        };
      });

      if (resolvedChatSessionId === targetSessionId) {
        const sortedRemainingSessionsForTargetAgent =
          sortChatSessionsForChatNavigation(remainingSessionsForTargetAgent);
        const firstRemainingSessionForTargetAgent = sortedRemainingSessionsForTargetAgent[0] || null;
        let fallbackChatTarget = firstRemainingSessionForTargetAgent
          ? {
              agentId: targetAgentId,
              threadId: String(firstRemainingSessionForTargetAgent?.id || "").trim(),
            }
          : null;

        if (!fallbackChatTarget) {
          const sessionsByAgentAfterDelete = {
            ...chatSessionsByAgent,
            [targetAgentId]: remainingSessionsForTargetAgent,
          };
          const sortedAgents = sortAgentsForChatNavigation(agents);
          for (const agentEntry of sortedAgents) {
            const fallbackAgentId = String(agentEntry?.id || "").trim();
            if (!fallbackAgentId) {
              continue;
            }
            const fallbackSessionsForAgent = sortChatSessionsForChatNavigation(
              Array.isArray(sessionsByAgentAfterDelete[fallbackAgentId])
                ? sessionsByAgentAfterDelete[fallbackAgentId]
                : [],
            );
            const fallbackSession = fallbackSessionsForAgent[0] || null;
            const fallbackThreadId = String(fallbackSession?.id || "").trim();
            if (fallbackThreadId) {
              fallbackChatTarget = {
                agentId: fallbackAgentId,
                threadId: fallbackThreadId,
              };
              break;
            }
          }
        }

        setChatSessionId("");
        setChatTurns([]);
        setQueuedChatMessages([]);
        if (activePage === "chats") {
          if (fallbackChatTarget?.agentId && fallbackChatTarget?.threadId) {
            setChatAgentId(fallbackChatTarget.agentId);
            setChatSessionId(fallbackChatTarget.threadId);
            setBrowserPath(
              getChatsPath({
                agentId: fallbackChatTarget.agentId,
                threadId: fallbackChatTarget.threadId,
              }),
              { replace: true },
            );
          } else {
            setBrowserPath(getChatsPath({ agentId: targetAgentId }), { replace: true });
          }
        }
        if (
          activePage === "agents"
          && agentsRoute.view === "chat"
          && String(agentsRoute.agentId || "").trim() === targetAgentId
        ) {
          setBrowserPath(`/agents/${targetAgentId}`);
        }
      }

      if (isOverviewRoute) {
        if (activePage === "chats") {
          await loadChatsBootstrapData({ silently: true });
        } else {
          await loadChatSessionIndexByAgent({ silently: true });
        }
      } else {
        await loadAgentChatSessions({
          silently: true,
          agentIdOverride: targetAgentId,
        });
      }
      return true;
    } catch (deleteError) {
      const errorMessage = deleteError?.message || "Chat deletion failed.";
      if (isOverviewRoute) {
        setChatIndexError(errorMessage);
      }
      setChatError(errorMessage);
      return false;
    } finally {
      setDeletingChatSessionKey("");
    }
  }

  function handleDraftChange(taskId, field, value) {
    setRelationshipDrafts((currentDrafts) => {
      const currentDraft = currentDrafts[taskId] || { dependencyTaskIds: [] };
      const nextDraft = {
        ...currentDraft,
        [field]: value,
      };
      if (field === "dependencyTaskIds") {
        nextDraft.dependencyTaskIds = normalizeUniqueStringList(value || []);
      }
      return {
        ...currentDrafts,
        [taskId]: nextDraft,
      };
    });
  }

  function handleSkillDraftChange(skillId, field, value) {
    setSkillDrafts((currentDrafts) => {
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

  function handleCreateAgentRunnerChange(nextRunnerId) {
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

  function handleCreateAgentSdkChange(nextSdk) {
    if (!isAvailableAgentSdk(nextSdk)) {
      setAgentSdk(DEFAULT_AGENT_SDK);
      return;
    }
    setAgentSdk(normalizeAgentSdkValue(nextSdk));
  }

  function handleCreateAgentModelChange(nextModel) {
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

  function handleCreateAgentReasoningLevelChange(nextReasoningLevel) {
    setAgentModelReasoningLevel(String(nextReasoningLevel || "").trim());
  }

  function handleCreateAgentRoleIdsChange(nextRoleIds) {
    setAgentRoleIds(normalizeUniqueStringList(nextRoleIds));
  }

  function handleAgentDraftChange(agentId, field, value) {
    setAgentDrafts((currentDrafts) => {
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

  async function navigateToChatsConversation({ replace = false } = {}) {
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
          (session) => String(session?.id || "").trim() === requestedThreadId,
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

  function navigateTo(pageId) {
    if (String(pageId || "").trim().toLowerCase() === "chats") {
      setChatSessionId("");
      setChatTurns([]);
      setQueuedChatMessages([]);
      void navigateToChatsConversation();
      return;
    }
    setBrowserPath(getPathForPage(pageId));
  }

  function handleOpenAgentSessions(agentId) {
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
    return tasks.reduce((map, task) => {
      map.set(task.id, task);
      return map;
    }, new Map());
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
    (taskId) => {
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
                onChange={(event) => setSelectedCompanyId(event.target.value)}
                disabled={isLoadingCompanies}
              >
                <option value="">
                  {isLoadingCompanies ? "Loading..." : "Select company"}
                </option>
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
              {companyError ? <p className="side-error">{companyError}</p> : null}
            </div>

            {NAV_SECTIONS.map((section) => (
              <div key={section.label} className="side-nav-section">
                <p className="side-nav-label">{section.label}</p>
                <nav className="side-nav" aria-label={`${section.label} navigation`}>
                  {section.items.map((item) => {
                    const isDisabled = item.requiresCompany && !selectedCompanyId;
                    return (
                      <a
                        key={item.id}
                        href={item.href}
                        aria-disabled={isDisabled ? "true" : undefined}
                        onClick={(event) => {
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
              {BOTTOM_NAV_ITEMS.map((item) => (
                <a
                  key={item.id}
                  href={item.href}
                  onClick={(event) => {
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
            isLoadingTasks={isLoadingTasks}
            taskError={taskError}
            isSubmittingTask={isSubmittingTask}
            savingTaskId={savingTaskId}
            commentingTaskId={commentingTaskId}
            deletingTaskId={deletingTaskId}
            name={name}
            description={description}
            dependencyTaskIds={dependencyTaskIds}
            relationshipDrafts={relationshipDrafts}
            taskCountLabel={taskCountLabel}
            onNameChange={setName}
            onDescriptionChange={setDescription}
            onDependencyTaskIdsChange={setDependencyTaskIds}
            onCreateTask={handleCreateTask}
            onDraftChange={handleDraftChange}
            onSaveRelationships={handleRelationshipSave}
            onCreateTaskComment={handleCreateTaskComment}
            onDeleteTask={handleDeleteTask}
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
            onOpenSkill={(skillId) => setBrowserPath(`/skills/${skillId}`)}
            onBackToSkills={() => setBrowserPath("/skills")}
            onCreateRole={handleCreateRole}
            onUpdateRole={handleUpdateRole}
            onDeleteRole={handleDeleteRole}
            onAddSkillToRole={handleAddSkillToRole}
            onRemoveSkillFromRole={handleRemoveSkillFromRole}
            onRoleMcpServerIdsChange={handleRoleMcpServerIdsChange}
            onOpenGitSkillPackage={(packageId) => setBrowserPath(`/gitSkillPackages/${packageId}`)}
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
            onOpenRole={(roleId) => setBrowserPath(`/roles/${roleId}`)}
            onBackToRoles={() => setBrowserPath("/roles")}
            onCreateRole={handleCreateRole}
            onUpdateRole={handleUpdateRole}
            onDeleteRole={handleDeleteRole}
            onAddSkillToRole={handleAddSkillToRole}
            onRemoveSkillFromRole={handleRemoveSkillFromRole}
            onRoleSkillGroupIdsChange={(roleId, nextSkillGroupIds) => {
              void handleRoleSkillGroupIdsChange(roleId, nextSkillGroupIds);
            }}
            onRoleMcpServerIdsChange={(roleId, nextMcpServerIds) => {
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
            onOpenSkill={(skillId) => setBrowserPath(`/skills/${skillId}`)}
          />
        ) : null}

        {selectedCompanyId && activePage === "gitskillpackages" ? (
          <GitSkillPackagesPage
            selectedCompanyId={selectedCompanyId}
            gitSkillPackages={gitSkillPackages}
            activeGitSkillPackage={activeGitSkillPackage}
            isLoadingGitSkillPackages={isLoadingGitSkillPackages}
            skillError={skillError}
            onOpenGitSkillPackage={(packageId) => setBrowserPath(`/gitSkillPackages/${packageId}`)}
            onBackToGitSkillPackages={() => setBrowserPath("/gitSkillPackages")}
            onPreviewGitSkillPackage={handlePreviewGitSkillPackage}
            onCreateGitSkillPackage={handleCreateGitSkillPackage}
            onDeleteGitSkillPackage={handleDeleteGitSkillPackage}
            onOpenSkill={(skillId) => setBrowserPath(`/skills/${skillId}`)}
          />
        ) : null}

        {selectedCompanyId && activePage === "mcp-servers" ? (
          <McpServersPage
            selectedCompanyId={selectedCompanyId}
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
            mcpServerBearerToken={mcpServerBearerToken}
            mcpServerCustomHeadersText={mcpServerCustomHeadersText}
            mcpServerEnabled={mcpServerEnabled}
            mcpServerDrafts={mcpServerDrafts}
            mcpServerCountLabel={mcpServerCountLabel}
            onMcpServerNameChange={setMcpServerName}
            onMcpServerTransportTypeChange={(value) =>
              setMcpServerTransportType(normalizeMcpTransportType(value))
            }
            onMcpServerUrlChange={setMcpServerUrl}
            onMcpServerCommandChange={setMcpServerCommand}
            onMcpServerArgsTextChange={setMcpServerArgsText}
            onMcpServerEnvVarsTextChange={setMcpServerEnvVarsText}
            onMcpServerAuthTypeChange={(value) => setMcpServerAuthType(normalizeMcpAuthType(value))}
            onMcpServerBearerTokenChange={setMcpServerBearerToken}
            onMcpServerCustomHeadersTextChange={setMcpServerCustomHeadersText}
            onMcpServerEnabledChange={setMcpServerEnabled}
            onCreateMcpServer={handleCreateMcpServer}
            onMcpServerDraftChange={handleMcpServerDraftChange}
            onSaveMcpServer={handleSaveMcpServer}
            onDeleteMcpServer={handleDeleteMcpServer}
          />
        ) : null}

        {selectedCompanyId && activePage === "agent-runner" ? (
          runnersRoute.view === "detail" && runnersRoute.runnerId ? (() => {
            const detailRunner = agentRunners.find((r) => r.id === runnersRoute.runnerId);
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
                onRunnerCommandSecretChange={(runnerId, value) =>
                  setRunnerSecretsById((currentSecrets) => ({
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
            agent={agents.find((agent) => agent.id === chatAgentId) || null}
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
              agent={agents.find((agent) => agent.id === chatAgentId) || null}
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
              onOpenChat={(sessionId) => {
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
              agent={agents.find((agent) => agent.id === chatAgentId) || null}
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
