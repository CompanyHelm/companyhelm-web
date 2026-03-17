import assert from "node:assert/strict";
import test from "node:test";
import { subscribeRelayGraphQL } from "../../src/relay/client.ts";
import { setActiveCompanyId } from "../../src/utils/company-context.ts";
import { AGENT_RUNNERS_SUBSCRIPTION } from "../../src/utils/graphql.ts";

type EventHandler = (...args: any[]) => void;
type GlobalWithWindow = typeof globalThis & { window?: unknown; WebSocket?: typeof WebSocket };

class MockWebSocket {
  static readonly CONNECTING = 0;
  static readonly OPEN = 1;
  static readonly CLOSING = 2;
  static readonly CLOSED = 3;

  readonly listeners = new Map<string, EventHandler[]>();
  readyState = MockWebSocket.CONNECTING;

  addEventListener(type: string, handler: EventHandler) {
    const handlers = this.listeners.get(type) || [];
    handlers.push(handler);
    this.listeners.set(type, handlers);
  }

  send() {}

  close(code?: number) {
    if (code === 1012) {
      throw new DOMException(
        "Failed to execute 'close' on 'WebSocket': The close code must be either 1000, or between 3000 and 4999. 1012 is neither.",
      );
    }
    this.readyState = MockWebSocket.CLOSED;
    for (const handler of this.listeners.get("close") || []) {
      handler();
    }
  }
}

test("switching company-scoped subscriptions does not throw when rotating the websocket", () => {
  const testGlobal = globalThis as GlobalWithWindow;
  const originalWindow = testGlobal.window;
  const originalWebSocket = testGlobal.WebSocket;
  const errors: string[] = [];
  let unsubscribeSecond = () => {};

  try {
    testGlobal.window = {} as unknown as Window & typeof globalThis;
    testGlobal.WebSocket = MockWebSocket as unknown as typeof WebSocket;

    setActiveCompanyId("company-1");
    const unsubscribeFirst = subscribeRelayGraphQL({
      query: AGENT_RUNNERS_SUBSCRIPTION,
      variables: { first: 20 },
      onData() {},
      onError(error) {
        errors.push(String(error?.message || error));
      },
    });

    setActiveCompanyId("company-2");
    unsubscribeSecond = subscribeRelayGraphQL({
      query: AGENT_RUNNERS_SUBSCRIPTION,
      variables: { first: 20 },
      onData() {},
      onError(error) {
        errors.push(String(error?.message || error));
      },
    });
    assert.deepEqual(errors, []);

    unsubscribeFirst();
    unsubscribeSecond();
  } finally {
    setActiveCompanyId("");
    if (typeof originalWindow === "undefined") {
      Reflect.deleteProperty(testGlobal, "window");
    } else {
      testGlobal.window = originalWindow;
    }
    if (typeof originalWebSocket === "undefined") {
      Reflect.deleteProperty(testGlobal, "WebSocket");
    } else {
      testGlobal.WebSocket = originalWebSocket;
    }
  }
});
