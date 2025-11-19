export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  const authData = localStorage.getItem('authData');
  if (!authData) return null;
  try {
    const parsed = JSON.parse(authData);
    return parsed.token || null;
  } catch {
    return null;
  }
}

export function getAuthData(): unknown | null {
  if (typeof window === 'undefined') return null;
  const authData = localStorage.getItem('authData');
  if (!authData) return null;
  try {
    return JSON.parse(authData);
  } catch {
    return null;
  }
}
