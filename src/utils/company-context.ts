function normalizeCompanyId(value: any) {
  return String(value || "").trim();
}

const COMPANY_STORAGE_KEY = "companyhelm.selectedCompanyId";

function resolveInitialCompanyId() {
  if (typeof window === "undefined" || !window?.localStorage) {
    return "";
  }
  try {
    return normalizeCompanyId(window.localStorage.getItem(COMPANY_STORAGE_KEY));
  } catch {
    return "";
  }
}

let activeCompanyId = resolveInitialCompanyId();

export function setActiveCompanyId(companyId: any) {
  activeCompanyId = normalizeCompanyId(companyId);
  return activeCompanyId;
}

export function getActiveCompanyId() {
  return activeCompanyId;
}
