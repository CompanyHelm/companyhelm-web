import { z } from "zod";

export const frontendConfigSchema = z.object({
  server: z.object({
    host: z.string().min(1),
    listeningPort: z.coerce.number().int().positive(),
  }),
  api: z.object({
    graphqlApiUrl: z.string().url(),
  }),
  authProvider: z.enum(["companyhelm", "supabase"]),
  auth: z.object({
    companyhelm: z.object({
      tokenStorageKey: z.string().min(1),
    }),
    supabase: z.object({
      tokenStorageKey: z.string().min(1),
      url: z.string().url(),
      anonKey: z.string().min(1),
    }),
  }),
});
