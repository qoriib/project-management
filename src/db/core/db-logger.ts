/**
 * Database Action Logger.
 * Uses @tauri-apps/plugin-log inside Tauri or falls back to console in CLI/Node.js.
 */

type LogLevel = "debug" | "info" | "warn" | "error";
type LogFn = (message: string) => void;

let tauriLogger: Record<LogLevel, LogFn> | null = null;

async function getLogger(): Promise<Record<LogLevel, LogFn>> {
  if (tauriLogger) return tauriLogger;

  if (typeof window !== "undefined") {
    try {
      const mod = await import("@tauri-apps/plugin-log");
      tauriLogger = {
        debug: mod.debug,
        error: mod.error,
        info: mod.info,
        warn: mod.warn,
      };
      return tauriLogger;
    } catch {
      // Fallback if plugin fails
    }
  }

  tauriLogger = {
    debug: (msg) => console.debug(`[DB] ${msg}`),
    error: (msg) => console.error(`[DB] ${msg}`),
    info: (msg) => console.info(`[DB] ${msg}`),
    warn: (msg) => console.warn(`[DB] ${msg}`),
  };

  return tauriLogger;
}

function log(level: LogLevel, message: string): void {
  void getLogger().then((logger) => logger[level](message));
}

export const dbLog = {
  debug: (message: string) => log("debug", message),
  error: (message: string) => log("error", message),
  info: (message: string) => log("info", message),
  warn: (message: string) => log("warn", message),
};
