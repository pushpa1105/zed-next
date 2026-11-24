import { beforeEach, describe, expect, it } from "vitest";

import { AppError, ConflictError, NotFoundError } from "@/lib/errors";

import { TODO_MAX_ITEMS } from "../../constants";
import { InMemoryTodoRepository } from "../../data/todo.repository";
import { createTodoService, type TodoService } from "../todo.service";

describe("todoService", () => {
  let service: TodoService;

  beforeEach(() => {
    // A fresh, isolated repository per test: no shared state.
    service = createTodoService({
      repo: new InMemoryTodoRepository(),
      generateId: () => "00000000-0000-4000-8000-000000000001",
      now: () => new Date("2026-01-01T00:00:00.000Z"),
    });
  });

  it("creates todos with injected id and clock", async () => {
    const todo = await service.create({ title: "Write tests" });

    expect(todo).toEqual({
      id: "00000000-0000-4000-8000-000000000001",
      title: "Write tests",
      completed: false,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    });
    await expect(service.list()).resolves.toHaveLength(1);
  });

  it("rejects duplicate titles, case-insensitively", async () => {
    await service.create({ title: "Ship it" });
    await expect(service.create({ title: "SHIP IT" })).rejects.toBeInstanceOf(
      ConflictError,
    );
  });

  it("toggles completion", async () => {
    const todo = await service.create({ title: "Toggle me" });
    const updated = await service.toggle({ id: todo.id, completed: true });
    expect(updated.completed).toBe(true);
  });

  it("throws NotFoundError for unknown ids", async () => {
    const id = "00000000-0000-4000-8000-000000000099";
    await expect(service.toggle({ id, completed: true })).rejects.toBeInstanceOf(
      NotFoundError,
    );
    await expect(service.remove(id)).rejects.toBeInstanceOf(NotFoundError);
  });

  it("enforces the maximum number of todos", async () => {
    let n = 0;
    const limited = createTodoService({
      repo: new InMemoryTodoRepository(),
      generateId: () => `id-${n++}`,
    });
    for (let i = 0; i < TODO_MAX_ITEMS; i++) await limited.create({ title: `Todo ${i}` });

    await expect(limited.create({ title: "One too many" })).rejects.toBeInstanceOf(
      AppError,
    );
  });

  it("uses the real clock and id generator by default", async () => {
    const real = createTodoService({ repo: new InMemoryTodoRepository() });
    const todo = await real.create({ title: "Defaults" });
    expect(todo.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(Date.parse(todo.createdAt)).not.toBeNaN();
  });
});
