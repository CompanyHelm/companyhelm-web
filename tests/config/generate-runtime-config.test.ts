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

test("generateRuntimeConfig validates yaml and writes src/generated/config.js", () => {
  const repoRoot = mkdtempSync(join(tmpdir(), "companyhelm-frontend-config-"));
  try {
    mkdirSync(join(repoRoot, "config"), { recursive: true });
    mkdirSync(join(repoRoot, "src", "generated"), { recursive: true });
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
    const generatedModule = readFileSync(resolveGeneratedConfigPath(repoRoot), "utf8");
    const jsonPayload = generatedModule.match(/export default (\{[\s\S]*\});\n$/)?.[1];
    const writtenJson = JSON.parse(jsonPayload || "{}");

    assert.equal(result.environment, "local");
    assert.equal(result.sourcePath, resolveEnvironmentConfigPath(repoRoot, "local"));
    assert.equal(result.outputPath, resolveGeneratedConfigPath(repoRoot));
    assert.match(generatedModule, /^\/\* This file is auto-generated\. Do not edit\. \*\//);
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

test("generateRuntimeConfig resolves environment placeholders before validation", () => {
  const repoRoot = mkdtempSync(join(tmpdir(), "companyhelm-frontend-config-env-"));
  const originalAnonKey = process.env.SUPABASE_ANON_KEY;
  try {
    process.env.SUPABASE_ANON_KEY = "env-anon-key";
    mkdirSync(join(repoRoot, "config"), { recursive: true });
    mkdirSync(join(repoRoot, "src", "generated"), { recursive: true });
    writeFileSync(
      join(repoRoot, "config", "dev.yaml"),
      [
        "api:",
        "  graphqlApiUrl: \"https://api.dev.companyhelm.com/graphql\"",
        "  runnerGrpcTarget: \"dev-runner.companyhelm.internal:50051\"",
        "auth:",
        "  provider: \"supabase\"",
        "  companyhelm:",
        "    tokenStorageKey: \"companyhelm.auth.token\"",
        "  supabase:",
        "    url: \"https://zbhnqhoctbgculdvsgpv.supabase.co\"",
        "    anonKey: \"${SUPABASE_ANON_KEY}\"",
        "    tokenStorageKey: \"supabase.auth.token\"",
        "",
      ].join("\n"),
      "utf8",
    );

    const result = generateRuntimeConfig({ repoRoot, environment: "dev" });

    assert.equal(result.config.auth.provider, "supabase");
    assert.equal(result.config.auth.supabase?.anonKey, "env-anon-key");
  } finally {
    if (typeof originalAnonKey === "undefined") {
      delete process.env.SUPABASE_ANON_KEY;
    } else {
      process.env.SUPABASE_ANON_KEY = originalAnonKey;
    }
    rmSync(repoRoot, { recursive: true, force: true });
  }
});
