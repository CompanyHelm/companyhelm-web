import { DEFAULT_AGENT_SDK } from "./constants.ts";
import { isRunnerReadyAndConnected } from "./formatting.ts";
import {
  getRunnerCodexModelEntriesForRunner,
  getRunnerModelNames,
  getRunnerReasoningLevels,
  isAvailableAgentSdk,
  normalizeAgentSdkValue,
  normalizeOptionalInstructions,
  normalizeRunnerAvailableAgentSdks,
  resolveRunnerSdkAndModelIds,
  resolveRunnerBackedModelSelection,
} from "./normalization.ts";
import type { AgentRunner, RunnerCodexModelEntriesById } from "../types/domain.ts";

export interface CreatedAgentSummary {
  id: string;
  name: string;
}

interface AgentCreationFormStatusInput {
  agentRunners: AgentRunner[];
  runnerCodexModelEntriesById: RunnerCodexModelEntriesById;
  agentName: string;
  agentRunnerId: string;
  agentSdk: string;
  agentModel: string;
  agentModelReasoningLevel: string;
  allowEmptyReasoningWhenUnavailable?: boolean;
}

export interface AgentCreationFormStatus {
  canSubmit: boolean;
  selectedRunner: AgentRunner | null;
  selectedRunnerIsReady: boolean;
  selectedSdkIsAvailable: boolean;
  selectedModelIsAvailable: boolean;
  selectedReasoningLevelIsAvailable: boolean;
}

export function getAgentCreationFormStatus({
  agentRunners,
  runnerCodexModelEntriesById,
  agentName,
  agentRunnerId,
  agentSdk,
  agentModel,
  agentModelReasoningLevel,
  allowEmptyReasoningWhenUnavailable = false,
}: AgentCreationFormStatusInput): AgentCreationFormStatus {
  const normalizedRunnerId = String(agentRunnerId || "").trim();
  const normalizedAgentName = String(agentName || "").trim();
  const normalizedSdk = normalizeAgentSdkValue(agentSdk);
  const normalizedModel = String(agentModel || "").trim();
  const normalizedReasoningLevel = String(agentModelReasoningLevel || "").trim();
  const selectedRunner = agentRunners.find((runner) => String(runner?.id || "").trim() === normalizedRunnerId) || null;
  const selectedRunnerIsReady = selectedRunner ? isRunnerReadyAndConnected(selectedRunner) : false;

  const selectedSdkEntry = selectedRunner
    ? normalizeRunnerAvailableAgentSdks(selectedRunner).find((sdkEntry) => sdkEntry.name === normalizedSdk) || null
    : null;
  const selectedSdkIsAvailable = Boolean(
    selectedSdkEntry
    && selectedSdkEntry.isAvailable
    && String(selectedSdkEntry.status || "").trim().toLowerCase() === "ready",
  );

  const runnerCodexModelEntries = getRunnerCodexModelEntriesForRunner(runnerCodexModelEntriesById, normalizedRunnerId);
  const selectedModelEntry = runnerCodexModelEntries.find((modelEntry) => modelEntry.name === normalizedModel) || null;
  const selectedModelIsAvailable = Boolean(selectedModelEntry?.isAvailable);
  const availableReasoningLevels = getRunnerReasoningLevels(
    runnerCodexModelEntries,
    normalizedModel,
  );
  const selectedReasoningLevelIsAvailable = availableReasoningLevels.includes(normalizedReasoningLevel)
    || Boolean(
      allowEmptyReasoningWhenUnavailable
      && availableReasoningLevels.length === 0
      && !normalizedReasoningLevel,
    );

  return {
    canSubmit: Boolean(
      normalizedAgentName
      && selectedRunnerIsReady
      && selectedSdkIsAvailable
      && selectedModelIsAvailable
      && selectedReasoningLevelIsAvailable,
    ),
    selectedRunner,
    selectedRunnerIsReady,
    selectedSdkIsAvailable,
    selectedModelIsAvailable,
    selectedReasoningLevelIsAvailable,
  };
}

export function resolveAgentRunnerSelectionChange({
  nextRunnerId,
  currentModel,
  currentReasoningLevel,
  runnerCodexModelEntriesById,
}: {
  nextRunnerId: string;
  currentModel: string;
  currentReasoningLevel: string;
  runnerCodexModelEntriesById: RunnerCodexModelEntriesById;
}) {
  const normalizedRunnerId = String(nextRunnerId || "").trim();
  const selectedRunnerCodexModels = getRunnerCodexModelEntriesForRunner(
    runnerCodexModelEntriesById,
    normalizedRunnerId,
  );
  const resolvedSelection = resolveRunnerBackedModelSelection({
    codexModelEntries: selectedRunnerCodexModels,
    requestedModel: currentModel,
    requestedReasoning: currentReasoningLevel,
  });

  return {
    agentRunnerId: normalizedRunnerId,
    agentSdk: DEFAULT_AGENT_SDK,
    agentModel: resolvedSelection.model,
    agentModelReasoningLevel: resolvedSelection.modelReasoningLevel,
  };
}

export function resolveAgentModelSelectionChange({
  agentRunnerId,
  nextModel,
  currentReasoningLevel,
  runnerCodexModelEntriesById,
}: {
  agentRunnerId: string;
  nextModel: string;
  currentReasoningLevel: string;
  runnerCodexModelEntriesById: RunnerCodexModelEntriesById;
}) {
  const selectedRunnerCodexModels = getRunnerCodexModelEntriesForRunner(
    runnerCodexModelEntriesById,
    String(agentRunnerId || "").trim(),
  );
  const resolvedSelection = resolveRunnerBackedModelSelection({
    codexModelEntries: selectedRunnerCodexModels,
    requestedModel: nextModel,
    requestedReasoning: currentReasoningLevel,
  });

  return {
    agentModel: resolvedSelection.model,
    agentModelReasoningLevel: resolvedSelection.modelReasoningLevel,
  };
}

