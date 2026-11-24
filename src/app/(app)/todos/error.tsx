"use client";

import { ErrorView } from "@/components/feedback/error-view";

export default function TodosError({
  error,
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  return (
    <ErrorView
      error={error}
      retry={retry}
      title="Could not load your todos"
      description="We hit a problem loading this page. Your data is safe. Please try again."
    />
  );
}
