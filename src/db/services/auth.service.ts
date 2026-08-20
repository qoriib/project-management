import { invoke } from "@tauri-apps/api/core";

let isAuthenticated = false;

/**
 * Checks if the provided PIN matches the stored PIN in the system.
 */
export async function login(pin: string): Promise<boolean> {
  try {
    const success: boolean = await invoke("check_pin", { pin });
    if (success) {
      isAuthenticated = true;
    }
    return success;
  } catch (error) {
    console.error("Login error:", error);
    return false;
  }
}

/**
 * Checks if the user is currently authenticated in this session.
 */
export function checkIsAuthenticated(): boolean {
  return isAuthenticated;
}

/**
 * Logs the user out by resetting the authentication state.
 */
export function logout(): void {
  isAuthenticated = false;
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
