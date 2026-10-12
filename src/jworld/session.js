const STORAGE_KEY = "jworld-session-v1";

export function loadSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.memberId || !parsed?.token || !parsed?.displayName) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveSession(session) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      memberId: session.memberId,
      token: session.token,
      displayName: session.displayName,
    }),
  );
}

export function clearSession() {
  localStorage.removeItem(STORAGE_KEY);
}
