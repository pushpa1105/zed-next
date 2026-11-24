import "server-only";

import { AppError, ConflictError, NotFoundError } from "@/lib/errors";
import { generateId, type IdGenerator } from "@/lib/id";

import { TODO_MAX_ITEMS } from "../constants";
import { type TodoRepository, todoRepository } from "../data/todo.repository";
import type { CreateTodoInput, Todo, ToggleTodoInput } from "../types";

/** Everything the service depends on, injectable for tests. */
export interface TodoServiceDeps {
  repo: TodoRepository;
  generateId?: IdGenerator;
  now?: () => Date;
}

/**
 * Business rules for todos. Framework-agnostic: no Next.js imports, no
 * caching, no `FormData`. Easy to unit test with a fake repository, clock
 * and ID generator.
 *
 * Authorization checks belong here too (e.g. "does this user own the todo?")
 * once authentication is added.
 */
export function createTodoService({
  repo,
  generateId: nextId = generateId,
  now = () => new Date(),
}: TodoServiceDeps) {
  return {
    list(): Promise<Todo[]> {
      return repo.list();
    },

    async create({ title }: CreateTodoInput): Promise<Todo> {
      if ((await repo.count()) >= TODO_MAX_ITEMS) {
        throw new AppError("BAD_REQUEST", `You can have at most ${TODO_MAX_ITEMS} todos`);
      }
      if (await repo.findByTitle(title)) {
        throw new ConflictError("A todo with this title already exists");
      }

      const timestamp = now().toISOString();
      return repo.create({
        id: nextId(),
        title,
        completed: false,
        createdAt: timestamp,
        updatedAt: timestamp,
      });
    },

    async toggle({ id, completed }: ToggleTodoInput): Promise<Todo> {
      const updated = await repo.update(id, {
        completed,
        updatedAt: now().toISOString(),
      });
      if (!updated) throw new NotFoundError("Todo");
      return updated;
    },

    async remove(id: string): Promise<void> {
      const deleted = await repo.delete(id);
      if (!deleted) throw new NotFoundError("Todo");
    },
  };
}

export type TodoService = ReturnType<typeof createTodoService>;

export const todoService = createTodoService({ repo: todoRepository });
