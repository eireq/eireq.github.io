import { normalizeGeometry } from "./geometry.js";

function outerRings(geometry) {
  if (geometry.type === "Polygon") return [geometry.coordinates[0]];
  return geometry.coordinates.map((polygon) => polygon[0]).filter(Boolean);
}

function bboxOf(geometry) {
  let minX = 180;
  let minY = 90;
  let maxX = -180;
  let maxY = -90;
  for (const ring of outerRings(geometry)) {
    for (const [x, y] of ring) {
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  }
  return { minX, minY, maxX, maxY };
}

function boxesOverlap(a, b) {
  return a.minX <= b.maxX && a.maxX >= b.minX && a.minY <= b.maxY && a.maxY >= b.minY;
}

function pointInRing(x, y, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0];
    const yi = ring[i][1];
    const xj = ring[j][0];
    const yj = ring[j][1];
    const intersect =
      yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi + 0.0) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function pointInGeometry(x, y, geometry) {
  return outerRings(geometry).some((ring) => pointInRing(x, y, ring));
}

function sampleRing(ring, maxPoints = 40) {
  if (!ring?.length) return [];
  if (ring.length <= maxPoints) return ring;
  const step = Math.ceil(ring.length / maxPoints);
  const out = [];
  for (let i = 0; i < ring.length; i += step) out.push(ring[i]);
  return out;
}

function segmentsCross(a, b, c, d) {
  function side(p, q, r) {
    return (q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]);
  }
  const ab = side(a, b, c) * side(a, b, d);
  const cd = side(c, d, a) * side(c, d, b);
  return ab < 0 && cd < 0;
}

function edgesCross(geometryA, geometryB) {
  const ringsA = outerRings(geometryA).map((ring) => sampleRing(ring, 24));
  const ringsB = outerRings(geometryB).map((ring) => sampleRing(ring, 24));
  for (const ringA of ringsA) {
    for (let i = 0; i < ringA.length - 1; i += 1) {
      for (const ringB of ringsB) {
        for (let j = 0; j < ringB.length - 1; j += 1) {
          if (segmentsCross(ringA[i], ringA[i + 1], ringB[j], ringB[j + 1])) {
            return true;
          }
        }
      }
    }
  }
  return false;
}

function geometriesOverlap(a, b) {
  if (!boxesOverlap(bboxOf(a), bboxOf(b))) return false;
  const samplesA = outerRings(a).flatMap((ring) => sampleRing(ring));
  const samplesB = outerRings(b).flatMap((ring) => sampleRing(ring));
  if (samplesA.some(([x, y]) => pointInGeometry(x, y, b))) return true;
  if (samplesB.some(([x, y]) => pointInGeometry(x, y, a))) return true;
  return edgesCross(a, b);
}

/** Names of other countries this geometry covers. Does not block a save. */
export function coveredCountryNames(geometry, countries, ignoreId = null) {
  const mine = normalizeGeometry(geometry);
  if (!mine) return [];
  const names = [];
  for (const country of countries || []) {
    if (!country || country.id === ignoreId) continue;
    const other = normalizeGeometry(country.geometry);
    if (!other) continue;
    if (!geometriesOverlap(mine, other)) continue;
    const name = country.official_name || "another country";
    if (!names.includes(name)) names.push(name);
  }
  return names;
}
