import { DEFAULT_AGENT_SDK, SKILL_TYPE_SKILLSMP } from "./constants.js";
import {
  normalizeUniqueStringList,
  normalizeSkillType,
  normalizeMcpTransportType,
  normalizeMcpAuthType,
  mcpArgsToText,
  mcpEnvVarsToText,
  mcpHeadersToText,
} from "./normalization.js";

export function createRelationshipDrafts(tasks) {
  const taskList = Array.isArray(tasks) ? tasks : [];
  const childTaskIdsByParentTaskId = new Map();

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

  return taskList.reduce((drafts, task) => {
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

export function createAgentDrafts(agents) {
  return agents.reduce((drafts, agent) => {
    drafts[agent.id] = {
      agentRunnerId: agent.agentRunnerId || "",
      roleIds: [...(agent.roleIds || [])],
      mcpServerIds: [...(agent.mcpServerIds || [])],
      name: agent.name || "",
      agentSdk: agent.agentSdk || DEFAULT_AGENT_SDK,
      model: agent.model || "",
      modelReasoningLevel: agent.modelReasoningLevel || "",
      defaultAdditionalModelInstructions: agent.defaultAdditionalModelInstructions || "",
    };
    return drafts;
  }, {});
}

export function createSkillDrafts(skills) {
  return skills.reduce((drafts, skill) => {
    const normalizedSkillType = normalizeSkillType(skill.skillType);
    drafts[skill.id] = {
      name: skill.name || "",
      skillType: normalizedSkillType,
      skillsMpPackageName:
        normalizedSkillType === SKILL_TYPE_SKILLSMP
          ? String(skill.skillsMpPackageName || "").trim()
          : "",
      description: skill.description || "",
      instructions: skill.instructions || "",
    };
    return drafts;
  }, {});
}

export function createMcpServerDrafts(mcpServers) {
  return mcpServers.reduce((drafts, mcpServer) => {
    drafts[mcpServer.id] = {
      name: mcpServer.name || "",
      transportType: normalizeMcpTransportType(mcpServer.transportType),
      url: mcpServer.url || "",
      command: mcpServer.command || "",
      argsText: mcpArgsToText(mcpServer.args || []),
      envVarsText: mcpEnvVarsToText(mcpServer.envVars || []),
      authType: normalizeMcpAuthType(mcpServer.authType),
      bearerToken: mcpServer.bearerToken || "",
      customHeadersText: mcpHeadersToText(mcpServer.customHeaders || []),
      enabled: mcpServer.enabled !== false,
    };
    return drafts;
  }, {});
}
