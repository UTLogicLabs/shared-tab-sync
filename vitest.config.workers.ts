import { cloudflareTest } from "@cloudflare/vitest-pool-workers";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [
    cloudflareTest({
      main: "./workers/test-entry.ts",
      wrangler: { configPath: "./wrangler.toml" },
    }),
  ],
  test: {
    name: "workers",
    include: ["tests/durable-objects/**/*.test.ts"],
  },
});
