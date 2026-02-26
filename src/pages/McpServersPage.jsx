import { useState } from "react";
import { CreationModal } from "../components/CreationModal.jsx";
import {
  MCP_TRANSPORT_TYPE_STREAMABLE_HTTP,
  MCP_TRANSPORT_TYPE_STDIO,
  MCP_TRANSPORT_TYPE_OPTIONS,
  MCP_AUTH_TYPE_NONE,
  MCP_AUTH_TYPE_BEARER_TOKEN,
  MCP_AUTH_TYPE_CUSTOM_HEADERS,
  MCP_AUTH_TYPE_OPTIONS,
} from "../utils/constants.js";

export function McpServersPage({
  selectedCompanyId,
  mcpServers,
  isLoadingMcpServers,
  mcpServerError,
  isCreatingMcpServer,
  savingMcpServerId,
  deletingMcpServerId,
  mcpServerName,
  mcpServerTransportType,
  mcpServerUrl,
  mcpServerCommand,
  mcpServerArgsText,
  mcpServerEnvVarsText,
  mcpServerAuthType,
  mcpServerBearerToken,
  mcpServerCustomHeadersText,
  mcpServerEnabled,
  mcpServerDrafts,
  mcpServerCountLabel,
  onMcpServerNameChange,
  onMcpServerTransportTypeChange,
  onMcpServerUrlChange,
  onMcpServerCommandChange,
  onMcpServerArgsTextChange,
  onMcpServerEnvVarsTextChange,
  onMcpServerAuthTypeChange,
  onMcpServerBearerTokenChange,
  onMcpServerCustomHeadersTextChange,
  onMcpServerEnabledChange,
  onCreateMcpServer,
  onMcpServerDraftChange,
  onSaveMcpServer,
  onDeleteMcpServer,
}) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  async function handleCreateMcpServerSubmit(event) {
    const didCreate = await onCreateMcpServer(event);
    if (didCreate) {
      setIsCreateModalOpen(false);
    }
  }

  return (
    <div className="page-stack">
      <section className="panel hero-panel">
        <p className="eyebrow">MCP Registry</p>
        <h1>MCP servers page</h1>
        <p className="subcopy">
          Register company-level MCP servers as streamable HTTP or stdio transports.
        </p>
        <p className="context-pill">Company: {selectedCompanyId}</p>
      </section>

      <section className="panel list-panel">
        <header className="panel-header panel-header-row">
          <h2>MCP servers</h2>
          <div className="task-meta">
            <span>{mcpServerCountLabel}</span>
            <button
              type="button"
              className="icon-create-btn"
              aria-label="Create MCP server"
              title="Create MCP server"
              onClick={() => setIsCreateModalOpen(true)}
            >
              +
            </button>
          </div>
        </header>

        {mcpServerError ? <p className="error-banner">{mcpServerError}</p> : null}
        {isLoadingMcpServers ? <p className="empty-hint">Loading MCP servers...</p> : null}
        {!isLoadingMcpServers && mcpServers.length === 0 ? (
          <div className="empty-state">
            <p className="empty-hint">No MCP servers created for this company yet.</p>
            <button
              type="button"
              className="secondary-btn empty-create-btn"
              onClick={() => setIsCreateModalOpen(true)}
            >
              + Create MCP server
            </button>
          </div>
        ) : null}

        {mcpServers.length > 0 ? (
          <ul className="task-list">
            {mcpServers.map((mcpServer) => {
              const draft = mcpServerDrafts[mcpServer.id] || {
                name: "",
                transportType: MCP_TRANSPORT_TYPE_STREAMABLE_HTTP,
                url: "",
                command: "",
                argsText: "",
                envVarsText: "",
                authType: MCP_AUTH_TYPE_NONE,
                bearerToken: "",
                customHeadersText: "",
                enabled: true,
              };
              const isSavingOrDeleting =
                savingMcpServerId === mcpServer.id || deletingMcpServerId === mcpServer.id;
              const transportLabel =
                MCP_TRANSPORT_TYPE_OPTIONS.find((option) => option.value === draft.transportType)
                  ?.label || "Streamable HTTP";
              const authLabel =
                MCP_AUTH_TYPE_OPTIONS.find((option) => option.value === draft.authType)?.label ||
                "No auth";
              const endpointLabel =
                draft.transportType === MCP_TRANSPORT_TYPE_STDIO
                  ? `Command: ${draft.command || "-"}`
                  : `URL: ${draft.url || "-"}`;

              return (
                <li key={mcpServer.id} className="task-card">
                  <div className="task-card-top">
                    <strong>{mcpServer.name}</strong>
                    <code className="runner-id">{mcpServer.id}</code>
                  </div>
                  <p className="agent-subcopy">
                    Transport: <strong>{transportLabel}</strong> • {endpointLabel}
                  </p>
                  <p className="agent-subcopy">
                    Auth:{" "}
                    <strong>
                      {draft.transportType === MCP_TRANSPORT_TYPE_STDIO ? "n/a" : authLabel}
                    </strong>{" "}
                    • enabled:{" "}
                    <strong>{draft.enabled ? "yes" : "no"}</strong>
                  </p>

                  <div className="relationship-editor">
                    <div className="mcp-edit-grid">
                      <label className="relationship-field" htmlFor={`mcp-name-${mcpServer.id}`}>
                        Name
                      </label>
                      <input
                        id={`mcp-name-${mcpServer.id}`}
                        type="text"
                        value={draft.name}
                        onChange={(event) =>
                          onMcpServerDraftChange(mcpServer.id, "name", event.target.value)
                        }
                        disabled={isSavingOrDeleting}
                      />

                      <label className="relationship-field" htmlFor={`mcp-transport-${mcpServer.id}`}>
                        Transport
                      </label>
                      <select
                        id={`mcp-transport-${mcpServer.id}`}
                        value={draft.transportType}
                        onChange={(event) =>
                          onMcpServerDraftChange(mcpServer.id, "transportType", event.target.value)
                        }
                        disabled={isSavingOrDeleting}
                      >
                        {MCP_TRANSPORT_TYPE_OPTIONS.map((option) => (
                          <option key={`${mcpServer.id}-transport-${option.value}`} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>

                      {draft.transportType === MCP_TRANSPORT_TYPE_STDIO ? (
                        <>
                          <label className="relationship-field" htmlFor={`mcp-command-${mcpServer.id}`}>
                            Command
                          </label>
                          <input
                            id={`mcp-command-${mcpServer.id}`}
                            type="text"
                            value={draft.command}
                            onChange={(event) =>
                              onMcpServerDraftChange(mcpServer.id, "command", event.target.value)
                            }
                            placeholder="npx"
                            disabled={isSavingOrDeleting}
                          />

                          <label className="relationship-field" htmlFor={`mcp-args-${mcpServer.id}`}>
                            Arguments
                          </label>
                          <textarea
                            id={`mcp-args-${mcpServer.id}`}
                            rows={4}
                            value={draft.argsText}
                            onChange={(event) =>
                              onMcpServerDraftChange(mcpServer.id, "argsText", event.target.value)
                            }
                            placeholder={"-y\n@modelcontextprotocol/server-filesystem\n/workspace"}
                            disabled={isSavingOrDeleting}
                          />

                          <label className="relationship-field" htmlFor={`mcp-env-${mcpServer.id}`}>
                            Environment variables
                          </label>
                          <textarea
                            id={`mcp-env-${mcpServer.id}`}
                            rows={4}
                            value={draft.envVarsText}
                            onChange={(event) =>
                              onMcpServerDraftChange(mcpServer.id, "envVarsText", event.target.value)
                            }
                            placeholder={"API_KEY=secret\nLOG_LEVEL=debug"}
                            disabled={isSavingOrDeleting}
                          />
                        </>
                      ) : (
                        <>
                          <label className="relationship-field" htmlFor={`mcp-url-${mcpServer.id}`}>
                            URL
                          </label>
                          <input
                            id={`mcp-url-${mcpServer.id}`}
                            type="text"
                            value={draft.url}
                            onChange={(event) =>
                              onMcpServerDraftChange(mcpServer.id, "url", event.target.value)
                            }
                            disabled={isSavingOrDeleting}
                          />

                          <label className="relationship-field" htmlFor={`mcp-auth-${mcpServer.id}`}>
                            Auth
                          </label>
                          <select
                            id={`mcp-auth-${mcpServer.id}`}
                            value={draft.authType}
                            onChange={(event) =>
                              onMcpServerDraftChange(mcpServer.id, "authType", event.target.value)
                            }
                            disabled={isSavingOrDeleting}
                          >
                            {MCP_AUTH_TYPE_OPTIONS.map((option) => (
                              <option key={`${mcpServer.id}-auth-${option.value}`} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>

                          <label className="relationship-field" htmlFor={`mcp-token-${mcpServer.id}`}>
                            Bearer token
                          </label>
                          <input
                            id={`mcp-token-${mcpServer.id}`}
                            type="text"
                            value={draft.bearerToken}
                            onChange={(event) =>
                              onMcpServerDraftChange(mcpServer.id, "bearerToken", event.target.value)
                            }
                            placeholder="Token value only"
                            disabled={
                              isSavingOrDeleting || draft.authType !== MCP_AUTH_TYPE_BEARER_TOKEN
                            }
                          />

                          <label className="relationship-field" htmlFor={`mcp-headers-${mcpServer.id}`}>
                            Custom headers
                          </label>
                          <textarea
                            id={`mcp-headers-${mcpServer.id}`}
                            rows={4}
                            value={draft.customHeadersText}
                            onChange={(event) =>
                              onMcpServerDraftChange(
                                mcpServer.id,
                                "customHeadersText",
                                event.target.value,
                              )
                            }
                            placeholder={"Authorization: Bearer <token>\nX-Env: staging"}
                            disabled={
                              isSavingOrDeleting || draft.authType !== MCP_AUTH_TYPE_CUSTOM_HEADERS
                            }
                          />
                        </>
                      )}

                      <label className="relationship-field" htmlFor={`mcp-enabled-${mcpServer.id}`}>
                        Enabled
                      </label>
                      <label htmlFor={`mcp-enabled-${mcpServer.id}`}>
                        <input
                          id={`mcp-enabled-${mcpServer.id}`}
                          type="checkbox"
                          checked={Boolean(draft.enabled)}
                          onChange={(event) =>
                            onMcpServerDraftChange(mcpServer.id, "enabled", event.target.checked)
                          }
                          disabled={isSavingOrDeleting}
                        />{" "}
                        Enable this MCP server
                      </label>
                    </div>
                    <div className="task-card-actions">
                      <button
                        type="button"
                        className="secondary-btn relationship-save-btn"
                        onClick={() => onSaveMcpServer(mcpServer.id)}
                        disabled={isSavingOrDeleting}
                      >
                        {savingMcpServerId === mcpServer.id ? "Saving..." : "Save"}
                      </button>
                      <button
                        type="button"
                        className="danger-btn"
                        onClick={() => onDeleteMcpServer(mcpServer.id, mcpServer.name)}
                        disabled={isSavingOrDeleting}
                      >
                        {deletingMcpServerId === mcpServer.id ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : null}
      </section>

      <CreationModal
        modalId="create-mcp-server-modal"
        title="Create MCP server"
        description="Add a company-level MCP server with streamable HTTP or stdio transport."
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      >
        <form className="task-form" onSubmit={handleCreateMcpServerSubmit}>
          <label htmlFor="create-mcp-name">Name</label>
          <input
            id="create-mcp-name"
            value={mcpServerName}
            onChange={(event) => onMcpServerNameChange(event.target.value)}
            placeholder="e.g. GitHub MCP"
            required
            autoFocus
          />

          <label htmlFor="create-mcp-transport">Transport</label>
          <select
            id="create-mcp-transport"
            value={mcpServerTransportType}
            onChange={(event) => onMcpServerTransportTypeChange(event.target.value)}
          >
            {MCP_TRANSPORT_TYPE_OPTIONS.map((option) => (
              <option key={`create-mcp-transport-${option.value}`} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {mcpServerTransportType === MCP_TRANSPORT_TYPE_STDIO ? (
            <>
              <label htmlFor="create-mcp-command">Command</label>
              <input
                id="create-mcp-command"
                value={mcpServerCommand}
                onChange={(event) => onMcpServerCommandChange(event.target.value)}
                placeholder="npx"
                required
              />

              <label htmlFor="create-mcp-args">Arguments</label>
              <textarea
                id="create-mcp-args"
                rows={4}
                value={mcpServerArgsText}
                onChange={(event) => onMcpServerArgsTextChange(event.target.value)}
                placeholder={"-y\n@modelcontextprotocol/server-filesystem\n/workspace"}
              />

              <label htmlFor="create-mcp-env">Environment variables</label>
              <textarea
                id="create-mcp-env"
                rows={4}
                value={mcpServerEnvVarsText}
                onChange={(event) => onMcpServerEnvVarsTextChange(event.target.value)}
                placeholder={"API_KEY=secret\nLOG_LEVEL=debug"}
              />
            </>
          ) : (
            <>
              <label htmlFor="create-mcp-url">URL</label>
              <input
                id="create-mcp-url"
                value={mcpServerUrl}
                onChange={(event) => onMcpServerUrlChange(event.target.value)}
                placeholder="https://example.com/mcp"
                required
              />

              <label htmlFor="create-mcp-auth">Auth</label>
              <select
                id="create-mcp-auth"
                value={mcpServerAuthType}
                onChange={(event) => onMcpServerAuthTypeChange(event.target.value)}
              >
                {MCP_AUTH_TYPE_OPTIONS.map((option) => (
                  <option key={`create-mcp-auth-${option.value}`} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              <label htmlFor="create-mcp-token">Bearer token</label>
              <input
                id="create-mcp-token"
                value={mcpServerBearerToken}
                onChange={(event) => onMcpServerBearerTokenChange(event.target.value)}
                placeholder="Token value only"
                disabled={mcpServerAuthType !== MCP_AUTH_TYPE_BEARER_TOKEN}
              />

              <label htmlFor="create-mcp-headers">Custom headers</label>
              <textarea
                id="create-mcp-headers"
                rows={4}
                value={mcpServerCustomHeadersText}
                onChange={(event) => onMcpServerCustomHeadersTextChange(event.target.value)}
                placeholder={"Authorization: Bearer <token>\nX-Env: staging"}
                disabled={mcpServerAuthType !== MCP_AUTH_TYPE_CUSTOM_HEADERS}
              />
            </>
          )}

          <label htmlFor="create-mcp-enabled">
            <input
              id="create-mcp-enabled"
              type="checkbox"
              checked={Boolean(mcpServerEnabled)}
              onChange={(event) => onMcpServerEnabledChange(event.target.checked)}
            />{" "}
            Enable this MCP server
          </label>

          <button type="submit" disabled={isCreatingMcpServer}>
            {isCreatingMcpServer ? "Creating..." : "Create MCP server"}
          </button>
        </form>
      </CreationModal>
    </div>
  );
}
