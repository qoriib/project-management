/**
 * Utilitas Integrasi Validasi Form & Notifikasi Feedback
 *
 * Menyediakan fungsi pembantu untuk validasi `@tanstack/react-form`
 * dengan format status input Astryx (`statusVariant="tooltip"`)
 * serta penanganan error toast.
 */

/** Struktur objek status error kompatibel dengan komponen input Astryx */
export interface FieldErrorStatus {
  type: "error";
  message: string;
}

/**
 * Mengembalikan objek status error field hanya ketika field telah disentuh (touched) dan memiliki error validasi.
 * Mencegah pesan validasi langsung muncul saat form pertama kali dimuat.
 *
 * @param errors - Array error dari `field.state.meta.errors`
 * @param isTouched - Status sentuh dari `field.state.meta.isTouched` (default: true)
 * @returns Objek `{ type: "error", message: string }` atau `undefined` jika tidak ada error
 *
 * @example
 * ```tsx
 * <TextInput
 *   statusVariant="tooltip"
 *   status={getFieldError(field.state.meta.errors, field.state.meta.isTouched)}
 * />
 * ```
 */
export function getFieldError(errors: unknown[] | undefined, isTouched = true): FieldErrorStatus | undefined {
  if (!isTouched || !errors || errors.length === 0) {
    return undefined;
  }

  const firstError = errors[0];
  const message =
    typeof firstError === "string"
      ? firstError
      : typeof firstError === "object" && firstError !== null && "message" in firstError
        ? String((firstError as { message?: unknown }).message ?? "")
        : "";

  if (message) {
    return { message, type: "error" };
  }

  return undefined;
}

/**
 * Handler penanganan exception saat submit form untuk menampilkan notifikasi Toast error yang konsisten.
 *
 * @param error - Objek error yang ditangkap pada blok try/catch
 * @param showToast - Fungsi toast dari hook `useToast()` Astryx
 *
 * @example
 * ```ts
 * try {
 *   await saveProject(payload);
 * } catch (error) {
 *   handleFormError(error, showToast);
 * }
 * ```
 */
export function handleFormError(error: unknown, showToast: (options: { type: "error"; body: string }) => void): void {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "object" && error !== null && "message" in error
        ? String((error as { message?: unknown }).message)
        : "Terjadi kesalahan sistem.";

  showToast({ body: message, type: "error" });
}
