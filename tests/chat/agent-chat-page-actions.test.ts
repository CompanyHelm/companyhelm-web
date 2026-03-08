import assert from "node:assert/strict";
import test from "node:test";
import { resolveChatPageActionVisibility } from "../../src/pages/AgentChatPage.tsx";

test("resolveChatPageActionVisibility hides inert actions when no chat is selected on mobile", () => {
  const visibility = resolveChatPageActionVisibility({
    canChat: false,
    showChatSidebar: true,
    isMobileViewport: true,
  });

  assert.deepEqual(visibility, {
    showChatListToggle: false,
    showSettingsAction: false,
  });
});

test("resolveChatPageActionVisibility shows all conversation actions for an active mobile chat", () => {
  const visibility = resolveChatPageActionVisibility({
    canChat: true,
    showChatSidebar: true,
    isMobileViewport: true,
  });

  assert.deepEqual(visibility, {
    showChatListToggle: true,
    showSettingsAction: true,
  });
});

test("resolveChatPageActionVisibility hides the mobile chat toggle outside the mobile conversation layout", () => {
  assert.deepEqual(
    resolveChatPageActionVisibility({
      canChat: true,
      showChatSidebar: true,
      isMobileViewport: false,
    }),
    {
      showChatListToggle: false,
      showSettingsAction: true,
    },
  );

  assert.deepEqual(
    resolveChatPageActionVisibility({
      canChat: true,
      showChatSidebar: false,
      isMobileViewport: true,
    }),
    {
      showChatListToggle: false,
      showSettingsAction: true,
    },
  );
});
