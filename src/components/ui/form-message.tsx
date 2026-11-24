import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

interface FormMessageProps extends ComponentProps<"p"> {
  /** Error messages for a field (e.g. `state.fieldErrors?.title`). */
  messages?: string[];
  tone?: "error" | "success";
}

/**
 * Accessible inline message for a form field or a whole form.
 * Renders nothing when there is no content.
 */
export function FormMessage({
  messages,
  tone = "error",
  className,
  children,
  ...props
}: FormMessageProps) {
  const content = children ?? messages?.[0];
  if (!content) return null;

  return (
    <p
      data-slot="form-message"
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "text-sm",
        tone === "error" ? "text-destructive" : "text-success",
        className,
      )}
      {...props}
    >
      {content}
    </p>
  );
}
