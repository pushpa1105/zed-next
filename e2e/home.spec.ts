import { expect, test } from "./fixtures";

test.describe("home page", () => {
  test("renders the hero and navigates to the example feature", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await page.getByRole("link", { name: "See the example feature" }).click();

    await expect(page).toHaveURL(/\/todos$/);
    await expect(page.getByRole("heading", { name: "Todos", level: 1 })).toBeVisible();
  });

  test("toggles the colour theme", async ({ page }) => {
    await page.goto("/");
    const html = page.locator("html");
    const initial = await html.getAttribute("class");

    await page.getByRole("button", { name: "Toggle theme" }).click();

    await expect(html).not.toHaveAttribute("class", initial ?? "");
  });

  test("shows the 404 page for unknown routes", async ({ page }) => {
    const response = await page.goto("/this-route-does-not-exist");
    expect(response?.status()).toBe(404);
    await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();
  });
});
