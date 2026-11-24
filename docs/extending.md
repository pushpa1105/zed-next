# Extending the starter

The starter is deliberately lean: it ships only what almost every project needs. These
recipes show where common additions plug into the architecture.

> **Every library you add gets an adapter.** Create one module that is the only
> importer, and register it in `VENDOR_ADAPTERS` in `eslint.config.mjs`. See
> [dependencies](dependencies.md#adding-a-new-library). The recipes below name the
> adapter location for each addition.

## Database

Recommended: **Drizzle ORM** (lightweight, SQL-first) or **Prisma** (schema-first,
mature tooling), with Postgres.

1. `pnpm add drizzle-orm postgres && pnpm add -D drizzle-kit`
2. Add `DATABASE_URL` to `src/config/env.ts` and `.env.example`.
3. Create the client in `src/lib/db/index.ts`, starting with `import "server-only"`.
   This is the database **adapter**: register `drizzle-orm`/`postgres` in
   `VENDOR_ADAPTERS`, with `src/lib/db/**` and `src/features/*/data/**` as the
   allowed importers.
   Table schemas can live in `src/lib/db/schema.ts`, or per feature in
   `features/<x>/data/<x>.table.ts`.
4. Implement the feature's repository interface, for example
   `DrizzleTodoRepository implements TodoRepository`, and swap the export in
   `data/todo.repository.ts`. Services, actions and UI don't change.
5. Add `db:generate` / `db:migrate` scripts and run migrations in CI/CD before deploy.

## Authentication

Recommended: **Better Auth** or **Auth.js** (self-hosted), or **Clerk** / **WorkOS**
(managed).

Create a `features/auth` module:

```
features/auth/
├── index.ts            SignInForm, UserMenu, types
├── server.ts           getSession, requireUser, requireRole
├── actions/            signIn, signOut, signUp
├── components/
└── lib/session.ts      verifySession(), cached with React `cache()`
```

- `proxy.ts`: optimistic redirect for unauthenticated users on `(app)` routes.
- Every action and service calls `requireUser()` and checks ownership.
- See [security](security.md#authentication-and-authorization-when-you-add-it).

## Calling external APIs

Use `createHttpClient` from `@/lib/http-client` in the feature's `data/` layer, and
always pass a response `schema`:

```ts
// features/billing/data/stripe.client.ts
const stripe = createHttpClient({
  baseUrl: "https://api.stripe.com/v1/",
  headers: { authorization: `Bearer ${env.STRIPE_SECRET_KEY}` },
});

export const getCustomer = (id: string) =>
  stripe.get(`customers/${id}`, { schema: customerSchema });
```

If the vendor ships an official SDK, wrap it the same way, in one `data/` module.

## Client-side data fetching (TanStack Query)

Only add this for polling, infinite lists, or offline support:

1. `pnpm add @tanstack/react-query`
2. Create `components/providers/query-provider.tsx` (`"use client"`, a
   `QueryClient` per browser session) and add it to `AppProviders`.
3. Keep query keys and fetchers inside the feature (`features/<x>/hooks/use-x-query.ts`).

## Internationalization

Recommended: **next-intl**. Move routes under `app/[locale]/`, keep messages in
`src/i18n/messages/<locale>.json`, and add locale detection to `proxy.ts`. Use
`generateStaticParams` for locales so pages stay prerendered.

## Forms at scale

The built-in `useActionState` pattern covers most forms. For large, dynamic forms, add
**React Hook Form** + `@hookform/resolvers/zod`, and reuse the same Zod schema on the
client and in the Server Action.

## Toasts and notifications

`pnpm add sonner`. Render `<Toaster />` in the root layout, and show
`result.message` from `ActionResult` after successful actions.

## Storybook

`pnpm dlx storybook@latest init`. Put stories next to primitives
(`components/ui/button.stories.tsx`), and import `globals.css` in
`.storybook/preview.ts`.

## Analytics and feature flags

- Analytics: Vercel Analytics, PostHog or Plausible, added as a provider in
  `AppProviders` or a script in the root layout.
- Feature flags: the Vercel Flags SDK (`flags`), or PostHog/LaunchDarkly. Evaluate
  flags on the server and pass the results down.

## Email, jobs, payments

| Need            | Suggestion                   | Where it goes                                                    |
| --------------- | ---------------------------- | ---------------------------------------------------------------- |
| Email           | Resend + React Email         | `features/notifications`                                         |
| Background jobs | Inngest, Trigger.dev, QStash | `features/<x>/jobs/` + a Route Handler                           |
| Payments        | Stripe                       | `features/billing` + webhook Route Handler using `revalidateTag` |

## Growing into a monorepo

When you add a second app (admin, mobile API, docs site), move to **pnpm workspaces +
Turborepo**: `apps/web` (this app) and `packages/ui`, `packages/config`
(ESLint/TS/Prettier) and `packages/<domain>`. Feature modules with clean public APIs
make this move easy, which is a big reason for the architecture.

## Removing the example feature

When you're ready:

1. Delete `src/features/todos`, `src/app/(app)/todos`, and `e2e/todos.spec.ts`.
2. Remove `todos` from `routes`/`publicRoutes` in `src/config/routes.ts` and from `siteConfig.nav`.
3. Update the home page links, `e2e/home.spec.ts`, and remove `e2e/pages/todos.page.ts`
   and its fixture in `e2e/fixtures.ts`.
4. Run `pnpm check && pnpm build`.
