import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { QuestionsPage } from "../../src/pages/QuestionsPage.tsx";

function renderQuestionsPageMarkup(overrides: Record<string, unknown> = {}) {
  return renderToStaticMarkup(
    React.createElement(QuestionsPage, {
      questions: [
        {
          id: "question-1",
          questionText: "How should we roll out this feature?",
          agentName: "Planner Agent",
          threadTitle: "Launch planning",
          options: [
            {
              id: "option-1",
              text: "Release to everyone today",
              rank: "bad",
              isRecommended: false,
            },
            {
              id: "option-2",
              text: "Start with the beta cohort",
              rank: "excellent",
              isRecommended: true,
            },
          ],
        },
      ],
      isLoadingQuestions: false,
      questionError: "",
      answeringQuestionId: "",
      answerDraftByQuestionId: {
        "question-1": "Start with the beta cohort",
      },
      questionCountLabel: "1 open question",
      onAnswerDraftChange: () => {},
      onAnswerQuestion: () => {},
      ...overrides,
    }),
  );
}

test("QuestionsPage renders ranked proposed answers and the answer form below them", () => {
  const markup = renderQuestionsPageMarkup();

  assert.match(markup, />1 open question</);
  assert.match(markup, />How should we roll out this feature\?</);
  assert.match(markup, />Planner Agent</);
  assert.match(markup, />Launch planning</);
  assert.match(markup, /Recommended/);
  assert.match(markup, /excellent/);
  assert.match(markup, /bad/);
  assert.match(markup, /Start with the beta cohort[\s\S]*Release to everyone today/);
  assert.match(markup, /textarea/);
  assert.match(markup, /Send answer/);
});

test("QuestionsPage renders loading and empty states", () => {
  const loadingMarkup = renderQuestionsPageMarkup({
    isLoadingQuestions: true,
    questions: [],
  });
  assert.match(loadingMarkup, /Loading questions\.\.\./);

  const emptyMarkup = renderQuestionsPageMarkup({
    isLoadingQuestions: false,
    questions: [],
    questionCountLabel: "No open questions",
  });
  assert.match(emptyMarkup, /No open questions\./);
});
