import { beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithUser, screen, waitFor, within } from "@/test/utils";

import { deleteTodo, toggleTodo } from "../../actions/todo.actions";
import type { Todo } from "../../types";
import { TodoList } from "../todo-list";
import { TodoListSkeleton } from "../todo-list-skeleton";

vi.mock("../../actions/todo.actions", () => ({
  toggleTodo: vi.fn(),
  deleteTodo: vi.fn(),
}));

const todo = (overrides: Partial<Todo>): Todo => ({
  id: "00000000-0000-4000-8000-000000000001",
  title: "Write docs",
  completed: false,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  ...overrides,
});

describe("TodoList", () => {
  beforeEach(() => {
    vi.mocked(toggleTodo).mockReset();
    vi.mocked(deleteTodo).mockReset();
  });

  it("shows an empty state", () => {
    renderWithUser(<TodoList todos={[]} />);
    expect(screen.getByText(/nothing to do yet/i)).toBeInTheDocument();
  });

  it("renders todos and the remaining count", () => {
    renderWithUser(
      <TodoList
        todos={[
          todo({ id: "00000000-0000-4000-8000-000000000001", title: "A" }),
          todo({
            id: "00000000-0000-4000-8000-000000000002",
            title: "B",
            completed: true,
          }),
        ]}
      />,
    );

    const list = screen.getByRole("list", { name: "Todos" });
    expect(within(list).getAllByRole("listitem")).toHaveLength(2);
    expect(screen.getByText("1 of 2 remaining")).toBeInTheDocument();
  });

  it("calls the toggle action with the new state", async () => {
    vi.mocked(toggleTodo).mockResolvedValue({
      ok: true,
      data: todo({ completed: true }),
    });
    const { user } = renderWithUser(<TodoList todos={[todo({})]} />);

    await user.click(screen.getByRole("checkbox", { name: "Write docs" }));

    expect(toggleTodo).toHaveBeenCalledWith({
      id: "00000000-0000-4000-8000-000000000001",
      completed: true,
    });
  });

  it("shows the server error when an action fails", async () => {
    vi.mocked(deleteTodo).mockResolvedValue({
      ok: false,
      code: "NOT_FOUND",
      error: "Todo not found",
    });
    const { user } = renderWithUser(<TodoList todos={[todo({})]} />);

    await user.click(screen.getByRole("button", { name: 'Delete "Write docs"' }));

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent("Todo not found"),
    );
  });

  it("toggles completed todos back to open", async () => {
    vi.mocked(toggleTodo).mockResolvedValue({ ok: true, data: todo({}) });
    const { user } = renderWithUser(<TodoList todos={[todo({ completed: true })]} />);

    await user.click(screen.getByRole("checkbox", { name: "Write docs" }));
    expect(toggleTodo).toHaveBeenCalledWith(
      expect.objectContaining({ completed: false }),
    );
  });
});

describe("TodoListSkeleton", () => {
  it("announces loading", () => {
    renderWithUser(<TodoListSkeleton rows={2} />);
    expect(screen.getByRole("status", { name: "Loading todos" })).toBeInTheDocument();
  });
});
