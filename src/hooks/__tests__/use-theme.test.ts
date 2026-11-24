import { describe, expect, it, vi } from "vitest";

import { renderHook } from "@/test/utils";

import { useTheme } from "../use-theme";

const vendor = vi.hoisted(() => ({
  theme: undefined as string | undefined,
  resolvedTheme: undefined as string | undefined,
  setTheme: vi.fn(),
}));
vi.mock("next-themes", () => ({ useTheme: () => vendor }));

describe("useTheme (adapter)", () => {
  it("normalizes vendor values into the app's theme API", () => {
    vendor.theme = "dark";
    vendor.resolvedTheme = "dark";
    const { result } = renderHook(() => useTheme());

    expect(result.current.preference).toBe("dark");
    expect(result.current.resolved).toBe("dark");

    result.current.setPreference("light");
    expect(vendor.setTheme).toHaveBeenCalledWith("light");
  });

  it("falls back safely for unknown or missing values", () => {
    vendor.theme = "sepia";
    vendor.resolvedTheme = undefined;
    const { result } = renderHook(() => useTheme());

    expect(result.current.preference).toBe("system");
    expect(result.current.resolved).toBeUndefined();
  });
});
