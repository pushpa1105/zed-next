import { describe, expect, it, vi } from "vitest";

import { defineAction, defineFormAction, formDataToObject } from "../actions";
import { AppError, ConflictError } from "../errors";
import { logger } from "../logger";
import { z } from "../validation";

const schema = z.object({ name: z.string().min(2, "Too short") });

describe("defineAction", () => {
  it("returns data on success", async () => {
    const action = defineAction(schema, async ({ name }) => name.toUpperCase(), {
      successMessage: "Saved",
    });
    await expect(action({ name: "ada" })).resolves.toEqual({
      ok: true,
      data: "ADA",
      message: "Saved",
    });
  });

  it("returns field errors when validation fails, without calling the handler", async () => {
    const handler = vi.fn();
    const result = await defineAction(schema, handler)({ name: "a" });

    expect(handler).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      ok: false,
      code: "VALIDATION_ERROR",
      fieldErrors: { name: ["Too short"] },
    });
  });

  it("returns exposed AppError messages as failures", async () => {
    const result = await defineAction(schema, async () => {
      throw new ConflictError("Name taken");
    })({ name: "ada" });

    expect(result).toEqual({
      ok: false,
      code: "CONFLICT",
      error: "Name taken",
      fieldErrors: undefined,
    });
  });

  it("hides unexpected errors and logs them", async () => {
    const spy = vi.spyOn(logger, "error").mockImplementation(() => {});
    const result = await defineAction(schema, async () => {
      throw new AppError("INTERNAL_ERROR", "db password is hunter2");
    })({ name: "ada" });

    expect(result).toMatchObject({ ok: false, code: "INTERNAL_ERROR" });
    expect(JSON.stringify(result)).not.toContain("hunter2");
    expect(spy).toHaveBeenCalledOnce();
  });
});

describe("defineFormAction", () => {
  it("parses FormData before validating", async () => {
    const formData = new FormData();
    formData.set("name", "grace");
    const action = defineFormAction(schema, async ({ name }) => name);

    await expect(action(null, formData)).resolves.toMatchObject({
      ok: true,
      data: "grace",
    });
  });
});

describe("formDataToObject", () => {
  it("collects repeated keys into arrays and skips React internals", () => {
    const formData = new FormData();
    formData.append("tag", "a");
    formData.append("tag", "b");
    formData.append("title", "x");
    formData.append("$ACTION_ID_123", "");

    expect(formDataToObject(formData)).toEqual({ tag: ["a", "b"], title: "x" });
  });
});
