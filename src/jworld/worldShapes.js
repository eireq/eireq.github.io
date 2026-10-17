/**
 * Real-world country outlines for "Snap to shape".
 * 50m is what gets saved. 110m is only a visual guide — too coarse to store.
 * Files live under /data/ so they are not confused with the /jworld SPA route.
 */
const BASE = import.meta.env.BASE_URL;
const SHAPE_SOURCES = [
  {
    url: `${BASE}data/ne_50m_admin_0_countries.geojson`,
    lowResolution: false,
  },
  {
    url: "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_admin_0_countries.geojson",
    lowResolution: false,
  },
  {
    url: `${BASE}data/ne_110m_admin_0_countries.geojson`,
    lowResolution: true,
  },
];

/**
 * Clicks this close to a simplified coast are reported as "near", not saved.
 * Only a point inside the outline becomes a border.
 */
const NEAR_COAST_KM = 40;

let cachedCollection = null;
let loadPromise = null;

async function fetchJson(url, timeoutMs = 20000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`Failed to load world shapes (${res.status})`);
    const text = await res.text();
    // GitHub Pages SPA 404.html is HTML — never treat it as GeoJSON.
    const trimmed = text.trimStart();
    if (trimmed.startsWith("<!") || trimmed.startsWith("<html")) {
      throw new Error("Got HTML instead of GeoJSON (SPA 404 page).");
    }
    return JSON.parse(text);
  } finally {
    clearTimeout(timer);
  }
}

export async function loadWorldShapes() {
  if (cachedCollection) return cachedCollection;
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    let lastErr = null;
    for (const source of SHAPE_SOURCES) {
      try {
        const data = await fetchJson(source.url);
        data.__jworldLowResolution = source.lowResolution;
        cachedCollection = data;
        return data;
      } catch (err) {
        lastErr = err;
        console.warn("jWorld: world shapes failed", source.url, err);
      }
    }
    loadPromise = null;
    throw new Error(
      lastErr?.name === "AbortError"
        ? "Timed out loading world shapes. Check your connection and try again."
        : "Could not load world shapes. Try again in a moment.",
    );
  })();

  return loadPromise;
}

/** Wrap longitude into [-180, 180]. */
export function wrapLng(lng) {
  return ((((lng + 180) % 360) + 360) % 360) - 180;
}

/** Shift lng by ±360° so it sits near a reference longitude (world copies). */
function lngNear(lng, refLng) {
  let x = lng;
  while (x - refLng > 180) x -= 360;
  while (x - refLng < -180) x += 360;
  return x;
}

/** Ray-cast point-in-ring (ring is [[lng,lat], ...]). */
function pointInRing(lng, lat, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0];
    const yi = ring[i][1];
    const xj = ring[j][0];
    const yj = ring[j][1];
    const intersect =
      yi > lat !== yj > lat &&
      lng < ((xj - xi) * (lat - yi)) / (yj - yi + 0.0) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function pointInPolygonCoords(lng, lat, coordinates) {
  if (!coordinates?.length) return false;
  const outer = coordinates[0];
  if (!outer?.length) return false;
  const localLng = lngNear(lng, outer[0][0]);
  if (!pointInRing(localLng, lat, outer)) return false;
  for (let h = 1; h < coordinates.length; h += 1) {
    if (pointInRing(localLng, lat, coordinates[h])) return false;
  }
  return true;
}

function featureName(props = {}) {
  return (
    props.NAME ||
    props.ADMIN ||
    props.NAME_LONG ||
    props.name ||
    props.admin ||
    "Unknown land"
  );
}

function haversineKm(lat1, lng1, lat2, lng2) {
  const toRad = (d) => (d * Math.PI) / 180;
  const r = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * r * Math.asin(Math.min(1, Math.sqrt(a)));
}

/** Min distance from point to ring edges (km). */
function distToRingKm(lat, lng, ring) {
  if (!ring?.length) return Infinity;
  const localLng = lngNear(lng, ring[0][0]);
  let min = Infinity;
  for (let i = 0; i < ring.length; i++) {
    const [lngA, latA] = ring[i];
    const [lngB, latB] = ring[(i + 1) % ring.length];
    min = Math.min(min, haversineKm(lat, localLng, latA, lngA));
    // Sample edge midpoint — catches clicks just offshore of a long edge.
    min = Math.min(
      min,
      haversineKm(lat, localLng, (latA + latB) / 2, (lngA + lngB) / 2),
    );
  }
  return min;
}

function distToPolygonKm(lat, lng, coordinates) {
  if (!coordinates?.length) return Infinity;
  return distToRingKm(lat, lng, coordinates[0]);
}

function cloneGeometry(geometry) {
  return {
    type: geometry.type,
    coordinates: geometry.coordinates,
  };
}

function hitFromFeature(collection, feature, partCoordinates, approximate) {
  const geom = feature.geometry;
  return {
    name: featureName(feature.properties),
    // Whole country. Snap-to-create stores this, not a single island.
    geometry: cloneGeometry(geom),
    partGeometry: {
      type: "Polygon",
      coordinates: partCoordinates,
    },
    approximate,
    lowResolution: Boolean(collection?.__jworldLowResolution),
  };
}

/**
 * Find the real-world country under a map click.
 * An exact hit includes the full country plus the clicked part.
 * A near-coast hit is marked approximate and must not be saved.
 */
export function findShapeAtLatLng(collection, latlng) {
  if (!collection?.features || !latlng) return null;
  const lat = latlng.lat;
  const lng = wrapLng(latlng.lng);

  let nearest = null;
  let nearestDist = Infinity;

  for (const feature of collection.features) {
    const geom = feature.geometry;
    if (!geom) continue;

    const parts =
      geom.type === "Polygon"
        ? [geom.coordinates]
        : geom.type === "MultiPolygon"
          ? geom.coordinates
          : [];

    for (const poly of parts) {
      if (pointInPolygonCoords(lng, lat, poly)) {
        return hitFromFeature(collection, feature, poly, false);
      }
      const d = distToPolygonKm(lat, lng, poly);
      if (d < nearestDist) {
        nearestDist = d;
        nearest = hitFromFeature(collection, feature, poly, true);
      }
    }
  }

  if (nearest && nearestDist <= NEAR_COAST_KM) return nearest;
  return null;
}
