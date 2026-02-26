import { SELECTED_COMPANY_STORAGE_KEY } from "./constants.js";

export function getPersistedCompanyId() {
  try {
    return window.localStorage.getItem(SELECTED_COMPANY_STORAGE_KEY) || "";
  } catch {
    return "";
  }
}

export function persistCompanyId(companyId) {
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
