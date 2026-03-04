export function quoteShellArg(value) {
  const normalizedValue = String(value ?? "");
  if (/^[A-Za-z0-9_./:-]+$/.test(normalizedValue)) {
    return normalizedValue;
  }
  return `'${normalizedValue.replace(/'/g, `'\"'\"'`)}'`;
}

export function buildRunnerStartCommand({
  backendGrpcTarget,
  runnerSecret,
}) {
  return [
    "companyhelm",
    "--server-url",
    quoteShellArg(backendGrpcTarget),
    "--secret",
    quoteShellArg(runnerSecret),
  ].join(" ");
}
