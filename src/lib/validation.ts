/**
 * Validation adapter: the ONLY module that imports the schema library.
 *
 * - Feature schemas import `z` from here, not from "zod".
 * - Everything that *consumes* schemas (Server Actions, the HTTP client, forms)
 *   depends on the vendor-neutral Standard Schema interface
 *   (https://standardschema.dev), which Zod, Valibot and ArkType all implement.
 *
 * Upgrading Zod, or moving to another Standard Schema library, changes this
 * file and the schema definitions only. Actions, services and UI keep working.
 * See docs/dependencies.md.
 */
import { z } from "zod";

import type { FieldErrors } from "./errors";

export { z };

// ─── Standard Schema v1 (vendored types, per the spec's recommendation) ──────

export interface StandardSchema<Input = unknown, Output = Input> {
  readonly "~standard": {
    readonly version: 1;
    readonly vendor: string;
    readonly validate: (
      value: unknown,
    ) => StandardResult<Output> | Promise<StandardResult<Output>>;
    readonly types?: { readonly input: Input; readonly output: Output } | undefined;
  };
}

type StandardResult<Output> =
  | { readonly value: Output; readonly issues?: undefined }
  | { readonly issues: ReadonlyArray<ValidationIssue> };

export interface ValidationIssue {
  readonly message: string;
  readonly path?: ReadonlyArray<PropertyKey | { readonly key: PropertyKey }> | undefined;
}

/** The type a schema accepts. */
export type InferInput<S extends StandardSchema> = NonNullable<
  S["~standard"]["types"]
>["input"];

/** The type a schema produces after parsing (defaults, transforms, trimming applied). */
export type InferOutput<S extends StandardSchema> = NonNullable<
  S["~standard"]["types"]
>["output"];

// ─── Validation API ─────────────────────────────────────────────────────────

export type ValidationResult<T> =
  | { success: true; data: T }
  | {
      success: false;
      issues: ReadonlyArray<ValidationIssue>;
      /** Issues keyed by dotted field path, e.g. `{ "address.city": ["Required"] }`. */
      fieldErrors: FieldErrors;
      /** Issues that are not tied to a field (e.g. cross-field rules). */
      formErrors: string[];
    };

/** Validate `input` against any Standard Schema. Never throws for invalid input. */
export async function validate<S extends StandardSchema>(
  schema: S,
  input: unknown,
): Promise<ValidationResult<InferOutput<S>>> {
  const result = await schema["~standard"].validate(input);

  if (!result.issues) {
    return { success: true, data: result.value as InferOutput<S> };
  }

  const fieldErrors: Record<string, string[]> = {};
  const formErrors: string[] = [];

  for (const issue of result.issues) {
    const path = toPath(issue);
    if (path) (fieldErrors[path] ??= []).push(issue.message);
    else formErrors.push(issue.message);
  }

  return { success: false, issues: result.issues, fieldErrors, formErrors };
}

function toPath(issue: ValidationIssue): string | undefined {
  if (!issue.path?.length) return undefined;
  return issue.path
    .map((segment) =>
      typeof segment === "object" && segment !== null
        ? String(segment.key)
        : String(segment),
    )
    .join(".");
}
