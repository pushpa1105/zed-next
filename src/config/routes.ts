import type { Route } from "next";

/**
 * Every app URL, defined once. Use these instead of string literals:
 *
 *   <Link href={routes.todos}>   redirect(routes.home)
 *
 * Renaming a URL is then a one-line change, and with `typedRoutes` enabled
 * TypeScript fails the build if an entry points to a page that doesn't exist.
 */
export const routes = {
  home: "/",
  todos: "/todos",
} as const satisfies Record<string, Route>;

/** Route Handler endpoints (not pages). */
export const apiRoutes = {
  health: "/api/health",
} as const;

/** Public, indexable pages. Used by the sitemap. */
export const publicRoutes: readonly Route[] = [routes.home, routes.todos];
