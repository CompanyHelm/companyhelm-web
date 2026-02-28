export function ChatSessionRunningBadge() {
  return (
    <span
      className="chat-session-running-badge"
      title="Chat is running"
      aria-label="Running"
    >
      <span className="chat-turn-spinner chat-session-spinner" aria-hidden="true" />
    </span>
  );
}
