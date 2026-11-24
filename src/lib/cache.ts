import "server-only";

import { cacheLife, cacheTag, revalidateTag, updateTag } from "next/cache";

/**
 * Caching adapter: the ONLY module that calls Next.js cache APIs.
 *
 * Next.js has reshaped its caching APIs in several majors (`unstable_cache`
 * → `"use cache"`, `unstable_cacheLife` → `cacheLife`, the new `revalidateTag`
 * signature, `updateTag`). Routing every call through here means the next
 * change is a one-file edit. See docs/data-and-caching.md.
 *
 * Note: the `"use cache"` directive itself must stay inline in each cached
 * function. It's a compiler directive, so it can't be wrapped.
 */

/** Built-in lifetime profiles. */
export type CacheLifetimeProfile =
  "seconds" | "minutes" | "hours" | "days" | "weeks" | "max";

/** A custom lifetime, in seconds. */
export interface CacheLifetimeCustom {
  /** How long the client may use the value without checking the server. */
  stale?: number;
  /** How often the server refreshes the value in the background. */
  revalidate?: number;
  /** After this long without requests, the value is discarded. */
  expire?: number;
}

export type CacheLifetime = CacheLifetimeProfile | CacheLifetimeCustom;

export interface CachePolicy {
  /** How long the entry may be served before it's refreshed. */
  lifetime: CacheLifetime;
  /** Tags used to invalidate the entry after writes. */
  tags: readonly string[];
}

// `cacheLife` is typed per profile name, so each profile is passed as a literal.
function setLifetime(lifetime: CacheLifetime): void {
  if (typeof lifetime === "object") return cacheLife(lifetime);
  switch (lifetime) {
    case "seconds":
      return cacheLife("seconds");
    case "minutes":
      return cacheLife("minutes");
    case "hours":
      return cacheLife("hours");
    case "days":
      return cacheLife("days");
    case "weeks":
      return cacheLife("weeks");
    case "max":
      return cacheLife("max");
  }
}

/**
 * Apply a lifetime and tags to the current `"use cache"` scope.
 *
 * @example
 * export async function getTodos() {
 *   "use cache";
 *   applyCachePolicy({ lifetime: "minutes", tags: [todoCacheTags.all] });
 *   return todoService.list();
 * }
 */
export function applyCachePolicy({ lifetime, tags }: CachePolicy): void {
  setLifetime(lifetime);
  if (tags.length > 0) cacheTag(...tags);
}

/**
 * Expire tags immediately: the next read waits for fresh data
 * (read-your-own-writes). **Server Actions only.**
 */
export function expireCacheTags(...tags: string[]): void {
  for (const tag of tags) updateTag(tag);
}

/**
 * Mark tags stale and refresh them in the background (stale-while-revalidate).
 * Use from Route Handlers, webhooks and jobs, where nobody is waiting for the
 * result.
 */
export function refreshCacheTagsInBackground(...tags: string[]): void {
  for (const tag of tags) revalidateTag(tag, "max");
}
