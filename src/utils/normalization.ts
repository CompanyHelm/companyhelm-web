import {
  SKILL_TYPE_TEXT,
  SKILL_TYPE_SKILLSMP,
  MCP_TRANSPORT_TYPE_STREAMABLE_HTTP,
  MCP_TRANSPORT_TYPE_STDIO,
  MCP_AUTH_TYPE_NONE,
  MCP_AUTH_TYPE_BEARER_TOKEN,
  MCP_AUTH_TYPE_CUSTOM_HEADERS,
  AVAILABLE_AGENT_SDKS,
  DEFAULT_AGENT_SDK,
} from "./constants.ts";

function resolveLegacyId(...values: any) {
  for (const value of values) {
    const resolved = String(value || "").trim();
    if (resolved) {
      return resolved;
    }
  }
  return "";
}

export function toSelectValue(value: any) {
  if (value == null) {
    return "";
  }
  return String(value);
}

export function normalizeUniqueStringList(values: any) {
  if (!Array.isArray(values)) {
    return [];
  }

  const normalizedValues: any[] = [];
  const seenValues = new Set<any>();
  for (const rawValue of values) {
    const cleanValue = String(rawValue || "").trim();
    if (!cleanValue || seenValues.has(cleanValue)) {
      continue;
    }
    seenValues.add(cleanValue);
    normalizedValues.push(cleanValue);
  }
  return normalizedValues;
}

export function normalizeOptionalInstructions(value: any) {
  if (value === undefined || value === null) {
    return null;
  }
  const normalizedValue = String(value).trim();
  return normalizedValue || null;
}

export function normalizeSkillType(value: any) {
  const normalized = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/-/g, "_")
    .replace(/\s+/g, "_");
  if (normalized === SKILL_TYPE_SKILLSMP) {
    return SKILL_TYPE_SKILLSMP;
  }
  return SKILL_TYPE_TEXT;
}

export function normalizeMcpTransportType(value: any) {
  const normalized = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/-/g, "_")
    .replace(/\s+/g, "_");
  if (
    normalized === MCP_TRANSPORT_TYPE_STREAMABLE_HTTP ||
    normalized === MCP_TRANSPORT_TYPE_STDIO
  ) {
    return normalized;
  }
  return MCP_TRANSPORT_TYPE_STREAMABLE_HTTP;
}

export function normalizeMcpAuthType(value: any) {
  const normalized = String(value || "")
    .trim()
    .toLowerCase();
  if (
    normalized === MCP_AUTH_TYPE_NONE ||
    normalized === MCP_AUTH_TYPE_BEARER_TOKEN ||
    normalized === MCP_AUTH_TYPE_CUSTOM_HEADERS
  ) {
    return normalized;
  }
  return MCP_AUTH_TYPE_NONE;
}

export function mcpHeadersToText(headers: any) {
  if (!Array.isArray(headers) || headers.length === 0) {
    return "";
  }
  return headers
    .map((header: any) => `${String(header?.key || "").trim()}: ${String(header?.value || "").trim()}`)
    .filter((line: any) => line !== ":")
    .join("\n");
}

export function mcpArgsToText(args: any) {
  if (!Array.isArray(args) || args.length === 0) {
    return "";
  }
  return args
    .map((arg: any) => String(arg || "").trim())
    .filter(Boolean)
    .join("\n");
}

export function mcpEnvVarsToText(envVars: any) {
  if (!Array.isArray(envVars) || envVars.length === 0) {
    return "";
  }
  return envVars
    .map((envVar: any) => `${String(envVar?.key || "").trim()}=${String(envVar?.value || "").trim()}`)
    .filter((line: any) => line !== "=")
    .join("\n");
}

