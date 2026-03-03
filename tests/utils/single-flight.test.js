import assert from "node:assert/strict";
import test from "node:test";
import { createSingleFlightByKey } from "../../src/utils/single-flight.js";

test("createSingleFlightByKey deduplicates concurrent calls with the same key", async () => {
  const runSingleFlight = createSingleFlightByKey();
  let invocationCount = 0;

  const task = async () => {
    invocationCount += 1;
    await new Promise((resolve) => setTimeout(resolve, 10));
    return `result-${invocationCount}`;
  };

  const [firstResult, secondResult] = await Promise.all([
    runSingleFlight("thread-create", task),
    runSingleFlight("thread-create", task),
  ]);

  assert.equal(invocationCount, 1);
  assert.equal(firstResult, "result-1");
  assert.equal(secondResult, "result-1");
});

test("createSingleFlightByKey runs calls independently for different keys", async () => {
  const runSingleFlight = createSingleFlightByKey();
  let invocationCount = 0;

  const createTask = (value) => async () => {
    invocationCount += 1;
    await new Promise((resolve) => setTimeout(resolve, 10));
    return value;
  };

  const [firstResult, secondResult] = await Promise.all([
    runSingleFlight("thread-create-1", createTask("one")),
    runSingleFlight("thread-create-2", createTask("two")),
  ]);

  assert.equal(invocationCount, 2);
  assert.equal(firstResult, "one");
  assert.equal(secondResult, "two");
});

test("createSingleFlightByKey clears the key after rejection", async () => {
  const runSingleFlight = createSingleFlightByKey();
  let invocationCount = 0;

  await assert.rejects(
    Promise.all([
      runSingleFlight("thread-create", async () => {
        invocationCount += 1;
        throw new Error("create failed");
      }),
      runSingleFlight("thread-create", async () => {
        invocationCount += 1;
        throw new Error("create failed");
      }),
    ]),
    /create failed/,
  );

  await assert.rejects(
    runSingleFlight("thread-create", async () => {
      invocationCount += 1;
      throw new Error("create failed again");
    }),
    /create failed again/,
  );

  assert.equal(invocationCount, 2);
});
