import { DEFAULT_AGENT_SDK, SKILL_TYPE_SKILLSMP } from "./constants.ts";
import {
  normalizeUniqueStringList,
  normalizeSkillType,
  normalizeMcpTransportType,
  normalizeMcpAuthType,
  mcpArgsToText,
  mcpEnvVarsToText,
  mcpHeadersToText,
} from "./normalization.ts";

type LooseRecord = Record<string, unknown>;

function toRecord(value: unknown): LooseRecord {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  return value as LooseRecord;
}

export function createRelationshipDrafts(tasks: unknown): Record<string, {
  dependencyTaskIds: string[];
  parentTaskId: string;
  childTaskIds: string[];
}> {
  const taskList = Array.isArray(tasks) ? tasks.map(toRecord) : [];
  const childTaskIdsByParentTaskId = new Map<string, string[]>();

  for (const task of taskList) {
    const taskId = String(task?.id || "").trim();
    const parentTaskId = String(task?.parentTaskId || "").trim();
    if (!taskId || !parentTaskId || parentTaskId === taskId) {
      continue;
    }
    const existingChildTaskIds = childTaskIdsByParentTaskId.get(parentTaskId);
    if (existingChildTaskIds) {
      existingChildTaskIds.push(taskId);
    } else {
      childTaskIdsByParentTaskId.set(parentTaskId, [taskId]);
    }
  }

  return taskList.reduce<Record<string, { dependencyTaskIds: string[]; parentTaskId: string; childTaskIds: string[] }>>((drafts, task) => {
    const taskId = String(task?.id || "").trim();
    if (!taskId) {
      return drafts;
    }

    drafts[taskId] = {
      dependencyTaskIds: normalizeUniqueStringList(task?.dependencyTaskIds || [])
        .filter((dependencyTaskId) => dependencyTaskId !== taskId),
      parentTaskId: String(task?.parentTaskId || "").trim(),
      childTaskIds: normalizeUniqueStringList(childTaskIdsByParentTaskId.get(taskId) || []),
    };
    return drafts;
  }, {});
}

export function createAgentDrafts(agents: unknown): Record<string, LooseRecord> {
  const agentList = Array.isArray(agents) ? agents.map(toRecord) : [];
  return agentList.reduce<Record<string, LooseRecord>>((drafts, agent) => {
    const agentId = String(agent.id || "").trim();
    if (!agentId) {
      return drafts;
    }
    drafts[agentId] = {
      agentRunnerId: String(agent.agentRunnerId || "").trim(),
      roleIds: Array.isArray(agent.roleIds) ? [...agent.roleIds] : [],
      mcpServerIds: Array.isArray(agent.mcpServerIds) ? [...agent.mcpServerIds] : [],
      name: String(agent.name || "").trim(),
      agentSdk: String(agent.agentSdk || "").trim() || DEFAULT_AGENT_SDK,
      model: String(agent.model || "").trim(),
      modelReasoningLevel: String(agent.modelReasoningLevel || "").trim(),
      defaultAdditionalModelInstructions: String(agent.defaultAdditionalModelInstructions || "").trim(),
    };
    return drafts;
  }, {});
}

export function createSkillDrafts(skills: unknown): Record<string, LooseRecord> {
  const skillList = Array.isArray(skills) ? skills.map(toRecord) : [];
  return skillList.reduce<Record<string, LooseRecord>>((drafts, skill) => {
    const skillId = String(skill.id || "").trim();
    if (!skillId) {
      return drafts;
    }
    const normalizedSkillType = normalizeSkillType(skill.skillType);
    drafts[skillId] = {
      name: String(skill.name || "").trim(),
      skillType: normalizedSkillType,
      skillsMpPackageName:
        normalizedSkillType === SKILL_TYPE_SKILLSMP
          ? String(skill.skillsMpPackageName || "").trim()
          : "",
      description: String(skill.description || "").trim(),
      instructions: String(skill.instructions || "").trim(),
    };
    return drafts;
  }, {});
}

export function createMcpServerDrafts(mcpServers: unknown): Record<string, LooseRecord> {
  const serverList = Array.isArray(mcpServers) ? mcpServers.map(toRecord) : [];
  return serverList.reduce<Record<string, LooseRecord>>((drafts, mcpServer) => {
    const serverId = String(mcpServer.id || "").trim();
    if (!serverId) {
      return drafts;
    }
    drafts[serverId] = {
      name: String(mcpServer.name || "").trim(),
      transportType: normalizeMcpTransportType(mcpServer.transportType),
      url: String(mcpServer.url || "").trim(),
      command: String(mcpServer.command || "").trim(),
      argsText: mcpArgsToText(mcpServer.args || []),
      envVarsText: mcpEnvVarsToText(mcpServer.envVars || []),
      authType: normalizeMcpAuthType(mcpServer.authType),
      bearerToken: String(mcpServer.bearerToken || "").trim(),
      customHeadersText: mcpHeadersToText(mcpServer.customHeaders || []),
      enabled: mcpServer.enabled !== false,
    };
    return drafts;
  }, {});
}
