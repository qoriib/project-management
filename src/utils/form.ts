export function getFieldError(errors: any[] | undefined): { type: 'error', message: string } | undefined {
  if (!errors || errors.length === 0) return undefined;

  const firstError = errors[0];
  const message = typeof firstError === 'string' ? firstError : firstError?.message;

  if (message) {
    return { type: 'error', message };
  }

  return undefined;
}
