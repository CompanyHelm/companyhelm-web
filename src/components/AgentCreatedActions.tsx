interface AgentCreatedActionsProps {
  agentName: string;
  isCreatingChat: boolean;
  onChatNow: () => void;
  onSkipForNow: () => void;
}

export function AgentCreatedActions({
  agentName,
  isCreatingChat,
  onChatNow,
  onSkipForNow,
}: AgentCreatedActionsProps) {
  const resolvedAgentName = String(agentName || "").trim() || "New agent";

  return (
    <section className="agent-created-actions">
      <div className="agent-created-actions-copy">
        <p className="eyebrow">Agent created</p>
        <h2>{resolvedAgentName}</h2>
        <p className="subcopy">
          Start a thread now or leave the agent ready for later.
        </p>
      </div>
      <div className="task-card-actions">
        <button type="button" onClick={onChatNow} disabled={isCreatingChat}>
          {isCreatingChat ? "Starting chat..." : "Chat now"}
        </button>
        <button
          type="button"
          className="secondary-btn"
          onClick={onSkipForNow}
          disabled={isCreatingChat}
        >
          Skip for now
        </button>
      </div>
    </section>
  );
}
