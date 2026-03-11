import type { ReactNode } from "react";
import { CreationModal } from "./CreationModal.tsx";

type ConfirmationTone = "default" | "danger";

interface ConfirmationModalProps {
  modalId: string;
  isOpen: boolean;
  title: string;
  message: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: ConfirmationTone;
  isConfirming?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmationModal({
  modalId,
  isOpen,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "default",
  isConfirming = false,
  onConfirm,
  onClose,
}: ConfirmationModalProps) {
  return (
    <CreationModal
      modalId={modalId}
      title={title}
      isOpen={isOpen}
      onClose={isConfirming ? () => {} : onClose}
    >
      <div className="page-stack">
        <p className="subcopy">{message}</p>
        <div className="modal-actions">
          <button type="button" className="secondary-btn" disabled={isConfirming} onClick={onClose}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className={tone === "danger" ? "danger-btn" : ""}
            disabled={isConfirming}
            onClick={onConfirm}
          >
            {isConfirming ? "Working..." : confirmLabel}
          </button>
        </div>
      </div>
    </CreationModal>
  );
}
