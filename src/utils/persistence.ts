import {
  SELECTED_COMPANY_STORAGE_KEY,
  TASK_TABLE_COLUMNS_STORAGE_KEY,
} from "./constants.ts";

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
