import { z } from "@/lib/validation";

import { TODO_TITLE_MAX_LENGTH } from "../constants";

/**
 * Schemas are the single source of truth for the feature's data shapes.
 * Types are inferred from them (see ../types.ts), and the same schemas
 * validate input on the server (Server Actions) and, optionally, the client.
 */
export const todoSchema = z.object({
  id: z.uuid(),
  title: z.string(),
  completed: z.boolean(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export const createTodoSchema = z.object({
  title: z
    .string({ error: "Title is required" })
    .trim()
    .min(1, "Title is required")
    .max(TODO_TITLE_MAX_LENGTH, `Keep it under ${TODO_TITLE_MAX_LENGTH} characters`),
});

export const todoIdSchema = z.object({
  id: z.uuid("Invalid todo id"),
});

export const toggleTodoSchema = todoIdSchema.extend({
  completed: z.boolean(),
});
