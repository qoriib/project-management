/**
 * Returns a field error status object only when the field has been touched.
 * Prevents validation errors from showing immediately on form mount.
 *
 * @param errors   - field.state.meta.errors
 * @param isTouched - field.state.meta.isTouched (default: true for backward compat)
 */
export function getFieldError(
  errors: any[] | undefined,
  isTouched = true
): { type: 'error'; message: string } | undefined {
  if (!isTouched || !errors || errors.length === 0) return undefined;

  const firstError = errors[0];
  const message = typeof firstError === 'string' ? firstError : firstError?.message;

  if (message) {
    return { type: 'error', message };
  }

  return undefined;
}
