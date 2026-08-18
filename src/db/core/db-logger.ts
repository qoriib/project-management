/**
 * db-logger — Database action logger.
 *
 * Uses @tauri-apps/plugin-log when running inside Tauri (browser context),
 * and falls back to console.* when running in Node.js (e.g. seed scripts).
 *
 * Usage:
 *   dbLog.debug("[projects] findAll options=%s", JSON.stringify(opts));
 *   dbLog.info("[projects] create → id=%s", id);
 *   dbLog.warn("[projects] hardDelete id=%s", id);
 *   dbLog.error("[projects] create ERROR: %s", err.message);
 */

type LogFn = (message: string) => void;

interface DbLogger {
  debug: LogFn;
  info: LogFn;
  warn: LogFn;
  error: LogFn;
}

/**
 * Lazily resolved Tauri log functions.
 * We import dynamically to avoid breaking Node.js environments.
 */
let _tauriLog: {
  debug: LogFn;
  info: LogFn;
  warn: LogFn;
  error: LogFn;
} | null = null;

async function getTauriLog() {
  if (_tauriLog) return _tauriLog;
  const mod = await import("@tauri-apps/plugin-log");
  _tauriLog = {
    debug: mod.debug,
    info: mod.info,
    warn: mod.warn,
    error: mod.error,
  };
  return _tauriLog;
}

/**
 * Check if we're running in Tauri (browser with Tauri backend).
 * In Node.js (seed scripts) window is undefined.
 */
function isTauriContext(): boolean {
  return typeof window !== "undefined";
}

/**
 * Internal dispatcher — routes to Tauri or console.
 */
async function dispatch(
  level: "debug" | "info" | "warn" | "error",
  message: string
): Promise<void> {
  if (isTauriContext()) {
    try {
      const logger = await getTauriLog();
      await logger[level](message);
    } catch {
      // Fallback to console if Tauri plugin fails to load
      console[level](`[DB] ${message}`);
    }
  } else {
    console[level](`[DB] ${message}`);
  }
}

/**
 * Public DB logger interface.
 * All methods are fire-and-forget (non-blocking).
 */
export const dbLog: DbLogger = {
  debug: (message: string) => void dispatch("debug", message),
  info: (message: string) => void dispatch("info", message),
  warn: (message: string) => void dispatch("warn", message),
  error: (message: string) => void dispatch("error", message),
};
