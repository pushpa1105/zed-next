import "server-only";

import { unstable_rethrow } from "next/navigation";

import { type ErrorCode, type FieldErrors, isAppError, ValidationError } from "./errors";
import { logger } from "./logger";
import {
  type InferInput,
  type InferOutput,
  type StandardSchema,
  validate,
} from "./validation";

/**
 * The single return shape for every Server Action.
 *
 * Expected failures (validation, not found, permission...) are returned as
 * values, never thrown, so the UI can render them. This follows the Next.js
 * guidance: "model expected errors as return values".
 */
export type ActionResult<T = void> =
  | { ok: true; data: T; message?: string }
  | { ok: false; error: string; code: ErrorCode; fieldErrors?: FieldErrors };

/** State type for `useActionState`: `null` before the first submission. */
export type ActionState<T = void> = ActionResult<T> | null;

type Handler<S extends StandardSchema, R> = (input: InferOutput<S>) => Promise<R>;

interface ActionOptions {
  /** Used in logs. Defaults to "anonymous-action". */
  name?: string;
  /** Message returned on success (e.g. for a toast). */
  successMessage?: string;
}

async function run<S extends StandardSchema, R>(
  schema: S,
  handler: Handler<S, R>,
  rawInput: unknown,
  { name = "anonymous-action", successMessage }: ActionOptions,
): Promise<ActionResult<R>> {
  const parsed = await validate(schema, rawInput);
  if (!parsed.success) {
    return {
      ok: false,
      code: "VALIDATION_ERROR",
      error: parsed.formErrors[0] ?? "Please fix the highlighted fields.",
      fieldErrors: parsed.fieldErrors,
    };
  }

  try {
    const data = await handler(parsed.data);
    return { ok: true, data, message: successMessage };
  } catch (error) {
    // Let Next.js control-flow errors (redirect(), notFound(), ...) propagate.
    unstable_rethrow(error);

    if (isAppError(error) && error.expose) {
      return {
        ok: false,
        code: error.code,
        error: error.message,
        fieldErrors: error instanceof ValidationError ? error.fieldErrors : undefined,
      };
    }

    logger.error("Server action failed", { action: name, error });
    return {
      ok: false,
      code: "INTERNAL_ERROR",
      error: "Something went wrong. Please try again.",
    };
  }
}

/**
 * Define a Server Action that takes a typed object as input.
 * `schema` can be any Standard Schema (Zod, Valibot, ArkType, ...).
 *
 * @example
 * // features/todos/actions/todo.actions.ts
 * "use server";
 * export const deleteTodo = defineAction(todoIdSchema, ({ id }) => service.remove(id));
 */
export function defineAction<S extends StandardSchema, R>(
  schema: S,
  handler: Handler<S, R>,
  options: ActionOptions = {},
) {
  return async (input: InferInput<S>): Promise<ActionResult<R>> =>
    run(schema, handler, input, options);
}

/**
 * Define a Server Action for `<form action>` + `useActionState`.
 * The `FormData` is converted to a plain object and validated with `schema`.
 */
export function defineFormAction<S extends StandardSchema, R>(
  schema: S,
  handler: Handler<S, R>,
  options: ActionOptions = {},
) {
  return async (_prev: ActionState<R>, formData: FormData): Promise<ActionResult<R>> =>
    run(schema, handler, formDataToObject(formData), options);
}

/** Convert FormData to a plain object. Repeated keys become arrays. */
export function formDataToObject(formData: FormData): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of formData.entries()) {
    // Skip React's internal action fields.
    if (key.startsWith("$ACTION")) continue;
    const existing = result[key];
    if (existing === undefined) result[key] = value;
    else if (Array.isArray(existing)) existing.push(value);
    else result[key] = [existing, value];
  }
  return result;
}
