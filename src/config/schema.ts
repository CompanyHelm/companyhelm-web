import { z } from "zod";

const runtimeConfigBaseSchema = z
  .object({
    api: z.object({
      graphqlApiUrl: z.string().url(),
      graphqlWebSocketUrl: z.string().min(1).optional(),
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
  })
  .superRefine((config, ctx) => {
    if (config.auth.provider === "supabase" && !config.auth.supabase) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["auth", "supabase"],
        message: "Supabase auth provider requires auth.supabase configuration.",
      });
    }
  });

export const runtimeConfigSchema = runtimeConfigBaseSchema;
export type RuntimeConfig = z.infer<typeof runtimeConfigSchema>;
