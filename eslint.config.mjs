// @ts-check
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier/flat";
import simpleImportSort from "eslint-plugin-simple-import-sort";

/* ═══════════════════════════════════════════════════════════════════════════
 * 1. VENDOR ADAPTERS
 *
 * Each third-party library may be imported ONLY by its adapter file(s).
 * Everything else imports the adapter. Replacing or upgrading a library is
 * then a change to one place. See docs/dependencies.md.
 *
 * To add a library: add a row here, create the adapter, document it.
 * ═════════════════════════════════════════════════════════════════════════ */
/** @type {{ packages: string[]; adapters: string[]; use: string }[]} */
const VENDOR_ADAPTERS = [
  {
    packages: ["zod"],
    adapters: ["src/lib/validation.ts"],
    use: "`z`, `validate` and `InferOutput` from `@/lib/validation`",
  },
  {
    packages: ["@t3-oss/env-nextjs"],
    adapters: ["src/config/env.ts"],
    use: "`env` from `@/config/env`",
  },
  {
    packages: ["lucide-react"],
    adapters: ["src/components/icons.tsx"],
    use: "semantic icons from `@/components/icons`",
  },
  {
    packages: ["next-themes"],
    adapters: ["src/components/providers/theme-provider.tsx", "src/hooks/use-theme.ts"],
    use: "`useTheme` from `@/hooks/use-theme`",
  },
  {
    packages: ["clsx", "tailwind-merge"],
    adapters: ["src/lib/utils.ts"],
    use: "`cn` from `@/lib/utils`",
  },
  {
    packages: ["class-variance-authority"],
    adapters: ["src/lib/variants.ts"],
    use: "`variants` from `@/lib/variants`",
  },
  {
    packages: ["@testing-library/*"],
    adapters: ["src/test/**"],
    use: "helpers from `@/test/utils`",
  },
  {
    packages: ["@playwright/test"],
    adapters: ["e2e/fixtures.ts", "e2e/pages/**", "playwright.config.ts"],
    use: "`test` and `expect` from `./fixtures`",
  },
];

/** Framework APIs that also go through an adapter (named imports only). */
const RESTRICTED_NAMED_IMPORTS = [
  {
    name: "next/cache",
    importNames: [
      "cacheLife",
      "cacheTag",
      "updateTag",
      "revalidateTag",
      "revalidatePath",
    ],
    adapters: ["src/lib/cache.ts"],
    message:
      "Use `applyCachePolicy`, `expireCacheTags` or `refreshCacheTagsInBackground` from `@/lib/cache`.",
  },
];

/* ═══════════════════════════════════════════════════════════════════════════
 * 2. ARCHITECTURE LAYERS (see docs/architecture.md)
 *
 *   app  ──▶  features  ──▶  shared (components, hooks, lib, config)
 * ═════════════════════════════════════════════════════════════════════════ */
const featureInternals = {
  group: ["@/features/*/*", "!@/features/*/server"],
  message:
    "Import a feature through its public API (`@/features/<name>` or `@/features/<name>/server`), not its internals.",
};
const noAppLayer = (who) => ({
  group: ["@/app/*", "@/app/**"],
  message: `${who} must not depend on the app/ routing layer.`,
});

const LAYERS = [
  { files: ["**/*.{ts,tsx,mts,mjs,js}"], patterns: [featureInternals] },
  {
    files: [
      "src/components/**",
      "src/hooks/**",
      "src/lib/**",
      "src/config/**",
      "src/test/**",
    ],
    patterns: [
      {
        group: ["@/features/*", "@/features/**"],
        message: "Shared code must not depend on features.",
      },
      noAppLayer("Shared code"),
    ],
  },
  { files: ["src/features/**"], patterns: [featureInternals, noAppLayer("Features")] },
];

/* ═══════════════════════════════════════════════════════════════════════════
 * 3. COMPOSE `no-restricted-imports`
 *
 * Flat config replaces a rule's options wholesale for each matching block, so
 * every block must carry the full set: layer patterns + vendor rules, minus
 * the vendors that file is allowed to use.
 * ═════════════════════════════════════════════════════════════════════════ */
function restrictedImports(layerPatterns, { allowPackages = [], allowNamed = [] } = {}) {
  const vendorPatterns = VENDOR_ADAPTERS.filter(
    (v) => !v.packages.some((p) => allowPackages.includes(p)),
  ).map((v) => ({
    group: v.packages.flatMap((p) => [p, `${p}/*`]),
    message: `Import ${v.use} instead. Only ${v.adapters.join(", ")} may import ${v.packages.join(", ")}.`,
  }));
  const paths = RESTRICTED_NAMED_IMPORTS.filter((r) => !allowNamed.includes(r.name)).map(
    ({ name, importNames, message }) => ({ name, importNames, message }),
  );
  return ["error", { paths, patterns: [...layerPatterns, ...vendorPatterns] }];
}

/** Layer patterns that apply to a given adapter path (most specific layer wins). */
function layerPatternsFor(adapterGlob) {
  const prefix = adapterGlob.replace(/\*.*$/, "");
  const matches = LAYERS.filter((layer) =>
    layer.files.some(
      (glob) => glob.startsWith("src/") && prefix.startsWith(glob.replace("**", "")),
    ),
  );
  return (matches.at(-1) ?? LAYERS[0]).patterns;
}

const layerBlocks = LAYERS.map(({ files, patterns }) => ({
  files,
  rules: { "no-restricted-imports": restrictedImports(patterns) },
}));

const adapterBlocks = [
  ...VENDOR_ADAPTERS.flatMap((vendor) =>
    vendor.adapters.map((adapter) => ({
      files: [adapter],
      rules: {
        "no-restricted-imports": restrictedImports(layerPatternsFor(adapter), {
          allowPackages: vendor.packages,
        }),
      },
    })),
  ),
  ...RESTRICTED_NAMED_IMPORTS.flatMap((restriction) =>
    restriction.adapters.map((adapter) => ({
      files: [adapter],
      rules: {
        "no-restricted-imports": restrictedImports(layerPatternsFor(adapter), {
          allowNamed: [restriction.name],
        }),
      },
    })),
  ),
];

/* ═══════════════════════════════════════════════════════════════════════════
 * 4. CONFIG
 * ═════════════════════════════════════════════════════════════════════════ */
const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,

  {
    plugins: { "simple-import-sort": simpleImportSort },
    rules: {
      "simple-import-sort/imports": "error",
      "simple-import-sort/exports": "error",
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "prefer-const": "error",
      eqeqeq: ["error", "smart"],
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { prefer: "type-imports", fixStyle: "inline-type-imports" },
      ],
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },

  ...layerBlocks,
  ...adapterBlocks,

  // E2E specs are not React code (Playwright fixtures use a `use` callback).
  {
    files: ["e2e/**"],
    rules: { "react-hooks/rules-of-hooks": "off" },
  },

  // The logger is the one place allowed to write to the console.
  {
    files: ["src/lib/logger.ts", "src/lib/__tests__/logger.test.ts", "scripts/**"],
    rules: { "no-console": "off" },
  },

  // Must stay last: turns off stylistic rules that conflict with Prettier.
  prettier,

  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "coverage/**",
    "playwright-report/**",
    "test-results/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
