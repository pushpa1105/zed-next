import { describe, expect, it } from "vitest";

import type { Todo } from "../../types";
import { InMemoryTodoRepository } from "../todo.repository";

const make = (id: string, title: string, createdAt: string): Todo => ({
  id,
  title,
  completed: false,
  createdAt,
  updatedAt: createdAt,
});

describe("InMemoryTodoRepository", () => {
  const older = make("1", "Older", "2026-01-01T00:00:00.000Z");
  const newer = make("2", "Newer", "2026-02-01T00:00:00.000Z");

  it("lists newest first", async () => {
    const repo = new InMemoryTodoRepository([older, newer]);
    await expect(repo.list()).resolves.toEqual([newer, older]);
  });

  it("finds by id and by title (case-insensitive)", async () => {
    const repo = new InMemoryTodoRepository([older]);
    await expect(repo.findById("1")).resolves.toEqual(older);
    await expect(repo.findById("missing")).resolves.toBeNull();
    await expect(repo.findByTitle("OLDER")).resolves.toEqual(older);
    await expect(repo.findByTitle("nope")).resolves.toBeNull();
  });

  it("updates and deletes, reporting missing records", async () => {
    const repo = new InMemoryTodoRepository([older]);
    await expect(repo.update("1", { completed: true })).resolves.toMatchObject({
      completed: true,
    });
    await expect(repo.update("missing", { completed: true })).resolves.toBeNull();
    await expect(repo.delete("1")).resolves.toBe(true);
    await expect(repo.delete("1")).resolves.toBe(false);
    await expect(repo.count()).resolves.toBe(0);
  });
});
