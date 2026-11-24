"use client";

import { useTheme as useNextTheme } from "next-themes";

/**
 * Theme adapter (hook half). Returns a small, vendor-neutral API, so
 * components never depend on next-themes' types or quirks.
 */
export type ThemePreference = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

export interface ThemeApi {
  /** What the user chose. */
  preference: ThemePreference;
  /** What is actually shown. `undefined` on the server and before hydration. */
  resolved: ResolvedTheme | undefined;
  setPreference: (preference: ThemePreference) => void;
}

export function useTheme(): ThemeApi {
  const { theme, resolvedTheme, setTheme } = useNextTheme();

  return {
    preference: isPreference(theme) ? theme : "system",
    resolved:
      resolvedTheme === "dark" || resolvedTheme === "light" ? resolvedTheme : undefined,
    setPreference: setTheme,
  };
}

function isPreference(value: unknown): value is ThemePreference {
  return value === "light" || value === "dark" || value === "system";
}
