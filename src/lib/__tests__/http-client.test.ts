import { describe, expect, it, vi } from "vitest";

import { AppError } from "../errors";
import { createHttpClient, HttpError } from "../http-client";
import { logger } from "../logger";
import { z } from "../validation";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });

function setup(...responses: Array<Response | Error>) {
  const fetchMock = vi.fn<typeof fetch>();
  for (const response of responses) {
    if (response instanceof Error) fetchMock.mockRejectedValueOnce(response);
    else fetchMock.mockResolvedValueOnce(response);
  }
  const client = createHttpClient({
    baseUrl: "https://api.example.com",
    headers: { authorization: "Bearer token" },
    fetch: fetchMock,
  });
  return { client, fetchMock };
}

describe("createHttpClient", () => {
  it("builds the URL, sends default headers and validates the response", async () => {
    const { client, fetchMock } = setup(json({ id: 1, name: "Ada" }));

    const user = await client.get("/users/1", {
      query: { include: "profile", skip: undefined },
      schema: z.object({ id: z.number(), name: z.string() }),
    });

    expect(user).toEqual({ id: 1, name: "Ada" });
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(String(url)).toBe("https://api.example.com/users/1?include=profile");
    expect(new Headers(init?.headers).get("authorization")).toBe("Bearer token");
  });

  it("serializes JSON bodies", async () => {
    const { client, fetchMock } = setup(json({ ok: true }, 201));

    await client.post("/users", { body: { name: "Ada" } });

    const [, init] = fetchMock.mock.calls[0]!;
    expect(init?.body).toBe('{"name":"Ada"}');
    expect(new Headers(init?.headers).get("content-type")).toBe("application/json");
  });

  it("maps non-2xx responses to HttpError with the matching code", async () => {
    const { client } = setup(json({ message: "nope" }, 404));

    const error = await client.post("/missing").catch((e: unknown) => e);

    expect(error).toBeInstanceOf(HttpError);
    expect(error).toMatchObject({
      code: "NOT_FOUND",
      upstreamStatus: 404,
      expose: false,
    });
  });

  it("retries idempotent requests on retryable statuses", async () => {
    const { client, fetchMock } = setup(json({}, 503), json({ ok: true }));

    await expect(client.get("/flaky")).resolves.toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("never retries non-idempotent requests", async () => {
    vi.spyOn(logger, "warn").mockImplementation(() => {});
    const { client, fetchMock } = setup(new TypeError("network down"));

    await expect(client.post("/orders")).rejects.toBeInstanceOf(AppError);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("rejects responses that don't match the schema", async () => {
    vi.spyOn(logger, "error").mockImplementation(() => {});
    const { client } = setup(json({ id: "not-a-number" }));

    await expect(
      client.get("/users/1", { schema: z.object({ id: z.number() }) }),
    ).rejects.toMatchObject({ code: "INTERNAL_ERROR" });
  });

  it("retries idempotent requests after network errors", async () => {
    vi.spyOn(logger, "warn").mockImplementation(() => {});
    const { client, fetchMock } = setup(new TypeError("reset"), json({ ok: true }));

    await expect(client.delete("/items/1")).resolves.toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("handles text and empty responses, and passes BodyInit through", async () => {
    const { client, fetchMock } = setup(
      new Response("plain text", { headers: { "content-type": "text/plain" } }),
      new Response(null, { status: 204 }),
    );

    await expect(client.put("/text", { body: "raw" })).resolves.toBe("plain text");
    await expect(
      client.patch("/empty", { body: new URLSearchParams({ a: "1" }) }),
    ).resolves.toBeUndefined();
    expect(fetchMock.mock.calls[0]?.[1]?.body).toBe("raw");
  });

  it.each([
    [400, "BAD_REQUEST"],
    [401, "UNAUTHORIZED"],
    [403, "FORBIDDEN"],
    [409, "CONFLICT"],
    [429, "RATE_LIMITED"],
    [418, "INTERNAL_ERROR"],
  ])("maps upstream %i to %s", async (status, code) => {
    const { client } = setup(json({}, status));
    await expect(client.post("/x")).rejects.toMatchObject({ code });
  });
});
