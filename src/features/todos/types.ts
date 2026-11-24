import type { InferOutput } from "@/lib/validation";

import type {
  createTodoSchema,
  todoIdSchema,
  todoSchema,
  toggleTodoSchema,
} from "./schemas/todo.schema";

// Types are derived from schemas through the vendor-neutral `InferOutput`,
// so they don't depend on which validation library defines the schema.
export type Todo = InferOutput<typeof todoSchema>;
export type CreateTodoInput = InferOutput<typeof createTodoSchema>;
export type TodoIdInput = InferOutput<typeof todoIdSchema>;
export type ToggleTodoInput = InferOutput<typeof toggleTodoSchema>;
