import { useMemo } from "react";
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

export function QuestionsPage({
  questions,
  isLoadingQuestions,
  questionError,
  answeringQuestionId,
  answerDraftByQuestionId,
  questionCountLabel,
  onAnswerDraftChange,
  onAnswerQuestion,
}: any) {
  const pageActions = useMemo(() => (
    <span className="chat-card-meta">{questionCountLabel}</span>
  ), [questionCountLabel]);
  useSetPageActions(pageActions);

  return (
    <Page><div className="page-stack">
      <section className="panel list-panel">
        <p className="chat-card-meta">{questionCountLabel}</p>
        {questionError ? <p className="error-banner">{questionError}</p> : null}
        {isLoadingQuestions ? <p className="empty-hint">Loading questions...</p> : null}
        {!isLoadingQuestions && questions.length === 0 ? (
          <p className="empty-hint">No open questions.</p>
        ) : null}

        {questions.length > 0 ? (
          <ul className="chat-card-list">
            {questions.map((question: any) => {
              const answerDraft = String(answerDraftByQuestionId?.[question.id] || "");
              const sortedOptions = sortQuestionOptions(Array.isArray(question?.options) ? question.options : []);
              const isAnswering = answeringQuestionId === question.id;

              return (
                <li key={question.id} className="chat-card question-card">
                  <div className="chat-card-main">
                    <p className="chat-card-title">
                      <strong>{String(question?.questionText || "").trim() || "Untitled question"}</strong>
                    </p>
                    <p className="chat-card-meta">Agent: <span>{question?.agentName || "Unknown agent"}</span></p>
                    <p className="chat-card-meta">Thread: <span>{question?.threadTitle || "Untitled thread"}</span></p>
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
                              className="secondary-btn"
                              onClick={() => onAnswerDraftChange(question.id, option.text || "")}
                              disabled={isAnswering}
                            >
                              Use answer
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : null}

                    <div className="question-answer-form">
                      <textarea
                        className="question-answer-input"
                        value={answerDraft}
                        onChange={(event: any) => onAnswerDraftChange(question.id, event.target.value)}
                        placeholder="Write the answer to send back to the agent."
                        disabled={isAnswering}
                        rows={4}
                      />
                      <div className="question-answer-actions">
                        <button
                          type="button"
                          className="secondary-btn"
                          onClick={() => onAnswerQuestion(question.id)}
                          disabled={isAnswering || !String(answerDraft || "").trim()}
                        >
                          {isAnswering ? "Sending..." : "Send answer"}
                        </button>
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
