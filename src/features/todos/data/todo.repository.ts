import "server-only";

import type { Todo } from "../types";

/**
 * Data-access contract for todos.
 *
 * The rest of the feature depends on this interface, not on a concrete
 * database. To move to Postgres/Prisma/Drizzle, write a new implementation
 * and change the `todoRepository` export below. Nothing else changes.
 */
export interface TodoRepository {
  list(): Promise<Todo[]>;
  findById(id: string): Promise<Todo | null>;
  findByTitle(title: string): Promise<Todo | null>;
  count(): Promise<number>;
  create(todo: Todo): Promise<Todo>;
  update(
    id: string,
    patch: Partial<Omit<Todo, "id" | "createdAt">>,
  ): Promise<Todo | null>;
  delete(id: string): Promise<boolean>;
}

/**
 * In-memory implementation, for local development and demos ONLY.
 * Data resets on restart and is not shared between server instances.
 */
export class InMemoryTodoRepository implements TodoRepository {
  private readonly store = new Map<string, Todo>();

  constructor(seed: Todo[] = []) {
    for (const todo of seed) this.store.set(todo.id, todo);
  }

  async list() {
    return [...this.store.values()].sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt),
    );
  }

  async findById(id: string) {
    return this.store.get(id) ?? null;
  }

  async findByTitle(title: string) {
    const needle = title.toLowerCase();
    for (const todo of this.store.values()) {
      if (todo.title.toLowerCase() === needle) return todo;
    }
    return null;
  }

  async count() {
    return this.store.size;
  }

  async create(todo: Todo) {
    this.store.set(todo.id, todo);
    return todo;
  }

  async update(id: string, patch: Partial<Omit<Todo, "id" | "createdAt">>) {
    const existing = this.store.get(id);
    if (!existing) return null;
    const updated = { ...existing, ...patch };
    this.store.set(id, updated);
    return updated;
  }

  async delete(id: string) {
    return this.store.delete(id);
  }
}

const SEED: Todo[] = [
  {
    id: "5b0a1f5e-2c1d-4d6a-9a43-0f4f7d2b6c01",
    title: "Read docs/architecture.md",
    completed: true,
    createdAt: "2026-01-01T09:00:00.000Z",
    updatedAt: "2026-01-01T09:00:00.000Z",
  },
  {
    id: "8c3e2d7a-6f41-4b2e-8d15-3a9b0c4e5f02",
    title: "Scaffold a feature with `pnpm gen:feature`",
    completed: false,
    createdAt: "2026-01-01T10:00:00.000Z",
    updatedAt: "2026-01-01T10:00:00.000Z",
  },
];

// Keep a single instance across hot reloads in development.
const globalForRepo = globalThis as unknown as { __todoRepository?: TodoRepository };

export const todoRepository: TodoRepository =
  globalForRepo.__todoRepository ?? new InMemoryTodoRepository(SEED);

if (process.env.NODE_ENV !== "production") {
  globalForRepo.__todoRepository = todoRepository;
}
