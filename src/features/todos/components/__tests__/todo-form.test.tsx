import { beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithUser, screen, waitFor } from "@/test/utils";

import { createTodo } from "../../actions/todo.actions";
import { TodoForm } from "../todo-form";

// Server Actions are mocked: component tests check UI behaviour only.
vi.mock("../../actions/todo.actions", () => ({
  createTodo: vi.fn(),
}));

const mockedCreateTodo = vi.mocked(createTodo);

describe("TodoForm", () => {
  beforeEach(() => {
    mockedCreateTodo.mockReset();
  });

  it("submits the title and clears the input on success", async () => {
    mockedCreateTodo.mockResolvedValue({
      ok: true,
      data: {
        id: "5b0a1f5e-2c1d-4d6a-9a43-0f4f7d2b6c01",
        title: "Buy milk",
        completed: false,
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
      },
    });
    const { user } = renderWithUser(<TodoForm />);

    const input = screen.getByLabelText("New todo");
    await user.type(input, "Buy milk");
    await user.click(screen.getByRole("button", { name: /add/i }));

    await waitFor(() => expect(input).toHaveValue(""));
    const formData = mockedCreateTodo.mock.calls[0]?.[1];
    expect(formData?.get("title")).toBe("Buy milk");
  });

  it("shows field errors and keeps the input on failure", async () => {
    mockedCreateTodo.mockResolvedValue({
      ok: false,
      code: "VALIDATION_ERROR",
      error: "Please fix the highlighted fields.",
      fieldErrors: { title: ["Title is required"] },
    });
    const { user } = renderWithUser(<TodoForm />);

    const input = screen.getByLabelText("New todo");
    await user.type(input, " ");
    await user.click(screen.getByRole("button", { name: /add/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Title is required");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveValue(" ");
  });
});
