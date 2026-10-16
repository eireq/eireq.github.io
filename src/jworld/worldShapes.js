/**
 * Real-world country / island outlines for "Snap to shape".
 * Prefer the local Natural Earth 110m copy (works offline / no CORS).
 */
const LOCAL_SHAPES_URL = `${import.meta.env.BASE_URL}jworld/ne_110m_admin_0_countries.geojson`;
const FALLBACK_SHAPES_URL =
  "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson";

let cachedCollection = null;
let loadPromise = null;

async function fetchJson(url, timeoutMs = 20000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`Failed to load world shapes (${res.status})`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

export async function loadWorldShapes() {
  if (cachedCollection) return cachedCollection;
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    try {
      const data = await fetchJson(LOCAL_SHAPES_URL);
      cachedCollection = data;
      return data;
    } catch (localErr) {
      console.warn("jWorld: local world shapes failed, trying fallback", localErr);
      try {
        const data = await fetchJson(FALLBACK_SHAPES_URL);
        cachedCollection = data;
        return data;
      } catch (fallbackErr) {
        loadPromise = null;
        throw new Error(
          fallbackErr?.name === "AbortError"
            ? "Timed out loading world shapes. Check your connection and try again."
            : "Could not load world shapes. Try again in a moment.",
        );
      }
    }
  })();

  return loadPromise;
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
  if (!pointInRing(lng, lat, coordinates[0])) return false;
  for (let h = 1; h < coordinates.length; h += 1) {
    if (pointInRing(lng, lat, coordinates[h])) return false;
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

/**
 * Find the real-world shape under a map click.
 * For MultiPolygon countries, returns only the clicked island/part as a Polygon.
 */
export function findShapeAtLatLng(collection, latlng) {
  if (!collection?.features || !latlng) return null;
  const lat = latlng.lat;
  const lng = latlng.lng;

  for (const feature of collection.features) {
    const geom = feature.geometry;
    if (!geom) continue;
    const name = featureName(feature.properties);

    if (geom.type === "Polygon") {
      if (pointInPolygonCoords(lng, lat, geom.coordinates)) {
        return {
          name,
          geometry: {
            type: "Polygon",
            coordinates: geom.coordinates,
          },
        };
      }
    }

    if (geom.type === "MultiPolygon") {
      for (const poly of geom.coordinates) {
        if (pointInPolygonCoords(lng, lat, poly)) {
          return {
            name,
            geometry: {
              type: "Polygon",
              coordinates: poly,
            },
          };
        }
      }
    }
  }

  return null;
}
