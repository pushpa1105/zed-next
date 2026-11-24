import type { ReactNode } from "react";

import { ThemeProvider } from "./theme-provider";

/**
 * Composes every app-wide client provider in one place, so the root layout
 * stays clean. Add new providers here (data-fetching client, i18n, feature
 * flags...) and keep the order intentional: outermost = most global.
 */
export function AppProviders({ children }: { children: ReactNode }) {
  return <ThemeProvider>{children}</ThemeProvider>;
}
