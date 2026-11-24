"use client";

import { DarkModeIcon, LightModeIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/use-theme";

/**
 * Toggles light/dark. Both icons are rendered and swapped with CSS, which
 * avoids a hydration mismatch (the theme is unknown on the server).
 */
export function ThemeToggle() {
  const { resolved, setPreference } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Toggle theme"
      onClick={() => setPreference(resolved === "dark" ? "light" : "dark")}
    >
      <LightModeIcon className="scale-100 rotate-0 transition-transform dark:scale-0 dark:-rotate-90" />
      <DarkModeIcon className="absolute scale-0 rotate-90 transition-transform dark:scale-100 dark:rotate-0" />
    </Button>
  );
}
