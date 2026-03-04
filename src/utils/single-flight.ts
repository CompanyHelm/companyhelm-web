export function createSingleFlightByKey() {
  const inFlightByKey = new Map<any, any>();

  return async function runSingleFlight(key: any, task: any) {
    const resolvedKey = String(key || "").trim();
    if (!resolvedKey) {
      throw new Error("Single-flight key is required.");
    }
    if (typeof task !== "function") {
      throw new Error("Single-flight task must be a function.");
    }

    const existingTaskPromise = inFlightByKey.get(resolvedKey);
    if (existingTaskPromise) {
      return existingTaskPromise;
    }

    const taskPromise = Promise.resolve().then(() => task());
    inFlightByKey.set(resolvedKey, taskPromise);

    try {
      return await taskPromise;
    } finally {
      if (inFlightByKey.get(resolvedKey) === taskPromise) {
        inFlightByKey.delete(resolvedKey);
      }
    }
  };
}