export function parseMcpHeadersText(rawText: any) {
  const lines = String(rawText || "")
    .split("\n")
    .map((line: any) => line.trim())
    .filter(Boolean);
  const headers: any[] = [];
  const seenKeys = new Set<any>();

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const delimiterIndex = line.indexOf(":");
    if (delimiterIndex <= 0) {
      return {
        headers: [],
        error: `Header line ${index + 1} must be in "Key: Value" format.`,
      };
    }
    const key = line.slice(0, delimiterIndex).trim();
    const value = line.slice(delimiterIndex + 1).trim();
    if (!key) {
      return {
        headers: [],
        error: `Header line ${index + 1} is missing a key.`,
      };
    }
    if (!value) {
      return {
        headers: [],
        error: `Header line ${index + 1} is missing a value.`,
      };
    }
    const normalizedKey = key.toLowerCase();
    if (seenKeys.has(normalizedKey)) {
      return {
        headers: [],
        error: `Duplicate header key "${key}" is not allowed.`,
      };
    }
    seenKeys.add(normalizedKey);
    headers.push({ key, value });
  }

  return { headers, error: "" };
}

export function parseMcpArgsText(rawText: any) {
  const args = String(rawText || "")
    .split("\n")
    .map((line: any) => line.trim())
    .filter(Boolean);
  return {
    args,
    error: "",
  };
}

export function parseMcpEnvVarsText(rawText: any) {
  const lines = String(rawText || "")
    .split("\n")
    .map((line: any) => line.trim())
    .filter(Boolean);
  const envVars: any[] = [];
  const seenKeys = new Set<any>();

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const delimiterIndex = line.indexOf("=");
    if (delimiterIndex <= 0) {
      return {
        envVars: [],
        error: `Env var line ${index + 1} must be in "KEY=VALUE" format.`,
      };
    }
    const key = line.slice(0, delimiterIndex).trim();
    const value = line.slice(delimiterIndex + 1).trim();
    if (!key) {
      return {
        envVars: [],
        error: `Env var line ${index + 1} is missing a key.`,
      };
    }
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) {
      return {
        envVars: [],
        error: `Env var line ${index + 1} has invalid key "${key}".`,
      };
    }
    if (seenKeys.has(key)) {
      return {
        envVars: [],
        error: `Duplicate env var key "${key}" is not allowed.`,
      };
    }
    seenKeys.add(key);
    envVars.push({ key, value });
  }

  return { envVars, error: "" };
}

export function normalizeAgentSdkValue(value: any) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

export function isAvailableAgentSdk(value: any) {
  return AVAILABLE_AGENT_SDKS.includes(normalizeAgentSdkValue(value));
}

export function normalizeRunnerAvailableAgentSdks(runner: any) {
  const runnerSdks = Array.isArray(runner?.availableAgentSdks)
    ? runner.availableAgentSdks
    : Array.isArray(runner?.agentSdks)
      ? runner.agentSdks
      : [];

  return runnerSdks
    .map((sdkEntry: any) => ({
      id: resolveLegacyId(sdkEntry?.id),
      name: normalizeAgentSdkValue(sdkEntry?.name),
      availableModels: (
        Array.isArray(sdkEntry?.availableModels)
          ? sdkEntry.availableModels
          : Array.isArray(sdkEntry?.models)
            ? sdkEntry.models
            : []
      )
        .map((modelEntry: any) => ({
          id: resolveLegacyId(modelEntry?.id),
          name: String(modelEntry?.name || "").trim(),
          reasoningLevels: [
            ...new Set(
              (
                Array.isArray(modelEntry?.reasoningLevels)
                  ? modelEntry.reasoningLevels
                  : Array.isArray(modelEntry?.reasoning)
                    ? modelEntry.reasoning
                    : [modelEntry?.reasoningLevels, modelEntry?.reasoning]
              )
                .map((value: any) => String(value || "").trim())
                .filter(Boolean),
            ),
          ].sort((a: any, b: any) => a.localeCompare(b)),
        }))
        .filter((modelEntry: any) => Boolean(modelEntry.name))
        .sort((leftModel: any, rightModel: any) => leftModel.name.localeCompare(rightModel.name)),
    }))
    .filter((sdkEntry: any) => Boolean(sdkEntry.name))
    .sort((leftSdk: any, rightSdk: any) => leftSdk.name.localeCompare(rightSdk.name));
}

export function normalizeRunnerCodexAvailableModels(runner: any) {
  const availableAgentSdks = normalizeRunnerAvailableAgentSdks(runner);
  const codexSdk = availableAgentSdks.find((sdkEntry: any) => sdkEntry.name === DEFAULT_AGENT_SDK) || null;
  if (!codexSdk) {
    return [];
  }

  return codexSdk.availableModels.map((entry: any) => ({
    id: entry.id,
    sdkId: codexSdk.id,
    name: entry.name,
    reasoning: entry.reasoningLevels,
  }));
}

