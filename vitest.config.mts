import { fileURLToPath } from "node:url";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    tsconfigPaths: true,
    alias: {
      // `server-only` throws outside a React Server environment; stub it in tests.
      "server-only": fileURLToPath(
        new URL("./src/test/server-only-stub.ts", import.meta.url),
      ),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    exclude: ["node_modules", "e2e/**", ".next/**"],
    css: false,
    clearMocks: true,
    restoreMocks: true,
    coverage: {
      provider: "v8",
      reporter: ["text-summary", "html", "lcov"],
      include: ["src/**/*.{ts,tsx}"],
      // Excluded: code that only runs inside the Next.js runtime (covered by E2E)
      // and declarations with no logic.
      exclude: [
        "src/**/*.test.{ts,tsx}",
        "src/**/__tests__/**",
        "src/test/**",
        "src/app/**",
        "src/proxy.ts",
        "src/instrumentation.ts",
        "src/config/**",
        "src/features/*/actions/**",
        "src/features/*/queries/**",
        "src/components/providers/**",
        "src/components/icons.tsx",
        "src/**/index.ts",
        "src/**/server.ts",
        "src/**/types.ts",
      ],
      // CI fails if coverage drops below these. Raise them as the suite grows;
      // never lower them to make a PR pass.
      thresholds: {
        statements: 90,
        branches: 85,
        functions: 90,
        lines: 90,
      },
    },
  },
});
