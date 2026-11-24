/**
 * Consistent cache-tag naming. Pure and client-safe (no Next.js imports), so
 * features can export their tags from a universal module.
 *
 * @example
 * export const todoCacheTags = createCacheTags("todos");
 * todoCacheTags.all          // "todos"
 * todoCacheTags.byId("42")   // "todos:42"
 */
export function createCacheTags<const Namespace extends string>(namespace: Namespace) {
  return {
    all: namespace,
    byId: (id: string) => `${namespace}:${id}` as const,
  };
}
