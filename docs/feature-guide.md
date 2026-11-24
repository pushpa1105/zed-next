# Feature guide: building a feature end-to-end

This guide builds a hypothetical `projects` feature. Use `src/features/todos` as the
working reference implementation. It shows every pattern described here.

## 0. Decide: is it a feature?

| It's a **feature** if…                        | It's **shared** code if…                     |
| --------------------------------------------- | -------------------------------------------- |
| it represents a business capability or domain | it's generic and has no business meaning     |
| it owns data, rules, or workflows             | it would be the same in any product          |
| e.g. `projects`, `billing`, `auth`, `search`  | e.g. `Button`, `useDebouncedValue`, `logger` |

## 1. Scaffold

```bash
pnpm gen:feature projects
```

This creates `src/features/projects/` with a public API, schema, service, cached query,
Server Action, component, test and README. Everything compiles and lints out of the box.

## 2. Model the data: `schemas/`

Schemas are the **single source of truth**. Types come from schemas, never the other
way round.

```ts
// schemas/project.schema.ts
import { z } from "@/lib/validation"; // never import "zod" directly

export const projectSchema = z.object({
  id: z.uuid(),
  name: z.string().trim().min(1).max(100),
  status: z.enum(["active", "archived"]),
  createdAt: z.iso.datetime(),
});
export const createProjectSchema = projectSchema.pick({ name: true });

// types.ts
import type { InferOutput } from "@/lib/validation";
export type Project = InferOutput<typeof projectSchema>;

// constants.ts
export const projectCacheTags = createCacheTags("projects");
```

## 3. Data access: `data/`

Define an **interface** and one implementation. Only this layer knows about the
database.

```ts
export interface ProjectRepository {
  list(ownerId: string): Promise<Project[]>;
  create(project: Project): Promise<Project>;
}

export const projectRepository: ProjectRepository = new DrizzleProjectRepository(db);
```

## 4. Business rules: `services/`

Services hold invariants and authorization. Every dependency (repository, ID
generator, clock) is injected, so tests can pass fakes.

```ts
export function createProjectService({
  repo,
  generateId: nextId = generateId, // from @/lib/id
  now = () => new Date(),
}: ProjectServiceDeps) {
  return {
    async create(ownerId: string, input: CreateProjectInput) {
      if ((await repo.list(ownerId)).length >= 10) {
        throw new AppError("BAD_REQUEST", "Project limit reached");
      }
      return repo.create({
        id: nextId(),
        ...input,
        status: "active",
        createdAt: now().toISOString(),
      });
    },
  };
}
export const projectService = createProjectService({ repo: projectRepository });
```

Throw `AppError` subclasses (`NotFoundError`, `ConflictError`, `ForbiddenError`…)
for expected failures. See [error handling](error-handling.md).

## 5. Reads: `queries/`

```ts
export async function getProjects(ownerId: string) {
  "use cache";
  applyCachePolicy({
    lifetime: "minutes",
    tags: [projectCacheTags.all, projectCacheTags.byId(ownerId)],
  });
  return projectService.list(ownerId);
}
```

Arguments become part of the cache key. See [data & caching](data-and-caching.md).

## 6. Writes: `actions/`

```ts
"use server";
export const createProject = defineFormAction(
  createProjectSchema,
  async (input) => {
    const user = await requireUser(); // authorize: actions are public endpoints!
    const project = await projectService.create(user.id, input);
    expireCacheTags(projectCacheTags.all);
    return project;
  },
  { name: "projects.create", successMessage: "Project created" },
);
```

## 7. UI: `components/`

- Forms: `useActionState(action, null)` with `ActionState<T>` for pending state and
  errors (see `todo-form.tsx`).
- Lists with mutations: `useOptimistic` + `useTransition` (see `todo-list.tsx`).
- Build from `@/components/ui/*` primitives and design tokens. Use icons from
  `@/components/icons` and URLs from `@/config/routes`.
- Calling an external API? Create a client with `createHttpClient` from
  `@/lib/http-client` in the feature's `data/` layer, and always pass a `schema`
  to validate responses.

## 8. Public API: `index.ts` and `server.ts`

Export **only** what other code needs:

```ts
// index.ts (client + server safe)
export { ProjectList } from "./components/project-list";
export type { Project } from "./types";

// server.ts (server only)
import "server-only";
export { getProjects } from "./queries/get-projects";
```

## 9. Compose in a route

```tsx
// app/(app)/projects/page.tsx
import { ProjectList, ProjectListSkeleton } from "@/features/projects";
import { getProjects } from "@/features/projects/server";

export default function ProjectsPage() {
  return (
    <Suspense fallback={<ProjectListSkeleton />}>
      <Projects />
    </Suspense>
  );
}
async function Projects() {
  return <ProjectList projects={await getProjects(/* ... */)} />;
}
```

Add the URL to `routes` in `src/config/routes.ts`. If it should be public, also add it
to `publicRoutes` (sitemap) and `siteConfig.nav`.

## 10. Test

| What              | Where                             | Tool         |
| ----------------- | --------------------------------- | ------------ |
| Schemas           | `schemas/__tests__/*.test.ts`     | Vitest       |
| Services (rules)  | `services/__tests__/*.test.ts`    | Vitest       |
| Client components | `components/__tests__/*.test.tsx` | Vitest + RTL |
| Full user flows   | `e2e/<feature>.spec.ts`           | Playwright   |

## Definition of done

- [ ] Schema-first types, no duplicated type definitions
- [ ] Every action validates input **and** checks authorization
- [ ] Every write invalidates the right cache tags
- [ ] Expected errors are `AppError`s and appear in the UI
- [ ] Loading (`Suspense` fallback/skeleton) and empty states exist
- [ ] Accessible: labels, focus states, `aria-*` for errors
- [ ] Unit tests for services/schemas, an E2E test for the main flow
- [ ] Only the public API is imported from outside (`pnpm lint` passes)
- [ ] Feature `README.md` describes the feature
