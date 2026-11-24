/**
 * Domain error hierarchy.
 *
 * Throw these from services and repositories for *expected* failures.
 * - Server Actions turn them into `ActionResult` failures (see `lib/actions.ts`).
 * - Route Handlers turn them into HTTP responses (see `lib/api-response.ts`).
 * Anything that is not an `AppError` is treated as an unexpected 500.
 */
export type ErrorCode =
  | "BAD_REQUEST"
  | "VALIDATION_ERROR"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "INTERNAL_ERROR";

const STATUS_BY_CODE: Record<ErrorCode, number> = {
  BAD_REQUEST: 400,
  VALIDATION_ERROR: 422,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  RATE_LIMITED: 429,
  INTERNAL_ERROR: 500,
};

export type FieldErrors = Record<string, string[] | undefined>;

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly status: number;
  /** Whether `message` is safe to show end users. Internal details belong in `cause`. */
  readonly expose: boolean;

  constructor(
    code: ErrorCode,
    message: string,
    options?: { cause?: unknown; expose?: boolean },
  ) {
    super(message, { cause: options?.cause });
    this.name = new.target.name;
    this.code = code;
    this.status = STATUS_BY_CODE[code];
    this.expose = options?.expose ?? this.status < 500;
  }
}

export class NotFoundError extends AppError {
  constructor(resource = "Resource", options?: { cause?: unknown }) {
    super("NOT_FOUND", `${resource} not found`, options);
  }
}

export class ValidationError extends AppError {
  readonly fieldErrors: FieldErrors;

  constructor(message: string, fieldErrors: FieldErrors = {}) {
    super("VALIDATION_ERROR", message);
    this.fieldErrors = fieldErrors;
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "You must be signed in") {
    super("UNAUTHORIZED", message);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "You do not have permission to do that") {
    super("FORBIDDEN", message);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super("CONFLICT", message);
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

/** A user-safe message for any thrown value. Never leaks internals. */
export function toPublicMessage(
  error: unknown,
  fallback = "Something went wrong. Please try again.",
): string {
  return isAppError(error) && error.expose ? error.message : fallback;
}
