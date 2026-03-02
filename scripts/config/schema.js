import { z } from "zod";

export const frontendConfigSchema = z.object({
  server: z.object({
    listeningPort: z.coerce.number().int().positive(),
  }),
  api: z.object({
    graphqlApiUrl: z.string().url(),
  }),
});
