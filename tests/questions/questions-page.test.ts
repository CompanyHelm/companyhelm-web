import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { QuestionsPage } from "../../src/pages/QuestionsPage.tsx";

const questionsPageSource = readFileSync(
  new URL("../../src/pages/QuestionsPage.tsx", import.meta.url),
  "utf8",
);

const appSource = readFileSync(
  new URL("../../src/App.tsx", import.meta.url),
  "utf8",
);

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
      dismissAnswerText: "user didnt' respond to question",
      ...overrides,
    }),
  );
}

test("QuestionsPage renders the full question copy with answer actions before the option list", () => {
  const markup = renderQuestionsPageMarkup();

  assert.match(markup, />1 open question</);
  assert.match(markup, />How should we roll out this feature\?</);
  assert.match(markup, />Planner Agent</);
  assert.match(markup, />Launch planning</);
  assert.match(markup, /Send custom answer/);
  assert.match(markup, /Dismiss/);
  assert.match(markup, /Recommended/);
  assert.match(markup, /excellent/);
  assert.match(markup, /bad/);
  assert.match(markup, /question-answer-form[\s\S]*question-option-list/);
  assert.match(markup, /Start with the beta cohort[\s\S]*Release to everyone today/);
  assert.match(markup, /textarea/);
  assert.doesNotMatch(markup, /Use answer/);
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

test("QuestionsPage does not show the empty state when loading failed", () => {
  const errorMarkup = renderQuestionsPageMarkup({
    isLoadingQuestions: false,
    questions: [],
    questionError: "Failed query: select ...",
    questionCountLabel: "No open questions",
  });

  assert.match(errorMarkup, /Failed query: select \.\.\./);
  assert.doesNotMatch(errorMarkup, /No open questions\./);
});

test("QuestionsPage sends canned responses directly from option and dismiss buttons", () => {
  assert.match(questionsPageSource, /onClick=\{\(\) => onAnswerQuestion\(question\.id, option\.text \|\| ""\)\}/);
  assert.match(questionsPageSource, /onClick=\{\(\) => onAnswerQuestion\(question\.id, dismissAnswerText\)\}/);
});

test("App accepts an immediate answer override for question responses", () => {
  assert.match(appSource, /async function handleAnswerQuestion\(questionId: any, answerOverride: any = null\)/);
  assert.match(appSource, /const answerText = String\(\(answerOverride \?\? answerDraftByQuestionId\?\.\[normalizedQuestionId\]\) \|\| ""\)\.trim\(\);/);
});
