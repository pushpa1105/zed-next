import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createLogger } from "../logger";

describe("logger", () => {
  beforeEach(() => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("writes one JSON object per line in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    createLogger({ service: "test" }).info("hello", { userId: 1 });

    const line = vi.mocked(console.log).mock.calls[0]?.[0] as string;
    expect(JSON.parse(line)).toMatchObject({
      level: "info",
      msg: "hello",
      service: "test",
      userId: 1,
    });
  });

  it("serializes errors with their cause", () => {
    vi.stubEnv("NODE_ENV", "production");
    const error = new Error("outer", { cause: new Error("inner") });
    createLogger().error("failed", { error });

    const entry = JSON.parse(vi.mocked(console.error).mock.calls[0]?.[0] as string);
    expect(entry.error).toMatchObject({ message: "outer", cause: { message: "inner" } });
  });

  it("drops messages below LOG_LEVEL", () => {
    vi.stubEnv("LOG_LEVEL", "warn");
    const log = createLogger();
    log.info("ignored");
    log.warn("kept");

    expect(console.log).not.toHaveBeenCalled();
    expect(console.warn).toHaveBeenCalledOnce();
  });

  it("merges bindings from child loggers", () => {
    vi.stubEnv("NODE_ENV", "production");
    createLogger({ a: 1 }).child({ b: 2 }).info("nested");

    const entry = JSON.parse(vi.mocked(console.log).mock.calls[0]?.[0] as string);
    expect(entry).toMatchObject({ a: 1, b: 2 });
  });
});
