import { beforeEach, describe, expect, it, vi } from "vitest";

import { errorResponse, withErrorHandling } from "../api-response";
import { AppError, NotFoundError, ValidationError } from "../errors";
import { logger } from "../logger";

describe("errorResponse", () => {
  beforeEach(() => {
    vi.spyOn(logger, "error").mockImplementation(() => {});
  });

  it("maps exposed AppErrors to their status and message", async () => {
    const response = errorResponse(new NotFoundError("Todo"));
    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      error: { code: "NOT_FOUND", message: "Todo not found" },
    });
  });

  it("includes field errors for validation failures", async () => {
    const response = errorResponse(
      new ValidationError("Invalid", { title: ["Required"] }),
    );
    await expect(response.json()).resolves.toMatchObject({
      error: { fieldErrors: { title: ["Required"] } },
    });
  });

  it("hides the message of internal AppErrors and logs them", async () => {
    const response = errorResponse(new AppError("INTERNAL_ERROR", "db exploded"));
    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: { code: "INTERNAL_ERROR", message: "Internal server error" },
    });
    expect(logger.error).toHaveBeenCalledOnce();
  });

  it("returns a generic 500 for unknown errors", async () => {
    const response = errorResponse(new Error("secret"));
    expect(response.status).toBe(500);
    expect(JSON.stringify(await response.json())).not.toContain("secret");
  });
});

describe("withErrorHandling", () => {
  it("passes successful responses through", async () => {
    const handler = withErrorHandling(async () => Response.json({ ok: true }));
    await expect((await handler()).json()).resolves.toEqual({ ok: true });
  });

  it("converts thrown errors into JSON responses", async () => {
    const handler = withErrorHandling(async () => {
      throw new NotFoundError("Project");
    });
    expect((await handler()).status).toBe(404);
  });
});
