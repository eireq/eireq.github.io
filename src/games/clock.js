// rounds up, so 0:01 stays on screen until the time is actually gone
export function formatClock(ms) {
  const total = Math.max(0, Math.ceil(ms / 1000 - 1e-9));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}
