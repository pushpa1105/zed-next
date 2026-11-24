import type { ReactNode } from "react";

/**
 * Shell for the authenticated "application" area.
 *
 * When you add authentication, this is the place for an *optimistic* session
 * check (redirect to /login). Real authorization must still happen in the
 * data layer and in every Server Action. See docs/security.md.
 */
export default function AppLayout({ children }: { children: ReactNode }) {
  return <div className="container mx-auto max-w-3xl px-4 py-10">{children}</div>;
}
