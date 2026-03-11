import assert from "node:assert/strict";
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import test from "node:test";

function writeExecutable(path: string, contents: string) {
  writeFileSync(path, contents, "utf8");
  chmodSync(path, 0o755);
}

test("docker-entrypoint requires COMPANYHELM_CONFIG_PATH", () => {
  const result = spawnSync("sh", ["scripts/docker-entrypoint.sh"], {
    cwd: "/workspace/frontend",
    env: {
      ...process.env,
    },
    encoding: "utf8",
  });

  assert.equal(result.status, 1);
  assert.match(
    result.stderr,
    /Missing COMPANYHELM_CONFIG_PATH\. Container startup requires an explicit runtime config path\./,
  );
});

test("docker-entrypoint launches preview container with explicit config path", () => {
  const tempDir = mkdtempSync(join(tmpdir(), "companyhelm-frontend-entrypoint-"));
  const logPath = join(tempDir, "npm.log");
  try {
    const fakeBinDir = join(tempDir, "bin");
    mkdirSync(fakeBinDir, { recursive: true });
    writeExecutable(
      join(fakeBinDir, "npm"),
      `#!/bin/sh
echo "$@" > "${logPath}"
exit 0
`,
    );

    const result = spawnSync("sh", ["scripts/docker-entrypoint.sh"], {
      cwd: "/workspace/frontend",
      env: {
        ...process.env,
        PATH: `${fakeBinDir}:${process.env.PATH || ""}`,
        COMPANYHELM_CONFIG_PATH: "/run/companyhelm/config.yaml",
      },
      encoding: "utf8",
    });

    assert.equal(result.status, 0);
    assert.equal(readFileSync(logPath, "utf8").trim(), "run preview:container --");
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }
});
