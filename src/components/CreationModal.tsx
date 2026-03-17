import { useEffect, type MouseEvent, type ReactNode } from "react";
import { ModalCloseButton } from "./ModalCloseButton.tsx";

interface CreationModalProps {
  modalId: string;
  title: string;
  description?: string;
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  cardClassName?: string;
}

export function CreationModal({
  modalId,
  title,
  description,
  isOpen,
  onClose,
  children,
  cardClassName = "",
}: CreationModalProps) {
  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal-overlay" role="presentation">
      <section
        className={["panel", "modal-card", cardClassName].filter(Boolean).join(" ")}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${modalId}-title`}
        aria-describedby={description ? `${modalId}-description` : undefined}
        onClick={(event: MouseEvent<HTMLElement>) => event.stopPropagation()}
      >
        <header className="panel-header panel-header-row modal-header">
          <div>
            <h2 id={`${modalId}-title`}>{title}</h2>
            {description ? (
              <p id={`${modalId}-description`} className="subcopy modal-description">
                {description}
              </p>
            ) : null}
          </div>
          <ModalCloseButton onClick={onClose} />
        </header>
        {children}
      </section>
    </div>
  );
}
