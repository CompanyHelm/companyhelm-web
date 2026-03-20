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
      activeTab: "open",
      questions: [
        {
          id: "question-1",
          agentId: "agent-1",
          threadId: "thread-1",
          questionText: "How should we roll out this feature?",
          decisionType: "approval",
          priority: "critical",
          agentName: "Planner Agent",
          threadTitle: "Launch planning",
          status: "open",
          options: [
            {
              id: "option-1",
              text: "Release to everyone today",
              rating: 2,
              isRecommended: false,
            },
            {
              id: "option-2",
              text: "Start with the beta cohort",
              rating: 5,
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
      onTabChange: () => {},
      onAnswerDraftChange: () => {},
      onAnswerQuestion: () => {},
      onOpenThread: () => {},
      dismissAnswerText: "user didnt' respond to question",
      ...overrides,
    }),
  );
}

test("QuestionsPage renders tabs and open-question actions", () => {
  const markup = renderQuestionsPageMarkup();

  assert.match(markup, />Open</);
  assert.match(markup, />Completed</);
  assert.match(markup, />Dismissed</);
  assert.match(markup, />1 open question</);
  assert.match(markup, />How should we roll out this feature\?</);
  assert.match(markup, />Planner Agent</);
  assert.match(markup, />Launch planning</);
  assert.match(markup, />Approval required</);
  assert.match(markup, />Critical priority</);
  assert.match(markup, /This question needs an explicit human decision before the agent proceeds\./);
  assert.match(markup, />Status: <span>Open</);
  assert.match(markup, /Open thread/);
  assert.match(markup, /Send custom answer/);
  assert.match(markup, /Dismiss question/);
  assert.match(markup, /Recommended/);
  assert.match(markup, /★★★★★/);
  assert.match(markup, /★★☆☆☆/);
  assert.match(markup, /Start with the beta cohort[\s\S]*Release to everyone today/);
  assert.match(markup, /textarea/);
  assert.doesNotMatch(markup, /question-response-panel/);
});

test("QuestionsPage renders completed questions as read-only history", () => {
  const markup = renderQuestionsPageMarkup({
    activeTab: "completed",
    questions: [
      {
        id: "question-1",
        questionText: "How should we roll out this feature?",
        decisionType: "approval",
        priority: "high",
        agentName: "Planner Agent",
        threadTitle: "Launch planning",
        status: "completed",
        answerText: "Start with the beta cohort",
        options: [],
      },
    ],
    questionCountLabel: "1 completed question",
  });

  assert.match(markup, />1 completed question</);
  assert.match(markup, />Approval required</);
  assert.match(markup, />High priority</);
  assert.match(markup, />Status: <span>Completed</);
  assert.match(markup, />Answer</);
  assert.match(markup, />Start with the beta cohort</);
  assert.match(markup, />Reopen</);
  assert.match(markup, /question-response-panel/);
  assert.doesNotMatch(markup, /textarea/);
  assert.doesNotMatch(markup, /Dismiss question/);
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

  const dismissedEmptyMarkup = renderQuestionsPageMarkup({
    activeTab: "dismissed",
    isLoadingQuestions: false,
    questions: [],
    questionCountLabel: "No dismissed questions",
  });
  assert.match(dismissedEmptyMarkup, /No dismissed questions\./);
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
  assert.match(questionsPageSource, /onClick=\{\(\) => onAnswerQuestion\(question\.id, option\.text \|\| "", "completed"\)\}/);
  assert.match(questionsPageSource, /onClick=\{\(\) => onAnswerQuestion\(question\.id, dismissAnswerText, "dismissed"\)\}/);
  assert.match(questionsPageSource, /onClick=\{\(\) => onAnswerQuestion\(question\.id, null, "open"\)\}/);
  assert.match(questionsPageSource, /onClick=\{\(\) => onOpenThread\(agentId, threadId\)\}/);
  assert.match(questionsPageSource, /className="chat-card-icon-btn question-answer-submit-btn"/);
  assert.match(questionsPageSource, /This question needs an explicit human decision before the agent proceeds\./);
});

test("App supports tab deep links and status-aware question responses", () => {
  assert.match(appSource, /const \[questionsTab, setQuestionsTab\] = useState<any>\(\(\) => getQuestionsTabFromPathname\(\)\);/);
  assert.match(appSource, /onTabChange=\{\(tab: "open" \| "completed" \| "dismissed"\) => setBrowserPath\(getQuestionsPath\(\{ tab \}\)\)\}/);
  assert.match(appSource, /async function handleAnswerQuestion\(questionId: any, answerOverride: any = null, status: any = "completed"\)/);
  assert.match(appSource, /const answerText = String\(\(answerOverride \?\? answerDraftByQuestionId\?\.\[normalizedQuestionId\]\) \|\| ""\)\.trim\(\);/);
  assert.match(appSource, /const normalizedStatus = String\(status \|\| "completed"\)\.trim\(\)\.toLowerCase\(\);/);
  assert.match(appSource, /if \(normalizedStatus !== "open" && !answerText\)/);
  assert.match(appSource, /answerText: normalizedStatus === "open" \? null : answerText,/);
  assert.match(appSource, /status: normalizedStatus,/);
  assert.match(appSource, /decisionType: String\(question\?\.decisionType \|\| ""\)\.trim\(\) \|\| "clarification"/);
  assert.match(appSource, /priority: String\(question\?\.priority \|\| ""\)\.trim\(\) \|\| "normal"/);
  assert.match(appSource, /onOpenThread=\{\(agentId: string, threadId: string\) => navigateToChatsConversation\(\{ agentId, threadId \}\)\}/);
  assert.doesNotMatch(appSource, /LIST_AGENT_QUESTIONS_QUERY,\s*\{\s*companyId: selectedCompanyId,\s*status: "open"/);
});
