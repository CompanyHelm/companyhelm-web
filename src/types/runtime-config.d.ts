import type { RuntimeConfig } from "../config/schema.ts";

declare global {
  interface Window {
    __COMPANYHELM_CONFIG__?: RuntimeConfig;
  }
}

export {};
