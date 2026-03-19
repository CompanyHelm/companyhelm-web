import { useMemo, useRef } from "react";
import { Page } from "../components/Page.tsx";
import { useSetPageActions } from "../components/PageActionsContext.tsx";

const OPTION_RANK_ORDER = {
  excellent: 5,
  good: 4,
  average: 3,
  bad: 2,
  atrocious: 1,
};

function getOptionRankValue(rank: any) {
  const normalizedRank = String(rank || "").trim().toLowerCase();
  return OPTION_RANK_ORDER[normalizedRank as keyof typeof OPTION_RANK_ORDER] || 0;
}

function sortQuestionOptions(options: any[] = []) {
  return [...options].sort((leftOption: any, rightOption: any) => {
    const rankDelta = getOptionRankValue(rightOption?.rank) - getOptionRankValue(leftOption?.rank);
    if (rankDelta !== 0) {
      return rankDelta;
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

export function QuestionsPage({
  questions,
  isLoadingQuestions,
  questionError,
  answeringQuestionId,
  answerDraftByQuestionId,
  questionCountLabel,
  dismissAnswerText,
  onAnswerDraftChange,
  onAnswerQuestion,
}: any) {
  const answerInputByQuestionIdRef = useRef<Record<string, HTMLTextAreaElement | null>>({});
  const pageActions = useMemo(() => (
    <span className="chat-card-meta">{questionCountLabel}</span>
  ), [questionCountLabel]);
  useSetPageActions(pageActions);

  function handleQuestionCardClick(questionId: string, event: any) {
    const target = event?.target;
    if (target instanceof Element && target.closest("button, textarea")) {
      return;
    }
    answerInputByQuestionIdRef.current[String(questionId || "")]?.focus();
  }

  return (
    <Page><div className="page-stack">
      <section className="panel list-panel">
        <p className="chat-card-meta">{questionCountLabel}</p>
        {questionError ? <p className="error-banner">{questionError}</p> : null}
        {isLoadingQuestions ? <p className="empty-hint">Loading questions...</p> : null}
        {!isLoadingQuestions && !questionError && questions.length === 0 ? (
          <p className="empty-hint">No open questions.</p>
        ) : null}

        {questions.length > 0 ? (
          <ul className="chat-card-list">
            {questions.map((question: any) => {
              const answerDraft = String(answerDraftByQuestionId?.[question.id] || "");
              const sortedOptions = sortQuestionOptions(Array.isArray(question?.options) ? question.options : []);
              const isAnswering = answeringQuestionId === question.id;
              const trimmedQuestionText = String(question?.questionText || "").trim() || "Untitled question";

              return (
                <li
                  key={question.id}
                  className="chat-card question-card"
                  onClick={(event: any) => handleQuestionCardClick(question.id, event)}
                >
                  <div className="question-card-header">
                    <div className="chat-card-main question-card-main">
                      <p className="chat-card-title question-card-question">
                        <strong>{trimmedQuestionText}</strong>
                      </p>
                      <p className="chat-card-meta">Agent: <span>{question?.agentName || "Unknown agent"}</span></p>
                      <p className="chat-card-meta">Thread: <span>{question?.threadTitle || "Untitled thread"}</span></p>
                    </div>
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
                  </div>

                  <div className="question-card-body">
                    {sortedOptions.length > 0 ? (
                      <ul className="question-option-list">
                        {sortedOptions.map((option: any) => (
                          <li key={option.id} className="question-option-row">
                            <div className="question-option-copy">
                              <p className="question-option-text">{option.text || "-"}</p>
                              <div className="question-option-meta">
                                {option.rank ? <span className="question-option-rank">{option.rank}</span> : null}
                                {option.isRecommended ? <span className="question-option-recommended">Recommended</span> : null}
                              </div>
                            </div>
                            <button
                              type="button"
                              className="chat-card-icon-btn"
                              onClick={() => onAnswerQuestion(question.id, option.text || "", "completed")}
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
                          ref={(element) => {
                            answerInputByQuestionIdRef.current[String(question.id || "")] = element;
                          }}
                          value={answerDraft}
                          onChange={(event: any) => onAnswerDraftChange(question.id, event.target.value)}
                          placeholder="Write the answer to send back to the agent."
                          disabled={isAnswering}
                          rows={4}
                        />
                        <div className="question-answer-actions">
                          <button
                            type="button"
                            className="chat-card-icon-btn"
                            onClick={() => onAnswerQuestion(question.id, null, "completed")}
                            disabled={isAnswering || !String(answerDraft || "").trim()}
                            aria-label={isAnswering ? "Sending answer..." : "Send custom answer"}
                            title={isAnswering ? "Sending answer..." : "Send custom answer"}
                          >
                            <SendIcon />
                          </button>
                        </div>
                      </div>
                    </div>
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
