/** Shared GeoJSON helpers for borders, area, and snap. */

export function normalizeGeometry(geometry) {
  if (!geometry) return null;
  let geo = geometry;
  if (typeof geo === "string") {
    try {
      geo = JSON.parse(geo);
    } catch {
      return null;
    }
  }
  if (geo.type === "Feature") geo = geo.geometry;
  if (!geo || !geo.type || !geo.coordinates) return null;
  if (geo.type !== "Polygon" && geo.type !== "MultiPolygon") return null;

  if (geo.type === "Polygon") {
    const ring = geo.coordinates?.[0];
    if (!ring || ring.length < 3) return null;
  }
  if (geo.type === "MultiPolygon") {
    const ring = geo.coordinates?.[0]?.[0];
    if (!ring || ring.length < 3) return null;
  }
  return geo;
}

/** Shift longitudes so a ring does not jump across the antimeridian. */
export function unwrapRing(ring) {
  if (!ring?.length) return [];
  const out = [[Number(ring[0][0]), Number(ring[0][1])]];
  for (let i = 1; i < ring.length; i += 1) {
    let lng = Number(ring[i][0]);
    const lat = Number(ring[i][1]);
    const prev = out[i - 1][0];
    while (lng - prev > 180) lng -= 360;
    while (lng - prev < -180) lng += 360;
    out.push([lng, lat]);
  }
  return out;
}

function samePoint(a, b) {
  return Math.abs(a[0] - b[0]) < 1e-10 && Math.abs(a[1] - b[1]) < 1e-10;
}

function cross(origin, a, b) {
  return (a[0] - origin[0]) * (b[1] - origin[1]) - (a[1] - origin[1]) * (b[0] - origin[0]);
}

/** True when two segments properly cross (shared endpoints do not count). */
function segmentsCross(a, b, c, d) {
  if (samePoint(a, b) || samePoint(c, d)) return false;
  if (
    samePoint(a, c) ||
    samePoint(a, d) ||
    samePoint(b, c) ||
    samePoint(b, d)
  ) {
    return false;
  }
  const d1 = cross(c, d, a);
  const d2 = cross(c, d, b);
  const d3 = cross(a, b, c);
  const d4 = cross(a, b, d);
  return (
    ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) &&
    ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))
  );
}

function ringPoints(ring) {
  const unwrapped = unwrapRing(ring);
  if (
    unwrapped.length > 1 &&
    samePoint(unwrapped[0], unwrapped[unwrapped.length - 1])
  ) {
    unwrapped.pop();
  }
  return unwrapped;
}

export function ringSelfIntersects(ring) {
  const pts = ringPoints(ring);
  const n = pts.length;
  if (n < 4) return false;
  for (let i = 0; i < n; i += 1) {
    const a = pts[i];
    const b = pts[(i + 1) % n];
    for (let j = i + 1; j < n; j += 1) {
      const gap = Math.min(Math.abs(i - j), n - Math.abs(i - j));
      if (gap <= 1) continue;
      const c = pts[j];
      const d = pts[(j + 1) % n];
      if (segmentsCross(a, b, c, d)) return true;
    }
  }
  return false;
}

export function geometrySelfIntersects(geometry) {
  const geo = normalizeGeometry(geometry);
  if (!geo) return false;
  const polygons =
    geo.type === "Polygon" ? [geo.coordinates] : geo.coordinates;
  for (const polygon of polygons) {
    if (!polygon) continue;
    for (const ring of polygon) {
      if (ringSelfIntersects(ring)) return true;
    }
  }
  return false;
}

/** Empty string when the geometry can be stored. */
export function savableGeometryError(geometry) {
  const geo = normalizeGeometry(geometry);
  if (!geo) return "Draw a closed shape with at least 3 points.";
  if (geometrySelfIntersects(geo)) {
    return "Borders can't cross themselves. Undo the crossing edge, then save.";
  }
  return "";
}
