import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    projects: ["./vitest.config.jsdom.ts", "./vitest.config.workers.ts"],
  },
});
