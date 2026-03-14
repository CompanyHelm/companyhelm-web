import { AVAILABLE_AGENT_SDKS, DEFAULT_AGENT_SDK } from "./constants.ts";

type LooseRecord = Record<string, unknown>;
type RunnerModelEntry = {
  id: string;
  name: string;
  reasoningLevels: string[];
  isAvailable: boolean;
};

type RunnerSdkEntry = {
  id: string;
  name: string;
  status?: string;
  isAvailable: boolean;
  codexAuthStatus?: string | null;
  codexAuthType?: string | null;
  errorMessage?: string | null;
  availableModels: RunnerModelEntry[];
};

type RunnerLike = {
  availableAgentSdks?: unknown;
  agentSdks?: unknown;
  [key: string]: unknown;
};

const companyApiRunnerMetadataById = new Map<string, LooseRecord>();
const companyApiAgentMetadataById = new Map<string, LooseRecord>();
const companyApiThreadMetadataById = new Map<string, LooseRecord>();

function toRecord(value: unknown): LooseRecord {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  return value as LooseRecord;
}

function normalizeAvailabilityFlag(...values: unknown[]): boolean {
  for (const value of values) {
    if (typeof value === "boolean") {
      return value;
    }
  }
  return true;
}

function normalizeAgentSdkValue(value: unknown): string {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function isAvailableAgentSdk(value: unknown): boolean {
  return AVAILABLE_AGENT_SDKS.includes(normalizeAgentSdkValue(value));
}

function normalizeUniqueStringList(values: unknown): string[] {
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

function normalizeOptionalInstructions(value: unknown): string | null {
  if (value === undefined || value === null) {
    return null;
  }
  const normalizedValue = String(value).trim();
  return normalizedValue || null;
}

function toLegacyAgentHeartbeatPayload(heartbeat: unknown) {
  const heartbeatRecord = toRecord(heartbeat);
  const threadRecord = toRecord(heartbeatRecord.thread);

  return {
    id: resolveLegacyId(heartbeatRecord.id),
    name: String(heartbeatRecord.name || "").trim(),
    prompt: String(heartbeatRecord.prompt || "").trim(),
    enabled: heartbeatRecord.enabled !== false,
    intervalSeconds: Number(heartbeatRecord.intervalSeconds || 0),
    nextHeartbeatAt: typeof heartbeatRecord.nextHeartbeatAt === "string"
      ? heartbeatRecord.nextHeartbeatAt
      : null,
    lastSentAt: typeof heartbeatRecord.lastSentAt === "string"
      ? heartbeatRecord.lastSentAt
      : null,
    threadId: resolveLegacyId(heartbeatRecord.threadId, threadRecord.id) || null,
  };
}

function normalizeRunnerAvailableAgentSdks(runner: RunnerLike): RunnerSdkEntry[] {
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

export function normalizeCompanyApiRunnerConnectivity(value: unknown): boolean {
  return value === true;
}

export function resolveLegacyId(...values: unknown[]): string {
  for (const value of values) {
    const resolved = String(value || "").trim();
    if (resolved) {
      return resolved;
    }
  }
  return "";
}

export function toConnectionNodes(connection: unknown): unknown[] {
  const connectionRecord = toRecord(connection);
  const edges = connectionRecord.edges;
  if (!Array.isArray(edges)) {
    return [];
  }
  return edges
    .map((edge) => toRecord(edge).node)
    .filter(Boolean);
}

export function toLegacyRunnerPayload(agentRunner: LooseRecord | null | undefined) {
  const runnerRecord = toRecord(agentRunner);
  const runnerId = resolveLegacyId(runnerRecord.id);
  const runnerName = resolveLegacyId(runnerRecord.name);
  const nowIso = new Date().toISOString();
  const currentMetadata: LooseRecord = companyApiRunnerMetadataById.get(runnerId) || {};
  const isConnected = normalizeCompanyApiRunnerConnectivity(runnerRecord.isConnected);
  const availableAgentSdks = normalizeRunnerAvailableAgentSdks(runnerRecord);
  const lastSeenAt = resolveLegacyId(runnerRecord.lastSeenAt, currentMetadata.lastSeenAt) || null;
  const lastHealthCheckAt = resolveLegacyId(
    runnerRecord.lastHealthCheckAt,
    runnerRecord.lastSeenAt,
    currentMetadata.lastHealthCheckAt,
    currentMetadata.lastSeenAt,
  ) || null;

  const nextMetadata: LooseRecord = {
    name: runnerName || resolveLegacyId(currentMetadata.name) || "",
    createdAt: resolveLegacyId(runnerRecord.createdAt, currentMetadata.createdAt) || nowIso,
    updatedAt: resolveLegacyId(runnerRecord.updatedAt, currentMetadata.updatedAt) || nowIso,
    lastSeenAt,
    lastHealthCheckAt,
    availableAgentSdks,
  };
  if (runnerId) {
    companyApiRunnerMetadataById.set(runnerId, nextMetadata);
  }

  const companyRecord = toRecord(runnerRecord.company);

  return {
    id: runnerId,
    companyId: resolveLegacyId(companyRecord.id),
    name: nextMetadata.name,
    callbackUrl: null,
    hasAuthSecret: true,
    availableAgentSdks,
    isConnected,
    status: "",
    lastHealthCheckAt: nextMetadata.lastHealthCheckAt,
    lastSeenAt: nextMetadata.lastSeenAt,
    createdAt: nextMetadata.createdAt,
    updatedAt: nextMetadata.updatedAt,
  };
}

export function toLegacyAgentPayload(agent: LooseRecord | null | undefined, {
  metadataOverride,
}: {
  metadataOverride?: LooseRecord;
} = {}) {
  const agentRecord = toRecord(agent);
  const agentId = resolveLegacyId(agentRecord.id);
  const currentMetadata: LooseRecord = companyApiAgentMetadataById.get(agentId) || {};
  const overrideProvidesDefaultAdditionalModelInstructions = Boolean(
    metadataOverride
      && Object.prototype.hasOwnProperty.call(metadataOverride, "defaultAdditionalModelInstructions"),
  );
  const agentProvidesDefaultAdditionalModelInstructions = Boolean(
    agentRecord && Object.prototype.hasOwnProperty.call(agentRecord, "defaultAdditionalModelInstructions"),
  );
  const explicitDefaultAdditionalModelInstructions = overrideProvidesDefaultAdditionalModelInstructions
    ? metadataOverride?.defaultAdditionalModelInstructions
    : agentProvidesDefaultAdditionalModelInstructions
      ? agentRecord.defaultAdditionalModelInstructions
      : undefined;
  const resolvedDefaultAdditionalModelInstructions =
    explicitDefaultAdditionalModelInstructions === undefined
      ? normalizeOptionalInstructions(currentMetadata.defaultAdditionalModelInstructions)
      : normalizeOptionalInstructions(explicitDefaultAdditionalModelInstructions);
  const nextMetadata: LooseRecord = {
    ...currentMetadata,
    ...(metadataOverride || {}),
    defaultAdditionalModelInstructions: resolvedDefaultAdditionalModelInstructions,
  };
  if (agentId) {
    companyApiAgentMetadataById.set(agentId, nextMetadata);
  }

  const resolvedSdk = isAvailableAgentSdk(nextMetadata.agentSdk)
    ? normalizeAgentSdkValue(nextMetadata.agentSdk)
    : DEFAULT_AGENT_SDK;
  const resolvedModel = resolveLegacyId(nextMetadata.model, agentRecord.model);
  const resolvedReasoning = resolveLegacyId(
    nextMetadata.modelReasoningLevel,
    agentRecord.modelReasoningLevel,
  );
  const companyRecord = toRecord(agentRecord.company);
  const runnerRecord = toRecord(agentRecord.runner);

  return {
    id: agentId,
    companyId: resolveLegacyId(companyRecord.id),
    name: resolveLegacyId(nextMetadata.name, agentRecord.name),
    status: resolveLegacyId(agentRecord.status) || "pending",
    agentRunnerId: resolveLegacyId(
      nextMetadata.agentRunnerId,
      runnerRecord.id,
    ),
    skillIds: normalizeUniqueStringList(nextMetadata.skillIds || []),
    mcpServerIds: normalizeUniqueStringList(nextMetadata.mcpServerIds || []),
    installedSkills: Array.isArray(nextMetadata.installedSkills) ? nextMetadata.installedSkills : [],
    agentSdk: resolvedSdk,
    model: resolvedModel,
    modelReasoningLevel: resolvedReasoning,
    defaultAdditionalModelInstructions: resolvedDefaultAdditionalModelInstructions,
    heartbeats: Array.isArray(agentRecord.heartbeats)
      ? agentRecord.heartbeats.map((heartbeat) => toLegacyAgentHeartbeatPayload(heartbeat))
      : [],
  };
}

export function toLegacyThreadPayload(thread: LooseRecord | null | undefined, {
  metadataOverride,
}: {
  metadataOverride?: LooseRecord;
} = {}) {
  const threadRecord = toRecord(thread);
  const threadId = resolveLegacyId(threadRecord.id);
  const nowIso = new Date().toISOString();
  const currentMetadata: LooseRecord = companyApiThreadMetadataById.get(threadId) || {};
  const overrideRecord = toRecord(metadataOverride);
  const threadCurrentModelRecord = toRecord(threadRecord.currentModel);

  const resolvedCurrentModelId = resolveLegacyId(
    overrideRecord.currentModelId,
    toRecord(overrideRecord.currentModel).id,
    threadCurrentModelRecord.id,
    currentMetadata.currentModelId,
  ) || null;
  const resolvedCurrentModelName = resolveLegacyId(
    overrideRecord.currentModelName,
    toRecord(overrideRecord.currentModel).name,
    threadRecord.currentModelName,
    threadCurrentModelRecord.name,
    currentMetadata.currentModelName,
  ) || null;
  const resolvedCurrentReasoningLevel = resolveLegacyId(
    overrideRecord.currentReasoningLevel,
    threadRecord.currentReasoningLevel,
    currentMetadata.currentReasoningLevel,
  ) || null;
  const overrideProvidesTitle = Boolean(
    metadataOverride && Object.prototype.hasOwnProperty.call(metadataOverride, "title"),
  );
  const threadProvidesTitle = Boolean(threadRecord && Object.prototype.hasOwnProperty.call(threadRecord, "title"));
  const explicitTitleValue = overrideProvidesTitle
    ? metadataOverride?.title
    : threadProvidesTitle
      ? threadRecord.title
      : undefined;
  const normalizedExplicitTitle = typeof explicitTitleValue === "string" ? explicitTitleValue.trim() : "";
  const fallbackTitle = explicitTitleValue === undefined ? resolveLegacyId(currentMetadata.title) : "";
  const resolvedTitle = normalizedExplicitTitle || fallbackTitle;
  const overrideProvidesAdditionalModelInstructions = Boolean(
    metadataOverride && Object.prototype.hasOwnProperty.call(metadataOverride, "additionalModelInstructions"),
  );
  const threadProvidesAdditionalModelInstructions = Boolean(
    threadRecord && Object.prototype.hasOwnProperty.call(threadRecord, "additionalModelInstructions"),
  );
  const explicitAdditionalModelInstructions = overrideProvidesAdditionalModelInstructions
    ? metadataOverride?.additionalModelInstructions
    : threadProvidesAdditionalModelInstructions
      ? threadRecord.additionalModelInstructions
      : undefined;
  const resolvedAdditionalModelInstructions =
    explicitAdditionalModelInstructions === undefined
      ? normalizeOptionalInstructions(currentMetadata.additionalModelInstructions)
      : normalizeOptionalInstructions(explicitAdditionalModelInstructions);
  const overrideProvidesErrorMessage = Boolean(
    metadataOverride && Object.prototype.hasOwnProperty.call(metadataOverride, "errorMessage"),
  );
  const threadProvidesErrorMessage = Boolean(
    threadRecord && Object.prototype.hasOwnProperty.call(threadRecord, "errorMessage"),
  );
  const explicitErrorMessage = overrideProvidesErrorMessage
    ? metadataOverride?.errorMessage
    : threadProvidesErrorMessage
      ? threadRecord.errorMessage
      : undefined;
  const resolvedErrorMessage =
    explicitErrorMessage === undefined
      ? normalizeOptionalInstructions(currentMetadata.errorMessage)
      : normalizeOptionalInstructions(explicitErrorMessage);
  const nextMetadata: LooseRecord = {
    createdAt: resolveLegacyId(currentMetadata.createdAt) || nowIso,
    updatedAt: nowIso,
    title: resolvedTitle,
    status: resolveLegacyId(
      overrideRecord.status,
      threadRecord.status,
      currentMetadata.status,
    ),
    runnerId: resolveLegacyId(overrideRecord.runnerId, currentMetadata.runnerId) || null,
    currentModelId: resolvedCurrentModelId,
    currentModelName: resolvedCurrentModelName,
    currentReasoningLevel: resolvedCurrentReasoningLevel,
    additionalModelInstructions: resolvedAdditionalModelInstructions,
    errorMessage: resolvedErrorMessage,
  };
  if (threadId) {
    companyApiThreadMetadataById.set(threadId, nextMetadata);
  }

  return {
    id: threadId,
    threadId,
    companyId: resolveLegacyId(toRecord(threadRecord.company).id),
    agentId: resolveLegacyId(toRecord(threadRecord.agent).id),
    runnerId: nextMetadata.runnerId,
    title: nextMetadata.title,
    status: nextMetadata.status,
    errorMessage: nextMetadata.errorMessage,
    currentModelId: nextMetadata.currentModelId,
    currentModelName: nextMetadata.currentModelName,
    currentReasoningLevel: nextMetadata.currentReasoningLevel,
    additionalModelInstructions: nextMetadata.additionalModelInstructions,
    createdAt: nextMetadata.createdAt,
    updatedAt: nextMetadata.updatedAt,
  };
}

export function toLegacyTurnItemRole(itemType: unknown) {
  const normalizedType = String(itemType || "").trim().toLowerCase();
  if (normalizedType === "user_message") {
    return "user";
  }
  if (normalizedType === "agent_message") {
    return "assistant";
  }
  return "system";
}

export function toLegacyTurnPayload(turn: LooseRecord | null | undefined, {
  runnerId,
}: {
  runnerId?: string;
} = {}) {
  const turnRecord = toRecord(turn);
  const resolvedTurnId = resolveLegacyId(turnRecord.id);
  const resolvedThreadId = resolveLegacyId(toRecord(turnRecord.thread).id);
  const resolvedCompanyId = resolveLegacyId(toRecord(turnRecord.company).id);
  const resolvedAgentId = resolveLegacyId(toRecord(turnRecord.agent).id);
  const resolvedRunnerId = resolveLegacyId(runnerId) || null;
  const resolvedStartedAt = resolveLegacyId(turnRecord.startedAt) || null;
  const resolvedEndedAt = resolveLegacyId(turnRecord.endedAt) || null;
  const fallbackTimestamp = resolvedStartedAt || resolvedEndedAt || new Date().toISOString();

  const items = (Array.isArray(turnRecord.items) ? turnRecord.items : []).map((item) => {
    const itemRecord = toRecord(item);
    const resolvedItemType = resolveLegacyId(itemRecord.type) || "unknown";
    const itemStartedAt = resolveLegacyId(itemRecord.startedAt) || null;
    const itemEndedAt = resolveLegacyId(itemRecord.completedAt) || null;
    const itemTimestamp = itemStartedAt || itemEndedAt || fallbackTimestamp;
    const itemTurnRecord = toRecord(itemRecord.turn);
    const itemCompanyRecord = toRecord(itemRecord.company);

    return {
      id: resolveLegacyId(itemRecord.id),
      turnId: resolveLegacyId(itemTurnRecord.id, resolvedTurnId),
      threadId: resolveLegacyId(toRecord(itemTurnRecord.thread).id, resolvedThreadId),
      companyId: resolveLegacyId(itemCompanyRecord.id, resolvedCompanyId),
      agentId: resolvedAgentId,
      runnerId: resolvedRunnerId,
      providerItemId: resolveLegacyId(itemRecord.sdkItemId),
      role: toLegacyTurnItemRole(resolvedItemType),
      itemType: resolvedItemType,
      text: resolveLegacyId(itemRecord.text),
      command: resolveLegacyId(itemRecord.commandOutput),
      output: resolveLegacyId(itemRecord.consoleOutput),
      status: resolveLegacyId(itemRecord.status) || "running",
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
    status: resolveLegacyId(turnRecord.status) || "running",
    reasoningText: resolveLegacyId(turnRecord.reasoningText),
    startedAt: resolvedStartedAt,
    endedAt: resolvedEndedAt,
    createdAt: fallbackTimestamp,
    updatedAt: resolvedEndedAt || resolvedStartedAt || fallbackTimestamp,
    items,
  };
}

export function toLegacyQueuedUserMessagePayload(queuedMessage: LooseRecord | null | undefined) {
  const queuedMessageRecord = toRecord(queuedMessage);
  const normalizedStatus = String(queuedMessageRecord.status || "").trim().toLowerCase();
  const errorMessage = resolveLegacyId(queuedMessageRecord.errorMessage) || null;
  return {
    id: resolveLegacyId(queuedMessageRecord.id),
    companyId: resolveLegacyId(toRecord(queuedMessageRecord.company).id),
    threadId: resolveLegacyId(toRecord(queuedMessageRecord.thread).id),
    status:
      normalizedStatus === "processed"
        ? "processed"
        : normalizedStatus === "submitted"
          ? "submitted"
          : normalizedStatus === "failed"
            ? "failed"
          : "queued",
    errorMessage,
    sdkTurnId: resolveLegacyId(queuedMessageRecord.sdkTurnId) || null,
    allowSteer: Boolean(queuedMessageRecord.allowSteer),
    text: resolveLegacyId(queuedMessageRecord.text),
  };
}