export function resolveRunnerSdkAndModelIds({
  runner,
  sdkName,
  modelName,
}: any) {
  const normalizedSdk = normalizeAgentSdkValue(sdkName);
  const normalizedModel = String(modelName || "").trim();
  if (!normalizedSdk || !normalizedModel) {
    return {
      agentRunnerSdkId: "",
      defaultModelId: "",
    };
  }

  const availableAgentSdks = normalizeRunnerAvailableAgentSdks(runner);
  const selectedSdk = availableAgentSdks.find((sdkEntry: any) => sdkEntry.name === normalizedSdk) || null;
  if (!selectedSdk) {
    return {
      agentRunnerSdkId: "",
      defaultModelId: "",
    };
  }

  const selectedModel = selectedSdk.availableModels.find((modelEntry: any) => modelEntry.name === normalizedModel) || null;
  return {
    agentRunnerSdkId: resolveLegacyId(selectedSdk.id),
    defaultModelId: resolveLegacyId(selectedModel?.id),
  };
}

export function mergeAgentRunnerPayloadEntry(currentRunner: any, incomingRunner: any) {
  const fallbackSdks = Array.isArray(currentRunner?.availableAgentSdks)
    ? currentRunner.availableAgentSdks
    : [];
  const incomingHasAvailableAgentSdks = Object.prototype.hasOwnProperty.call(
    incomingRunner || {},
    "availableAgentSdks",
  );
  const incomingSdks = incomingHasAvailableAgentSdks
    ? incomingRunner?.availableAgentSdks
    : fallbackSdks;
  const resolvedSdks = Array.isArray(incomingSdks) ? incomingSdks : fallbackSdks;

  return {
    ...(currentRunner || {}),
    ...(incomingRunner || {}),
    availableAgentSdks: resolvedSdks,
  };
}

export function mergeAgentRunnerPayloadList(currentRunners: any, incomingRunners: any) {
  if (!Array.isArray(incomingRunners)) {
    return Array.isArray(currentRunners) ? currentRunners : [];
  }

  const currentById = new Map(
    (Array.isArray(currentRunners) ? currentRunners : []).map((runner: any) => [String(runner?.id || ""), runner]),
  );

  return incomingRunners.map((incomingRunner: any) => {
    const incomingId = String(incomingRunner?.id || "");
    const currentRunner = incomingId ? currentById.get(incomingId) : null;
    return mergeAgentRunnerPayloadEntry(currentRunner, incomingRunner);
  });
}

export function getRunnerModelNames(codexModelEntries: any) {
  return codexModelEntries.map((entry: any) => entry.name);
}

export function getRunnerReasoningLevels(codexModelEntries: any, modelName: any) {
  const normalizedModel = String(modelName || "").trim();
  if (!normalizedModel) {
    return [];
  }
  const matchedEntry = codexModelEntries.find((entry: any) => entry.name === normalizedModel);
  return matchedEntry ? matchedEntry.reasoning : [];
}

export function getRunnerCodexModelEntriesForRunner(codexModelEntriesByRunnerId: any, runnerId: any) {
  if (!runnerId) {
    return [];
  }
  return codexModelEntriesByRunnerId.get(runnerId) || [];
}

export function resolveRunnerBackedModelSelection({
  codexModelEntries,
  requestedModel,
  requestedReasoning,
}: any) {
  const modelNames = getRunnerModelNames(codexModelEntries);
  const normalizedRequestedModel = String(requestedModel || "").trim();
  const nextModel = modelNames.includes(normalizedRequestedModel)
    ? normalizedRequestedModel
    : modelNames[0] || "";

  const reasoningLevels = getRunnerReasoningLevels(codexModelEntries, nextModel);
  const normalizedRequestedReasoning = String(requestedReasoning || "").trim();
  const nextReasoning = reasoningLevels.includes(normalizedRequestedReasoning)
    ? normalizedRequestedReasoning
    : reasoningLevels[0] || "";

  return { model: nextModel, modelReasoningLevel: nextReasoning };
}
