import { invoke } from "@tauri-apps/api/core";

let isAuthenticated = false;

/**
 * Checks if the provided PIN matches the stored PIN.
 * If correct, sets the isAuthenticated flag.
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
 * Logs the user out.
 */
export function logout(): void {
  isAuthenticated = false;
}

/**
 * Changes the PIN. Requires the old PIN to be correct.
 */
export async function changePin(oldPin: string, newPin: string): Promise<boolean> {
  try {
    const success: boolean = await invoke("change_pin", { newPin, oldPin });
    return success;
  } catch (error: any) {
    throw new Error(error.toString(), { cause: error });
  }
}
