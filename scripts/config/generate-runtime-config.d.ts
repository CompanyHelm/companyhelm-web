import type { RuntimeConfig } from "../../src/config/schema.ts";

export type RuntimeEnvironment = "local" | "dev" | "prod";

export interface GenerateRuntimeConfigInput {
  repoRoot: string;
  environment: RuntimeEnvironment;
}

export interface GenerateRuntimeConfigResult {
  environment: RuntimeEnvironment;
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

export function normalizeEnvironment(environment: unknown): RuntimeEnvironment;
export function parseEnvironmentFromArgs(argv: readonly string[]): RuntimeEnvironment;
export function resolveEnvironmentConfigPath(repoRoot: string, environment: RuntimeEnvironment): string;
export function resolveGeneratedConfigPath(repoRoot: string): string;
export function generateRuntimeConfig(input: GenerateRuntimeConfigInput): GenerateRuntimeConfigResult;
export function run(argv: readonly string[], options?: RunOptions): void;
