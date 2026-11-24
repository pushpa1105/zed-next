import { describe, expect, it } from "vitest";

import {
  AppError,
  ConflictError,
  ForbiddenError,
  isAppError,
  NotFoundError,
  toPublicMessage,
  UnauthorizedError,
  ValidationError,
} from "../errors";

describe("AppError hierarchy", () => {
  it("maps codes to HTTP status codes", () => {
    expect(new NotFoundError("Todo").status).toBe(404);
    expect(new ConflictError("dup").status).toBe(409);
    expect(new ValidationError("bad").status).toBe(422);
    expect(new AppError("INTERNAL_ERROR", "boom").status).toBe(500);
  });

  it("sets a helpful name and message", () => {
    const error = new NotFoundError("Todo");
    expect(error.name).toBe("NotFoundError");
    expect(error.message).toBe("Todo not found");
    expect(isAppError(error)).toBe(true);
  });

  it("exposes 4xx messages but hides 5xx by default", () => {
    expect(new ConflictError("dup").expose).toBe(true);
    expect(new AppError("INTERNAL_ERROR", "db password wrong").expose).toBe(false);
  });
});

describe("toPublicMessage", () => {
  it("returns exposed AppError messages", () => {
    expect(toPublicMessage(new ConflictError("Already exists"))).toBe("Already exists");
  });

  it("never leaks internal or unknown errors", () => {
    expect(toPublicMessage(new AppError("INTERNAL_ERROR", "secret"))).not.toContain(
      "secret",
    );
    expect(toPublicMessage(new Error("stack trace"), "fallback")).toBe("fallback");
  });
});

describe("auth errors", () => {
  it("have sensible defaults", () => {
    expect(new UnauthorizedError()).toMatchObject({ status: 401, expose: true });
    expect(new ForbiddenError()).toMatchObject({ status: 403, expose: true });
  });
});
