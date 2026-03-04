import { configSchema } from "./config";


export function getDevelopmentConfig() {
    return configSchema.parse({
        api: {
          graphqlApiUrl: "http://127.0.0.1:4000/graphql",
          runnerGrpcTarget: "localhost:50051",
        },
        auth: {
            provider: "companyhelm",
            companyhelm: {
              tokenStorageKey: "companyhelm.auth.token",
            },
        },
      });
}
