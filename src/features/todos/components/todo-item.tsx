"use client";

import { DeleteIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import type { Todo } from "../types";

interface TodoItemProps {
  todo: Todo;
  onToggle: (todo: Todo) => void;
  onDelete: (todo: Todo) => void;
}

export function TodoItem({ todo, onToggle, onDelete }: TodoItemProps) {
  const checkboxId = `todo-${todo.id}`;

  return (
    <li className="flex items-center gap-3 px-4 py-3">
      <input
        id={checkboxId}
        type="checkbox"
        checked={todo.completed}
        onChange={() => onToggle(todo)}
        className="size-4 accent-primary"
      />
      <label
        htmlFor={checkboxId}
        className={cn(
          "flex-1 text-sm break-words",
          todo.completed && "text-muted-foreground line-through",
        )}
      >
        {todo.title}
      </label>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onDelete(todo)}
        aria-label={`Delete "${todo.title}"`}
      >
        <DeleteIcon />
      </Button>
    </li>
  );
}
