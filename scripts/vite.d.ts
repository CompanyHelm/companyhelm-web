export function parseCliArgs(args: string[]): {
  viteCommand: string;
  configPath: string;
  passthrough: string[];
};
export function buildConfigGenerateArgs(configPath: string): string[];
