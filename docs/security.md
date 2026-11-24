# Security

## What's already in place

| Measure                                                             | Where                                                         |
| ------------------------------------------------------------------- | ------------------------------------------------------------- |
| Validated env vars, server/client split                             | `src/config/env.ts`                                           |
| `server-only` guards on server modules                              | feature `server.ts`, services, repositories, `lib/actions.ts` |
| Zod validation on every Server Action                               | `defineAction` / `defineFormAction`                           |
| No internal error details sent to clients                           | `lib/actions.ts`, `lib/api-response.ts`, `ErrorView`          |
| Security headers (HSTS, nosniff, frame deny, referrer, permissions) | `next.config.ts` → `headers()`                                |
| `X-Powered-By` removed                                              | `poweredByHeader: false`                                      |
| Request IDs for incident tracing                                    | `src/proxy.ts`                                                |
| Dependency updates                                                  | `.github/dependabot.yml`                                      |

## Server Actions are public endpoints

Any exported function in a `"use server"` file can be called with a crafted POST
request, whether or not your UI calls it. For **every** action:

1. **Validate** input. `defineAction` does this with the schema you pass.
2. **Authenticate and authorize** inside the action or the service. Never rely on
   the UI hiding a button, or on `proxy.ts`.
3. **Return only what the caller may see.** Don't return whole database rows.

```ts
export const deleteProject = defineAction(projectIdSchema, async ({ id }) => {
  const user = await requireUser(); // 401 if not signed in
  await projectService.delete({ id, actorId: user.id }); // 403 if not owner
  expireCacheTags(projectCacheTags.all);
});
```

## Authentication and authorization (when you add it)

Recommended layering, following the Next.js
[authentication guide](https://nextjs.org/docs/app/guides/authentication):

| Layer                 | Job                                                                                                         |
| --------------------- | ----------------------------------------------------------------------------------------------------------- |
| `proxy.ts`            | **Optimistic** redirect only (is there a session cookie?)                                                   |
| `(app)/layout.tsx`    | Optimistic UX gate. Layouts don't re-render on every navigation, so never rely on them                      |
| **Data Access Layer** | `verifySession()` / `requireUser()` (cached per request with React `cache`), called by services and actions |
| Services              | Resource-level authorization ("does this user own X?")                                                      |

Libraries that fit this structure: **Better Auth** or **Auth.js** (self-hosted), or
**Clerk** / **WorkOS** (managed). Put them in a `features/auth` module. See
[extending](extending.md#authentication).

## Content Security Policy

No CSP is set by default, because a strict nonce-based CSP makes **every page
dynamic**. That conflicts with the static shell from Cache Components. Options:

1. **Nonce-based (strictest)**: generate a nonce in `proxy.ts` and set the
   `Content-Security-Policy` header. Next.js applies the nonce to its scripts. Accept
   that pages render dynamically. See
   `node_modules/next/dist/docs/01-app/02-guides/content-security-policy.md`.
2. **Hash-based / static policy**: add a static CSP in `next.config.ts` → `headers()`
   that allows `'self'` plus your known origins. Weaker against inline-script XSS,
   but it keeps static rendering.

Start in **report-only** mode (`Content-Security-Policy-Report-Only`) and tighten the
policy once reports are clean.

## Other guidance

- **Secrets** live in server env vars only. Never `NEXT_PUBLIC_*`.
- **Data tainting**: React's `experimental_taintObjectReference` /
  `taintUniqueValue` can stop sensitive objects or tokens from being passed to
  Client Components.
- **Rate limiting**: add it for auth, sign-up and expensive actions (for example
  Upstash Ratelimit, or at the edge/WAF). Throw `AppError("RATE_LIMITED", …)`.
- **Uploads**: validate type and size on the server, and store outside the app server.
- **Redirects**: only redirect to relative paths or an allow-list, never to raw
  user-provided URLs.
- **Dependencies**: review Dependabot PRs promptly, and run `pnpm audit` in CI if
  your policy requires it.
- **Next.js security releases**: watch <https://nextjs.org/blog> and upgrade promptly.

## Reporting a vulnerability

Describe your team's private disclosure process here (for example, an email address
or a GitHub Security Advisory). Don't use public issues for vulnerabilities.
