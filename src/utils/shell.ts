export function quoteShellArg(value: any) {
  const normalizedValue = String(value ?? "");
  if (/^[A-Za-z0-9_./:-]+$/.test(normalizedValue)) {
    return normalizedValue;
  }
  return `'${normalizedValue.replace(/'/g, `'\"'\"'`)}'`;
}

interface BuildRunnerStartCommandOptions {
  runnerSecret: string;
  daemon?: boolean;
}

export function buildRunnerStartCommand({
  runnerSecret,
  daemon = false,
}: BuildRunnerStartCommandOptions) {
  const parts = [
    "npx",
    "@companyhelm/runner",
    "start",
  ];

  parts.push("--secret", quoteShellArg(runnerSecret));

  if (daemon) {
    parts.push("--daemon");
  }

  return parts.join(" ");
}
