import "server-only";

type LogLevel = "info" | "warn" | "error";

export interface LogContext {
  userId?: string;
  [key: string]: unknown;
}

/**
 * Minimal structured logger. Writes newline-delimited JSON to stdout/stderr
 * so it's easy to ship to any log aggregator. Never pass raw secrets,
 * passwords, or full OAuth/API tokens in `context` — log identifiers
 * (user id, shop domain, job id) instead.
 */
function write(level: LogLevel, event: string, context: LogContext = {}) {
  const entry = { level, event, time: new Date().toISOString(), ...context };
  const line = JSON.stringify(entry);
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

export const logger = {
  info: (event: string, context?: LogContext) => write("info", event, context),
  warn: (event: string, context?: LogContext) => write("warn", event, context),
  error: (event: string, context?: LogContext) => write("error", event, context),
};
