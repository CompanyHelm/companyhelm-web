import assert from "node:assert/strict";
import test from "node:test";
import { createMcpServerDrafts, createSecretDrafts } from "../../src/utils/drafts.ts";

test("createMcpServerDrafts keeps bearer token secret references", () => {
  const drafts = createMcpServerDrafts([
    {
      id: "mcp-1",
      name: "Context7",
      transportType: "streamable_http",
      url: "https://context7.example/mcp",
      authType: "bearer_token",
      bearerTokenSecretId: "secret-1",
      customHeaders: [],
      enabled: true,
    },
  ]);

  assert.deepEqual(drafts, {
    "mcp-1": {
      name: "Context7",
      transportType: "streamable_http",
      url: "https://context7.example/mcp",
      command: "",
      argsText: "",
      envVarsText: "",
      authType: "bearer_token",
      bearerTokenSecretId: "secret-1",
      customHeadersText: "",
      enabled: true,
    },
  });
});

test("createSecretDrafts initializes editable secret records", () => {
  const drafts = createSecretDrafts([
    {
      id: "secret-1",
      name: "GitHub Token",
      description: "Used for MCP bearer auth",
    },
  ]);

  assert.deepEqual(drafts, {
    "secret-1": {
      name: "GitHub Token",
      description: "Used for MCP bearer auth",
      value: "",
    },
  });
});
