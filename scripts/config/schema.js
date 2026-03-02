import { z } from "zod";

export const frontendConfigSchema = z.object({
  server: z.object({
    host: z.string().min(1),
    listeningPort: z.coerce.number().int().positive(),
  }),
  api: z.object({
    graphqlApiUrl: z.string().url(),
  }),
});
