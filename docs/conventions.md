# Conventions

Most of these rules are automated (ESLint, Prettier, TypeScript, commitlint). The rest
are agreements that are easy to follow.

## Files and folders

| Thing              | Convention                                                   | Example                                   |
| ------------------ | ------------------------------------------------------------ | ----------------------------------------- |
| Files and folders  | `kebab-case`                                                 | `todo-list.tsx`, `use-debounced-value.ts` |
| React components   | `PascalCase` named export                                    | `export function TodoList()`              |
| Hooks              | `useCamelCase`, file `use-*.ts`                              | `useDebouncedValue`                       |
| Role suffixes      | `.schema.ts`, `.service.ts`, `.repository.ts`, `.actions.ts` | `todo.service.ts`                         |
| Tests              | sibling `__tests__/` folder: `*.test.ts(x)`                  | `services/__tests__/todo.service.test.ts` |
| E2E tests          | `e2e/<area>.spec.ts`                                         | `e2e/todos.spec.ts`                       |
| Constants          | `SCREAMING_SNAKE_CASE`                                       | `TODO_MAX_ITEMS`                          |
| Types / interfaces | `PascalCase`, no `I` prefix                                  | `TodoRepository`                          |

**Named exports everywhere**, except where Next.js requires a default export
(`page`, `layout`, `error`, `not-found`, `route` handlers, metadata files).

## Imports

- Use the `@/` alias for anything outside the current feature, and **relative** imports
  inside a feature.
- Import features only via their public API (`@/features/x`, `@/features/x/server`).
  ESLint enforces this.
- **Never import a third-party library directly.** Use its adapter (`@/lib/validation`,
  `@/components/icons`, `@/lib/cache`, …). ESLint names the adapter if you forget. See
  [dependencies](dependencies.md).
- Use `routes` from `@/config/routes` for URLs instead of string literals.
- Import order is automatic (`simple-import-sort`). Run `pnpm lint:fix`.
- Use `import type` for type-only imports (enforced). It keeps server types out of
  client bundles.
- No barrel files (`index.ts` re-exports) in shared folders. Import
  `@/components/ui/button` directly. Feature `index.ts` files are the only barrels,
  because they define a public API.

## TypeScript

- `strict` + `noUncheckedIndexedAccess`: `array[0]` is `T | undefined`. Handle it.
- No `any`. Use `unknown` and narrow it.
- Derive types from schemas with `InferOutput<typeof schema>` from `@/lib/validation`
  instead of hand-writing them twice.
- Prefer discriminated unions over optional flags (see `ActionResult`).
- Use `assertNever` from `@/lib/utils` for exhaustive `switch` statements.

## React and Next.js

- Server Components by default. Add `"use client"` only when needed, as low in the
  tree as possible.
- Props: define an `interface XProps` when there is more than one prop, and extend
  `ComponentProps<"element">` for primitives.
- Never fetch data in a Client Component with `useEffect`. Fetch on the server and
  pass it down, or use a Server Action.
- Wrap request-dependent or slow async UI in `<Suspense>` with a meaningful skeleton.
- Every route segment that can fail on its own gets an `error.tsx`.
- Components don't import `process.env`. Use `env` from `@/config/env`.
- React Compiler is on, so you rarely need `useMemo`/`useCallback`. Don't add them
  by default.

## Styling

- Use Tailwind utilities with **semantic tokens** (`bg-primary`, `text-muted-foreground`),
  never raw colours (`bg-zinc-900`). See [styling](styling.md).
- Compose classes with `cn()`. Express variants with `variants()` from `@/lib/variants`.
- Use icons from `@/components/icons` by their semantic name (`DeleteIcon`). Add new
  ones to that file.
- Class order is automatic (Prettier plugin).

## Errors and logging

- Throw `AppError` subclasses for expected failures. Never throw plain strings.
- Log with `logger` from `@/lib/logger`, not `console.log` (ESLint warns).
- Never log secrets, tokens or full request bodies with personal data.

## Git

**Branches:** `feat/<short-desc>`, `fix/<short-desc>`, `chore/<short-desc>`, `docs/…`

**Commits:** [Conventional Commits](https://www.conventionalcommits.org), enforced by
commitlint:

```
<type>(<optional scope>): <imperative summary>

feat(todos): add bulk complete action
fix(auth): handle expired session cookie
docs: explain cache tags
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`,
`chore`, `revert`. Add `!` or a `BREAKING CHANGE:` footer for breaking changes.

**Pull requests:** small and focused, with a green CI, and the PR template filled in.
Squash-merge into `main`.
