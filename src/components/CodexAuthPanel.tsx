import { useEffect, useMemo, useState } from "react";
import type { RunnerSdkCodexAuthEvent, RunnerSdkEntry } from "../types/domain.ts";

const CODEX_DEVICE_LOGIN_URL = "https://auth.openai.com/codex/device";

function resolveStatusTone(params: {
  sdk: RunnerSdkEntry | null;
  authEvent: RunnerSdkCodexAuthEvent | null;
}): { className: string; label: string; description: string } {
  if (params.sdk?.status === "ready") {
    return {
      className: "codex-auth-status-authenticated",
      label: "configured",
      description: "Codex is configured on this runner.",
    };
  }
  if (params.authEvent?.codexAuthStatus === "waiting_for_device_code" && params.authEvent.deviceCode) {
    return {
      className: "codex-auth-status-pending",
      label: "device code ready",
      description: "Enter the one-time code in OpenAI auth to finish sign-in.",
    };
  }
  if (params.sdk?.codexAuthStatus === "requested") {
    return {
      className: "codex-auth-status-queued",
      label: "requested",
      description: "Auth request sent to runner.",
    };
  }
  if (params.sdk?.codexAuthStatus === "waiting_for_completion") {
    return {
      className: "codex-auth-status-pending",
      label: "waiting",
      description: "Waiting for Codex login to complete on the runner.",
    };
  }
  if (params.sdk?.codexAuthStatus === "failed" || params.sdk?.status === "error") {
    return {
      className: "codex-auth-status-failed",
      label: "failed",
      description: params.sdk?.errorMessage || "Codex auth failed.",
    };
  }
  return {
    className: "codex-auth-status-queued",
    label: "unconfigured",
    description: "Codex is registered but not configured on this runner.",
  };
}

export function CodexAuthPanel({
  sdk,
  runnerId,
  authEvent,
  isRunnerConnected,
  isStarting,
  onStartDeviceCodeAuth,
}: {
  sdk: RunnerSdkEntry | null;
  runnerId: string;
  authEvent: RunnerSdkCodexAuthEvent | null;
  isRunnerConnected: boolean;
  isStarting: boolean;
  onStartDeviceCodeAuth: (runnerId: string, sdkId: string) => void;
}) {
  const [copyFeedback, setCopyFeedback] = useState("");
  const statusTone = useMemo(() => resolveStatusTone({ sdk, authEvent }), [sdk, authEvent]);
  const deviceCode = authEvent?.codexAuthStatus === "waiting_for_device_code"
    ? String(authEvent.deviceCode || "").trim()
    : "";

  useEffect(() => {
    setCopyFeedback("");
  }, [deviceCode, sdk?.status, sdk?.codexAuthStatus]);

  async function handleCopyCode() {
    if (!deviceCode || typeof navigator === "undefined" || !navigator.clipboard?.writeText) {
      return;
    }
    await navigator.clipboard.writeText(deviceCode);
    setCopyFeedback("Copied");
  }

  return (
    <section className="panel list-panel codex-auth-panel">
      <h2 className="panel-section-title">Codex Auth</h2>
      <div className="codex-auth-state">
        <p className="codex-auth-row">
          <span className={`codex-auth-status ${statusTone.className}`}>{statusTone.label}</span>
        </p>
        <p className="codex-auth-row">{statusTone.description}</p>
        {!isRunnerConnected ? (
          <p className="codex-auth-row">Start the runner first. Device auth requires an active runner connection.</p>
        ) : null}
        {deviceCode ? (
          <>
            <p className="codex-auth-row codex-auth-row-with-action">
              <span className="codex-auth-code">{deviceCode}</span>
              <button
                type="button"
                className="secondary-btn codex-auth-copy-btn"
                onClick={() => {
                  void handleCopyCode();
                }}
              >
                Copy code
              </button>
              {copyFeedback ? <span className="codex-auth-copy-feedback">{copyFeedback}</span> : null}
            </p>
            <p className="codex-auth-row">
              Login in OpenAI auth:
              {" "}
              <a className="codex-auth-link" href={CODEX_DEVICE_LOGIN_URL} target="_blank" rel="noreferrer">
                {CODEX_DEVICE_LOGIN_URL}
              </a>
            </p>
          </>
        ) : null}
        {sdk?.errorMessage && (sdk?.codexAuthStatus === "failed" || sdk?.status === "error") ? (
          <p className="codex-auth-row">{sdk.errorMessage}</p>
        ) : null}
        {sdk?.status !== "ready" && sdk?.id ? (
          <p className="codex-auth-row">
            <button
              type="button"
              className="secondary-btn"
              disabled={!isRunnerConnected || isStarting}
              onClick={() => onStartDeviceCodeAuth(runnerId, sdk.id)}
            >
              {isStarting ? "Starting..." : "Start device code auth"}
            </button>
          </p>
        ) : null}
      </div>
    </section>
  );
}
