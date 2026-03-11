import {
  SKILL_TYPE_TEXT,
  SKILL_TYPE_SKILLSMP,
  MCP_TRANSPORT_TYPE_STREAMABLE_HTTP,
  MCP_TRANSPORT_TYPE_STDIO,
  MCP_AUTH_TYPE_NONE,
  MCP_AUTH_TYPE_BEARER_TOKEN,
  MCP_AUTH_TYPE_CUSTOM_HEADERS,
  MCP_AUTH_TYPE_OAUTH,
  AVAILABLE_AGENT_SDKS,
  DEFAULT_AGENT_SDK,
} from "./constants.ts";

type KeyValueEntry = {
  key: string;
  value: string;
};

function resolveLegacyId(...values: unknown[]) {
  for (const value of values) {
    const resolved = String(value || "").trim();
    if (resolved) {
      return resolved;
    }
  }
  return "";
}

export function toSelectValue(value: unknown): string {
  if (value == null) {
    return "";
  }
  return String(value);
}

export function normalizeUniqueStringList(values: unknown): string[] {
  if (!Array.isArray(values)) {
    return [];
  }

  const normalizedValues: string[] = [];
  const seenValues = new Set<string>();
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

export function normalizeOptionalInstructions(value: unknown): string | null {
  if (value === undefined || value === null) {
    return null;
  }
  const normalizedValue = String(value).trim();
  return normalizedValue || null;
}

export function normalizeSkillType(value: unknown): string {
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

export function normalizeMcpTransportType(value: unknown): string {
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

export function normalizeMcpAuthType(value: unknown): string {
  const normalized = String(value || "")
    .trim()
    .toLowerCase();
  if (
    normalized === MCP_AUTH_TYPE_NONE ||
    normalized === MCP_AUTH_TYPE_BEARER_TOKEN ||
    normalized === MCP_AUTH_TYPE_CUSTOM_HEADERS ||
    normalized === MCP_AUTH_TYPE_OAUTH
  ) {
    return normalized;
  }
  return MCP_AUTH_TYPE_NONE;
}

export function mcpHeadersToText(headers: unknown): string {
  if (!Array.isArray(headers) || headers.length === 0) {
    return "";
  }
  return headers
    .map((header) => `${String((header as KeyValueEntry)?.key || "").trim()}: ${String((header as KeyValueEntry)?.value || "").trim()}`)
    .filter((line) => line !== ":")
    .join("\n");
}

export function mcpArgsToText(args: unknown): string {
  if (!Array.isArray(args) || args.length === 0) {
    return "";
  }
  return args
    .map((arg) => String(arg || "").trim())
    .filter(Boolean)
    .join("\n");
}

export function mcpEnvVarsToText(envVars: unknown): string {
  if (!Array.isArray(envVars) || envVars.length === 0) {
    return "";
  }
  return envVars
    .map((envVar) => `${String((envVar as KeyValueEntry)?.key || "").trim()}=${String((envVar as KeyValueEntry)?.value || "").trim()}`)
    .filter((line) => line !== "=")
    .join("\n");
}

export function parseMcpHeadersText(rawText: unknown): { headers: KeyValueEntry[]; error: string } {
  const lines = String(rawText || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const headers: KeyValueEntry[] = [];
  const seenKeys = new Set<string>();

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

export function parseMcpArgsText(rawText: unknown): { args: string[]; error: string } {
  const args = String(rawText || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  return {
    args,
    error: "",
  };
}

export function parseMcpEnvVarsText(rawText: unknown): { envVars: KeyValueEntry[]; error: string } {
  const lines = String(rawText || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const envVars: KeyValueEntry[] = [];
  const seenKeys = new Set<string>();

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

type RunnerModelEntry = {
  id: string;
  name: string;
  reasoningLevels: string[];
  isAvailable: boolean;
};

type RunnerCodexModelEntry = {
  id: string;
  sdkId: string;
  name: string;
  reasoning: string[];
  isAvailable: boolean;
};

type RunnerSdkEntry = {
  id: string;
  name: string;
  isAvailable: boolean;
  availableModels: RunnerModelEntry[];
};

type RunnerLike = {
  availableAgentSdks?: unknown;
  agentSdks?: unknown;
  [key: string]: unknown;
};

function toRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  return value as Record<string, unknown>;
}

function normalizeAvailabilityFlag(...values: unknown[]): boolean {
  for (const value of values) {
    if (typeof value === "boolean") {
      return value;
    }
  }
  return true;
}

export function normalizeAgentSdkValue(value: unknown): string {
  return String(value || "")
    .trim()
    .toLowerCase();
}

export function isAvailableAgentSdk(value: unknown): boolean {
  return AVAILABLE_AGENT_SDKS.includes(normalizeAgentSdkValue(value));
}

export function normalizeRunnerAvailableAgentSdks(runner: RunnerLike): RunnerSdkEntry[] {
  const runnerSdks = Array.isArray(runner?.availableAgentSdks)
    ? runner.availableAgentSdks
    : Array.isArray(runner?.agentSdks)
      ? runner.agentSdks
      : [];

  return runnerSdks
    .map((sdkEntry) => {
      const sdkRecord = toRecord(sdkEntry);
      return {
        id: resolveLegacyId(sdkRecord.id),
        name: normalizeAgentSdkValue(sdkRecord.name),
        status: String(sdkRecord.status || "").trim().toLowerCase(),
        isAvailable: normalizeAvailabilityFlag(sdkRecord.isAvailable, sdkRecord.is_available),
        codexAuthStatus: String(
          sdkRecord.codexAuthStatus
          ?? sdkRecord.codex_auth_status
          ?? "",
        ).trim().toLowerCase() || null,
        codexAuthType: String(
          sdkRecord.codexAuthType
          ?? sdkRecord.codex_auth_type
          ?? "",
        ).trim().toLowerCase() || null,
        errorMessage: typeof sdkRecord.errorMessage === "string"
          ? sdkRecord.errorMessage
          : typeof sdkRecord.error_message === "string"
            ? sdkRecord.error_message
            : null,
        availableModels: (
          Array.isArray(sdkRecord.availableModels)
            ? sdkRecord.availableModels
            : Array.isArray(sdkRecord.models)
              ? sdkRecord.models
              : []
        )
          .map((modelEntry) => {
            const modelRecord = toRecord(modelEntry);
            const rawReasoningLevels = Array.isArray(modelRecord.reasoningLevels)
              ? modelRecord.reasoningLevels
              : Array.isArray(modelRecord.reasoning)
                ? modelRecord.reasoning
                : [modelRecord.reasoningLevels, modelRecord.reasoning];
            return {
              id: resolveLegacyId(modelRecord.id),
              name: String(modelRecord.name || "").trim(),
              isAvailable: normalizeAvailabilityFlag(modelRecord.isAvailable, modelRecord.is_available),
              reasoningLevels: [
                ...new Set(
                  rawReasoningLevels
                    .map((value) => String(value || "").trim())
                    .filter(Boolean),
                ),
              ].sort((leftLevel, rightLevel) => leftLevel.localeCompare(rightLevel)),
            };
          })
          .filter((modelEntry) => Boolean(modelEntry.name))
          .sort((leftModel, rightModel) => leftModel.name.localeCompare(rightModel.name)),
      };
    })
    .filter((sdkEntry) => Boolean(sdkEntry.name))
    .sort((leftSdk, rightSdk) => leftSdk.name.localeCompare(rightSdk.name));
}

export function normalizeRunnerCodexAvailableModels(runner: RunnerLike) {
  const availableAgentSdks = normalizeRunnerAvailableAgentSdks(runner);
  const codexSdk = availableAgentSdks.find((sdkEntry) => sdkEntry.name === DEFAULT_AGENT_SDK) || null;
  if (!codexSdk) {
    return [];
  }

  return codexSdk.availableModels.map((entry): RunnerCodexModelEntry => ({
    id: entry.id,
    sdkId: codexSdk.id,
    name: entry.name,
    reasoning: entry.reasoningLevels,
    isAvailable: entry.isAvailable,
  }));
}

export function resolveRunnerSdkAndModelIds({
  runner,
  sdkName,
  modelName,
}: {
  runner: RunnerLike;
  sdkName?: string;
  modelName?: string;
}) {
  const normalizedSdk = normalizeAgentSdkValue(sdkName);
  const normalizedModel = String(modelName || "").trim();
  if (!normalizedSdk || !normalizedModel) {
    return {
      agentRunnerSdkId: "",
      defaultModelId: "",
    };
  }

  const availableAgentSdks = normalizeRunnerAvailableAgentSdks(runner);
  const selectedSdk = availableAgentSdks.find((sdkEntry) => sdkEntry.name === normalizedSdk) || null;
  if (!selectedSdk || !selectedSdk.isAvailable) {
    return {
      agentRunnerSdkId: "",
      defaultModelId: "",
    };
  }

  const selectedModel = selectedSdk.availableModels.find((modelEntry) => modelEntry.name === normalizedModel) || null;
  return {
    agentRunnerSdkId: resolveLegacyId(selectedSdk.id),
    defaultModelId: selectedModel?.isAvailable ? resolveLegacyId(selectedModel.id) : "",
  };
}

export function mergeAgentRunnerPayloadEntry(
  currentRunner: Record<string, unknown> | null | undefined,
  incomingRunner: Record<string, unknown> | null | undefined,
) {
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

export function mergeAgentRunnerPayloadList(
  currentRunners: Array<Record<string, unknown>> | null | undefined,
  incomingRunners: Array<Record<string, unknown>> | null | undefined,
) {
  if (!Array.isArray(incomingRunners)) {
    return Array.isArray(currentRunners) ? currentRunners : [];
  }

  const nextById = new Map(
    (Array.isArray(currentRunners) ? currentRunners : []).map((runner) => [String(runner?.id || ""), runner]),
  );

  for (const incomingRunner of incomingRunners) {
    const incomingId = String(incomingRunner?.id || "");
    const currentRunner = incomingId ? nextById.get(incomingId) : null;
    const mergedRunner = mergeAgentRunnerPayloadEntry(currentRunner, incomingRunner);
    if (incomingId) {
      nextById.set(incomingId, mergedRunner);
    }
  }

  return [...nextById.values()];
}

export function replaceAgentRunnerPayloadList(
  currentRunners: Array<Record<string, unknown>> | null | undefined,
  incomingRunners: Array<Record<string, unknown>> | null | undefined,
) {
  if (!Array.isArray(incomingRunners)) {
    return Array.isArray(currentRunners) ? currentRunners : [];
  }

  const currentById = new Map(
    (Array.isArray(currentRunners) ? currentRunners : []).map((runner) => [String(runner?.id || ""), runner]),
  );

  return incomingRunners.map((incomingRunner) => {
    const incomingId = String(incomingRunner?.id || "");
    const currentRunner = incomingId ? currentById.get(incomingId) : null;
    return mergeAgentRunnerPayloadEntry(currentRunner, incomingRunner);
  });
}

export function getRunnerModelNames(codexModelEntries: RunnerCodexModelEntry[]) {
  return codexModelEntries
    .filter((entry) => entry.isAvailable)
    .map((entry) => entry.name);
}

export function getRunnerReasoningLevels(codexModelEntries: RunnerCodexModelEntry[], modelName: string) {
  const normalizedModel = String(modelName || "").trim();
  if (!normalizedModel) {
    return [];
  }
  const matchedEntry = codexModelEntries.find((entry) => entry.name === normalizedModel);
  return matchedEntry?.isAvailable ? matchedEntry.reasoning : [];
}

export function getRunnerCodexModelEntriesForRunner(
  codexModelEntriesByRunnerId: Map<string, RunnerCodexModelEntry[]>,
  runnerId: string,
) {
  if (!runnerId) {
    return [];
  }
  return codexModelEntriesByRunnerId.get(runnerId) || [];
}

export function resolveRunnerBackedModelSelection({
  codexModelEntries,
  requestedModel,
  requestedReasoning,
}: {
  codexModelEntries: RunnerCodexModelEntry[];
  requestedModel?: string;
  requestedReasoning?: string;
}) {
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
