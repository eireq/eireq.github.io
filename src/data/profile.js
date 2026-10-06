const PROFILE_KEY = "eirePlayerName";
const RACING_KEY = "laneRunnerName";
const MAX_NAME = 30;
const RACING_MAX = 16;

function cleanName(value, max = MAX_NAME) {
  return String(value || "")
    .trim()
    .slice(0, max);
}

/**
 * Shared player name across games/tools.
 * Reads the unified key first, then migrates legacy racing name.
 * Writes both keys so existing racing score inserts keep working.
 */
export function getPlayerName() {
  const shared = cleanName(window.localStorage.getItem(PROFILE_KEY));
  if (shared) return shared;

  const racing = cleanName(window.localStorage.getItem(RACING_KEY), RACING_MAX);
  if (racing) {
    window.localStorage.setItem(PROFILE_KEY, racing);
    return racing;
  }

  return "a guy";
}

export function setPlayerName(value) {
  const name = cleanName(value) || "a guy";
  window.localStorage.setItem(PROFILE_KEY, name);
  window.localStorage.setItem(RACING_KEY, name.slice(0, RACING_MAX));
  return name;
}

export function racingPlayerName() {
  return getPlayerName().slice(0, RACING_MAX) || "a guy";
}
