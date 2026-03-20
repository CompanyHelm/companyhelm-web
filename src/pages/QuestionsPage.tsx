import { useMemo } from "react";
import { Page } from "../components/Page.tsx";
import { useSetPageActions } from "../components/PageActionsContext.tsx";

const QUESTION_TABS = [
  { id: "open", label: "Open" },
  { id: "completed", label: "Completed" },
  { id: "dismissed", label: "Dismissed" },
] as const;

function normalizeQuestionOptionRating(rating: any) {
  const parsedRating = Number.parseInt(String(rating ?? ""), 10);
  if (
    parsedRating !== 1
    && parsedRating !== 2
    && parsedRating !== 3
    && parsedRating !== 4
    && parsedRating !== 5
  ) {
    return 0;
  }

  return parsedRating;
}

function renderQuestionOptionRatingStars(rating: any) {
  const normalizedRating = normalizeQuestionOptionRating(rating);
  if (normalizedRating === 0) {
    return null;
  }

  return `${"★".repeat(normalizedRating)}${"☆".repeat(5 - normalizedRating)}`;
}

function sortQuestionOptions(options: any[] = []) {
  return [...options].sort((leftOption: any, rightOption: any) => {
    const ratingDelta = normalizeQuestionOptionRating(rightOption?.rating) - normalizeQuestionOptionRating(leftOption?.rating);
    if (ratingDelta !== 0) {
      return ratingDelta;
    }
    if (Boolean(rightOption?.isRecommended) !== Boolean(leftOption?.isRecommended)) {
      return Number(Boolean(rightOption?.isRecommended)) - Number(Boolean(leftOption?.isRecommended));
    }
    return String(leftOption?.text || "").localeCompare(String(rightOption?.text || ""));
  });
}

function SendIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M3 11 21 3 13 21 11 13 3 11z" />
      <path d="m11 13 10-10" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M7 18.5 3.5 21v-4.5A7.5 7.5 0 0 1 11 9h5a4.5 4.5 0 0 1 0 9H7z" />
      <path d="M8 13h8" />
      <path d="M8 16h5" />
    </svg>
  );
}

function getQuestionTabLabel(tabId: string = "") {
  return QUESTION_TABS.find((tab) => tab.id === tabId)?.label || "Open";
}

function getDecisionTypeLabel(decisionType: string = "") {
  const normalizedDecisionType = String(decisionType || "").trim().toLowerCase();
  if (normalizedDecisionType === "approval") {
    return "Approval required";
  }
  if (normalizedDecisionType === "direction") {
    return "Direction needed";
  }
  return "Clarification";
}

function getPriorityLabel(priority: string = "") {
  const normalizedPriority = String(priority || "").trim().toLowerCase();
  if (normalizedPriority === "critical") {
    return "Critical priority";
  }
  if (normalizedPriority === "high") {
    return "High priority";
  }
  if (normalizedPriority === "low") {
    return "Low priority";
  }
  return "Normal priority";
}

