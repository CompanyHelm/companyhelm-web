import {
  SELECTED_COMPANY_STORAGE_KEY,
  TASK_TABLE_COLUMNS_STORAGE_KEY,
  FLAGS_STORAGE_KEY,
  ONBOARDING_STORAGE_KEY,
} from "./constants.ts";

export interface AppFlags {
  skipOnboarding: boolean;
  showChatContextUsage: boolean;
  showExternalAgents: boolean;
}

const DEFAULT_FLAGS: AppFlags = {
  skipOnboarding: false,
  showChatContextUsage: false,
  showExternalAgents: false,
};

export function getPersistedFlags(): AppFlags {
  try {
    const stored = window.localStorage.getItem(FLAGS_STORAGE_KEY);
    if (!stored) {
      return { ...DEFAULT_FLAGS };
    }
    const parsed = JSON.parse(stored);
    return { ...DEFAULT_FLAGS, ...parsed };
  } catch {
    return { ...DEFAULT_FLAGS };
  }
}

export function persistFlags(flags: Partial<AppFlags>) {
  try {
    const current = getPersistedFlags();
    const next = { ...current, ...flags };
    window.localStorage.setItem(FLAGS_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Ignore local storage write failures.
  }
}

export type OnboardingPhase = "runner" | "configuring" | "agent" | "github" | "done" | null;

export interface OnboardingState {
  phase: OnboardingPhase;
  runnerSecret: string;
  runnerId: string;
}

const DEFAULT_ONBOARDING: OnboardingState = {
  phase: null,
  runnerSecret: "",
  runnerId: "",
};

function normalizeOnboardingPhase(value: unknown): OnboardingPhase {
  if (value === "runner" || value === "configuring" || value === "agent" || value === "github" || value === "done") {
    return value;
  }
  return null;
}

export function getPersistedOnboarding(): OnboardingState {
  try {
    const stored = window.localStorage.getItem(ONBOARDING_STORAGE_KEY);
    if (!stored) {
      return { ...DEFAULT_ONBOARDING };
    }
    const parsed = JSON.parse(stored);
    return {
      ...DEFAULT_ONBOARDING,
      ...parsed,
      phase: normalizeOnboardingPhase(parsed?.phase),
    };
  } catch {
    return { ...DEFAULT_ONBOARDING };
  }
}

export function persistOnboarding(state: Partial<OnboardingState>) {
  try {
    const current = getPersistedOnboarding();
    const next = { ...current, ...state };
    window.localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Ignore local storage write failures.
  }
}

export function clearPersistedOnboarding() {
  try {
    window.localStorage.removeItem(ONBOARDING_STORAGE_KEY);
  } catch {
    // Ignore local storage write failures.
  }
}

export function getPersistedCompanyId() {
  try {
    return window.localStorage.getItem(SELECTED_COMPANY_STORAGE_KEY) || "";
  } catch {
    return "";
  }
}

export function persistCompanyId(companyId: any) {
  try {
    if (!companyId) {
      window.localStorage.removeItem(SELECTED_COMPANY_STORAGE_KEY);
      return;
    }
    window.localStorage.setItem(SELECTED_COMPANY_STORAGE_KEY, companyId);
  } catch {
    // Ignore local storage write failures.
  }
}

export function getPersistedTaskTableColumnIds(allowedIds: string[], defaultIds: string[]) {
  const allowedIdSet = new Set(
    (Array.isArray(allowedIds) ? allowedIds : [])
      .map((value) => String(value || "").trim())
      .filter(Boolean),
  );
  const normalizedDefaultIds = (Array.isArray(defaultIds) ? defaultIds : [])
    .map((value) => String(value || "").trim())
    .filter((value, index, values) => value && allowedIdSet.has(value) && values.indexOf(value) === index);

  try {
    const storedValue = window.localStorage.getItem(TASK_TABLE_COLUMNS_STORAGE_KEY);
    if (storedValue === null) {
      return normalizedDefaultIds;
    }
    const parsedValue = JSON.parse(storedValue);
    if (!Array.isArray(parsedValue)) {
      return normalizedDefaultIds;
    }
    const normalizedStoredIds = parsedValue
      .map((value) => String(value || "").trim())
      .filter((value, index, values) => value && allowedIdSet.has(value) && values.indexOf(value) === index);

    if (parsedValue.length > 0 && normalizedStoredIds.length === 0) {
      return normalizedDefaultIds;
    }
    return normalizedStoredIds;
  } catch {
    return normalizedDefaultIds;
  }
}

export function persistTaskTableColumnIds(columnIds: string[]) {
  try {
    const normalizedIds = (Array.isArray(columnIds) ? columnIds : [])
      .map((value) => String(value || "").trim())
      .filter((value, index, values) => value && values.indexOf(value) === index);
    window.localStorage.setItem(TASK_TABLE_COLUMNS_STORAGE_KEY, JSON.stringify(normalizedIds));
  } catch {
    // Ignore local storage write failures.
  }
}
