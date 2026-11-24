import { describe, expect, it } from "vitest";

import { type StandardSchema, validate, z } from "../validation";

describe("validate", () => {
  const schema = z.object({
    name: z.string().trim().min(2, "Too short"),
    address: z.object({ city: z.string().min(1, "City is required") }),
  });

  it("returns parsed output on success", async () => {
    await expect(
      validate(schema, { name: "  Ada ", address: { city: "London" } }),
    ).resolves.toEqual({
      success: true,
      data: { name: "Ada", address: { city: "London" } },
    });
  });

  it("keys field errors by dotted path", async () => {
    const result = await validate(schema, { name: "A", address: { city: "" } });

    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.fieldErrors).toEqual({
      name: ["Too short"],
      "address.city": ["City is required"],
    });
    expect(result.formErrors).toEqual([]);
  });

  it("collects path-less issues as form errors", async () => {
    const passwords = z
      .object({ password: z.string(), confirm: z.string() })
      .refine((v) => v.password === v.confirm, { message: "Passwords must match" });

    const result = await validate(passwords, { password: "a", confirm: "b" });
    expect(result).toMatchObject({
      success: false,
      formErrors: ["Passwords must match"],
    });
  });

  it("works with any Standard Schema implementation, not just Zod", async () => {
    const evenNumber: StandardSchema<number> = {
      "~standard": {
        version: 1,
        vendor: "custom",
        validate: (value) =>
          typeof value === "number" && value % 2 === 0
            ? { value }
            : { issues: [{ message: "Must be even" }] },
      },
    };

    await expect(validate(evenNumber, 4)).resolves.toEqual({ success: true, data: 4 });
    await expect(validate(evenNumber, 3)).resolves.toMatchObject({
      success: false,
      formErrors: ["Must be even"],
    });
  });
});
