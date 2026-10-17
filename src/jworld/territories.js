function normalizeGeometry(geometry) {
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
  return geo;
}

/** Polygon coordinate arrays for each territory part. */
export function listTerritoryPolygons(geometry) {
  const geo = normalizeGeometry(geometry);
  if (!geo) return [];
  if (geo.type === "Polygon") return [geo.coordinates];
  return geo.coordinates || [];
}

/** Raw name strings aligned with territory polygons. */
export function listTerritoryNames(countryOrPayload, geometry = null) {
  const geo = geometry || countryOrPayload?.geometry;
  const parts = listTerritoryPolygons(geo);
  const stored = countryOrPayload?.geography?.territories;
  const names = Array.isArray(stored) ? stored : [];

  return parts.map((_, index) => {
    const entry = names[index];
    if (typeof entry === "string") return entry.trim();
    if (entry && typeof entry === "object") return String(entry.name || "").trim();
    return "";
  });
}

/** Display label like "Gibraltar (United Kingdom)". */
export function formatTerritoryLabel(territoryName, countryName) {
  const place = String(territoryName || "").trim();
  const country = String(countryName || "").trim();
  if (!place && !country) return "Territory";
  if (!place) return country;
  if (!country || place.toLowerCase() === country.toLowerCase()) return place;
  return `${place} (${country})`;
}

export function territoriesPayload(names) {
  return (names || []).map((name) => ({
    name: String(name || "").trim(),
  }));
}

/** Rebuild geometry + name list after removing one part. */
export function removeTerritoryAt(geometry, names, index) {
  const parts = listTerritoryPolygons(geometry);
  if (index < 0 || index >= parts.length) {
    return {
      geometry: normalizeGeometry(geometry),
      names: [...(names || [])],
    };
  }
  if (parts.length <= 1) {
    return { geometry: null, names: [] };
  }

  const nextParts = parts.filter((_, i) => i !== index);
  const nextNames = [...(names || [])];
  nextNames.splice(index, 1);

  if (nextParts.length === 1) {
    return {
      geometry: { type: "Polygon", coordinates: nextParts[0] },
      names: nextNames,
    };
  }

  return {
    geometry: { type: "MultiPolygon", coordinates: nextParts },
    names: nextNames,
  };
}

/** Ensure names array length matches polygon count. */
export function syncTerritoryNames(geometry, names, fallbackName = "") {
  const parts = listTerritoryPolygons(geometry);
  return parts.map((_, i) => {
    const existing = String(names?.[i] || "").trim();
    if (existing) return existing;
    if (i === 0 && fallbackName) return String(fallbackName).trim();
    return "";
  });
}

/** Attach territory name list onto a payload's geography. */
export function withTerritoryNames(payload, names) {
  return {
    ...payload,
    geography: {
      ...(payload.geography || {}),
      territories: territoriesPayload(names),
    },
  };
}
