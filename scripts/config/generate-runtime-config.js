import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { parse as parseYaml } from "yaml";
import { runtimeConfigSchema } from "../../src/config/schema.ts";

const ALLOWED_ENVIRONMENTS = new Set(["local", "dev", "prod"]);
const ENV_PLACEHOLDER_PATTERN = /\$\{([A-Z0-9_]+)\}/g;

export function normalizeEnvironment(environment) {
  const normalized = String(environment || "").trim().toLowerCase();
  if (!normalized) {
    throw new Error("Missing required --environment <local|dev|prod> argument.");
  }
  if (!ALLOWED_ENVIRONMENTS.has(normalized)) {
    throw new Error(
      `Invalid --environment "${environment}". Expected one of: ${Array.from(ALLOWED_ENVIRONMENTS).join(", ")}.`
    );
  }
  return normalized;
}

export function parseEnvironmentFromArgs(argv) {
  let environment;
  for (let index = 0; index < argv.length; index += 1) {
    const argument = String(argv[index] || "").trim();
    if (!argument) {
      continue;
    }
    if (argument === "--environment") {
      environment = argv[index + 1];
      index += 1;
      continue;
    }
    if (argument.startsWith("--environment=")) {
      environment = argument.slice("--environment=".length);
    }
  }
  return normalizeEnvironment(environment);
}

export function resolveEnvironmentConfigPath(repoRoot, environment) {
  return resolve(repoRoot, "config", `${normalizeEnvironment(environment)}.yaml`);
}

export function resolveGeneratedConfigPath(repoRoot) {
  return resolve(repoRoot, "src", "generated", "config.js");
}

export function resolveConfigPlaceholders(value, path = "") {
  if (typeof value === "string") {
    const placeholders = [...value.matchAll(ENV_PLACEHOLDER_PATTERN)];
    if (placeholders.length === 0) {
      return value;
    }

    const placeholderPath = path || "<root>";
    return value.replace(ENV_PLACEHOLDER_PATTERN, (_fullMatch, variableName) => {
      const resolved = process.env[variableName];
      if (!resolved) {
        throw new Error(
          `Environment variable "${variableName}" is required for config value at "${placeholderPath}".`,
        );
      }
      return resolved;
    });
  }

  if (Array.isArray(value)) {
    return value.map((entry, index) => resolveConfigPlaceholders(entry, `${path}[${index}]`));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [
        key,
        resolveConfigPlaceholders(entry, path ? `${path}.${key}` : key),
      ]),
    );
  }

  return value;
}

export function generateRuntimeConfig({ repoRoot, environment }) {
  const sourcePath = resolveEnvironmentConfigPath(repoRoot, environment);
  if (!existsSync(sourcePath)) {
    throw new Error(`Config file not found: ${sourcePath}`);
  }

  const rawYaml = readFileSync(sourcePath, "utf8");
  const parsedConfig = parseYaml(rawYaml);
  const resolvedConfig = resolveConfigPlaceholders(parsedConfig);
  const validatedConfig = runtimeConfigSchema.parse(resolvedConfig);
  const outputPath = resolveGeneratedConfigPath(repoRoot);
  const outputDir = resolve(repoRoot, "src", "generated");
  const generatedModuleSource = [
    "/* This file is auto-generated. Do not edit. */",
    "",
    `export default ${JSON.stringify(validatedConfig, null, 2)};`,
    "",
  ].join("\n");
  mkdirSync(outputDir, { recursive: true });
  writeFileSync(outputPath, generatedModuleSource, "utf8");

  return {
    environment: normalizeEnvironment(environment),
    sourcePath,
    outputPath,
    config: validatedConfig,
  };
}

export function run(argv, { repoRoot = process.cwd(), logger = console } = {}) {
  const environment = parseEnvironmentFromArgs(argv);
  const result = generateRuntimeConfig({ repoRoot, environment });
  logger.log(
    `Generated runtime config for environment "${result.environment}" from ${result.sourcePath} -> ${result.outputPath}`
  );
}

const isMainModule = process.argv[1]
  ? import.meta.url === pathToFileURL(process.argv[1]).href
  : false;

if (isMainModule) {
  try {
    run(process.argv.slice(2));
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
