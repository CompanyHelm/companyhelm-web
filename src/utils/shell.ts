export function quoteShellArg(value: any) {
  const normalizedValue = String(value ?? "");
  if (/^[A-Za-z0-9_./:-]+$/.test(normalizedValue)) {
    return normalizedValue;
  }
  return `'${normalizedValue.replace(/'/g, `'\"'\"'`)}'`;
}

interface BuildRunnerStartCommandOptions {
  runnerSecret: string;
  useHostDockerRuntime?: boolean;
  useDedicatedAuth?: boolean;
  daemon?: boolean;
}

export function buildRunnerStartCommand({
  runnerSecret,
  useHostDockerRuntime = false,
  useDedicatedAuth = false,
  daemon = false,
}: BuildRunnerStartCommandOptions) {
  const parts = [
    "npx",
    "@companyhelm/runner",
    "start",
  ];

  if (useHostDockerRuntime) {
    parts.push("--use-host-docker-runtime");
  }

  if (useDedicatedAuth) {
    parts.push("--use-dedicated-auth");
  }

  parts.push("--secret", quoteShellArg(runnerSecret));

  if (daemon) {
    parts.push("--daemon");
  }

  return parts.join(" ");
}
