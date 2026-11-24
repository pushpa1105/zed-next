import type { Locator, Page } from "@playwright/test";

/**
 * Page object for /todos. Selectors live here, once. If the UI markup
 * changes, update this class and every spec keeps working.
 */
export class TodosPage {
  readonly heading: Locator;
  readonly titleInput: Locator;
  readonly addButton: Locator;
  readonly list: Locator;

  constructor(readonly page: Page) {
    this.heading = page.getByRole("heading", { name: "Todos", level: 1 });
    this.titleInput = page.getByLabel("New todo");
    this.addButton = page.getByRole("button", { name: "Add" });
    this.list = page.getByRole("list", { name: "Todos" });
  }

  async goto() {
    await this.page.goto("/todos");
  }

  async add(title: string) {
    await this.titleInput.fill(title);
    await this.addButton.click();
  }

  checkbox(title: string): Locator {
    return this.page.getByRole("checkbox", { name: title });
  }

  deleteButton(title: string): Locator {
    return this.page.getByRole("button", { name: `Delete "${title}"` });
  }

  /**
   * A form alert with the given text. Next.js also renders an empty
   * `role="alert"` route announcer, so alerts are matched by text.
   */
  alert(text: string): Locator {
    return this.page.getByRole("alert").filter({ hasText: text });
  }
}
