import { useEffect, useMemo, useState } from "react";
import { CreationModal } from "./CreationModal.tsx";

interface ConversationParticipantsModalProps {
  isOpen: boolean;
  onClose: () => void;
  participants: any[];
  availableAgents: any[];
  isSubmitting?: boolean;
  onSubmit: (agentIds: string[]) => Promise<void> | void;
}

function formatParticipantName(participant: any) {
  return String(participant?.displayName || "").trim() || "Unknown participant";
}

export function ConversationParticipantsModal({
  isOpen,
  onClose,
  participants,
  availableAgents,
  isSubmitting = false,
  onSubmit,
}: ConversationParticipantsModalProps) {
  const [selectedAgentIds, setSelectedAgentIds] = useState<string[]>([]);

  useEffect(() => {
    if (!isOpen) {
      setSelectedAgentIds([]);
    }
  }, [isOpen]);

  const existingAgentIds = useMemo(() =>
    new Set(
      (Array.isArray(participants) ? participants : [])
        .map((participant: any) => String(participant?.agentId || "").trim())
        .filter(Boolean),
    ),
  [participants]);

  const candidateAgents = useMemo(() =>
    [...(Array.isArray(availableAgents) ? availableAgents : [])]
      .filter((agent: any) => {
        const agentId = String(agent?.id || "").trim();
        return agentId && !existingAgentIds.has(agentId);
      })
      .sort((left: any, right: any) => String(left?.name || "").localeCompare(String(right?.name || ""))),
  [availableAgents, existingAgentIds]);

  return (
    <CreationModal
      modalId="conversation-participants"
      title="Add participants"
      description="Select more agents to join this conversation. New participants only receive future messages."
      isOpen={isOpen}
      onClose={onClose}
      cardClassName="conversation-modal-card"
    >
      <div className="conversation-modal-body">
        <div className="conversation-modal-section">
          <p className="conversation-modal-section-label">Current participants</p>
          <div className="conversation-chat-participant-strip">
            {(Array.isArray(participants) ? participants : []).map((participant: any) => (
              <span key={String(participant?.id || "").trim()} className="conversation-participant-pill">
                {formatParticipantName(participant)}
              </span>
            ))}
          </div>
        </div>

        {candidateAgents.length === 0 ? (
          <p className="empty-hint">All available agents are already participants.</p>
        ) : (
          <div className="conversation-agent-picker" role="group" aria-label="Agents to add">
            {candidateAgents.map((agent: any) => {
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
        )}

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
            {isSubmitting ? "Adding..." : "Add selected agents"}
          </button>
        </div>
      </div>
    </CreationModal>
  );
}
