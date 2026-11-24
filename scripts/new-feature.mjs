#!/usr/bin/env node
/**
 * Scaffold a new feature module that follows the project conventions.
 *
 *   pnpm gen:feature <name>          e.g. pnpm gen:feature billing
 *
 * Creates src/features/<name>/ with a public API (index.ts, server.ts),
 * a schema, a repository, a service, a cached query, a Server Action, a
 * component, a test and a README, all wired through the project adapters
 * (@/lib/validation, @/lib/cache, @/lib/id). See docs/feature-guide.md.
 */
import { execSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const name = process.argv[2];

if (!name || !/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(name)) {
  console.error("Usage: pnpm gen:feature <kebab-case-name>   (e.g. user-profile)");
  process.exit(1);
}

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const featureDir = join(root, "src", "features", name);

if (existsSync(featureDir)) {
  console.error(`Feature "${name}" already exists at ${featureDir}`);
  process.exit(1);
}

const pascal = name
  .split("-")
  .map((part) => part[0].toUpperCase() + part.slice(1))
  .join("");
const camel = pascal[0].toLowerCase() + pascal.slice(1);

const files = {
  "README.md": `# Feature: ${name}

<!-- One paragraph: what this feature does and who uses it. -->

## Public API

- \`@/features/${name}\`: components, cache tags and types (server + client safe)
- \`@/features/${name}/server\`: queries (server only)

## Structure

| Folder        | Purpose                                                     |
| ------------- | ----------------------------------------------------------- |
| \`actions/\`    | Server Actions: validate, authorize, call service, expire tags |
| \`components/\` | React components owned by this feature                       |
| \`data/\`       | Repository interface + implementation (only data access)     |
| \`queries/\`    | Cached server reads (\`"use cache"\` + \`applyCachePolicy\`)     |
| \`schemas/\`    | Schemas: the source of truth for data shapes                 |
| \`services/\`   | Business rules, framework-agnostic and unit tested           |
`,

  "index.ts": `/**
 * Public API of the \`${name}\` feature (safe for Server AND Client Components).
 * Only export what other parts of the app need.
 */
export { ${pascal}Panel } from "./components/${name}-panel";
export { ${camel}CacheTags } from "./constants";
export type { ${pascal} } from "./types";
`,

  "server.ts": `import "server-only";

/** Server-only public API of the \`${name}\` feature. */
export { get${pascal}List } from "./queries/get-${name}-list";
`,

  "constants.ts": `import { createCacheTags } from "@/lib/cache-tags";

/** Cache tags for ${name}. Expire \`${camel}CacheTags.all\` after writes. */
export const ${camel}CacheTags = createCacheTags("${name}");
`,

  "types.ts": `import type { InferOutput } from "@/lib/validation";

import type { create${pascal}Schema, ${camel}Schema } from "./schemas/${name}.schema";

export type ${pascal} = InferOutput<typeof ${camel}Schema>;
export type Create${pascal}Input = InferOutput<typeof create${pascal}Schema>;
`,

  [`schemas/${name}.schema.ts`]: `import { z } from "@/lib/validation";

export const ${camel}Schema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1, "Name is required").max(200),
});

export const create${pascal}Schema = ${camel}Schema.pick({ name: true });
`,

  [`data/${name}.repository.ts`]: `import "server-only";

import type { ${pascal} } from "../types";

/** Data-access contract. Implement it for your database and swap the export. */
export interface ${pascal}Repository {
  list(): Promise<${pascal}[]>;
  create(item: ${pascal}): Promise<${pascal}>;
}

/** In-memory implementation for development and tests ONLY. */
export class InMemory${pascal}Repository implements ${pascal}Repository {
  private readonly items = new Map<string, ${pascal}>();

  async list() {
    return [...this.items.values()];
  }

  async create(item: ${pascal}) {
    this.items.set(item.id, item);
    return item;
  }
}

export const ${camel}Repository: ${pascal}Repository = new InMemory${pascal}Repository();
`,

  [`services/${name}.service.ts`]: `import "server-only";

import { generateId, type IdGenerator } from "@/lib/id";

import { type ${pascal}Repository, ${camel}Repository } from "../data/${name}.repository";
import type { Create${pascal}Input, ${pascal} } from "../types";

export interface ${pascal}ServiceDeps {
  repo: ${pascal}Repository;
  generateId?: IdGenerator;
}

/**
 * Business rules for ${name}. Framework-agnostic: dependencies are injected
 * so tests can pass fakes. Authorization checks belong here.
 */
export function create${pascal}Service({
  repo,
  generateId: nextId = generateId,
}: ${pascal}ServiceDeps) {
  return {
    list(): Promise<${pascal}[]> {
      return repo.list();
    },
    create(input: Create${pascal}Input): Promise<${pascal}> {
      return repo.create({ id: nextId(), ...input });
    },
  };
}

export const ${camel}Service = create${pascal}Service({ repo: ${camel}Repository });
`,

  [`queries/get-${name}-list.ts`]: `import "server-only";

import { applyCachePolicy } from "@/lib/cache";

import { ${camel}CacheTags } from "../constants";
import { ${camel}Service } from "../services/${name}.service";

export async function get${pascal}List() {
  "use cache";
  applyCachePolicy({ lifetime: "minutes", tags: [${camel}CacheTags.all] });

  return ${camel}Service.list();
}
`,

  [`actions/${name}.actions.ts`]: `"use server";

import { defineFormAction } from "@/lib/actions";
import { expireCacheTags } from "@/lib/cache";

import { ${camel}CacheTags } from "../constants";
import { create${pascal}Schema } from "../schemas/${name}.schema";
import { ${camel}Service } from "../services/${name}.service";

export const create${pascal} = defineFormAction(
  create${pascal}Schema,
  async (input) => {
    // TODO: check the caller is authorized before mutating.
    const item = await ${camel}Service.create(input);
    expireCacheTags(${camel}CacheTags.all);
    return item;
  },
  { name: "${name}.create" },
);
`,

  [`components/${name}-panel.tsx`]: `import type { ${pascal} } from "../types";

export function ${pascal}Panel({ items }: { items: ${pascal}[] }) {
  return (
    <section aria-label="${pascal}">
      <ul>
        {items.map((item) => (
          <li key={item.id}>{item.name}</li>
        ))}
      </ul>
    </section>
  );
}
`,

  [`services/__tests__/${name}.service.test.ts`]: `import { describe, expect, it } from "vitest";

import { InMemory${pascal}Repository } from "../../data/${name}.repository";
import { create${pascal}Service } from "../${name}.service";

describe("${camel}Service", () => {
  it("creates and lists items", async () => {
    const service = create${pascal}Service({
      repo: new InMemory${pascal}Repository(),
      generateId: () => "id-1",
    });

    await service.create({ name: "First" });

    await expect(service.list()).resolves.toEqual([{ id: "id-1", name: "First" }]);
  });
});
`,
};

for (const [relativePath, content] of Object.entries(files)) {
  const target = join(featureDir, relativePath);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, content);
}

// Apply import order and formatting so the output is commit-ready.
const relDir = `src/features/${name}`;
try {
  execSync(`pnpm exec eslint --fix ${relDir}`, { cwd: root, stdio: "ignore" });
  execSync(`pnpm exec prettier --write ${relDir}`, { cwd: root, stdio: "ignore" });
} catch {
  console.warn("Auto-formatting failed. Run `pnpm lint:fix && pnpm format` manually.");
}

console.log(`\nCreated feature "${name}" at src/features/${name}/\n`);
for (const file of Object.keys(files).sort()) console.log(`  ${file}`);
console.log(`
Next steps:
  1. Model your data in schemas/${name}.schema.ts
  2. Implement data/${name}.repository.ts for your database
  3. Compose it in a route: import { ${pascal}Panel } from "@/features/${name}";
  4. Run: pnpm check
`);
