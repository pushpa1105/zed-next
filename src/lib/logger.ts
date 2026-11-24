/**
 * Minimal structured logger.
 *
 * - Production: one JSON object per line (ready for Datadog, Loki, CloudWatch, ...).
 * - Development: human-readable output.
 *
 * To move to pino, winston or OpenTelemetry later, change this file only:
 * every call site goes through `logger` / `logger.child()`.
 */
type LogLevel = "debug" | "info" | "warn" | "error";
type LogContext = Record<string, unknown>;

const LEVELS: Record<LogLevel, number> = { debug: 10, info: 20, warn: 30, error: 40 };

function resolveLevel(): LogLevel {
  const level = process.env.LOG_LEVEL;
  return level && level in LEVELS ? (level as LogLevel) : "info";
}

function serializeError(error: unknown): unknown {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
      ...(error.cause ? { cause: serializeError(error.cause) } : {}),
    };
  }
  return error;
}

function normalize(context: LogContext): LogContext {
  return Object.fromEntries(
    Object.entries(context).map(([key, value]) => [
      key,
      value instanceof Error ? serializeError(value) : value,
    ]),
  );
}

export interface Logger {
  debug(message: string, context?: LogContext): void;
  info(message: string, context?: LogContext): void;
  warn(message: string, context?: LogContext): void;
  error(message: string, context?: LogContext): void;
  child(bindings: LogContext): Logger;
}

export function createLogger(bindings: LogContext = {}): Logger {
  const isProd = process.env.NODE_ENV === "production";
  const minLevel = LEVELS[resolveLevel()];

  const write = (level: LogLevel, message: string, context: LogContext = {}) => {
    if (LEVELS[level] < minLevel) return;
    const payload = normalize({ ...bindings, ...context });
    const sink =
      level === "error" ? console.error : level === "warn" ? console.warn : console.log;

    if (isProd) {
      sink(
        JSON.stringify({
          level,
          time: new Date().toISOString(),
          msg: message,
          ...payload,
        }),
      );
      return;
    }

    const hasContext = Object.keys(payload).length > 0;
    sink(`[${level.toUpperCase()}] ${message}`, ...(hasContext ? [payload] : []));
  };

  return {
    debug: (message, context) => write("debug", message, context),
    info: (message, context) => write("info", message, context),
    warn: (message, context) => write("warn", message, context),
    error: (message, context) => write("error", message, context),
    child: (extra) => createLogger({ ...bindings, ...extra }),
  };
}

export const logger = createLogger();