export async function createAgentRecord({
  selectedCompanyId,
  agentRunners,
  agentRunnerLookup,
  runnerCodexModelEntriesById,
  agentRoleIds,
  agentSkillIds,
  agentName,
  agentRunnerId,
  agentSdk,
  agentModel,
  agentModelReasoningLevel,
  allowEmptyReasoningWhenUnavailable = false,
  agentDefaultAdditionalModelInstructions,
  resolveEffectiveMcpServerIds,
  executeCreateAgent,
}: {
  selectedCompanyId: string;
  agentRunners: AgentRunner[];
  agentRunnerLookup: Map<string, AgentRunner>;
  runnerCodexModelEntriesById: RunnerCodexModelEntriesById;
  agentRoleIds: string[];
  agentSkillIds: string[];
  agentName: string;
  agentRunnerId: string;
  agentSdk: string;
  agentModel: string;
  agentModelReasoningLevel: string;
  allowEmptyReasoningWhenUnavailable?: boolean;
  agentDefaultAdditionalModelInstructions: string;
  resolveEffectiveMcpServerIds: () => string[];
  executeCreateAgent: (variables: Record<string, unknown>) => Promise<any>;
}) {
  const normalizedCompanyId = String(selectedCompanyId || "").trim();
  if (!normalizedCompanyId) {
    throw new Error("Select a company before creating agents.");
  }
  if (agentRunners.length === 0) {
    throw new Error("Register at least one runner before creating an agent.");
  }

  const normalizedAgentName = String(agentName || "").trim();
  if (!normalizedAgentName) {
    throw new Error("Agent name is required.");
  }

  const normalizedRunnerId = String(agentRunnerId || "").trim();
  if (!normalizedRunnerId) {
    throw new Error("Assign a runner before creating an agent.");
  }

  const selectedRunner = agentRunnerLookup.get(normalizedRunnerId);
  if (!selectedRunner) {
    throw new Error(`Assigned runner ${normalizedRunnerId} was not found for this company.`);
  }
  if (!isRunnerReadyAndConnected(selectedRunner)) {
    throw new Error(`Assigned runner ${normalizedRunnerId} must be connected with a configured Codex SDK before creating an agent.`);
  }

  const normalizedSdk = normalizeAgentSdkValue(agentSdk);
  if (!isAvailableAgentSdk(normalizedSdk)) {
    throw new Error(`agentSdk must be one of the supported values.`);
  }

  const selectedRunnerCodexModels = getRunnerCodexModelEntriesForRunner(
    runnerCodexModelEntriesById,
    normalizedRunnerId,
  );
  if (selectedRunnerCodexModels.length === 0) {
    throw new Error(`Runner ${normalizedRunnerId} has not reported any available models yet.`);
  }

  const normalizedModel = String(agentModel || "").trim();
  if (!normalizedModel) {
    throw new Error("Model is required.");
  }
  if (!getRunnerModelNames(selectedRunnerCodexModels).includes(normalizedModel)) {
    throw new Error(
      `Model "${normalizedModel}" is not available on runner ${normalizedRunnerId}. Wait for runner model updates and try again.`,
    );
  }

  const normalizedReasoning = String(agentModelReasoningLevel || "").trim();
  const availableReasoningLevels = getRunnerReasoningLevels(selectedRunnerCodexModels, normalizedModel);
  const canOmitReasoning = allowEmptyReasoningWhenUnavailable
    && availableReasoningLevels.length === 0;
  if (!normalizedReasoning && !canOmitReasoning) {
    throw new Error("Model reasoning level is required.");
  }
  if (normalizedReasoning && !availableReasoningLevels.includes(normalizedReasoning)) {
    throw new Error(
      `Reasoning "${normalizedReasoning}" is not available for model "${normalizedModel}" on runner ${normalizedRunnerId}.`,
    );
  }

  const { agentRunnerSdkId, defaultModelId } = resolveRunnerSdkAndModelIds({
    runner: selectedRunner,
    sdkName: normalizedSdk,
    modelName: normalizedModel,
  });
  if (!agentRunnerSdkId) {
    throw new Error(
      `Runner ${normalizedRunnerId} did not provide SDK metadata for "${normalizedSdk}". Refresh runners and try again.`,
    );
  }
  if (!defaultModelId) {
    throw new Error(
      `Runner ${normalizedRunnerId} did not provide model metadata for "${normalizedModel}". Refresh runners and try again.`,
    );
  }

  const data = await executeCreateAgent({
    companyId: normalizedCompanyId,
    agentRunnerId: normalizedRunnerId || null,
    roleIds: agentRoleIds,
    skillIds: agentSkillIds,
    mcpServerIds: resolveEffectiveMcpServerIds(),
    defaultAdditionalModelInstructions: normalizeOptionalInstructions(agentDefaultAdditionalModelInstructions),
    name: normalizedAgentName,
    agentSdk: normalizedSdk,
    model: normalizedModel,
    modelReasoningLevel: normalizedReasoning,
    agentRunnerSdkId,
    defaultModelId,
    defaultReasoningLevel: normalizedReasoning,
  });

  const result = data?.createAgent;
  if (!result?.ok) {
    throw new Error(result?.error || "Agent creation failed.");
  }

  return {
    createdAgentId: String(result?.agent?.id || "").trim(),
  };
}
