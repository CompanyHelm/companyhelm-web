export function quoteShellArg(value: any) {
  const normalizedValue = String(value ?? "");
  if (/^[A-Za-z0-9_./:-]+$/.test(normalizedValue)) {
    return normalizedValue;
  }
  return `'${normalizedValue.replace(/'/g, `'\"'\"'`)}'`;
}

export function buildRunnerStartCommand({
  backendGrpcTarget,
  runnerSecret,
}: any) {
  return [
    "companyhelm",
    "--server-url",
    quoteShellArg(backendGrpcTarget),
    "--secret",
    quoteShellArg(runnerSecret),
  ].join(" ");
}
