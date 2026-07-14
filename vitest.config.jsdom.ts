import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    name: "jsdom",
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    globals: true,
    include: ["tests/**/*.{test,spec}.{ts,tsx}"],
    exclude: ["tests/durable-objects/**", "tests/integration/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov", "html"],
      include: ["app/**/*.{ts,tsx}"],
      exclude: ["app/**/*.d.ts", "app/entry.*.tsx", "app/routes.ts"],
    },
  },
  resolve: {
    alias: { "~": new URL("./app", import.meta.url).pathname },
  },
});
