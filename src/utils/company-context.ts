function normalizeCompanyId(value: any) {
  return String(value || "").trim();
}

let activeCompanyId = "";

export function setActiveCompanyId(companyId: any) {
  activeCompanyId = normalizeCompanyId(companyId);
  return activeCompanyId;
}

export function getActiveCompanyId() {
  return activeCompanyId;
}
