import { expect, test, uniqueName } from "./fixtures";

test.describe("todos feature", () => {
  test.beforeEach(async ({ todosPage }) => {
    await todosPage.goto();
  });

  test("creates, completes and deletes a todo", async ({ todosPage, page }) => {
    const title = uniqueName("E2E");

    await todosPage.add(title);
    await expect(todosPage.list.getByText(title)).toBeVisible();
    await expect(todosPage.titleInput).toHaveValue("");

    await todosPage.checkbox(title).check();
    await expect(todosPage.checkbox(title)).toBeChecked();

    // Survives a full reload: the server state was updated, not just the UI.
    await page.reload();
    await expect(todosPage.checkbox(title)).toBeChecked();

    await todosPage.deleteButton(title).click();
    await expect(todosPage.list.getByText(title)).toHaveCount(0);
  });

  test("shows a validation error for an empty title", async ({ todosPage }) => {
    await todosPage.addButton.click();
    await expect(todosPage.alert("Title is required")).toBeVisible();
  });

  test("rejects duplicate titles", async ({ todosPage }) => {
    const title = uniqueName("Duplicate");

    await todosPage.add(title);
    await expect(todosPage.checkbox(title)).toBeVisible();

    await todosPage.add(title);
    await expect(todosPage.alert("A todo with this title already exists")).toBeVisible();
  });
});
