# Testing

## Strategy

```
          ▲  fewer, slower, more realistic
   E2E    │  Playwright: critical user journeys through the real app
          │
 Component│  Vitest + Testing Library: client component behaviour
          │
   Unit   │  Vitest: schemas, services, utilities (most tests live here)
          ▼  more, faster, more focused
```

| Layer to test                                                 | Tool                      | Location                        |
| ------------------------------------------------------------- | ------------------------- | ------------------------------- |
| Schemas, utils, lib                                           | Vitest                    | `__tests__/*.test.ts` beside it |
| Services (business rules)                                     | Vitest + fake repository  | `services/__tests__/`           |
| Client components                                             | Vitest + RTL + user-event | `components/__tests__/`         |
| Async Server Components, routing, caching, actions end-to-end | Playwright                | `e2e/*.spec.ts`                 |

> Vitest can't render **async** Server Components. Cover those with Playwright, and
> keep logic out of them (in services) so it can be unit tested.

## Commands

```bash
pnpm test                 # all unit/component tests, once
pnpm test:watch           # watch mode
pnpm test:coverage        # coverage report in coverage/index.html
pnpm exec vitest run todo # filter by file name

pnpm test:e2e             # Playwright (starts `pnpm dev`, or `pnpm start` when CI=1)
pnpm test:e2e:ui          # interactive UI mode
PLAYWRIGHT_BASE_URL=https://staging.example.com pnpm test:e2e   # against a deployment
```

> On Windows, run Vitest through `pnpm test` / `pnpm exec vitest`, not `npx vitest`.
> `npx` can load a second copy of Vitest when the drive-letter case differs, which
> causes a "failed to find the current suite" error.

To run E2E tests against a production build locally:

```bash
pnpm build && CI=1 pnpm test:e2e
```

## Setup details

- `vitest.config.mts`: jsdom environment, globals, `@/` path aliases, and a stub for
  `server-only`, so server modules (services, repositories) can be unit tested.
- `src/test/setup.ts`: loads `@testing-library/jest-dom` matchers and cleans up after
  each test.
- `src/test/utils.tsx`: **the test adapter.** Tests import `renderWithUser`, `render`,
  `screen`, `within`, `waitFor`, `act` and `renderHook` from `@/test/utils`, never
  from `@testing-library/*` (ESLint enforces this). Add app-wide providers or new
  helpers here, once.
- `playwright.config.ts`: Desktop Chrome + Pixel 7 projects, traces on retry,
  screenshots on failure.
- `e2e/fixtures.ts`: **the E2E adapter.** Specs import `test`, `expect` and
  `uniqueName` from `./fixtures`, never from `@playwright/test`. Page objects are
  registered here as fixtures.
- `e2e/pages/*.page.ts`: **page objects.** All selectors for a page live in one class.

## Coverage gate

`pnpm test:coverage` (run in CI) fails below **90% statements, 85% branches, 90%
functions, 90% lines**. Code that only runs inside the Next.js runtime (routes,
Server Action and query entry points, providers, config) is excluded, because E2E
tests cover it. Raise the thresholds as the suite grows. Never lower them to make
a PR pass.

## Patterns

**Services: inject fakes for every dependency** (repository, ID generator, clock),
so results are deterministic.

```ts
beforeEach(() => {
  service = createTodoService({
    repo: new InMemoryTodoRepository(),
    generateId: () => "00000000-0000-4000-8000-000000000001",
    now: () => new Date("2026-01-01T00:00:00.000Z"),
  });
});
```

**Adapters: test the translation.** Mock the vendor module and assert the adapter
calls it correctly (see `src/lib/__tests__/cache.test.ts` and `src/hooks/__tests__/use-theme.test.ts`).
These tests let you re-implement an adapter on a new library with confidence.

**Components: mock Server Actions and assert on behaviour.**

```ts
vi.mock("../actions/todo.actions", () => ({ createTodo: vi.fn() }));
vi.mocked(createTodo).mockResolvedValue({ ok: false, code: "VALIDATION_ERROR", ... });
```

**Queries: use accessible queries** (`getByRole`, `getByLabelText`). If an element
can't be found by role or label, it's probably not accessible either.

**E2E: use page objects and isolate data.**

```ts
import { expect, test, uniqueName } from "./fixtures";

test("adds a todo", async ({ todosPage }) => {
  const title = uniqueName("E2E"); // tests run in parallel against shared state
  await todosPage.goto();
  await todosPage.add(title);
  await expect(todosPage.checkbox(title)).toBeVisible();
});
```

When markup changes, update the page object, not every spec. Next.js renders an
empty `role="alert"` route announcer, so `TodosPage.alert(text)` filters alerts by text.

## CI

`.github/workflows/ci.yml` runs unit tests with the coverage gate on every PR, then builds the
app and runs Playwright against the production server. Failed E2E runs upload the
HTML report as an artifact.
