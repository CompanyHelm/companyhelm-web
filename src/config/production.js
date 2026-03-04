import { runtimeConfigSchema } from "./schema.js";

export function getProductionConfig() {
  return runtimeConfigSchema.parse({
    api: {
      graphqlApiUrl: "http://127.0.0.1:4000/graphql",
      runnerGrpcTarget: "localhost:50051",
    },
    auth: {
      provider: "companyhelm",
      companyhelm: {
        tokenStorageKey: "companyhelm.auth.token",
      },
      supabase: {
        url: "https://your-project-ref.supabase.co",
        anonKey: "your-supabase-anon-key",
        tokenStorageKey: "supabase.auth.token",
      },
    },
  });
}
