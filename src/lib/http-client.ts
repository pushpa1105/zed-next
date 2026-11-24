/**
 * HTTP client adapter for calling external APIs.
 *
 * The ONLY place that talks to `fetch` directly for third-party services.
 * Features create a client per upstream service (in their `data/` layer):
 *
 *   const github = createHttpClient({ baseUrl: "https://api.github.com" });
 *   const repo = await github.get(`/repos/${owner}/${name}`, { schema: repoSchema });
 *
 * Built in: base URL, default headers, timeouts, retries with backoff for
 * idempotent requests, JSON handling, response validation, and error mapping
 * to `AppError`. Swapping to ky/axios/undici, or adding tracing headers,
 * auth refresh or circuit breaking, happens in this file only.
 *
 * Next.js `fetch` options (e.g. `next: { tags }`) pass straight through.
 */
import { AppError, type ErrorCode } from "./errors";
import { logger } from "./logger";
import { type InferOutput, type StandardSchema, validate } from "./validation";

type Method = "GET" | "HEAD" | "POST" | "PUT" | "PATCH" | "DELETE";
type QueryValue = string | number | boolean | null | undefined;

export interface HttpClientOptions {
  baseUrl: string;
  headers?: HeadersInit;
  /** Per-attempt timeout. Default 10s. */
  timeoutMs?: number;
  /** Retries for idempotent requests (GET/HEAD/PUT/DELETE). Default 2. */
  retries?: number;
  /** Injected for tests or custom transports. Default: global `fetch`. */
  fetch?: typeof fetch;
}

export interface RequestOptions<
  S extends StandardSchema | undefined = undefined,
> extends Omit<RequestInit, "body" | "method"> {
  query?: Record<string, QueryValue>;
  /** Serialized as JSON unless it's already a BodyInit (FormData, Blob, string...). */
  body?: unknown;
  /** Validates the response body. Without it, the body is returned as `unknown`. */
  schema?: S;
  timeoutMs?: number;
  retries?: number;
}

type Result<S> = S extends StandardSchema ? InferOutput<S> : unknown;

/** An upstream service responded with a non-2xx status. */
export class HttpError extends AppError {
  constructor(
    readonly upstreamStatus: number,
    readonly url: string,
    readonly responseBody: unknown,
  ) {
    super(codeForStatus(upstreamStatus), `Upstream request failed (${upstreamStatus})`, {
      // Upstream messages are not ours to show to users.
      expose: false,
    });
  }
}

function codeForStatus(status: number): ErrorCode {
  switch (status) {
    case 400:
    case 422:
      return "BAD_REQUEST";
    case 401:
      return "UNAUTHORIZED";
    case 403:
      return "FORBIDDEN";
    case 404:
      return "NOT_FOUND";
    case 409:
      return "CONFLICT";
    case 429:
      return "RATE_LIMITED";
    default:
      return "INTERNAL_ERROR";
  }
}

const IDEMPOTENT: ReadonlySet<Method> = new Set(["GET", "HEAD", "PUT", "DELETE"]);
const RETRYABLE_STATUS: ReadonlySet<number> = new Set([
  408, 425, 429, 500, 502, 503, 504,
]);

function isBodyInit(body: unknown): body is BodyInit {
  return (
    typeof body === "string" ||
    body instanceof FormData ||
    body instanceof URLSearchParams ||
    body instanceof Blob ||
    body instanceof ArrayBuffer ||
    body instanceof ReadableStream
  );
}

async function parseBody(response: Response): Promise<unknown> {
  if (response.status === 204 || response.status === 205) return undefined;
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("json")) return response.json();
  const text = await response.text();
  return text.length > 0 ? text : undefined;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function createHttpClient({
  baseUrl,
  headers: defaultHeaders,
  timeoutMs: defaultTimeout = 10_000,
  retries: defaultRetries = 2,
  fetch: fetchImpl = (...args) => fetch(...args),
}: HttpClientOptions) {
  const log = logger.child({ component: "http-client", baseUrl });

  async function request<S extends StandardSchema | undefined = undefined>(
    method: Method,
    path: string,
    options: RequestOptions<S> = {},
  ): Promise<Result<S>> {
    const {
      query,
      body,
      schema,
      timeoutMs = defaultTimeout,
      retries = defaultRetries,
      headers,
      ...init
    } = options;

    const url = new URL(path, baseUrl);
    for (const [key, value] of Object.entries(query ?? {})) {
      if (value !== undefined && value !== null) url.searchParams.set(key, String(value));
    }

    const requestHeaders = new Headers(defaultHeaders);
    new Headers(headers).forEach((value, key) => requestHeaders.set(key, value));
    if (!requestHeaders.has("accept")) requestHeaders.set("accept", "application/json");

    let payload: BodyInit | undefined;
    if (body !== undefined) {
      if (isBodyInit(body)) payload = body;
      else {
        payload = JSON.stringify(body);
        requestHeaders.set("content-type", "application/json");
      }
    }

    const maxAttempts = IDEMPOTENT.has(method) ? retries + 1 : 1;

    for (let attempt = 1; ; attempt++) {
      try {
        const response = await fetchImpl(url, {
          ...init,
          method,
          headers: requestHeaders,
          body: payload,
          signal: init.signal ?? AbortSignal.timeout(timeoutMs),
        });

        if (!response.ok) {
          if (attempt < maxAttempts && RETRYABLE_STATUS.has(response.status)) {
            await sleep(backoff(attempt));
            continue;
          }
          throw new HttpError(response.status, url.toString(), await parseBody(response));
        }

        const data = await parseBody(response);
        if (!schema) return data as Result<S>;

        const parsed = await validate(schema, data);
        if (!parsed.success) {
          log.error("Upstream response failed validation", {
            url: url.toString(),
            issues: parsed.issues,
          });
          throw new AppError(
            "INTERNAL_ERROR",
            "Unexpected response from upstream service",
          );
        }
        return parsed.data as Result<S>;
      } catch (error) {
        const isNetworkError = !(error instanceof AppError);
        if (isNetworkError && attempt < maxAttempts) {
          log.warn("Request failed, retrying", { url: url.toString(), attempt, error });
          await sleep(backoff(attempt));
          continue;
        }
        if (isNetworkError) {
          throw new AppError("INTERNAL_ERROR", "Upstream service unavailable", {
            cause: error,
          });
        }
        throw error;
      }
    }
  }

  return {
    request,
    get: <S extends StandardSchema | undefined = undefined>(
      path: string,
      options?: RequestOptions<S>,
    ) => request("GET", path, options),
    post: <S extends StandardSchema | undefined = undefined>(
      path: string,
      options?: RequestOptions<S>,
    ) => request("POST", path, options),
    put: <S extends StandardSchema | undefined = undefined>(
      path: string,
      options?: RequestOptions<S>,
    ) => request("PUT", path, options),
    patch: <S extends StandardSchema | undefined = undefined>(
      path: string,
      options?: RequestOptions<S>,
    ) => request("PATCH", path, options),
    delete: <S extends StandardSchema | undefined = undefined>(
      path: string,
      options?: RequestOptions<S>,
    ) => request("DELETE", path, options),
  };
}

export type HttpClient = ReturnType<typeof createHttpClient>;

/** Exponential backoff with jitter: ~200ms, ~400ms, ~800ms... capped at 5s. */
function backoff(attempt: number): number {
  const base = Math.min(200 * 2 ** (attempt - 1), 5_000);
  return base / 2 + Math.random() * (base / 2);
}
