"use client";

import { ErrorView } from "@/components/feedback/error-view";

/** Catches errors in any route below the root layout. */
export default function RootError({
  error,
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  return <ErrorView error={error} retry={retry} />;
}
