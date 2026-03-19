import { useEffect, useMemo, useState } from "react";
import { CreationModal } from "./CreationModal.tsx";

interface ConversationCreateModalProps {
  isOpen: boolean;
  currentUserLabel: string;
  agents: any[];
  isSubmitting?: boolean;
  onClose: () => void;
  onSubmit: (agentIds: string[]) => Promise<void> | void;
}

export function ConversationCreateModal({
  isOpen,
  currentUserLabel,
  agents,
  isSubmitting = false,
  onClose,
  onSubmit,
}: ConversationCreateModalProps) {
  const [selectedAgentIds, setSelectedAgentIds] = useState<string[]>([]);

  useEffect(() => {
    if (!isOpen) {
      setSelectedAgentIds([]);
    }
  }, [isOpen]);

  const sortedAgents = useMemo(() =>
    [...(Array.isArray(agents) ? agents : [])].sort((left: any, right: any) =>
      String(left?.name || "").localeCompare(String(right?.name || ""))),
  [agents]);

  return (
    <CreationModal
      modalId="conversation-create"
      title="Start conversation"
      description="Pick the internal agents to include. Your user participant is always added."
      isOpen={isOpen}
      onClose={onClose}
      cardClassName="conversation-modal-card"
    >
      <div className="conversation-modal-body">
        <div className="conversation-participant-note">
          <span className="conversation-participant-pill conversation-participant-pill-user">You</span>
          <span>{currentUserLabel}</span>
        </div>
        <div className="conversation-agent-picker" role="group" aria-label="Available agents">
          {sortedAgents.length === 0 ? (
            <p className="empty-hint">No agents available.</p>
          ) : sortedAgents.map((agent: any) => {
            const agentId = String(agent?.id || "").trim();
            const checked = selectedAgentIds.includes(agentId);
            return (
              <label key={agentId} className="conversation-agent-option">
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={isSubmitting}
                  onChange={(event) => {
                    setSelectedAgentIds((current) => event.target.checked
                      ? [...current, agentId]
                      : current.filter((value) => value !== agentId));
                  }}
                />
                <span>{String(agent?.name || "").trim() || agentId}</span>
              </label>
            );
          })}
        </div>
        <div className="conversation-modal-actions">
          <button type="button" className="secondary-button" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </button>
          <button
            type="button"
            className="primary-button"
            disabled={isSubmitting || selectedAgentIds.length === 0}
            onClick={() => void onSubmit(selectedAgentIds)}
          >
            {isSubmitting ? "Creating..." : "Create conversation"}
          </button>
        </div>
      </div>
    </CreationModal>
  );
}
