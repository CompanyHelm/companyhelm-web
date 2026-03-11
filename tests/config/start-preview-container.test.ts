import assert from "node:assert/strict";
import test from "node:test";
import {
  buildPreviewBuildCommandArgs,
  resolveContainerConfigPath,
  resolvePreviewPort,
} from "../../scripts/start-preview-container.js";

test("resolveContainerConfigPath requires an explicit runtime config path", () => {
  assert.throws(
    () => resolveContainerConfigPath({}),
    /Missing COMPANYHELM_CONFIG_PATH\. Container startup requires an explicit runtime config path\./,
  );
});

test("resolveContainerConfigPath accepts COMPANYHELM_CONFIG_PATH", () => {
  assert.equal(
    resolveContainerConfigPath({ COMPANYHELM_CONFIG_PATH: "/tmp/companyhelm/frontend.yaml" }),
    "/tmp/companyhelm/frontend.yaml",
  );
});

test("buildPreviewBuildCommandArgs forwards --config-path to vite wrapper", () => {
  assert.deepEqual(buildPreviewBuildCommandArgs("/run/companyhelm/config.yaml"), [
    "scripts/vite.js",
    "build",
    "--config-path",
    "/run/companyhelm/config.yaml",
  ]);
});

test("resolvePreviewPort defaults to 4173", () => {
  assert.equal(resolvePreviewPort({}), "4173");
});

test("resolvePreviewPort rejects non-numeric ports", () => {
  assert.throws(
    () => resolvePreviewPort({ PORT: "nope" }),
    /Invalid PORT "nope"\. Expected a numeric TCP port\./,
  );
});
