import { useEffect } from "react";

/**
 * Tags that are considered "editable" — shortcut is suppressed
 * when focus lives inside these elements (unless allowInInput is true).
 */
const EDITABLE_TAGS = new Set(["INPUT", "TEXTAREA", "SELECT"]);

function isEditableTarget(el: Element | null): boolean {
  if (!el) return false;
  if (EDITABLE_TAGS.has(el.tagName)) return true;
  // contenteditable
  if ((el as HTMLElement).isContentEditable) return true;
  return false;
}

/**
 * Returns true when at least one <dialog> or [role="dialog"] element
 * is currently rendered in the DOM and visible.
 */
function isModalOpen(): boolean {
  // Native <dialog> open attribute
  const dialogs = document.querySelectorAll("dialog[open]");
  if (dialogs.length > 0) return true;

  // Astryx Dialog renders with role="dialog"
  const roleDialogs = document.querySelectorAll('[role="dialog"]');
  return roleDialogs.length > 0;
}

export interface UseKeyboardShortcutOptions {
  /** The key to listen for (case-insensitive), e.g. "n", "s", "Escape". */
  key: string;
  /** Require Ctrl / Cmd held down. Default: false. */
  ctrl?: boolean;
  /** Require Alt held down. Default: false. */
  alt?: boolean;
  /** Require Shift held down. Default: false. */
  shift?: boolean;
  /** The function to call when the shortcut fires. */
  handler: () => void;
  /**
   * When true (default), the shortcut is silently ignored if any
   * modal/dialog is currently open in the DOM. This prevents accidentally
   * triggering "create new" actions while a form dialog is visible.
   */
  skipWhenModalOpen?: boolean;
  /**
   * When true, the shortcut fires even when an editable element (input,
   * textarea, etc.) is focused. Default: false — shortcut is suppressed
   * while the user is typing.
   */
  allowInInput?: boolean;
  /**
   * Set to false to temporarily disable the shortcut without removing
   * the hook (e.g., feature-flag or role guard). Default: true.
   */
  enabled?: boolean;
}

/**
 * Attaches a keyboard shortcut to the `window` and cleans up on unmount.
 *
 * @example
 * useKeyboardShortcut({
 *   key: "n",
 *   ctrl: true,
 *   handler: () => setIsFormOpen(true),
 *   skipWhenModalOpen: true,
 * });
 */
export function useKeyboardShortcut({
  key,
  ctrl = false,
  alt = false,
  shift = false,
  handler,
  skipWhenModalOpen = true,
  allowInInput = false,
  enabled = true,
}: UseKeyboardShortcutOptions): void {
  useEffect(() => {
    if (!enabled) return;

    function onKeyDown(event: KeyboardEvent): void {
      // --- Modifier check ---
      if (ctrl && !event.ctrlKey && !event.metaKey) return;
      if (alt && !event.altKey) return;
      if (shift && !event.shiftKey) return;
      // Reject if a modifier is pressed that we did NOT ask for
      // (prevents collisions like Ctrl+Shift+N matching a Ctrl+N handler)
      if (!ctrl && (event.ctrlKey || event.metaKey)) return;
      if (!alt && event.altKey) return;
      if (!shift && event.shiftKey) return;

      // --- Key check (case-insensitive) ---
      if (event.key.toLowerCase() !== key.toLowerCase()) return;

      // --- Guard: editable element ---
      if (!allowInInput && isEditableTarget(document.activeElement)) return;

      // --- Guard: modal open ---
      if (skipWhenModalOpen && isModalOpen()) return;

      // All guards passed — fire
      event.preventDefault();
      handler();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [key, ctrl, alt, shift, handler, skipWhenModalOpen, allowInInput, enabled]);
}
