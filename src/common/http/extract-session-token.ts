export const extractSessionToken = (cookies: unknown): string | null => {
  if (!cookies || typeof cookies !== 'object') {
    return null;
  }

  const sessionToken = (cookies as Record<string, unknown>).sessionToken;
  const sessionTokenHasValidType = typeof sessionToken === 'string';

  return sessionTokenHasValidType ? sessionToken : null;
};
