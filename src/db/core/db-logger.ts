import { debug as tauriDebug, error as tauriError, info as tauriInfo, warn as tauriWarn } from "@tauri-apps/plugin-log";

const isTauri = typeof window !== "undefined";

export const dbLog = {
  debug: (message: string) => {
    if (isTauri) void tauriDebug(message);
  },
  error: (message: string) => {
    if (isTauri) void tauriError(message);
  },
  info: (message: string) => {
    if (isTauri) void tauriInfo(message);
  },
  warn: (message: string) => {
    if (isTauri) void tauriWarn(message);
  },
};
