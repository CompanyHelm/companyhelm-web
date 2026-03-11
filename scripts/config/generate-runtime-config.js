import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { isAbsolute, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { parse as parseYaml } from "yaml";
import { runtimeConfigSchema } from "../../src/config/schema.ts";

const ENV_PLACEHOLDER_PATTERN = /\$\{([A-Z0-9_]+)\}/g;

export function parseCliConfigPathArgument(argv) {
  let configPath;

  for (let index = 0; index < argv.length; index += 1) {
    const argument = String(argv[index] || "").trim();
    if (!argument) {
      continue;
    }

    if (argument === "--environment" || argument.startsWith("--environment=")) {
      throw new Error("--environment is no longer supported. Use --config-path instead.");
    }

    if (argument === "--config-path") {
      const value = String(argv[index + 1] || "").trim();
      if (!value || value.startsWith("-")) {
        throw new Error("Missing value for --config-path.");
      }
      configPath = value;
      index += 1;
      continue;
    }

    if (argument.startsWith("--config-path=")) {
      const value = argument.slice("--config-path=".length).trim();
      if (!value) {
        throw new Error("Missing value for --config-path.");
      }
      configPath = value;
    }
  }

  return configPath;
}

export function resolveConfigPath({ repoRoot = process.cwd(), configPath } = {}) {
  const explicitConfigPath = String(configPath || "").trim();
  if (!explicitConfigPath) {
    throw new Error("Missing required --config-path <path> argument.");
  }

  const resolvedPath = isAbsolute(explicitConfigPath)
    ? explicitConfigPath
    : resolve(repoRoot, explicitConfigPath);

  if (!existsSync(resolvedPath)) {
    throw new Error(`Config file not found: ${resolvedPath}`);
  }

  return resolvedPath;
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

export function generateRuntimeConfig({ repoRoot = process.cwd(), configPath } = {}) {
  const sourcePath = resolveConfigPath({ repoRoot, configPath });
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
    sourcePath,
    outputPath,
    config: validatedConfig,
  };
}

export function run(argv, { repoRoot = process.cwd(), logger = console } = {}) {
  const configPath = parseCliConfigPathArgument(argv);
  const result = generateRuntimeConfig({ repoRoot, configPath });
  logger.log(`Generated runtime config from ${result.sourcePath} -> ${result.outputPath}`);
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
