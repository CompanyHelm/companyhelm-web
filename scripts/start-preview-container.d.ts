export function resolveContainerConfigPath(env?: Record<string, string | undefined>): string;
export function resolvePreviewPort(env?: Record<string, string | undefined>): string;
export function buildPreviewBuildCommandArgs(configPath: string): string[];
export function buildPreviewServeCommandArgs(port: string): string[];
export function main(env?: Record<string, string | undefined>): Promise<void>;
