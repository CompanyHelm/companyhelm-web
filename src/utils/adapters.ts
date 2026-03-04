import { AVAILABLE_AGENT_SDKS, DEFAULT_AGENT_SDK } from "./constants.ts";

const companyApiRunnerMetadataById = new Map<any, any>();
const companyApiAgentMetadataById = new Map<any, any>();
const companyApiThreadMetadataById = new Map<any, any>();

function normalizeAgentSdkValue(value: any) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function isAvailableAgentSdk(value: any) {
  return AVAILABLE_AGENT_SDKS.includes(normalizeAgentSdkValue(value));
}

function normalizeUniqueStringList(values: any) {
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

function normalizeOptionalInstructions(value: any) {
  if (value === undefined || value === null) {
    return null;
  }
  const normalizedValue = String(value).trim();
  return normalizedValue || null;
}

function normalizeRunnerAvailableAgentSdks(runner: any) {
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

export function normalizeCompanyApiRunnerStatus(value: any) {
  return String(value || "").trim().toLowerCase() === "connected" ? "ready" : "disconnected";
}

export function resolveLegacyId(...values: any) {
  for (const value of values) {
    const resolved = String(value || "").trim();
    if (resolved) {
      return resolved;
    }
  }
  return "";
}

export function toConnectionNodes(connection: any) {
  if (!connection || !Array.isArray(connection.edges)) {
    return [];
  }
  return connection.edges.map((edge: any) => edge?.node).filter(Boolean);
}

export function toLegacyRunnerPayload(agentRunner: any) {
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

export function toLegacyAgentPayload(agent: any, {
  metadataOverride
}: any = {}) {
  const agentId = resolveLegacyId(agent?.id);
  const currentMetadata = companyApiAgentMetadataById.get(agentId) || {};
  const overrideProvidesDefaultAdditionalModelInstructions = Boolean(
    metadataOverride
      && Object.prototype.hasOwnProperty.call(metadataOverride, "defaultAdditionalModelInstructions"),
  );
  const agentProvidesDefaultAdditionalModelInstructions = Boolean(
    agent && Object.prototype.hasOwnProperty.call(agent, "defaultAdditionalModelInstructions"),
  );
  const explicitDefaultAdditionalModelInstructions = overrideProvidesDefaultAdditionalModelInstructions
    ? metadataOverride.defaultAdditionalModelInstructions
    : agentProvidesDefaultAdditionalModelInstructions
      ? agent.defaultAdditionalModelInstructions
      : undefined;
  const resolvedDefaultAdditionalModelInstructions =
    explicitDefaultAdditionalModelInstructions === undefined
      ? normalizeOptionalInstructions(currentMetadata.defaultAdditionalModelInstructions)
      : normalizeOptionalInstructions(explicitDefaultAdditionalModelInstructions);
  const nextMetadata = {
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
  const resolvedModel = resolveLegacyId(nextMetadata.model, agent?.model);
  const resolvedReasoning = resolveLegacyId(
    nextMetadata.modelReasoningLevel,
    agent?.modelReasoningLevel,
  );

  return {
    id: agentId,
    companyId: resolveLegacyId(agent?.company?.id),
    name: resolveLegacyId(nextMetadata.name, agent?.name),
    status: resolveLegacyId(agent?.status) || "pending",
    agentRunnerId: resolveLegacyId(
      nextMetadata.agentRunnerId,
      agent?.runner?.id,
    ),
    skillIds: normalizeUniqueStringList(nextMetadata.skillIds || []),
    mcpServerIds: normalizeUniqueStringList(nextMetadata.mcpServerIds || []),
    installedSkills: Array.isArray(nextMetadata.installedSkills) ? nextMetadata.installedSkills : [],
    agentSdk: resolvedSdk,
    model: resolvedModel,
    modelReasoningLevel: resolvedReasoning,
    defaultAdditionalModelInstructions: resolvedDefaultAdditionalModelInstructions,
  };
}

export function toLegacyThreadPayload(thread: any, {
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
    createdAt: nextMetadata.createdAt,
    updatedAt: nextMetadata.updatedAt,
  };
}

export function toLegacyTurnItemRole(itemType: any) {
  const normalizedType = String(itemType || "").trim().toLowerCase();
  if (normalizedType === "user_message") {
    return "user";
  }
  if (normalizedType === "agent_message") {
    return "assistant";
  }
  return "system";
}

export function toLegacyTurnPayload(turn: any, {
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

export function toLegacyQueuedUserMessagePayload(queuedMessage: any) {
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
