# Data fetching and caching

This project uses the Next.js 16 **Cache Components** model (`cacheComponents: true`)
with **Partial Prefetching**. Read this page before writing any data access.

> The authoritative docs for the installed version ship with the package:
> `node_modules/next/dist/docs/01-app/01-getting-started/08-caching.md`.

## Mental model

A page has three kinds of content:

| Kind                  | How                                                          | When it runs                                |
| --------------------- | ------------------------------------------------------------ | ------------------------------------------- |
| **Static**            | Plain JSX, sync code                                         | Build time (prerendered shell)              |
| **Cached**            | `"use cache"` function/component                             | Build time, then revalidated                |
| **Dynamic (request)** | Reads `cookies()`, `headers()`, `searchParams`, uncached I/O | Every request, streamed inside `<Suspense>` |

Everything static or cached is prerendered into an instant **static shell**. Dynamic
parts stream in behind `<Suspense>` fallbacks. If dynamic data isn't wrapped in
`<Suspense>`, the dev overlay shows a **blocking-route** warning. Fix it by adding a
boundary.

## Reading data

Put reads in the feature's `queries/` folder. Next.js cache APIs are called only
through the adapter in `src/lib/cache.ts` (ESLint enforces this), so future
Next.js API changes are a one-file fix:

```ts
import { applyCachePolicy } from "@/lib/cache";

export async function getTodos(): Promise<Todo[]> {
  "use cache"; // compiler directive: must stay inline
  applyCachePolicy({
    lifetime: "minutes", // always give cached data a lifetime
    tags: [todoCacheTags.all], // so writes can invalidate it
  });
  return todoService.list();
}
```

Tag names come from `createCacheTags` (`src/lib/cache-tags.ts`), so every feature
uses the same scheme:

```ts
export const todoCacheTags = createCacheTags("todos");
todoCacheTags.all; // "todos"
todoCacheTags.byId(id); // "todos:<id>"
```

Rules:

1. **Always** set a lifetime: `"seconds" | "minutes" | "hours" | "days" | "weeks" | "max"`,
   or a custom `{ stale, revalidate, expire }` in seconds.
2. **Always** tag cached data so mutations can invalidate it. Use the broad tag
   (`tags.all`) and, for single-record reads, a specific one (`tags.byId(id)`).
3. Function **arguments are part of the cache key**. Pass the user ID as an argument
   instead of reading cookies inside the cached function.
4. Return **serializable** values only (plain objects, arrays, strings, ISO dates).
5. You **cannot** call `cookies()`/`headers()` inside `"use cache"`. Read them
   outside and pass the values in, or use `"use cache: private"`.

### Request-specific data

```tsx
export default function Page() {
  return (
    <Suspense fallback={<Skeleton />}>
      <Greeting />
    </Suspense>
  );
}

async function Greeting() {
  const session = (await cookies()).get("session")?.value; // dynamic
  const profile = await getProfile(session); // cached per session
  return <p>Hi {profile.name}</p>;
}
```

### Data that must always be fresh

Don't cache it. Wrap the component in `<Suspense>`. For Route Handlers, call
`await connection()` to opt out of prerendering (see `app/api/health/route.ts`).

## Writing data (Server Actions)

All mutations go through Server Actions in `features/<x>/actions/`, built with the
helpers in `src/lib/actions.ts` and the cache adapter:

```ts
"use server";

export const createTodo = defineFormAction(       // for <form action> + useActionState
  createTodoSchema,
  async (input) => {
    const todo = await todoService.create(input);
    expireCacheTags(todoCacheTags.all);             // read-your-own-writes
    return todo;
  },
  { name: "todos.create", successMessage: "Todo added" },
);

export const toggleTodo = defineAction(toggleTodoSchema, async (input) => { ... });
```

What the helpers do for you:

- validate input against any [Standard Schema](https://standardschema.dev) (Zod today)
  and return `fieldErrors` keyed by field path on failure,
- turn exposed `AppError`s into `{ ok: false, error, code }`,
- log unexpected errors and return a generic message (no internals leaked),
- let Next.js control flow (`redirect()`, `notFound()`) pass through.

### Invalidation

| Adapter (`@/lib/cache`)                 | Next.js API underneath      | Where                    | Behaviour                                                          | Use for                        |
| --------------------------------------- | --------------------------- | ------------------------ | ------------------------------------------------------------------ | ------------------------------ |
| `expireCacheTags(...tags)`              | `updateTag`                 | Server Actions only      | Expires now. The next read waits for fresh data                    | The user's own edits (default) |
| `refreshCacheTagsInBackground(...tags)` | `revalidateTag(tag, "max")` | Actions + Route Handlers | Stale-while-revalidate: serves stale data, refreshes in background | Webhooks, background jobs, CMS |

`refresh()` from `next/cache` (re-render the client router without invalidating
tags) may be used directly in Server Actions. Avoid `revalidatePath`. Tags are more
precise, and the adapter doesn't expose path revalidation on purpose.

### Using actions in the UI

```tsx
// Forms: progressive enhancement + pending + errors
const [state, formAction, pending] = useActionState(createTodo, null);

// Direct calls with optimistic UI
const [optimistic, apply] = useOptimistic(todos, reducer);
startTransition(async () => {
  apply({ type: "toggle", id });
  const result = await toggleTodo({ id, completed });
  if (!result.ok) setError(result.error); // optimistic state rolls back automatically
});
```

## Do you need a client-side data library?

Usually not. Server Components + `"use cache"` + Server Actions cover most CRUD apps.
Add TanStack Query (or SWR) only for genuinely client-driven data: infinite scroll,
polling, live dashboards, or offline support. See [extending](extending.md).

## Caching in production

`"use cache"` entries are kept **in memory per server instance** by default. On
serverless or multi-instance deployments, configure a shared cache handler, or use
`"use cache: remote"` for data that must be shared across instances. See the Next.js
docs on `cacheHandlers` and [deployment](deployment.md).