export function QuestionsPage({
  activeTab,
  questions,
  isLoadingQuestions,
  questionError,
  answeringQuestionId,
  answerDraftByQuestionId,
  questionCountLabel,
  dismissAnswerText,
  onTabChange,
  onAnswerDraftChange,
  onAnswerQuestion,
  onOpenThread,
}: any) {
  const pageActions = useMemo(() => (
    <span className="chat-card-meta">{questionCountLabel}</span>
  ), [questionCountLabel]);
  useSetPageActions(pageActions);

  return (
    <Page><div className="page-stack">
      <section className="panel list-panel">
        <div className="task-view-tabs" role="tablist" aria-label="Question views">
          {QUESTION_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              className={`task-view-tab${activeTab === tab.id ? " task-view-tab-active" : ""}`}
              onClick={() => onTabChange(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <p className="chat-card-meta">{questionCountLabel}</p>
        {questionError ? <p className="error-banner">{questionError}</p> : null}
        {isLoadingQuestions ? <p className="empty-hint">Loading questions...</p> : null}
        {!isLoadingQuestions && !questionError && questions.length === 0 ? (
          <p className="empty-hint">No {activeTab} questions.</p>
        ) : null}

        {questions.length > 0 ? (
          <ul className="chat-card-list">
            {questions.map((question: any) => {
              const answerDraft = String(answerDraftByQuestionId?.[question.id] || "");
              const sortedOptions = sortQuestionOptions(Array.isArray(question?.options) ? question.options : []);
              const isAnswering = answeringQuestionId === question.id;
              const trimmedQuestionText = String(question?.questionText || "").trim() || "Untitled question";
              const decisionType = String(question?.decisionType || "").trim().toLowerCase() || "clarification";
              const priority = String(question?.priority || "").trim().toLowerCase() || "normal";
              const normalizedStatus = String(question?.status || "").trim().toLowerCase();
              const resolvedStatus = normalizedStatus === "completed" || normalizedStatus === "dismissed"
                ? normalizedStatus
                : "open";
              const isOpen = resolvedStatus === "open";
              const answerText = String(question?.answerText || "").trim();
              const responseLabel = resolvedStatus === "dismissed" ? "Dismiss reason" : "Answer";
              const threadId = String(question?.threadId || "").trim();
              const agentId = String(question?.agentId || "").trim();

              return (
                <li key={question.id} className="chat-card question-card">
                  <div className="question-card-header">
                    <div className="chat-card-main question-card-main">
                      <div className="question-card-title-row">
                        <p className="chat-card-title question-card-question">
                          <strong>{trimmedQuestionText}</strong>
                        </p>
                        {threadId ? (
                          <button
                            type="button"
                            className="chat-card-icon-btn"
                            onClick={() => onOpenThread(agentId, threadId)}
                            aria-label="Open thread"
                            title="Open thread"
                          >
                            <ChatIcon />
                          </button>
                        ) : null}
                      </div>
                      <p className="chat-card-meta">Agent: <span>{question?.agentName || "Unknown agent"}</span></p>
                      <p className="chat-card-meta">Thread: <span>{question?.threadTitle || "Untitled thread"}</span></p>
                      <div className="inline-selection-list">
                        <span className="tag-pill">{getDecisionTypeLabel(decisionType)}</span>
                        <span className="tag-pill">{getPriorityLabel(priority)}</span>
                      </div>
                      {decisionType === "approval" ? (
                        <p className="chat-card-meta">This question needs an explicit human decision before the agent proceeds.</p>
                      ) : null}
                      <p className="chat-card-meta">Status: <span>{getQuestionTabLabel(resolvedStatus)}</span></p>
                    </div>
                    {isOpen ? (
                      <button
                        type="button"
                        className="chat-card-icon-btn chat-card-icon-btn-danger"
                        onClick={() => onAnswerQuestion(question.id, dismissAnswerText, "dismissed")}
                        disabled={isAnswering}
                        aria-label={isAnswering ? "Updating question..." : "Dismiss question"}
                        title={isAnswering ? "Updating question..." : "Dismiss question"}
                      >
                        <CloseIcon />
                      </button>
                    ) : null}
                  </div>

                  <div className="question-card-body">
                    {isOpen ? (
                      <>
                        {sortedOptions.length > 0 ? (
                          <ul className="question-option-list">
                            {sortedOptions.map((option: any) => (
                          <li
                            key={option.id}
                            className="question-option-row"
                            onClick={() => onAnswerQuestion(question.id, option.text || "", "completed")}
                            onKeyDown={(event: any) => {
                              if (event.key === "Enter" || event.key === " ") {
                                event.preventDefault();
                                onAnswerQuestion(question.id, option.text || "", "completed");
                              }
                            }}
                            role="button"
                            tabIndex={isAnswering ? -1 : 0}
                          >
                            <div className="question-option-copy">
                              <p className="question-option-text">{option.text || "-"}</p>
                              <div className="question-option-meta">
                                {normalizeQuestionOptionRating(option?.rating) ? (
                                  <span
                                    className="question-option-stars"
                                    aria-label={`${normalizeQuestionOptionRating(option?.rating)} out of 5 stars`}
                                  >
                                    {renderQuestionOptionRatingStars(option?.rating)}
                                  </span>
                                ) : null}
                                {option.isRecommended ? <span className="question-option-recommended">Recommended</span> : null}
                                  </div>
                                </div>
                                <button
                              type="button"
                              className="chat-card-icon-btn"
                              onClick={(event: any) => {
                                event.stopPropagation();
                                onAnswerQuestion(question.id, option.text || "", "completed");
                              }}
                              disabled={isAnswering}
                              aria-label={isAnswering ? "Sending answer..." : `Send answer: ${option.text || ""}`}
                              title={isAnswering ? "Sending answer..." : "Send answer"}
                                >
                                  <SendIcon />
                                </button>
                              </li>
                            ))}
                          </ul>
                        ) : null}

                        <div className="question-answer-form">
                          <div className="question-answer-input-shell">
                            <textarea
                              className="question-answer-input"
                              value={answerDraft}
                              onChange={(event: any) => onAnswerDraftChange(question.id, event.target.value)}
                              placeholder="Write the answer to send back to the agent."
                              disabled={isAnswering}
                              rows={4}
                            />
                            <button
                              type="button"
                              className="chat-card-icon-btn question-answer-submit-btn"
                              onClick={() => onAnswerQuestion(question.id, null, "completed")}
                              disabled={isAnswering || !String(answerDraft || "").trim()}
                              aria-label={isAnswering ? "Sending answer..." : "Send custom answer"}
                              title={isAnswering ? "Sending answer..." : "Send custom answer"}
                            >
                              <SendIcon />
                            </button>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="question-response-panel">
                        <p className="question-response-label">{responseLabel}</p>
                        <p className="question-response-text">
                          {answerText || `No ${getQuestionTabLabel(resolvedStatus).toLowerCase()} response recorded.`}
                        </p>
                        <div className="question-response-actions">
                          <button
                            type="button"
                            className="secondary-btn"
                            onClick={() => onAnswerQuestion(question.id, null, "open")}
                            disabled={isAnswering}
                          >
                            Reopen
                          </button>
                        </div>
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
