# `src/lib`: shared infrastructure

Cross-cutting, feature-agnostic modules. Most of them are **adapters**: the only
place a third-party library or volatile framework API is used. See
[docs/dependencies.md](../../docs/dependencies.md).

| Module            | Runs on     | Purpose                                                                    |
| ----------------- | ----------- | -------------------------------------------------------------------------- |
| `actions.ts`      | server only | `defineAction` / `defineFormAction` → typed `ActionResult`                 |
| `api-response.ts` | server only | JSON error envelope + `withErrorHandling` for Route Handlers               |
| `cache.ts`        | server only | Adapter over Next.js cache APIs (`applyCachePolicy`, `expireCacheTags`, …) |
| `cache-tags.ts`   | anywhere    | `createCacheTags(namespace)` naming helper                                 |
| `errors.ts`       | anywhere    | `AppError` hierarchy, `toPublicMessage`                                    |
| `http-client.ts`  | anywhere*   | `createHttpClient`: timeouts, retries, validation, error mapping           |
| `id.ts`           | anywhere    | `generateId()` adapter                                                     |
| `logger.ts`       | anywhere    | Structured logger (JSON in production)                                     |
| `utils.ts`        | anywhere    | `cn()`, `assertNever`, `formatDate`                                        |
| `validation.ts`   | anywhere    | Schema adapter: `z`, `validate`, Standard Schema types                     |
| `variants.ts`     | anywhere    | Component variant adapter (`variants`, `VariantProps`)                     |

\* Calling third-party APIs with secrets must happen on the server.

Rules:

- Nothing here imports from `@/features` or `@/app` (enforced by ESLint).
- Server-only modules start with `import "server-only"`.
- Every module has a test in `__tests__/<module>.test.ts`.
