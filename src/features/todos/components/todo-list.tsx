"use client";

import { useOptimistic, useState, useTransition } from "react";

import { FormMessage } from "@/components/ui/form-message";

import { deleteTodo, toggleTodo } from "../actions/todo.actions";
import type { Todo } from "../types";
import { TodoItem } from "./todo-item";

type OptimisticAction =
  { type: "toggle"; id: string; completed: boolean } | { type: "delete"; id: string };

function reducer(todos: Todo[], action: OptimisticAction): Todo[] {
  switch (action.type) {
    case "toggle":
      return todos.map((todo) =>
        todo.id === action.id ? { ...todo, completed: action.completed } : todo,
      );
    case "delete":
      return todos.filter((todo) => todo.id !== action.id);
  }
}

/**
 * Renders todos with optimistic updates: the UI changes instantly and is
 * reconciled with the server response (or rolled back on failure).
 */
export function TodoList({ todos }: { todos: Todo[] }) {
  const [optimisticTodos, applyOptimistic] = useOptimistic(todos, reducer);
  const [, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleToggle = (todo: Todo) => {
    setError(null);
    startTransition(async () => {
      applyOptimistic({ type: "toggle", id: todo.id, completed: !todo.completed });
      const result = await toggleTodo({ id: todo.id, completed: !todo.completed });
      if (!result.ok) setError(result.error);
    });
  };

  const handleDelete = (todo: Todo) => {
    setError(null);
    startTransition(async () => {
      applyOptimistic({ type: "delete", id: todo.id });
      const result = await deleteTodo({ id: todo.id });
      if (!result.ok) setError(result.error);
    });
  };

  const remaining = optimisticTodos.filter((todo) => !todo.completed).length;

  return (
    <div className="grid gap-3">
      <FormMessage>{error}</FormMessage>

      {optimisticTodos.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          Nothing to do yet. Add your first todo above.
        </p>
      ) : (
        <ul className="divide-y rounded-lg border" aria-label="Todos">
          {optimisticTodos.map((todo) => (
            <TodoItem
              key={todo.id}
              todo={todo}
              onToggle={handleToggle}
              onDelete={handleDelete}
            />
          ))}
        </ul>
      )}

      <p className="text-sm text-muted-foreground" aria-live="polite">
        {remaining} of {optimisticTodos.length} remaining
      </p>
    </div>
  );
}
