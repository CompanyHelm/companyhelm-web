import type { RuntimeConfig } from "../../src/config/schema.ts";

export interface GenerateRuntimeConfigInput {
  repoRoot?: string;
  configPath?: string;
}

export interface GenerateRuntimeConfigResult {
  sourcePath: string;
  outputPath: string;
  config: RuntimeConfig;
}

export interface RunOptions {
  repoRoot?: string;
  logger?: {
    log: (...args: unknown[]) => void;
  };
}

export function parseCliConfigPathArgument(argv: readonly string[]): string | undefined;
export function resolveConfigPath(input?: {
  repoRoot?: string;
  configPath?: string;
}): string;
export function resolveConfigPlaceholders(value: unknown, path?: string): unknown;
export function resolveGeneratedConfigPath(repoRoot: string): string;
export function generateRuntimeConfig(input: GenerateRuntimeConfigInput): GenerateRuntimeConfigResult;
export function run(argv: readonly string[], options?: RunOptions): void;
