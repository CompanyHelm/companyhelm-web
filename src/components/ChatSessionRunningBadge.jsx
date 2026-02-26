export function ChatSessionRunningBadge() {
  return (
    <span className="chat-session-running-badge" title="Chat is running">
      <span className="chat-turn-spinner chat-session-spinner" aria-hidden="true" />
      running
    </span>
  );
}
