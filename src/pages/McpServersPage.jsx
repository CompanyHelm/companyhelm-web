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
  const [editingMcpServerId, setEditingMcpServerId] = useState("");

  async function handleCreateMcpServerSubmit(event) {
    const didCreate = await onCreateMcpServer(event);
    if (didCreate) {
      setIsCreateModalOpen(false);
    }
  }

  return (
    <div className="page-stack">
      <header className="chat-minimal-header">
        <div className="chat-minimal-header-info">
          <p className="chat-minimal-header-agent">{selectedCompanyId}</p>
          <h1 className="chat-minimal-header-title">MCP Servers</h1>
        </div>
        <div className="chat-minimal-header-actions">
          <span className="chat-card-meta">{mcpServerCountLabel}</span>
          <button
            type="button"
            className="chat-minimal-header-icon-btn"
            aria-label="Create MCP server"
            title="Create MCP server"
            onClick={() => setIsCreateModalOpen(true)}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
        </div>
      </header>

      <section className="panel list-panel">

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
          <ul className="chat-card-list">
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
              const endpointSummary =
                draft.transportType === MCP_TRANSPORT_TYPE_STDIO
                  ? draft.command || "-"
                  : draft.url || "-";

              return (
                <li
                  key={mcpServer.id}
                  className="chat-card"
                  onClick={() => !isSavingOrDeleting && setEditingMcpServerId(mcpServer.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !isSavingOrDeleting) {
                      setEditingMcpServerId(mcpServer.id);
                    }
                  }}
                >
                  <div className="chat-card-main">
                    <p className="chat-card-title">
                      <strong>{mcpServer.name}</strong>
                    </p>
                    <p className="chat-card-meta">
                      {transportLabel} &middot; {endpointSummary} &middot;{" "}
                      {draft.enabled ? "enabled" : "disabled"}
                    </p>
                  </div>
                  <div className="chat-card-actions">
                    <button
                      type="button"
                      className="chat-card-icon-btn chat-card-icon-btn-danger"
                      onClick={(event) => {
                        event.stopPropagation();
                        onDeleteMcpServer(mcpServer.id, mcpServer.name);
                      }}
                      disabled={isSavingOrDeleting}
                      aria-label={deletingMcpServerId === mcpServer.id ? "Deleting..." : "Delete MCP server"}
                      title={deletingMcpServerId === mcpServer.id ? "Deleting..." : "Delete MCP server"}
                    >
                      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                        <path d="M3 6h18" />
                        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                        <line x1="10" y1="11" x2="10" y2="17" />
                        <line x1="14" y1="11" x2="14" y2="17" />
                      </svg>
                    </button>
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

      <CreationModal
        modalId="edit-mcp-server-modal"
        title={
          editingMcpServerId
            ? `Edit MCP server "${(mcpServers.find((s) => s.id === editingMcpServerId) || {}).name || ""}"`
            : "Edit MCP server"
        }
        description=""
        isOpen={Boolean(editingMcpServerId)}
        onClose={() => setEditingMcpServerId("")}
        cardClassName="modal-card-wide"
      >
        {editingMcpServerId ? (() => {
          const draft = mcpServerDrafts[editingMcpServerId] || {
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
            savingMcpServerId === editingMcpServerId ||
            deletingMcpServerId === editingMcpServerId;

          return (
            <div className="chat-settings-modal-form">
              <div className="chat-settings-field">
                <label htmlFor={`edit-mcp-name-${editingMcpServerId}`} className="chat-settings-label">
                  Name
                </label>
                <input
                  id={`edit-mcp-name-${editingMcpServerId}`}
                  className="chat-settings-input"
                  type="text"
                  value={draft.name}
                  onChange={(event) =>
                    onMcpServerDraftChange(editingMcpServerId, "name", event.target.value)
                  }
                  disabled={isSavingOrDeleting}
                />
              </div>

              <div className="chat-settings-field">
                <label htmlFor={`edit-mcp-transport-${editingMcpServerId}`} className="chat-settings-label">
                  Transport
                </label>
                <select
                  id={`edit-mcp-transport-${editingMcpServerId}`}
                  className="chat-settings-input"
                  value={draft.transportType}
                  onChange={(event) =>
                    onMcpServerDraftChange(editingMcpServerId, "transportType", event.target.value)
                  }
                  disabled={isSavingOrDeleting}
                >
                  {MCP_TRANSPORT_TYPE_OPTIONS.map((option) => (
                    <option key={`edit-${editingMcpServerId}-transport-${option.value}`} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {draft.transportType === MCP_TRANSPORT_TYPE_STDIO ? (
                <>
                  <div className="chat-settings-field">
                    <label htmlFor={`edit-mcp-command-${editingMcpServerId}`} className="chat-settings-label">
                      Command
                    </label>
                    <input
                      id={`edit-mcp-command-${editingMcpServerId}`}
                      className="chat-settings-input"
                      type="text"
                      value={draft.command}
                      onChange={(event) =>
                        onMcpServerDraftChange(editingMcpServerId, "command", event.target.value)
                      }
                      placeholder="npx"
                      disabled={isSavingOrDeleting}
                    />
                  </div>

                  <div className="chat-settings-field">
                    <label htmlFor={`edit-mcp-args-${editingMcpServerId}`} className="chat-settings-label">
                      Arguments
                    </label>
                    <textarea
                      id={`edit-mcp-args-${editingMcpServerId}`}
                      className="chat-settings-input"
                      rows={4}
                      value={draft.argsText}
                      onChange={(event) =>
                        onMcpServerDraftChange(editingMcpServerId, "argsText", event.target.value)
                      }
                      placeholder={"-y\n@modelcontextprotocol/server-filesystem\n/workspace"}
                      disabled={isSavingOrDeleting}
                    />
                  </div>

                  <div className="chat-settings-field">
                    <label htmlFor={`edit-mcp-env-${editingMcpServerId}`} className="chat-settings-label">
                      Environment variables
                    </label>
                    <textarea
                      id={`edit-mcp-env-${editingMcpServerId}`}
                      className="chat-settings-input"
                      rows={4}
                      value={draft.envVarsText}
                      onChange={(event) =>
                        onMcpServerDraftChange(editingMcpServerId, "envVarsText", event.target.value)
                      }
                      placeholder={"API_KEY=secret\nLOG_LEVEL=debug"}
                      disabled={isSavingOrDeleting}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="chat-settings-field">
                    <label htmlFor={`edit-mcp-url-${editingMcpServerId}`} className="chat-settings-label">
                      URL
                    </label>
                    <input
                      id={`edit-mcp-url-${editingMcpServerId}`}
                      className="chat-settings-input"
                      type="text"
                      value={draft.url}
                      onChange={(event) =>
                        onMcpServerDraftChange(editingMcpServerId, "url", event.target.value)
                      }
                      disabled={isSavingOrDeleting}
                    />
                  </div>

                  <div className="chat-settings-field">
                    <label htmlFor={`edit-mcp-auth-${editingMcpServerId}`} className="chat-settings-label">
                      Auth
                    </label>
                    <select
                      id={`edit-mcp-auth-${editingMcpServerId}`}
                      className="chat-settings-input"
                      value={draft.authType}
                      onChange={(event) =>
                        onMcpServerDraftChange(editingMcpServerId, "authType", event.target.value)
                      }
                      disabled={isSavingOrDeleting}
                    >
                      {MCP_AUTH_TYPE_OPTIONS.map((option) => (
                        <option key={`edit-${editingMcpServerId}-auth-${option.value}`} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {draft.authType === MCP_AUTH_TYPE_BEARER_TOKEN ? (
                    <div className="chat-settings-field">
                      <label htmlFor={`edit-mcp-token-${editingMcpServerId}`} className="chat-settings-label">
                        Bearer token
                      </label>
                      <input
                        id={`edit-mcp-token-${editingMcpServerId}`}
                        className="chat-settings-input"
                        type="text"
                        value={draft.bearerToken}
                        onChange={(event) =>
                          onMcpServerDraftChange(editingMcpServerId, "bearerToken", event.target.value)
                        }
                        placeholder="Token value only"
                        disabled={isSavingOrDeleting}
                      />
                    </div>
                  ) : null}

                  {draft.authType === MCP_AUTH_TYPE_CUSTOM_HEADERS ? (
                    <div className="chat-settings-field">
                      <label htmlFor={`edit-mcp-headers-${editingMcpServerId}`} className="chat-settings-label">
                        Custom headers
                      </label>
                      <textarea
                        id={`edit-mcp-headers-${editingMcpServerId}`}
                        className="chat-settings-input"
                        rows={4}
                        value={draft.customHeadersText}
                        onChange={(event) =>
                          onMcpServerDraftChange(
                            editingMcpServerId,
                            "customHeadersText",
                            event.target.value,
                          )
                        }
                        placeholder={"Authorization: Bearer <token>\nX-Env: staging"}
                        disabled={isSavingOrDeleting}
                      />
                    </div>
                  ) : null}
                </>
              )}

              <div className="chat-settings-field">
                <label htmlFor={`edit-mcp-enabled-${editingMcpServerId}`} className="chat-settings-label">
                  Enabled
                </label>
                <label htmlFor={`edit-mcp-enabled-${editingMcpServerId}`}>
                  <input
                    id={`edit-mcp-enabled-${editingMcpServerId}`}
                    type="checkbox"
                    checked={Boolean(draft.enabled)}
                    onChange={(event) =>
                      onMcpServerDraftChange(editingMcpServerId, "enabled", event.target.checked)
                    }
                    disabled={isSavingOrDeleting}
                  />{" "}
                  Enable this MCP server
                </label>
              </div>

              <div className="chat-settings-actions">
                <button
                  type="button"
                  onClick={() => {
                    onSaveMcpServer(editingMcpServerId);
                    setEditingMcpServerId("");
                  }}
                  disabled={isSavingOrDeleting}
                >
                  {savingMcpServerId === editingMcpServerId ? "Saving..." : "Save"}
                </button>
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() => setEditingMcpServerId("")}
                >
                  Cancel
                </button>
              </div>
            </div>
          );
        })() : null}
      </CreationModal>
    </div>
  );
}
