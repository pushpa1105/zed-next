import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge class names, resolving conflicting Tailwind utilities (last one wins). */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/** Exhaustiveness helper for discriminated unions in `switch` statements. */
export function assertNever(value: never, message = "Unexpected value"): never {
  throw new Error(`${message}: ${JSON.stringify(value)}`);
}

/** Format an ISO date string for display. */
export function formatDate(
  iso: string,
  options: Intl.DateTimeFormatOptions = { dateStyle: "medium" },
  locale = "en-US",
): string {
  return new Intl.DateTimeFormat(locale, options).format(new Date(iso));
}
