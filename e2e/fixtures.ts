/**
 * E2E adapter: specs import `test` and `expect` from here, never from
 * `@playwright/test` directly. Shared fixtures (page objects, authenticated
 * sessions, seeded data) are registered once and injected by name:
 *
 *   test("adds a todo", async ({ todosPage }) => { ... });
 */
import { test as base } from "@playwright/test";

import { TodosPage } from "./pages/todos.page";

interface Fixtures {
  todosPage: TodosPage;
}

export const test = base.extend<Fixtures>({
  todosPage: async ({ page }, use) => {
    await use(new TodosPage(page));
  },
});

export { expect, type Locator, type Page } from "@playwright/test";

/** Unique, readable test data. Specs run in parallel against shared state. */
export function uniqueName(label: string): string {
  return `${label} ${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}
