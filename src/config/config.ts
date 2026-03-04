import { z } from "zod";
import { getDevelopmentConfig } from "./development";

export const configSchema = z.object({
  api: z.object({
    graphqlApiUrl: z.string().url(),
    runnerGrpcTarget: z.string().min(1),
  }),
  auth: z.object({
    provider: z.enum(["companyhelm", "supabase"]),
    companyhelm: z.object({
      tokenStorageKey: z.string().min(1),
    }),
    supabase: z
      .object({
        url: z.string().url(),
        anonKey: z.string().min(1),
        tokenStorageKey: z.string().min(1),
      })
      .optional(),
  }),
});


export type Config = z.infer<typeof configSchema>;

export function getConfig(): Config {
  if (import.meta.env.VITE_MODE === "development") {
    return getDevelopmentConfig();
  }
  return configSchema.parse(process.env.CONFIG);
}