import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./", import.meta.url)),
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.{test,spec}.{ts,tsx}"],
    exclude: ["tests/e2e/**"],
    clearMocks: true,
    restoreMocks: true,
    /**
     * Prompt 047 — no coverage tooling existed at all before this
     * (confirmed: no `@vitest/coverage-*` package anywhere in
     * `node_modules`/`package.json`). `@vitest/coverage-v8` is Vitest's
     * own official, zero-instrumentation-step provider (reads Node's
     * built-in V8 coverage counters directly — no Istanbul-style source
     * transform, the kind of "heavy dependency" this prompt's own edge
     * case explicitly says to avoid). Not installed here: `package.json`/
     * `yarn.lock` are both outside this prompt's own allowed-files list
     * (only `vitest.config.ts`'s coverage config itself is listed) — see
     * STATUS.md's 047 entry for the exact one-line command a maintainer
     * with `package.json` in scope needs to run
     * (`yarn add -D @vitest/coverage-v8`) before `yarn vitest run
     * --coverage` will do anything but print that same instruction.
     */
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      exclude: ["tests/**", "node_modules/**", "**/*.config.*", ".next/**"],
    },
  },
});
