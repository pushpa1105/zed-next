import "server-only";

import { isAppError, ValidationError } from "./errors";
import { logger } from "./logger";

/**
 * Consistent JSON error envelope for Route Handlers:
 *   { "error": { "code": "NOT_FOUND", "message": "Todo not found" } }
 */
export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    fieldErrors?: Record<string, string[] | undefined>;
  };
}

export function errorResponse(error: unknown): Response {
  if (isAppError(error)) {
    const body: ApiErrorBody = {
      error: {
        code: error.code,
        message: error.expose ? error.message : "Internal server error",
        ...(error instanceof ValidationError ? { fieldErrors: error.fieldErrors } : {}),
      },
    };
    if (!error.expose) logger.error("API error", { error });
    return Response.json(body, { status: error.status });
  }

  logger.error("Unhandled API error", { error });
  const body: ApiErrorBody = {
    error: { code: "INTERNAL_ERROR", message: "Internal server error" },
  };
  return Response.json(body, { status: 500 });
}

/**
 * Wrap a Route Handler so thrown `AppError`s become JSON responses.
 *
 * @example
 * export const GET = withErrorHandling(async () => Response.json(await listTodos()));
 */
export function withErrorHandling<Args extends unknown[]>(
  handler: (...args: Args) => Promise<Response>,
) {
  return async (...args: Args): Promise<Response> => {
    try {
      return await handler(...args);
    } catch (error) {
      return errorResponse(error);
    }
  };
}
