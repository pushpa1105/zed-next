"use client";

import Link from "next/link";
import { useEffect } from "react";

import { AlertIcon } from "@/components/icons";
import { Button, buttonVariants } from "@/components/ui/button";
import { routes } from "@/config/routes";

interface ErrorViewProps {
  error: unknown;
  retry?: () => void;
  title?: string;
  description?: string;
}

function getDigest(error: unknown): string | undefined {
  return typeof error === "object" && error !== null && "digest" in error
    ? String(error.digest)
    : undefined;
}

/**
 * Shared fallback UI for `error.tsx` boundaries. Shows a reference ID (the
 * error digest) that support can match against server logs, and never shows
 * raw error messages in production.
 */
export function ErrorView({
  error,
  retry,
  title = "Something went wrong",
  description = "An unexpected error occurred. Please try again.",
}: ErrorViewProps) {
  const digest = getDigest(error);

  useEffect(() => {
    // Server errors are already logged by `instrumentation.ts`.
    // Forward client-side errors to your error tracker here.
    console.error(error);
  }, [error]);

  return (
    <div
      role="alert"
      className="mx-auto flex max-w-md flex-col items-center gap-4 py-16 text-center"
    >
      <AlertIcon className="size-10 text-destructive" aria-hidden="true" />
      <div className="grid gap-1">
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
        {process.env.NODE_ENV === "development" && error instanceof Error && (
          <pre className="mt-2 max-w-full overflow-auto rounded-md bg-muted p-3 text-left text-xs">
            {error.message}
          </pre>
        )}
        {digest && (
          <p className="font-mono text-xs text-muted-foreground">Reference: {digest}</p>
        )}
      </div>
      <div className="flex gap-2">
        {retry && <Button onClick={() => retry()}>Try again</Button>}
        <Link href={routes.home} className={buttonVariants({ variant: "outline" })}>
          Go home
        </Link>
      </div>
    </div>
  );
}
