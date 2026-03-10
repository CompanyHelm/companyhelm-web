import { useMemo, useState } from "react";
import { Page } from "../components/Page.tsx";
import { CreationModal } from "../components/CreationModal.tsx";
import {
  MCP_TRANSPORT_TYPE_STREAMABLE_HTTP,
  MCP_TRANSPORT_TYPE_STDIO,
  MCP_TRANSPORT_TYPE_OPTIONS,
  MCP_AUTH_TYPE_NONE,
  MCP_AUTH_TYPE_BEARER_TOKEN,
  MCP_AUTH_TYPE_CUSTOM_HEADERS,
  MCP_AUTH_TYPE_OAUTH,
  MCP_AUTH_TYPE_OPTIONS,
} from "../utils/constants.ts";
import { useSetPageActions } from "../components/PageActionsContext.tsx";

function formatOauthConnectionStatus(status: any) {
  const normalizedStatus = String(status || "").trim().toLowerCase();
  if (normalizedStatus === "connected") {
    return "OAuth connected";
  }
  if (normalizedStatus === "degraded") {
    return "OAuth degraded";
  }
  return "OAuth not connected";
}

export function McpServersPage({
  selectedCompanyId,
  secrets,
  mcpServers,
  isLoadingMcpServers,
  mcpServerError,
  isCreatingMcpServer,
  savingMcpServerId,
  connectingMcpServerId,
  disconnectingMcpServerOAuthId,
  deletingMcpServerId,
  mcpServerName,
  mcpServerTransportType,
  mcpServerUrl,
  mcpServerCommand,
  mcpServerArgsText,
  mcpServerEnvVarsText,
  mcpServerAuthType,
  mcpServerBearerTokenSecretId,
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
  onMcpServerBearerTokenSecretIdChange,
  onMcpServerCustomHeadersTextChange,
  onMcpServerEnabledChange,
  onOpenSecretsPage,
  onCreateMcpServer,
  onMcpServerDraftChange,
  onSaveMcpServer,
  onStartMcpServerOAuth,
  onDisconnectMcpServerOAuth,
  onDeleteMcpServer,
}: any) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<any>(false);
  const [editingMcpServerId, setEditingMcpServerId] = useState<any>("");
  const createFlowRequiresSecret =
    mcpServerTransportType !== MCP_TRANSPORT_TYPE_STDIO
    && mcpServerAuthType === MCP_AUTH_TYPE_BEARER_TOKEN
    && secrets.length === 0;

  const pageActions = useMemo(() => (
    <>
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
    </>
  ), [mcpServerCountLabel]);
  useSetPageActions(pageActions);

  async function handleCreateMcpServerSubmit(event: any) {
    const didCreate = await onCreateMcpServer(event);
    if (didCreate) {
      setIsCreateModalOpen(false);
    }
  }

  return (
    <Page><div className="page-stack">
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
            {mcpServers.map((mcpServer: any) => {
              const draft = mcpServerDrafts[mcpServer.id] || {
                name: "",
                transportType: MCP_TRANSPORT_TYPE_STREAMABLE_HTTP,
                url: "",
                command: "",
                argsText: "",
                envVarsText: "",
                authType: MCP_AUTH_TYPE_NONE,
                bearerTokenSecretId: "",
                customHeadersText: "",
                oauthConnectionStatus: "",
                oauthLastError: "",
                oauthClientId: "",
                oauthClientSecret: "",
                oauthRequestedScopesText: "",
                enabled: true,
              };
              const isSavingOrDeleting =
                savingMcpServerId === mcpServer.id
                || deletingMcpServerId === mcpServer.id
                || connectingMcpServerId === mcpServer.id
                || disconnectingMcpServerOAuthId === mcpServer.id;
              const transportLabel =
                MCP_TRANSPORT_TYPE_OPTIONS.find((option: any) => option.value === draft.transportType)
                  ?.label || "Streamable HTTP";
              const endpointSummary =
                draft.transportType === MCP_TRANSPORT_TYPE_STDIO
                  ? draft.command || "-"
                  : draft.url || "-";
              const oauthStatusSummary = draft.authType === MCP_AUTH_TYPE_OAUTH
                ? ` \u00b7 ${formatOauthConnectionStatus(draft.oauthConnectionStatus)}`
                : "";

              return (
                <li
                  key={mcpServer.id}
                  className="chat-card"
                  onClick={() => !isSavingOrDeleting && setEditingMcpServerId(mcpServer.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(event: any) => {
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
                      {oauthStatusSummary}
                    </p>
                  </div>
                  <div className="chat-card-actions">
                    <button
                      type="button"
                      className="chat-card-icon-btn chat-card-icon-btn-danger"
                      onClick={(event: any) => {
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
            onChange={(event: any) => onMcpServerNameChange(event.target.value)}
            placeholder="e.g. GitHub MCP"
            required
            autoFocus
          />

          <label htmlFor="create-mcp-transport">Transport</label>
          <select
            id="create-mcp-transport"
            value={mcpServerTransportType}
            onChange={(event: any) => onMcpServerTransportTypeChange(event.target.value)}
          >
            {MCP_TRANSPORT_TYPE_OPTIONS.map((option: any) => (
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
                onChange={(event: any) => onMcpServerCommandChange(event.target.value)}
                placeholder="npx"
                required
              />

              <label htmlFor="create-mcp-args">Arguments</label>
              <textarea
                id="create-mcp-args"
                rows={4}
                value={mcpServerArgsText}
                onChange={(event: any) => onMcpServerArgsTextChange(event.target.value)}
                placeholder={"-y\n@modelcontextprotocol/server-filesystem\n/workspace"}
              />

              <label htmlFor="create-mcp-env">Environment variables</label>
              <textarea
                id="create-mcp-env"
                rows={4}
                value={mcpServerEnvVarsText}
                onChange={(event: any) => onMcpServerEnvVarsTextChange(event.target.value)}
                placeholder={"API_KEY=secret\nLOG_LEVEL=debug"}
              />
            </>
          ) : (
            <>
              <label htmlFor="create-mcp-url">URL</label>
              <input
                id="create-mcp-url"
                value={mcpServerUrl}
                onChange={(event: any) => onMcpServerUrlChange(event.target.value)}
                placeholder="https://example.com/mcp"
                required
              />

              <label htmlFor="create-mcp-auth">Auth</label>
              <select
                id="create-mcp-auth"
                value={mcpServerAuthType}
                onChange={(event: any) => onMcpServerAuthTypeChange(event.target.value)}
              >
                {MCP_AUTH_TYPE_OPTIONS.map((option: any) => (
                  <option key={`create-mcp-auth-${option.value}`} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              {mcpServerAuthType === MCP_AUTH_TYPE_BEARER_TOKEN ? (
                <>
                  {secrets.length === 0 ? (
                    <p className="error-banner">
                      Bearer token auth requires a secret. Create a secret first, then select it here.
                    </p>
                  ) : (
                    <>
                      <label htmlFor="create-mcp-token-secret">Bearer token secret</label>
                      <select
                        id="create-mcp-token-secret"
                        value={mcpServerBearerTokenSecretId}
                        onChange={(event: any) => onMcpServerBearerTokenSecretIdChange(event.target.value)}
                      >
                        <option value="">Select a secret</option>
                        {secrets.map((secret: any) => (
                          <option key={`create-mcp-secret-${secret.id}`} value={secret.id}>
                            {secret.name}
                          </option>
                        ))}
                      </select>
                      <p className="chat-card-meta">Select an existing company secret.</p>
                    </>
                  )}
                  <button
                    type="button"
                    className="secondary-btn"
                    onClick={onOpenSecretsPage}
                  >
                    {secrets.length === 0 ? "Create secret" : "Manage secrets"}
                  </button>
                </>
              ) : null}

              {mcpServerAuthType === MCP_AUTH_TYPE_OAUTH ? (
                <p className="chat-card-meta">
                  Save the server first, then connect OAuth from the edit dialog.
                </p>
              ) : null}

              <label htmlFor="create-mcp-headers">Custom headers</label>
              <textarea
                id="create-mcp-headers"
                rows={4}
                value={mcpServerCustomHeadersText}
                onChange={(event: any) => onMcpServerCustomHeadersTextChange(event.target.value)}
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
              onChange={(event: any) => onMcpServerEnabledChange(event.target.checked)}
            />{" "}
            Enable this MCP server
          </label>

          <button type="submit" disabled={isCreatingMcpServer || createFlowRequiresSecret}>
            {isCreatingMcpServer ? "Creating..." : "Create MCP server"}
          </button>
          {createFlowRequiresSecret ? (
            <p className="chat-card-meta">Create a secret first to use Bearer token auth.</p>
          ) : null}
        </form>
      </CreationModal>

      <CreationModal
        modalId="edit-mcp-server-modal"
        title={
          editingMcpServerId
            ? `Edit MCP server "${(mcpServers.find((s: any) => s.id === editingMcpServerId) || {}).name || ""}"`
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
            bearerTokenSecretId: "",
            customHeadersText: "",
            oauthConnectionStatus: "",
            oauthLastError: "",
            oauthClientId: "",
            oauthClientSecret: "",
            oauthRequestedScopesText: "",
            enabled: true,
          };
          const isSavingOrDeleting =
            savingMcpServerId === editingMcpServerId ||
            deletingMcpServerId === editingMcpServerId ||
            connectingMcpServerId === editingMcpServerId ||
            disconnectingMcpServerOAuthId === editingMcpServerId;
          const requiresSecretCreation =
            draft.transportType !== MCP_TRANSPORT_TYPE_STDIO
            && draft.authType === MCP_AUTH_TYPE_BEARER_TOKEN
            && secrets.length === 0;

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
                  onChange={(event: any) =>
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
                  onChange={(event: any) =>
                    onMcpServerDraftChange(editingMcpServerId, "transportType", event.target.value)
                  }
                  disabled={isSavingOrDeleting}
                >
                  {MCP_TRANSPORT_TYPE_OPTIONS.map((option: any) => (
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
                      onChange={(event: any) =>
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
                      onChange={(event: any) =>
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
                      onChange={(event: any) =>
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
                      onChange={(event: any) =>
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
                      onChange={(event: any) =>
                        onMcpServerDraftChange(editingMcpServerId, "authType", event.target.value)
                      }
                      disabled={isSavingOrDeleting}
                    >
                      {MCP_AUTH_TYPE_OPTIONS.map((option: any) => (
                        <option key={`edit-${editingMcpServerId}-auth-${option.value}`} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {draft.authType === MCP_AUTH_TYPE_BEARER_TOKEN ? (
                    <div className="chat-settings-field">
                      {secrets.length === 0 ? (
                        <p className="error-banner">
                          Bearer token auth requires a secret. Create a secret first, then select it here.
                        </p>
                      ) : (
                        <>
                          <label htmlFor={`edit-mcp-token-secret-${editingMcpServerId}`} className="chat-settings-label">
                            Bearer token secret
                          </label>
                          <select
                            id={`edit-mcp-token-secret-${editingMcpServerId}`}
                            className="chat-settings-input"
                            value={draft.bearerTokenSecretId}
                            onChange={(event: any) =>
                              onMcpServerDraftChange(editingMcpServerId, "bearerTokenSecretId", event.target.value)
                            }
                            disabled={isSavingOrDeleting}
                          >
                            <option value="">Select a secret</option>
                            {secrets.map((secret: any) => (
                              <option key={`edit-mcp-secret-${editingMcpServerId}-${secret.id}`} value={secret.id}>
                                {secret.name}
                              </option>
                            ))}
                          </select>
                          <p className="chat-card-meta">Select an existing company secret.</p>
                        </>
                      )}
                      <button
                        type="button"
                        className="secondary-btn"
                        onClick={onOpenSecretsPage}
                        disabled={isSavingOrDeleting}
                      >
                        {secrets.length === 0 ? "Create secret" : "Manage secrets"}
                      </button>
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
                        onChange={(event: any) =>
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

                  {draft.authType === MCP_AUTH_TYPE_OAUTH ? (
                    <>
                      <div className="chat-settings-field">
                        <label className="chat-settings-label">OAuth connection</label>
                        <p className="chat-card-meta">{formatOauthConnectionStatus(draft.oauthConnectionStatus)}</p>
                        {draft.oauthConnectionStatus === "degraded" ? (
                          <p className="error-banner">
                            OAuth refresh failed. Re-sign in to restore this MCP server.
                          </p>
                        ) : null}
                        {draft.oauthLastError ? (
                          <p className="chat-card-meta">{draft.oauthLastError}</p>
                        ) : null}
                      </div>

                      <div className="chat-settings-field">
                        <label htmlFor={`edit-mcp-oauth-scopes-${editingMcpServerId}`} className="chat-settings-label">
                          Requested scopes
                        </label>
                        <input
                          id={`edit-mcp-oauth-scopes-${editingMcpServerId}`}
                          className="chat-settings-input"
                          type="text"
                          value={draft.oauthRequestedScopesText}
                          onChange={(event: any) =>
                            onMcpServerDraftChange(editingMcpServerId, "oauthRequestedScopesText", event.target.value)
                          }
                          placeholder="openid profile"
                          disabled={isSavingOrDeleting}
                        />
                        <p className="chat-card-meta">Optional. Space or comma separated.</p>
                      </div>

                      <div className="chat-settings-field">
                        <label htmlFor={`edit-mcp-oauth-client-id-${editingMcpServerId}`} className="chat-settings-label">
                          Manual OAuth client ID
                        </label>
                        <input
                          id={`edit-mcp-oauth-client-id-${editingMcpServerId}`}
                          className="chat-settings-input"
                          type="text"
                          value={draft.oauthClientId}
                          onChange={(event: any) =>
                            onMcpServerDraftChange(editingMcpServerId, "oauthClientId", event.target.value)
                          }
                          placeholder="Leave blank for dynamic registration"
                          disabled={isSavingOrDeleting}
                        />
                      </div>

                      <div className="chat-settings-field">
                        <label
                          htmlFor={`edit-mcp-oauth-client-secret-${editingMcpServerId}`}
                          className="chat-settings-label"
                        >
                          Manual OAuth client secret
                        </label>
                        <input
                          id={`edit-mcp-oauth-client-secret-${editingMcpServerId}`}
                          className="chat-settings-input"
                          type="password"
                          value={draft.oauthClientSecret}
                          onChange={(event: any) =>
                            onMcpServerDraftChange(editingMcpServerId, "oauthClientSecret", event.target.value)
                          }
                          placeholder="Optional if already stored"
                          disabled={isSavingOrDeleting}
                        />
                        <p className="chat-card-meta">
                          Leave both manual fields blank to use dynamic registration or stored manual credentials.
                        </p>
                      </div>

                      <div className="chat-settings-actions">
                        <button
                          type="button"
                          onClick={() => onStartMcpServerOAuth(editingMcpServerId)}
                          disabled={isSavingOrDeleting}
                        >
                          {connectingMcpServerId === editingMcpServerId
                            ? "Connecting..."
                            : draft.oauthConnectionStatus === "connected"
                              ? "Reconnect OAuth"
                              : "Connect OAuth"}
                        </button>
                        <button
                          type="button"
                          className="secondary-btn"
                          onClick={() => onDisconnectMcpServerOAuth(editingMcpServerId)}
                          disabled={isSavingOrDeleting || !draft.oauthConnectionStatus}
                        >
                          {disconnectingMcpServerOAuthId === editingMcpServerId ? "Disconnecting..." : "Disconnect"}
                        </button>
                      </div>
                    </>
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
                    onChange={(event: any) =>
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
                  disabled={isSavingOrDeleting || requiresSecretCreation}
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
    </div></Page>
  );
}
