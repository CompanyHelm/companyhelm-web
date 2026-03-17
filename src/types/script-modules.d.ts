declare module "../../scripts/start-preview-container.js" {
  export function buildPreviewBuildCommandArgs(configPath: string): string[];
  export function buildPreviewServeCommandArgs(port: string): string[];
  export function resolveContainerConfigPath(env: Record<string, string | undefined>): string;
  export function resolvePreviewPort(env: Record<string, string | undefined>): string;
}

declare module "../../scripts/vite.js" {
  export function parseCliArgs(args: string[]): {
    viteCommand: string;
    configPath: string;
    passthrough: string[];
  };
  export function buildConfigGenerateArgs(configPath: string): string[];
}
