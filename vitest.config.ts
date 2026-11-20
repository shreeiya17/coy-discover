import { defineConfig } from "vitest/config";

export default defineConfig({
  test: { env: { COY_DB_PATH: ":memory:" }, include: ["src/**/*.test.ts"] },
});