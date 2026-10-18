import { normalizeGeometry } from "./geometry.js";

/** Polygon coordinate arrays for each territory part. */
export function listTerritoryPolygons(geometry) {
  const geo = normalizeGeometry(geometry);
  if (!geo) return [];
  if (geo.type === "Polygon") return [geo.coordinates];
  return geo.coordinates || [];
}

function entryName(entry) {
  if (typeof entry === "string") return entry.trim();
  if (entry && typeof entry === "object") return String(entry.name || "").trim();
  return "";
}

function entryCount(entry) {
  const count = Number(entry?.count);
  return Number.isFinite(count) && count > 1 ? Math.floor(count) : 1;
}

/**
 * One row per named territory. `count` is how many polygons share that name.
 * Older saves stored one {name} per polygon and stay one island per row.
 */
export function territoryGroups(geometry, storedEntries, fallbackName = "") {
  const parts = listTerritoryPolygons(geometry);
  const entries = Array.isArray(storedEntries) ? storedEntries : [];
  const grouped = entries.some((entry) => entryCount(entry) > 1);
  const countSum = entries.reduce((sum, entry) => sum + entryCount(entry), 0);
  const useCounts =
    grouped ||
    (entries.length > 0 &&
      entries.length !== parts.length &&
      countSum === parts.length);

  if (!useCounts) {
    return parts.map((_, index) => ({
      name:
        entryName(entries[index]) ||
        (index === 0 ? String(fallbackName || "").trim() : ""),
      count: 1,
    }));
  }

  const groups = [];
  let cursor = 0;
  for (const entry of entries) {
    if (cursor >= parts.length) break;
    const count = Math.min(entryCount(entry), parts.length - cursor);
    groups.push({ name: entryName(entry), count });
    cursor += count;
  }
  while (cursor < parts.length) {
    groups.push({
      name: cursor === 0 ? String(fallbackName || "").trim() : "",
      count: 1,
    });
    cursor += 1;
  }
  return groups;
}

/** Expand groups so each polygon has the territory name it belongs to. */
export function expandGroupNames(groups, partCount) {
  const names = [];
  for (const group of groups || []) {
    const count = Math.max(1, Number(group.count) || 1);
    const name = String(group.name || "").trim();
    for (let i = 0; i < count && names.length < partCount; i += 1) {
      names.push(name);
    }
  }
  while (names.length < partCount) names.push("");
  return names.slice(0, partCount);
}

/** Raw name strings aligned with territory polygons. */
export function listTerritoryNames(countryOrPayload, geometry = null) {
  const geo = geometry || countryOrPayload?.geometry;
  const parts = listTerritoryPolygons(geo);
  const groups = territoryGroups(
    geo,
    countryOrPayload?.geography?.territories,
    "",
  );
  return expandGroupNames(groups, parts.length);
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

function geometryFromParts(parts) {
  if (!parts?.length) return null;
  if (parts.length === 1) return { type: "Polygon", coordinates: parts[0] };
  return { type: "MultiPolygon", coordinates: parts };
}

function groupSpans(groups) {
  let cursor = 0;
  return (groups || []).map((group) => {
    const count = Math.max(1, Number(group.count) || 1);
    const span = {
      start: cursor,
      count,
      name: String(group.name || "").trim(),
    };
    cursor += count;
    return span;
  });
}

/** Keep group counts aligned with the current polygons. */
export function syncTerritoryGroups(geometry, groups, fallbackName = "") {
  const parts = listTerritoryPolygons(geometry);
  const next = [];
  let used = 0;
  for (const group of groups || []) {
    if (used >= parts.length) break;
    const count = Math.min(
      Math.max(1, Number(group.count) || 1),
      parts.length - used,
    );
    const name =
      String(group.name || "").trim() ||
      (used === 0 ? String(fallbackName || "").trim() : "");
    next.push({ name, count });
    used += count;
  }
  while (used < parts.length) {
    next.push({
      name: used === 0 ? String(fallbackName || "").trim() : "",
      count: 1,
    });
    used += 1;
  }
  return next;
}

/**
 * Combine the chosen groups into one name.
 * Islands stay separate polygons; they just share the name.
 */
export function mergeTerritoryGroups(geometry, groups, indexes, name) {
  const parts = listTerritoryPolygons(geometry);
  const spans = groupSpans(groups);
  const selected = new Set(indexes);
  if (selected.size < 2) {
    return {
      geometry: normalizeGeometry(geometry),
      groups: syncTerritoryGroups(geometry, groups),
    };
  }

  const next = [];
  const mergedParts = [];
  let placed = false;
  spans.forEach((span, index) => {
    const slice = parts.slice(span.start, span.start + span.count);
    if (selected.has(index)) {
      mergedParts.push(...slice);
      if (!placed) {
        next.push({ name: String(name || "").trim() || span.name, count: 0 });
        placed = true;
      }
      return;
    }
    next.push({ name: span.name, count: span.count, parts: slice });
  });

  const merged = next.find((group) => group.count === 0 && !group.parts);
  if (merged) {
    merged.count = mergedParts.length;
    merged.parts = mergedParts;
  }

  const ordered = [];
  const clean = [];
  for (const group of next) {
    const slice = group.parts || [];
    ordered.push(...slice);
    clean.push({ name: group.name, count: slice.length || group.count });
  }

  return {
    geometry: geometryFromParts(ordered),
    groups: clean,
  };
}

/** Turn one multi-island territory back into one row per island. */
export function splitTerritoryGroup(groups, index) {
  const group = groups?.[index];
  if (!group || (Number(group.count) || 1) <= 1) {
    return (groups || []).map((entry) => ({
      name: String(entry.name || ""),
      count: Math.max(1, Number(entry.count) || 1),
    }));
  }
  const pieces = Array.from({ length: group.count }, () => ({
    name: String(group.name || ""),
    count: 1,
  }));
  return [
    ...groups.slice(0, index).map((entry) => ({
      name: String(entry.name || ""),
      count: Math.max(1, Number(entry.count) || 1),
    })),
    ...pieces,
    ...groups.slice(index + 1).map((entry) => ({
      name: String(entry.name || ""),
      count: Math.max(1, Number(entry.count) || 1),
    })),
  ];
}

/** Drop one named territory and the polygons that belong to it. */
export function removeTerritoryGroup(geometry, groups, index) {
  const parts = listTerritoryPolygons(geometry);
  const spans = groupSpans(groups);
  const span = spans[index];
  if (!span || (groups || []).length <= 1) {
    return {
      geometry: normalizeGeometry(geometry),
      groups: syncTerritoryGroups(geometry, groups),
    };
  }
  const nextParts = parts.filter(
    (_, partIndex) =>
      partIndex < span.start || partIndex >= span.start + span.count,
  );
  const nextGroups = groups.filter((_, groupIndex) => groupIndex !== index);
  return {
    geometry: geometryFromParts(nextParts),
    groups: nextGroups.map((entry) => ({
      name: String(entry.name || ""),
      count: Math.max(1, Number(entry.count) || 1),
    })),
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

/** Attach territory groups onto a payload's geography. */
export function withTerritoryGroups(payload, groups) {
  return {
    ...payload,
    geography: {
      ...(payload.geography || {}),
      territories: (groups || []).map((group) => {
        const name = String(group.name || "").trim();
        const count = Math.max(1, Number(group.count) || 1);
        return count > 1 ? { name, count } : { name };
      }),
    },
  };
}

/** Attach territory name list onto a payload's geography. */
export function withTerritoryNames(payload, names) {
  return withTerritoryGroups(
    payload,
    (names || []).map((name) => ({ name, count: 1 })),
  );
}
