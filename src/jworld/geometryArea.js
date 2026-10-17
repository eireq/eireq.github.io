/** WGS84 equatorial radius (m) — same as Mapbox geojson-area. */
import { normalizeGeometry } from "./geometry.js";

const EARTH_RADIUS_M = 6378137;
const M2_PER_KM2 = 1_000_000;
const M2_PER_SQ_MI = 2_589_988.110336;

function toRad(deg) {
  return (deg * Math.PI) / 180;
}

/** Signed spherical ring area in m² (outer rings positive, holes negative). */
function ringAreaM2(ring) {
  if (!ring || ring.length < 3) return 0;
  let total = 0;
  const n = ring.length;
  for (let i = 0; i < n; i++) {
    const [lng1, lat1] = ring[i];
    const [lng2, lat2] = ring[(i + 1) % n];
    total +=
      (toRad(lng2) - toRad(lng1)) *
      (2 + Math.sin(toRad(lat1)) + Math.sin(toRad(lat2)));
  }
  return (total * EARTH_RADIUS_M * EARTH_RADIUS_M) / 2;
}

function polygonAreaM2(coords) {
  if (!coords?.length) return 0;
  let area = 0;
  for (const ring of coords) {
    area += ringAreaM2(ring);
  }
  return Math.abs(area);
}

/** Total land area of a Polygon/MultiPolygon in square metres. */
export function geometryAreaM2(geometry) {
  const geo = normalizeGeometry(geometry);
  if (!geo) return 0;

  if (geo.type === "Polygon") {
    return polygonAreaM2(geo.coordinates);
  }

  let total = 0;
  for (const polygon of geo.coordinates) {
    total += polygonAreaM2(polygon);
  }
  return total;
}

function formatNumber(n) {
  return Math.round(n).toLocaleString("en-US");
}

/**
 * Human-readable land area from borders.
 * @returns {string} e.g. "2,166,086 km² / 836,330 sq mi"
 */
export function formatLandArea(geometry) {
  const m2 = geometryAreaM2(geometry);
  if (!m2) return "";
  const km2 = m2 / M2_PER_KM2;
  const sqMi = m2 / M2_PER_SQ_MI;
  return `${formatNumber(km2)} km² / ${formatNumber(sqMi)} sq mi`;
}

/** Copy payload and set land_area + geography.area from geometry. */
export function withCalculatedArea(payload, geometry) {
  const area = formatLandArea(geometry);
  if (!area) return payload;
  return {
    ...payload,
    land_area: area,
    geography: {
      ...(payload.geography || {}),
      area,
    },
  };
}
