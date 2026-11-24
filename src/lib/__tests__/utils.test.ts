import { describe, expect, it } from "vitest";

import { assertNever, cn, formatDate } from "../utils";

describe("cn", () => {
  it("merges conditional classes", () => {
    expect(cn("a", false && "b", undefined, "c")).toBe("a c");
  });

  it("lets later Tailwind utilities win", () => {
    expect(cn("px-2 py-1", "px-4")).toBe("py-1 px-4");
  });
});

describe("formatDate", () => {
  it("formats ISO strings", () => {
    expect(
      formatDate("2026-01-15T12:00:00.000Z", { dateStyle: "medium", timeZone: "UTC" }),
    ).toBe("Jan 15, 2026");
  });
});

describe("assertNever", () => {
  it("throws with the unexpected value", () => {
    expect(() => assertNever("oops" as never)).toThrow('Unexpected value: "oops"');
  });
});
