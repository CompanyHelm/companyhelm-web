import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import test from "node:test";
import {
  generateRuntimeConfig,
  parseEnvironmentFromArgs,
  resolveEnvironmentConfigPath,
  resolveGeneratedConfigPath,
} from "../../scripts/config/generate-runtime-config.js";

test("parseEnvironmentFromArgs accepts '--environment <value>'", () => {
  assert.equal(parseEnvironmentFromArgs(["--environment", "local"]), "local");
});

test("parseEnvironmentFromArgs accepts '--environment=<value>'", () => {
  assert.equal(parseEnvironmentFromArgs(["--environment=dev"]), "dev");
});

test("parseEnvironmentFromArgs rejects missing environment", () => {
  assert.throws(
    () => parseEnvironmentFromArgs([]),
    /Missing required --environment <local\|dev\|prod> argument\./,
  );
});

test("parseEnvironmentFromArgs rejects unsupported environment values", () => {
  assert.throws(
    () => parseEnvironmentFromArgs(["--environment", "staging"]),
    /Invalid --environment "staging"/,
  );
});

test("generateRuntimeConfig validates yaml and writes public/config.json", () => {
  const repoRoot = mkdtempSync(join(tmpdir(), "companyhelm-frontend-config-"));
  try {
    mkdirSync(join(repoRoot, "config"), { recursive: true });
    mkdirSync(join(repoRoot, "public"), { recursive: true });
    writeFileSync(
      join(repoRoot, "config", "local.yaml"),
      [
        "api:",
        "  graphqlApiUrl: \"http://127.0.0.1:4000/graphql\"",
        "  runnerGrpcTarget: \"localhost:50051\"",
        "auth:",
        "  provider: \"companyhelm\"",
        "  companyhelm:",
        "    tokenStorageKey: \"companyhelm.auth.token\"",
        "",
      ].join("\n"),
      "utf8",
    );

    const result = generateRuntimeConfig({ repoRoot, environment: "local" });
    const writtenJson = JSON.parse(readFileSync(resolveGeneratedConfigPath(repoRoot), "utf8"));

    assert.equal(result.environment, "local");
    assert.equal(result.sourcePath, resolveEnvironmentConfigPath(repoRoot, "local"));
    assert.equal(result.outputPath, resolveGeneratedConfigPath(repoRoot));
    assert.equal(writtenJson.api.graphqlApiUrl, "http://127.0.0.1:4000/graphql");
    assert.equal(writtenJson.auth.provider, "companyhelm");
    assert.equal(
      writtenJson.auth.companyhelm.tokenStorageKey,
      "companyhelm.auth.token",
    );
  } finally {
    rmSync(repoRoot, { recursive: true, force: true });
  }
});

test("generateRuntimeConfig fails when yaml is invalid for schema", () => {
  const repoRoot = mkdtempSync(join(tmpdir(), "companyhelm-frontend-config-invalid-"));
  try {
    mkdirSync(join(repoRoot, "config"), { recursive: true });
    writeFileSync(
      join(repoRoot, "config", "prod.yaml"),
      [
        "api:",
        "  graphqlApiUrl: \"not-a-url\"",
        "  runnerGrpcTarget: \"\"",
        "auth:",
        "  provider: \"companyhelm\"",
        "  companyhelm:",
        "    tokenStorageKey: \"\"",
        "",
      ].join("\n"),
      "utf8",
    );

    assert.throws(
      () => generateRuntimeConfig({ repoRoot, environment: "prod" }),
      /Invalid url|String must contain at least 1 character/,
    );
  } finally {
    rmSync(repoRoot, { recursive: true, force: true });
  }
});
