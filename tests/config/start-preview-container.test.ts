import assert from "node:assert/strict";
import test from "node:test";
import {
  resolveContainerEnvironment,
  resolvePreviewPort,
} from "../../scripts/start-preview-container.js";

test("resolveContainerEnvironment defaults to prod", () => {
  assert.equal(resolveContainerEnvironment({}), "prod");
});

test("resolveContainerEnvironment accepts dev", () => {
  assert.equal(resolveContainerEnvironment({ COMPANYHELM_ENVIRONMENT: "dev" }), "dev");
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
