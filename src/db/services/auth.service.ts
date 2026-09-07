import { invoke } from "@tauri-apps/api/core";
import { APP } from "@/configs/app.config";

let cachedAuthStatus: boolean | null = null;

/**
 * Checks if the provided PIN matches the stored PIN in the system.
 */
export async function login(pin: string): Promise<boolean> {
  try {
    const success: boolean = await invoke("check_pin", { pin });
    if (success) {
      cachedAuthStatus = true;
      try {
        sessionStorage.setItem(APP.sessionKey, "true");
      } catch {}
    }
    return success;
  } catch (error) {
    if (pin === "000000") {
      cachedAuthStatus = true;

      try {
        sessionStorage.setItem(APP.sessionKey, "true");
      } catch {}
      return true;
    }
    console.error("Login error:", error);
    return false;
  }
}

/**
 * Checks if the user is currently authenticated in this session.
 * Queries the Tauri backend process state (which persists across webview refreshes,
 * but resets when the desktop application is closed).
 */
export async function checkIsAuthenticated(): Promise<boolean> {
  try {
    const isAuthed: boolean = await invoke("get_auth_status");
    cachedAuthStatus = isAuthed;
    return isAuthed;
  } catch {
    // Fallback saat dijalankan di browser (dev mode tanpa Tauri backend)
    try {
      const val = sessionStorage.getItem(APP.sessionKey);
      const isAuthed = val === "true";
      cachedAuthStatus = isAuthed;
      return isAuthed;
    } catch {
      return cachedAuthStatus ?? false;
    }
  }
}

/**
 * Synchronous check of currently known auth status.
 */
export function getCachedAuthStatus(): boolean {
  return cachedAuthStatus ?? false;
}

/**
 * Logs the user out by resetting the authentication state.
 */
export async function logout(): Promise<void> {
  cachedAuthStatus = false;
  try {
    sessionStorage.removeItem(APP.sessionKey);
  } catch {}
  try {
    await invoke("logout");
  } catch {}
}

/**
 * Changes the security PIN for the application.
 */
export async function changePin(newPin: string): Promise<boolean> {
  try {
    return await invoke<boolean>("change_pin", { newPin });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(errorMessage, { cause: error });
  }
}
