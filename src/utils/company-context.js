function normalizeCompanyId(value) {
  return String(value || "").trim();
}

let activeCompanyId = "";

export function setActiveCompanyId(companyId) {
  activeCompanyId = normalizeCompanyId(companyId);
  return activeCompanyId;
}

export function getActiveCompanyId() {
  return activeCompanyId;
}
