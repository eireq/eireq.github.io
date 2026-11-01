/** Star shows once the map is zoomed into a region. */
export const CAPITAL_STAR_ZOOM = 5;
/** Wiki capital name appears one zoom step closer than the star. */
export const CAPITAL_NAME_ZOOM = 6;

function wrapLng(lng) {
  if (!Number.isFinite(lng)) return Number.NaN;
  let x = lng;
  while (x > 180) x -= 360;
  while (x < -180) x += 360;
  return x;
}

/** { lat, lng } when the country has a saved capital point. */
export function capitalPointOf(country) {
  const point = country?.geography?.capital_point;
  if (!point || typeof point !== "object") return null;
  const lat = Number(point.lat);
  const lng = wrapLng(Number(point.lng));
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return { lat, lng };
}

/**
 * Name to draw next to the star.
 * Prefers the wiki Capital field. The map list does not always include that
 * column, so saves also copy it onto geography.capital_name.
 */
export function capitalLabelOf(country) {
  const fromWiki = country?.capital;
  if (typeof fromWiki === "string" && fromWiki.trim()) return fromWiki.trim();
  const mirrored = country?.geography?.capital_name;
  if (typeof mirrored === "string" && mirrored.trim()) return mirrored.trim();
  return "";
}

/** Keep geography.capital_name aligned with the wiki Capital field. */
export function mirrorCapitalName(payload) {
  if (!payload || typeof payload !== "object") return payload;
  const geography = {
    ...(payload.geography && typeof payload.geography === "object"
      ? payload.geography
      : {}),
  };
  const name = typeof payload.capital === "string" ? payload.capital.trim() : "";
  if (name) geography.capital_name = name;
  else delete geography.capital_name;
  return { ...payload, geography };
}

/** Copy of a country with geography.capital_point set or removed. */
export function withCapitalPoint(country, point) {
  const geography = {
    ...(country?.geography && typeof country.geography === "object"
      ? country.geography
      : {}),
  };
  if (!point) {
    delete geography.capital_point;
    return { ...country, geography };
  }
  const lat = Number(point.lat);
  const lng = wrapLng(Number(point.lng));
  if (!Number.isFinite(lat) || lat < -90 || lat > 90 || !Number.isFinite(lng)) {
    throw new Error("That point is off the map.");
  }
  geography.capital_point = {
    lat: Math.round(lat * 1e5) / 1e5,
    lng: Math.round(lng * 1e5) / 1e5,
  };
  return { ...country, geography };
}
