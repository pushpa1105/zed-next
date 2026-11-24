import { describe, expect, it } from "vitest";

import { TODO_TITLE_MAX_LENGTH } from "../../constants";
import { createTodoSchema, toggleTodoSchema } from "../todo.schema";

describe("createTodoSchema", () => {
  it("trims the title", () => {
    expect(createTodoSchema.parse({ title: "  Buy milk  " })).toEqual({
      title: "Buy milk",
    });
  });

  it.each([
    ["empty", ""],
    ["whitespace only", "   "],
    ["too long", "x".repeat(TODO_TITLE_MAX_LENGTH + 1)],
  ])("rejects a %s title", (_, title) => {
    expect(createTodoSchema.safeParse({ title }).success).toBe(false);
  });
});

describe("toggleTodoSchema", () => {
  it("requires a UUID id and a boolean", () => {
    expect(toggleTodoSchema.safeParse({ id: "nope", completed: true }).success).toBe(
      false,
    );
    expect(
      toggleTodoSchema.safeParse({
        id: "5b0a1f5e-2c1d-4d6a-9a43-0f4f7d2b6c01",
        completed: "yes",
      }).success,
    ).toBe(false);
  });
});
