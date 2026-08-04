export const extractResetToken = (cookies: unknown): string | null => {
  if (!cookies || typeof cookies !== 'object') {
    return null;
  }

  const resetToken = (cookies as Record<string, unknown>).resetToken;
  const resetTokenHasValidType = typeof resetToken === 'string';

  return resetTokenHasValidType ? resetToken : null;
};
