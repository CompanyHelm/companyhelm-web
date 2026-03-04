import { z } from "zod";

export const runtimeConfigSchema = z
  .object({
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
  })
  .superRefine((config: any, ctx: any) => {
    if (config.auth.provider === "supabase" && !config.auth.supabase) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["auth", "supabase"],
        message: "Supabase auth provider requires auth.supabase configuration.",
      });
    }
  });
