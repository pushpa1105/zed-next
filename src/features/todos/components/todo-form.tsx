"use client";

import { useActionState, useState } from "react";

import { AddIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/ui/form-message";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ActionState } from "@/lib/actions";

import { createTodo } from "../actions/todo.actions";
import { TODO_TITLE_MAX_LENGTH } from "../constants";
import type { Todo } from "../types";

/**
 * Progressive-enhancement form: works without JavaScript (plain POST via the
 * Server Action), and with JS it shows pending state and inline errors.
 */
export function TodoForm() {
  const [title, setTitle] = useState("");

  const [state, formAction, pending] = useActionState(
    async (prev: ActionState<Todo>, formData: FormData) => {
      const result = await createTodo(prev, formData);
      if (result.ok) setTitle("");
      return result;
    },
    null,
  );

  const fieldError = state && !state.ok ? state.fieldErrors?.title : undefined;
  const formError = state && !state.ok && !fieldError ? state.error : undefined;

  return (
    <form action={formAction} className="grid gap-2" noValidate>
      <Label htmlFor="todo-title">New todo</Label>
      <div className="flex gap-2">
        <Input
          id="todo-title"
          name="title"
          placeholder="What needs to be done?"
          autoComplete="off"
          maxLength={TODO_TITLE_MAX_LENGTH}
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          aria-invalid={fieldError ? true : undefined}
          aria-describedby={fieldError ? "todo-title-error" : undefined}
        />
        <Button type="submit" loading={pending}>
          {!pending && <AddIcon aria-hidden="true" />}
          Add
        </Button>
      </div>
      <FormMessage id="todo-title-error" messages={fieldError} />
      <FormMessage>{formError}</FormMessage>
    </form>
  );
}
