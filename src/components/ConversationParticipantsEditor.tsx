import { useMemo, useState } from "react";

interface ConversationParticipantsEditorProps {
  participants: any[];
  availableAgents: any[];
  isSubmitting?: boolean;
  onSubmit: (agentIds: string[]) => Promise<void> | void;
}

export function ConversationParticipantsEditor({
  participants,
  availableAgents,
  isSubmitting = false,
  onSubmit,
}: ConversationParticipantsEditorProps) {
  const [selectedAgentIds, setSelectedAgentIds] = useState<string[]>([]);
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
    <section className="conversation-participants-editor panel">
      <div className="panel-header panel-header-row">
        <div>
          <h3>Add agents</h3>
          <p className="subcopy">New participants receive future messages only.</p>
        </div>
      </div>
      {candidateAgents.length === 0 ? (
        <p className="empty-hint">All available agents are already participants.</p>
      ) : (
        <>
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
          <div className="conversation-modal-actions">
            <button
              type="button"
              className="primary-button"
              disabled={isSubmitting || selectedAgentIds.length === 0}
              onClick={() => void onSubmit(selectedAgentIds)}
            >
              {isSubmitting ? "Adding..." : "Add selected agents"}
            </button>
          </div>
        </>
      )}
    </section>
  );
}
