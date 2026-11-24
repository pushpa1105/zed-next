import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  applyCachePolicy,
  expireCacheTags,
  refreshCacheTagsInBackground,
} from "../cache";
import { createCacheTags } from "../cache-tags";

// The adapter's job is to translate to Next.js APIs, so assert on those calls.
const next = vi.hoisted(() => ({
  cacheLife: vi.fn(),
  cacheTag: vi.fn(),
  updateTag: vi.fn(),
  revalidateTag: vi.fn(),
}));
vi.mock("next/cache", () => next);

describe("cache adapter", () => {
  beforeEach(() => {
    Object.values(next).forEach((fn) => fn.mockReset());
  });

  it("applies a named lifetime and tags", () => {
    applyCachePolicy({ lifetime: "hours", tags: ["a", "b"] });
    expect(next.cacheLife).toHaveBeenCalledWith("hours");
    expect(next.cacheTag).toHaveBeenCalledWith("a", "b");
  });

  it.each(["seconds", "minutes", "hours", "days", "weeks", "max"] as const)(
    "passes the %s profile through",
    (profile) => {
      applyCachePolicy({ lifetime: profile, tags: ["t"] });
      expect(next.cacheLife).toHaveBeenCalledWith(profile);
    },
  );

  it("applies a custom lifetime and skips empty tags", () => {
    applyCachePolicy({ lifetime: { revalidate: 30 }, tags: [] });
    expect(next.cacheLife).toHaveBeenCalledWith({ revalidate: 30 });
    expect(next.cacheTag).not.toHaveBeenCalled();
  });

  it("expires tags immediately with updateTag", () => {
    expireCacheTags("todos", "todos:1");
    expect(next.updateTag.mock.calls).toEqual([["todos"], ["todos:1"]]);
  });

  it("refreshes tags in the background with the max profile", () => {
    refreshCacheTagsInBackground("todos");
    expect(next.revalidateTag).toHaveBeenCalledWith("todos", "max");
  });
});

describe("createCacheTags", () => {
  it("namespaces tags consistently", () => {
    const tags = createCacheTags("projects");
    expect(tags.all).toBe("projects");
    expect(tags.byId("42")).toBe("projects:42");
  });
});
