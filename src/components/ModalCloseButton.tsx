interface ModalCloseButtonProps {
  onClick: () => void;
}

export function ModalCloseButton({ onClick }: ModalCloseButtonProps) {
  return (
    <button type="button" className="secondary-btn modal-close-btn" aria-label="Close" onClick={onClick}>
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M6 6l12 12" />
        <path d="M18 6 6 18" />
      </svg>
    </button>
  );
}
