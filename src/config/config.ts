import { getDevelopmentConfig } from "./development.ts";
import { getProductionConfig } from "./production.ts";
import { runtimeConfigSchema } from "./schema.ts";

const LOCAL_HOSTNAMES = new Set(["localhost", "127.0.0.1", "::1", "0.0.0.0"]);

let cachedConfig;

function getWindowRuntimeConfig() {
  if (typeof window === "undefined") {
    return null;
  }
  const config = window.__COMPANYHELM_CONFIG__;
  if (!config) {
    return null;
  }
  return runtimeConfigSchema.parse(config);
}

function isProductionHost() {
  if (typeof window === "undefined") {
    return false;
  }
  const hostname = String(window.location?.hostname || "").trim().toLowerCase();
  if (!hostname) {
    return false;
  }
  return !LOCAL_HOSTNAMES.has(hostname);
}

export function loadConfig() {
  const runtimeConfig = getWindowRuntimeConfig();
  if (runtimeConfig) {
    return runtimeConfig;
  }

  if (isProductionHost()) {
    return getProductionConfig();
  }

  return getDevelopmentConfig();
}

export function getConfig() {
  if (!cachedConfig) {
    cachedConfig = loadConfig();
  }
  return cachedConfig;
}

export function clearConfigCache() {
  cachedConfig = undefined;
}
