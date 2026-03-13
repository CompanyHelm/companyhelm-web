import { useMemo } from "react";
import { Page } from "../components/Page.tsx";
import { useSetPageActions } from "../components/PageActionsContext.tsx";

function normalizeApprovalStatus(value: any) {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "approved" || normalized === "rejected" || normalized === "pending") {
    return normalized;
  }
  return "pending";
}

export function ApprovalsPage({
  approvals,
  isLoadingApprovals,
  approvalError,
  approvingApprovalId,
  rejectingApprovalId,
  deletingApprovalId,
  rejectionReasonDraftByApprovalId,
  approvalCountLabel,
  onRejectionReasonChange,
  onApproveApproval,
  onRejectApproval,
  onDeleteApproval,
}: any) {
  const pageActions = useMemo(() => (
    <span className="chat-card-meta">{approvalCountLabel}</span>
  ), [approvalCountLabel]);
  useSetPageActions(pageActions);

  return (
    <Page><div className="page-stack">
      <section className="panel list-panel">
        {approvalError ? <p className="error-banner">{approvalError}</p> : null}
        {isLoadingApprovals ? <p className="empty-hint">Loading approvals...</p> : null}
        {!isLoadingApprovals && approvals.length === 0 ? (
          <p className="empty-hint">No approvals yet.</p>
        ) : null}

        {approvals.length > 0 ? (
          <ul className="chat-card-list">
            {approvals.map((approval: any) => {
              const status = normalizeApprovalStatus(approval?.status);
              const isApproving = approvingApprovalId === approval.id;
              const isRejecting = rejectingApprovalId === approval.id;
              const isDeleting = deletingApprovalId === approval.id;
              const isBusy = isApproving || isRejecting || isDeleting;
              const rejectionReasonDraft = String(rejectionReasonDraftByApprovalId?.[approval.id] || "");

              return (
                <li key={approval.id} className="chat-card">
                  <div className="chat-card-main">
                    <p className="chat-card-title">
                      <strong>{String(approval.secretName || "").trim() || "Unknown secret"}</strong>
                    </p>
                    <p className="chat-card-meta">Requested by: {approval.requestingAgentName || "Unknown agent"}</p>
                    <p className="chat-card-meta">Reason: {approval.reason || "-"}</p>
                    {status === "rejected" && approval.rejectionReason ? (
                      <p className="chat-card-meta">Rejection reason: {approval.rejectionReason}</p>
                    ) : null}
                    <p className="chat-card-meta">Status: {status}</p>
                  </div>

                  <div className="approval-card-actions">
                    {status === "pending" ? (
                      <>
                        <input
                          type="text"
                          className="approval-rejection-input"
                          placeholder="Optional rejection reason"
                          value={rejectionReasonDraft}
                          onChange={(event: any) => onRejectionReasonChange(approval.id, event.target.value)}
                          disabled={isBusy}
                        />
                        <div className="approval-inline-controls">
                          <button
                            type="button"
                            className="secondary-btn"
                            onClick={() => onApproveApproval(approval.id)}
                            disabled={isBusy}
                          >
                            {isApproving ? "Approving..." : "Approve"}
                          </button>
                          <button
                            type="button"
                            className="secondary-btn"
                            onClick={() => onRejectApproval(approval.id)}
                            disabled={isBusy}
                          >
                            {isRejecting ? "Rejecting..." : "Reject"}
                          </button>
                          <button
                            type="button"
                            className="chat-card-icon-btn chat-card-icon-btn-danger"
                            onClick={() => onDeleteApproval(approval.id)}
                            disabled={isBusy}
                            aria-label={isDeleting ? "Deleting..." : "Delete approval"}
                            title={isDeleting ? "Deleting..." : "Delete approval"}
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
                      </>
                    ) : (
                      <div className="approval-inline-controls">
                        <button
                          type="button"
                          className="chat-card-icon-btn chat-card-icon-btn-danger"
                          onClick={() => onDeleteApproval(approval.id)}
                          disabled={isBusy}
                          aria-label={isDeleting ? "Deleting..." : "Delete approval"}
                          title={isDeleting ? "Deleting..." : "Delete approval"}
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
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        ) : null}
      </section>
    </div></Page>
  );
}
