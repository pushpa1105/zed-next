# Error handling

There are two kinds of errors, and they are handled differently.

| Kind           | Examples                                           | How it's handled                                              |
| -------------- | -------------------------------------------------- | ------------------------------------------------------------- |
| **Expected**   | invalid input, not found, duplicate, no permission | Returned as a **value** (`ActionResult`) and shown inline     |
| **Unexpected** | bug, database down, null dereference               | **Thrown**, caught by an error boundary, logged with a digest |

## 1. Throwing expected errors: `AppError`

`src/lib/errors.ts` defines the hierarchy:

| Class               | Code               | HTTP   |
| ------------------- | ------------------ | ------ |
| `ValidationError`   | `VALIDATION_ERROR` | 422    |
| `UnauthorizedError` | `UNAUTHORIZED`     | 401    |
| `ForbiddenError`    | `FORBIDDEN`        | 403    |
| `NotFoundError`     | `NOT_FOUND`        | 404    |
| `ConflictError`     | `CONFLICT`         | 409    |
| `AppError(code, …)` | any `ErrorCode`    | mapped |

```ts
if (!todo) throw new NotFoundError("Todo");
if (exists) throw new ConflictError("A todo with this title already exists");
```

`expose` controls whether the message is safe for users. It defaults to `true` for
4xx and `false` for 5xx. Put internal details in `cause`, never in the message:

```ts
throw new AppError("INTERNAL_ERROR", "Could not save", { cause: dbError });
```

## 2. Server Actions: `ActionResult`

Actions never throw expected errors to the client. `defineAction` /
`defineFormAction` validate input (any Standard Schema, via `@/lib/validation`) and
convert errors:

```ts
type ActionResult<T> =
  | { ok: true; data: T; message?: string }
  | { ok: false; error: string; code: ErrorCode; fieldErrors?: Record<string, string[]> };
```

The UI branches on `ok`:

```tsx
const fieldError = state && !state.ok ? state.fieldErrors?.title : undefined;
<FormMessage messages={fieldError} />;
```

Unknown errors are logged server-side and returned as a generic
`"Something went wrong"`. Stack traces and messages never reach the browser.

## 3. Route Handlers: JSON error envelope

Wrap handlers with `withErrorHandling` from `src/lib/api-response.ts`:

```ts
export const GET = withErrorHandling(async (_req, { params }) => {
  const todo = await todoService.get((await params).id); // throws NotFoundError
  return Response.json(todo);
});
// → 404 { "error": { "code": "NOT_FOUND", "message": "Todo not found" } }
```

## 4. Calling external APIs: `HttpError`

`createHttpClient` (`src/lib/http-client.ts`) converts failures into `AppError`s:

| Situation                   | Result                                                                                       |
| --------------------------- | -------------------------------------------------------------------------------------------- |
| Upstream non-2xx            | `HttpError` with the mapped code (404 → `NOT_FOUND`, 429 → `RATE_LIMITED`…), `expose: false` |
| Network error or timeout    | Retried for idempotent methods, then `AppError("INTERNAL_ERROR")` with the cause             |
| Response fails the `schema` | Logged with its issues, then `AppError("INTERNAL_ERROR")`                                    |

Upstream messages are never shown to users. Catch `HttpError` in a service when you
need to translate it, for example into `NotFoundError("Customer")`.

## 5. Rendering errors: boundaries

| File                        | Catches                                                     |
| --------------------------- | ----------------------------------------------------------- |
| `app/(app)/todos/error.tsx` | Errors in that segment (and below)                          |
| `app/error.tsx`             | Errors in any route under the root layout                   |
| `app/global-error.tsx`      | Errors in the root layout itself (renders its own `<html>`) |
| `app/not-found.tsx`         | `notFound()` calls and unknown URLs                         |

Boundaries receive `{ error, retry }` (Next.js 16.2+). `retry()` re-fetches and
re-renders the segment. All of them use the shared `ErrorView`, which shows the
error **digest** as a reference ID. Support can match it against server logs.

For component-level boundaries (for example, one failing widget on a dashboard), use
`catchError` from `next/error` instead of writing a class component.

## 6. Global server error reporting

`src/instrumentation.ts` exports `onRequestError`, which Next.js calls for every
uncaught server error (render, Route Handler, Server Action, proxy). It logs the
digest, path, route and request ID. Plug in Sentry/Datadog there. See
[observability](observability.md).

## Do and don't

- ✅ `throw new NotFoundError("Project")` in services
- ✅ `notFound()` in pages when a resource from params doesn't exist
- ✅ Model expected failures as return values in actions
- ❌ `try/catch` around everything "just in case"
- ❌ `throw "string"` or `throw { message }`
- ❌ Showing `error.message` from unknown errors to users
- ❌ Catching `redirect()`/`notFound()`. If you must `try/catch` around them, call
  `unstable_rethrow(error)` first
