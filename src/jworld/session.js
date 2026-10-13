const STORAGE_KEY = "jworld-session-v1";

export function loadSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.memberId || !parsed?.token || !parsed?.displayName) return null;
    return {
      memberId: parsed.memberId,
      token: parsed.token,
      displayName: parsed.displayName,
      // Missing flag = legacy session; prompt to set a password for multi-device.
      hasPassword: Object.prototype.hasOwnProperty.call(parsed, "hasPassword")
        ? Boolean(parsed.hasPassword)
        : false,
    };
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
      hasPassword: Boolean(session.hasPassword),
    }),
  );
}

export function clearSession() {
  localStorage.removeItem(STORAGE_KEY);
}
