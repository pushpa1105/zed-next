"use server";

import { defineAction, defineFormAction } from "@/lib/actions";
import { expireCacheTags } from "@/lib/cache";

import { todoCacheTags } from "../constants";
import { createTodoSchema, todoIdSchema, toggleTodoSchema } from "../schemas/todo.schema";
import { todoService } from "../services/todo.service";

/*
 * Server Actions are public HTTP endpoints. Every action:
 *   1. validates input against a schema (done by defineAction/defineFormAction),
 *   2. (once auth exists) checks the caller is allowed to do this,
 *   3. delegates to the service layer,
 *   4. expires affected cache tags so the UI shows fresh data.
 */

export const createTodo = defineFormAction(
  createTodoSchema,
  async (input) => {
    const todo = await todoService.create(input);
    expireCacheTags(todoCacheTags.all);
    return todo;
  },
  { name: "todos.create", successMessage: "Todo added" },
);

export const toggleTodo = defineAction(
  toggleTodoSchema,
  async (input) => {
    const todo = await todoService.toggle(input);
    expireCacheTags(todoCacheTags.all, todoCacheTags.byId(todo.id));
    return todo;
  },
  { name: "todos.toggle" },
);

export const deleteTodo = defineAction(
  todoIdSchema,
  async ({ id }) => {
    await todoService.remove(id);
    expireCacheTags(todoCacheTags.all, todoCacheTags.byId(id));
  },
  { name: "todos.delete", successMessage: "Todo deleted" },
);
