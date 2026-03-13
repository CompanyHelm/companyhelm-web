import assert from "node:assert/strict";
import test from "node:test";
import { getIgnoredSecretInputProps } from "../../src/utils/autofill.ts";

test("getIgnoredSecretInputProps marks secret fields for password-manager ignore", () => {
  assert.deepEqual(
    getIgnoredSecretInputProps("runnerSecret"),
    {
      name: "runnerSecret",
      autoComplete: "off",
      spellCheck: false,
      "data-bwignore": "true",
      "data-1p-ignore": "true",
    },
  );
});

test("getIgnoredSecretInputProps falls back to a stable secret name", () => {
  assert.equal(getIgnoredSecretInputProps("").name, "secret");
});
