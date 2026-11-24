import { createCacheTags } from "@/lib/cache-tags";

/** Cache tags for todos. Invalidate `todoCacheTags.all` after any write. */
export const todoCacheTags = createCacheTags("todos");

export const TODO_TITLE_MAX_LENGTH = 120;

/** Guard rail for the demo in-memory store. */
export const TODO_MAX_ITEMS = 100;
