import { normalizeEnvironment } from "./config.js";

export function parseCliEnvironmentArgument(argv) {
  let environment;

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (!argument) {
      continue;
    }

    if (argument === "--environment") {
      const value = argv[index + 1];
      if (!value || value.startsWith("-")) {
        throw new Error("Missing value for --environment.");
      }
      environment = value;
      index += 1;
      continue;
    }

    if (argument.startsWith("--environment=")) {
      const value = argument.slice("--environment=".length).trim();
      if (!value) {
        throw new Error("Missing value for --environment.");
      }
      environment = value;
    }
  }

  if (!environment) {
    throw new Error("Missing required --environment <name> CLI argument.");
  }

  return normalizeEnvironment(environment);
}

export function stripEnvironmentArguments(argv) {
  const args = [];

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (!argument) {
      continue;
    }

    if (argument === "--environment") {
      index += 1;
      continue;
    }

    if (argument.startsWith("--environment=")) {
      continue;
    }

    args.push(argument);
  }

  return args;
}
