import { useEffect, useMemo, useState } from "react";
import { Page } from "../components/Page.tsx";
import { CreationModal } from "../components/CreationModal.tsx";
import { useSetPageActions } from "../components/PageActionsContext.tsx";

function formatAccessedAt(value: any) {
  const normalized = String(value || "").trim();
  if (!normalized) {
    return "-";
  }
  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) {
    return normalized;
  }
  return parsed.toLocaleString();
}

function SecretVisibilityIcon({ isVisible }: { isVisible: boolean }) {
  if (isVisible) {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M3 3l18 18" />
        <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
        <path d="M9.9 4.2A10.3 10.3 0 0 1 12 4c5 0 8.8 3.3 10 8-0.5 1.8-1.4 3.3-2.6 4.5" />
        <path d="M6.3 6.3C4.7 7.8 3.5 9.8 3 12c1.2 4.7 5 8 10 8 1.4 0 2.7-0.3 3.9-0.8" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export function SecretsPage({
  secrets,
  isLoadingSecrets,
  secretError,
  isCreatingSecret,
  savingSecretId,
  deletingSecretId,
  secretName,
  secretDescription,
  secretValue,
  secretDrafts,
  secretValuesBySecretId,
  secretAccessLogsBySecretId,
  isLoadingSecretValuesBySecretId,
  isLoadingSecretAccessLogsBySecretId,
  secretValueErrorBySecretId,
  secretAccessLogErrorBySecretId,
  secretCountLabel,
  onSecretNameChange,
  onSecretDescriptionChange,
  onSecretValueChange,
  onCreateSecret,
  onSecretDraftChange,
  onLoadSecretValue,
  onLoadSecretAccessLogs,
  onSaveSecret,
  onDeleteSecret,
}: any) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<any>(false);
  const [editingSecretId, setEditingSecretId] = useState<any>("");
  const [isCreateSecretValueVisible, setIsCreateSecretValueVisible] = useState<any>(false);
  const [isSecretDraftValueVisibleBySecretId, setIsSecretDraftValueVisibleBySecretId] = useState<any>({});
  const [isCurrentSecretValueVisibleBySecretId, setIsCurrentSecretValueVisibleBySecretId] = useState<any>({});

  const pageActions = useMemo(() => (
    <>
      <span className="chat-card-meta">{secretCountLabel}</span>
      <button
        type="button"
        className="chat-minimal-header-icon-btn"
        aria-label="Create secret"
        title="Create secret"
        onClick={() => setIsCreateModalOpen(true)}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>
    </>
  ), [secretCountLabel]);
  useSetPageActions(pageActions);

  async function handleCreateSecretSubmit(event: any) {
    const didCreate = await onCreateSecret(event);
    if (didCreate) {
      setIsCreateSecretValueVisible(false);
      setIsCreateModalOpen(false);
    }
  }

  function handleCloseCreateModal() {
    setIsCreateSecretValueVisible(false);
    setIsCreateModalOpen(false);
  }

  function handleCloseEditModal() {
    setEditingSecretId("");
  }

  function handleSecretDraftVisibilityToggle(secretId: any) {
    setIsSecretDraftValueVisibleBySecretId((currentBySecretId: any) => ({
      ...(currentBySecretId || {}),
      [secretId]: !Boolean(currentBySecretId?.[secretId]),
    }));
  }

  async function handleCurrentSecretValueVisibilityToggle(secretId: any) {
    const normalizedSecretId = String(secretId || "").trim();
    if (!normalizedSecretId) {
      return;
    }

    const hasLoadedCurrentValue = Object.prototype.hasOwnProperty.call(
      secretValuesBySecretId || {},
      normalizedSecretId,
    );

    if (!hasLoadedCurrentValue) {
      if (typeof onLoadSecretValue === "function") {
        const loadedValue = await onLoadSecretValue(normalizedSecretId);
        if (loadedValue !== null) {
          setIsCurrentSecretValueVisibleBySecretId((currentBySecretId: any) => ({
            ...(currentBySecretId || {}),
            [normalizedSecretId]: true,
          }));
        }
      }
      return;
    }

    setIsCurrentSecretValueVisibleBySecretId((currentBySecretId: any) => ({
      ...(currentBySecretId || {}),
      [normalizedSecretId]: !Boolean(currentBySecretId?.[normalizedSecretId]),
    }));
  }

  useEffect(() => {
    if (!editingSecretId) {
      return;
    }

    if (typeof onLoadSecretAccessLogs === "function") {
      void onLoadSecretAccessLogs(editingSecretId, { first: 100 });
    }
  }, [editingSecretId, onLoadSecretAccessLogs]);

  return (
    <Page><div className="page-stack">
      <section className="panel list-panel">
        {secretError ? <p className="error-banner">{secretError}</p> : null}
        {isLoadingSecrets ? <p className="empty-hint">Loading secrets...</p> : null}
        {!isLoadingSecrets && secrets.length === 0 ? (
          <div className="empty-state">
            <p className="empty-hint">No secrets created for this company yet.</p>
            <button
              type="button"
              className="secondary-btn empty-create-btn"
              onClick={() => setIsCreateModalOpen(true)}
            >
              + Create secret
            </button>
          </div>
        ) : null}

        {secrets.length > 0 ? (
          <ul className="chat-card-list">
            {secrets.map((secret: any) => {
              const isSavingOrDeleting =
                savingSecretId === secret.id || deletingSecretId === secret.id;

              return (
                <li
                  key={secret.id}
                  className="chat-card"
                  onClick={() => !isSavingOrDeleting && setEditingSecretId(secret.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(event: any) => {
                    if (event.key === "Enter" && !isSavingOrDeleting) {
                      setEditingSecretId(secret.id);
                    }
                  }}
                >
                  <div className="chat-card-main">
                    <p className="chat-card-title">
                      <strong>{secret.name}</strong>
                    </p>
                    <p className="chat-card-meta">{secret.description || "-"}</p>
                  </div>
                  <div className="chat-card-actions">
                    <button
                      type="button"
                      className="chat-card-icon-btn chat-card-icon-btn-danger"
                      onClick={(event: any) => {
                        event.stopPropagation();
                        onDeleteSecret(secret.id, secret.name);
                      }}
                      disabled={isSavingOrDeleting}
                      aria-label={deletingSecretId === secret.id ? "Deleting..." : "Delete secret"}
                      title={deletingSecretId === secret.id ? "Deleting..." : "Delete secret"}
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
        modalId="create-secret-modal"
        title="Create secret"
        description="Store an encrypted secret value for company-level integrations."
        isOpen={isCreateModalOpen}
        onClose={handleCloseCreateModal}
      >
        <form className="task-form" onSubmit={handleCreateSecretSubmit}>
          <label htmlFor="create-secret-name">Name</label>
          <input
            id="create-secret-name"
            value={secretName}
            onChange={(event: any) => onSecretNameChange(event.target.value)}
            placeholder="e.g. Context7 Bearer Token"
            required
            autoFocus
          />

          <label htmlFor="create-secret-description">Description</label>
          <input
            id="create-secret-description"
            value={secretDescription}
            onChange={(event: any) => onSecretDescriptionChange(event.target.value)}
            placeholder="Used for Context7 MCP auth"
            required
          />

          <label htmlFor="create-secret-value">Secret value</label>
          <div className="secret-input-row">
            <input
              id="create-secret-value"
              type={isCreateSecretValueVisible ? "text" : "password"}
              value={secretValue}
              onChange={(event: any) => onSecretValueChange(event.target.value)}
              placeholder="Paste secret value"
              required
            />
            <button
              type="button"
              className="secret-visibility-toggle-btn"
              onClick={() => setIsCreateSecretValueVisible((current: any) => !current)}
              aria-label={isCreateSecretValueVisible ? "Hide secret value" : "Show secret value"}
              title={isCreateSecretValueVisible ? "Hide secret value" : "Show secret value"}
            >
              <SecretVisibilityIcon isVisible={isCreateSecretValueVisible} />
            </button>
          </div>

          <button type="submit" disabled={isCreatingSecret}>
            {isCreatingSecret ? "Creating..." : "Create secret"}
          </button>
        </form>
      </CreationModal>

      <CreationModal
        modalId="edit-secret-modal"
        title={
          editingSecretId
            ? `Edit secret "${(secrets.find((s: any) => s.id === editingSecretId) || {}).name || ""}"`
            : "Edit secret"
        }
        description="Leave value empty to keep the current encrypted value unchanged."
        isOpen={Boolean(editingSecretId)}
        onClose={handleCloseEditModal}
      >
        {editingSecretId ? (() => {
          const draft = secretDrafts[editingSecretId] || {
            name: "",
            description: "",
            value: "",
          };
          const accessLogs = Array.isArray(secretAccessLogsBySecretId?.[editingSecretId])
            ? secretAccessLogsBySecretId[editingSecretId]
            : [];
          const isLoadingAccessLogs = Boolean(isLoadingSecretAccessLogsBySecretId?.[editingSecretId]);
          const accessLogError = String(secretAccessLogErrorBySecretId?.[editingSecretId] || "");
          const isSavingOrDeleting =
            savingSecretId === editingSecretId || deletingSecretId === editingSecretId;
          const hasLoadedCurrentSecretValue = Object.prototype.hasOwnProperty.call(
            secretValuesBySecretId || {},
            editingSecretId,
          );
          const currentSecretValue = hasLoadedCurrentSecretValue
            ? String(secretValuesBySecretId?.[editingSecretId] ?? "")
            : "";
          const isLoadingCurrentSecretValue = Boolean(isLoadingSecretValuesBySecretId?.[editingSecretId]);
          const currentSecretValueError = String(secretValueErrorBySecretId?.[editingSecretId] || "");
          const isCurrentSecretValueVisible = Boolean(isCurrentSecretValueVisibleBySecretId?.[editingSecretId]);
          const isDraftSecretValueVisible = Boolean(isSecretDraftValueVisibleBySecretId?.[editingSecretId]);

          return (
            <div className="chat-settings-modal-form">
              <div className="chat-settings-field">
                <label htmlFor={`edit-secret-name-${editingSecretId}`} className="chat-settings-label">
                  Name
                </label>
                <input
                  id={`edit-secret-name-${editingSecretId}`}
                  className="chat-settings-input"
                  type="text"
                  value={draft.name}
                  onChange={(event: any) =>
                    onSecretDraftChange(editingSecretId, "name", event.target.value)
                  }
                  disabled={isSavingOrDeleting}
                />
              </div>

              <div className="chat-settings-field">
                <label htmlFor={`edit-secret-description-${editingSecretId}`} className="chat-settings-label">
                  Description
                </label>
                <input
                  id={`edit-secret-description-${editingSecretId}`}
                  className="chat-settings-input"
                  type="text"
                  value={draft.description}
                  onChange={(event: any) =>
                    onSecretDraftChange(editingSecretId, "description", event.target.value)
                  }
                  disabled={isSavingOrDeleting}
                />
              </div>

              <div className="chat-settings-field">
                <label htmlFor={`edit-secret-current-value-${editingSecretId}`} className="chat-settings-label">
                  Current value
                </label>
                <div className="secret-input-row">
                  <input
                    id={`edit-secret-current-value-${editingSecretId}`}
                    className="chat-settings-input"
                    type={isCurrentSecretValueVisible ? "text" : "password"}
                    value={currentSecretValue}
                    readOnly
                    placeholder={
                      hasLoadedCurrentSecretValue
                        ? ""
                        : (isLoadingCurrentSecretValue ? "Loading..." : "Click eye icon to view current value")
                    }
                    disabled={isSavingOrDeleting}
                  />
                  <button
                    type="button"
                    className="secret-visibility-toggle-btn"
                    onClick={() => {
                      void handleCurrentSecretValueVisibilityToggle(editingSecretId);
                    }}
                    disabled={isSavingOrDeleting || isLoadingCurrentSecretValue}
                    aria-label={
                      hasLoadedCurrentSecretValue
                        ? (isCurrentSecretValueVisible ? "Hide current secret value" : "Show current secret value")
                        : "View current secret value"
                    }
                    title={
                      hasLoadedCurrentSecretValue
                        ? (isCurrentSecretValueVisible ? "Hide current secret value" : "Show current secret value")
                        : "View current secret value"
                    }
                  >
                    <SecretVisibilityIcon isVisible={isCurrentSecretValueVisible} />
                  </button>
                </div>
                {currentSecretValueError ? <p className="error-banner">{currentSecretValueError}</p> : null}
              </div>

              <div className="chat-settings-field">
                <label htmlFor={`edit-secret-value-${editingSecretId}`} className="chat-settings-label">
                  New value (optional)
                </label>
                <div className="secret-input-row">
                  <input
                    id={`edit-secret-value-${editingSecretId}`}
                    className="chat-settings-input"
                    type={isDraftSecretValueVisible ? "text" : "password"}
                    value={draft.value}
                    onChange={(event: any) =>
                      onSecretDraftChange(editingSecretId, "value", event.target.value)
                    }
                    placeholder="Set only when rotating the secret"
                    disabled={isSavingOrDeleting}
                  />
                  <button
                    type="button"
                    className="secret-visibility-toggle-btn"
                    onClick={() => handleSecretDraftVisibilityToggle(editingSecretId)}
                    disabled={isSavingOrDeleting}
                    aria-label={isDraftSecretValueVisible ? "Hide new secret value" : "Show new secret value"}
                    title={isDraftSecretValueVisible ? "Hide new secret value" : "Show new secret value"}
                  >
                    <SecretVisibilityIcon isVisible={isDraftSecretValueVisible} />
                  </button>
                </div>
              </div>

              <div className="chat-settings-field">
                <label className="chat-settings-label">Access log</label>
                <div className="chat-settings-actions">
                  <button
                    type="button"
                    className="secondary-btn"
                    onClick={() => {
                      if (typeof onLoadSecretAccessLogs === "function") {
                        void onLoadSecretAccessLogs(editingSecretId, { first: 100 });
                      }
                    }}
                    disabled={isLoadingAccessLogs || typeof onLoadSecretAccessLogs !== "function"}
                  >
                    {isLoadingAccessLogs ? "Refreshing..." : "Refresh log"}
                  </button>
                </div>

                {accessLogError ? <p className="error-banner">{accessLogError}</p> : null}
                {isLoadingAccessLogs ? <p className="chat-card-meta">Loading access log...</p> : null}
                {!isLoadingAccessLogs && !accessLogError && accessLogs.length === 0 ? (
                  <p className="chat-card-meta">No access events yet.</p>
                ) : null}

                {!isLoadingAccessLogs && !accessLogError && accessLogs.length > 0 ? (
                  <ul className="chat-card-list">
                    {accessLogs.map((accessLog: any) => {
                      const agentName = String(accessLog?.agent?.name || "").trim() || "Unnamed agent";
                      const threadTitle = String(accessLog?.thread?.title || "").trim();
                      const mcpServerName = String(accessLog?.mcpServer?.name || "").trim() || "Unknown MCP server";
                      const threadLabel = threadTitle || "Untitled chat";

                      return (
                        <li key={accessLog.id} className="chat-card">
                          <div className="chat-card-main">
                            <p className="chat-card-title">
                              <strong>{formatAccessedAt(accessLog?.accessedAt)}</strong>
                            </p>
                            <p className="chat-card-meta">
                              Agent: {agentName} &middot; Thread: {threadLabel}
                            </p>
                            <p className="chat-card-meta">
                              MCP server: {mcpServerName}
                            </p>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                ) : null}
              </div>

              <div className="chat-settings-actions">
                <button
                  type="button"
                  onClick={() => {
                    onSaveSecret(editingSecretId);
                    setEditingSecretId("");
                  }}
                  disabled={isSavingOrDeleting}
                >
                  {savingSecretId === editingSecretId ? "Saving..." : "Save"}
                </button>
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() => setEditingSecretId("")}
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
