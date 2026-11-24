import "server-only";

import { applyCachePolicy } from "@/lib/cache";

import { todoCacheTags } from "../constants";
import { todoService } from "../services/todo.service";
import type { Todo } from "../types";

/**
 * Cached read of all todos.
 *
 * - `"use cache"` puts the result into the prerendered static shell.
 * - The tag lets Server Actions invalidate it after writes.
 * - The lifetime bounds how stale it can get.
 */
export async function getTodos(): Promise<Todo[]> {
  "use cache";
  applyCachePolicy({ lifetime: "minutes", tags: [todoCacheTags.all] });

  return todoService.list();
}
