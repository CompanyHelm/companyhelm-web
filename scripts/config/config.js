import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parse } from "yaml";
import { frontendConfigSchema } from "./schema.js";

let cachedConfig;
let cachedEnvironment;
const DEFAULT_ENVIRONMENT = "local";

export function normalizeEnvironment(environment) {
  const normalizedEnvironment = String(environment || "").trim();
  if (!normalizedEnvironment) {
    throw new Error("Environment value cannot be empty.");
  }
  if (
    normalizedEnvironment.includes("/") ||
    normalizedEnvironment.includes("\\") ||
    normalizedEnvironment.includes("..")
  ) {
    throw new Error(`Invalid environment value "${environment}".`);
  }

  return normalizedEnvironment;
}

function resolveConfigPath(environment) {
  const configPath = resolve(process.cwd(), "config", `${environment}.yaml`);
  if (!existsSync(configPath)) {
    throw new Error(
      `No config file found for environment "${environment}". Expected file: ${configPath}`
    );
  }

  return configPath;
}

export function loadConfig(environment) {
  const resolvedEnvironment = normalizeEnvironment(environment);
  const configPath = resolveConfigPath(resolvedEnvironment);
  const rawConfig = readFileSync(configPath, "utf8");
  const parsedConfig = parse(rawConfig);

  return frontendConfigSchema.parse(parsedConfig);
}

export function resolveConfigEnvironment(environment) {
  const rawEnvironment = environment ?? process.env.APP_ENV ?? DEFAULT_ENVIRONMENT;
  const normalizedEnvironment = String(rawEnvironment).trim();
  if (!normalizedEnvironment) {
    return DEFAULT_ENVIRONMENT;
  }
  return normalizeEnvironment(normalizedEnvironment);
}

export function getConfig(environment) {
  const resolvedEnvironment = resolveConfigEnvironment(environment);
  if (!cachedConfig || cachedEnvironment !== resolvedEnvironment) {
    cachedConfig = loadConfig(resolvedEnvironment);
    cachedEnvironment = resolvedEnvironment;
  }
  return cachedConfig;
}

export function clearConfigCache() {
  cachedConfig = undefined;
  cachedEnvironment = undefined;
}
