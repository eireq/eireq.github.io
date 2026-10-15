import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-draw";
import "leaflet-draw/dist/leaflet.draw.css";
import { flagPublicUrl } from "./supabase.js";

import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const FLAG_FILL_OPACITY = 0.85;
const EMPTY_FILL_OPACITY = 0.5;

/** SPA-safe SVG paint server URL (bare url(#id) breaks on /jworld). */
function svgPaintUrl(patternId) {
  const base = `${window.location.origin}${window.location.pathname}${window.location.search}`;
  return `url("${base}#${patternId}")`;
}

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

  if (geo.type === "Polygon") {
    const ring = geo.coordinates?.[0];
    if (!ring || ring.length < 3) return null;
  }
  if (geo.type === "MultiPolygon") {
    const ring = geo.coordinates?.[0]?.[0];
    if (!ring || ring.length < 3) return null;
  }
  if (geo.type !== "Polygon" && geo.type !== "MultiPolygon") return null;
  return geo;
}

function geometryToLatLngs(geometry) {
  const geo = normalizeGeometry(geometry);
  if (!geo) return null;

  if (geo.type === "Polygon") {
    return geo.coordinates.map((ring) =>
      ring.map(([lng, lat]) => [lat, lng]),
    );
  }

  return geo.coordinates.map((polygon) =>
    polygon.map((ring) => ring.map(([lng, lat]) => [lat, lng])),
  );
}

/** One latlng-ring-list per territory (so each can get its own flag). */
function territoryLatLngList(geometry) {
  const geo = normalizeGeometry(geometry);
  if (!geo) return [];

  if (geo.type === "Polygon") {
    return [
      geo.coordinates.map((ring) => ring.map(([lng, lat]) => [lat, lng])),
    ];
  }

  return geo.coordinates.map((polygon) =>
    polygon.map((ring) => ring.map(([lng, lat]) => [lat, lng])),
  );
}

export function layerToGeoJSONGeometry(layer) {
  const geo = layer.toGeoJSON();
  return geo?.geometry || null;
}

/** Combine polygons into one MultiPolygon (e.g. UK + Gibraltar). */
export function mergeGeometries(existing, addition) {
  const base = normalizeGeometry(existing);
  const add = normalizeGeometry(addition);
  if (!add) return base;
  if (!base) return add;

  const asMultiCoords = (geo) =>
    geo.type === "MultiPolygon" ? geo.coordinates : [geo.coordinates];

  return {
    type: "MultiPolygon",
    coordinates: [...asMultiCoords(base), ...asMultiCoords(add)],
  };
}

function ensureDefs(svg) {
  let defs = svg.querySelector("defs.jworld-flag-defs");
  if (!defs) {
    defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
    defs.classList.add("jworld-flag-defs");
    svg.prepend(defs);
  }
  return defs;
}

function applySolidFill(path, opacity) {
  path.setAttribute("fill", "#5a8cc8");
  path.setAttribute("fill-opacity", String(opacity));
}

function updateFlagPattern(map, layer, patternKey, flagUrl) {
  const path = layer.getElement?.() || layer._path;
  if (!path) return;

  // Always keep a visible solid fill so countries never "vanish".
  applySolidFill(path, flagUrl ? FLAG_FILL_OPACITY : EMPTY_FILL_OPACITY);
  if (!flagUrl) return;

  const svg = path.ownerSVGElement;
  if (!svg) return;

  const defs = ensureDefs(svg);
  // Unique pattern per territory so each gets a full flag in its own bounds.
  const safeId = String(patternKey).replace(/[^a-zA-Z0-9]/g, "");
  const patternId = `jworldflag${safeId}`;
  let pattern = svg.getElementById(patternId);
  if (!pattern) {
    pattern = document.createElementNS("http://www.w3.org/2000/svg", "pattern");
    pattern.setAttribute("id", patternId);
    pattern.setAttribute("patternUnits", "userSpaceOnUse");
    const image = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "image",
    );
    image.setAttribute("preserveAspectRatio", "xMidYMid slice");
    image.setAttributeNS("http://www.w3.org/1999/xlink", "href", flagUrl);
    image.setAttribute("href", flagUrl);
    pattern.appendChild(image);
    defs.appendChild(pattern);
  } else {
    const image = pattern.querySelector("image");
    if (image) {
      image.setAttributeNS("http://www.w3.org/1999/xlink", "href", flagUrl);
      image.setAttribute("href", flagUrl);
    }
  }

  // Size the flag to THIS territory only (not the whole MultiPolygon bbox).
  const bounds = layer.getBounds?.();
  if (!bounds || !bounds.isValid()) return;

  const sw = map.latLngToLayerPoint(bounds.getSouthWest());
  const ne = map.latLngToLayerPoint(bounds.getNorthEast());
  const x = Math.min(sw.x, ne.x);
  const y = Math.min(sw.y, ne.y);
  const width = Math.max(8, Math.abs(ne.x - sw.x));
  const height = Math.max(8, Math.abs(sw.y - ne.y));

  pattern.setAttribute("x", String(x));
  pattern.setAttribute("y", String(y));
  pattern.setAttribute("width", String(width));
  pattern.setAttribute("height", String(height));

  const image = pattern.querySelector("image");
  if (image) {
    image.setAttribute("x", "0");
    image.setAttribute("y", "0");
    image.setAttribute("width", String(width));
    image.setAttribute("height", String(height));
  }

  path.setAttribute("fill", svgPaintUrl(patternId));
  path.setAttribute("fill-opacity", String(FLAG_FILL_OPACITY));
}

function eachTerritoryPart(entry, fn) {
  if (entry?.__jworldParts?.length) {
    entry.__jworldParts.forEach((layer, index) => fn(layer, index));
    return;
  }
  fn(entry, 0);
}

export function createJworldMap(container, options = {}) {
  const map = L.map(container, {
    worldCopyJump: true,
    minZoom: 2,
    maxZoom: 11,
    zoomControl: true,
  }).setView([20, 10], 2);

  L.tileLayer(
    "https://basemap.queeniemella.cc/tiles/countries/{z}/{x}/{y}.png",
    {
      attribution:
        '&copy; <a href="https://basemap.queeniemella.cc/">queeniemella.cc</a> | &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 20,
    },
  ).addTo(map);

  const countriesLayer = L.featureGroup().addTo(map);
  const drawLayer = new L.FeatureGroup().addTo(map);

  const countryLayers = new Map();
  let drawControl = null;
  let drawingEnabled = false;
  let activeTool = null;

  const handlers = {
    onCountryClick: options.onCountryClick || (() => {}),
    onDrawCreated: options.onDrawCreated || (() => {}),
    onDrawEdited: options.onDrawEdited || (() => {}),
  };

  function stopLayerEditing() {
    drawLayer.eachLayer((layer) => {
      try {
        if (layer.editing?.enabled?.()) layer.editing.disable();
        else if (layer.editing?.disable) layer.editing.disable();
      } catch {
        /* ignore */
      }
    });
  }

  function stopActiveTool() {
    stopLayerEditing();
    if (!activeTool) return;
    try {
      // Commit in-progress vertex edits before disable (disable can revert).
      if (typeof activeTool.save === "function") activeTool.save();
      activeTool.disable();
    } catch {
      /* ignore */
    }
    activeTool = null;
  }

  const vertexIcon = (isFirst) =>
    L.divIcon({
      className: isFirst
        ? "leaflet-div-icon leaflet-editing-icon jworld-first-vertex"
        : "leaflet-div-icon leaflet-editing-icon",
      iconSize: isFirst ? [14, 14] : [10, 10],
      iconAnchor: isFirst ? [7, 7] : [5, 5],
    });

  /** Make the first draw/edit vertex obvious (the one you click to close). */
  function highlightFirstVertex() {
    const markers = activeTool?._markers;
    if (!Array.isArray(markers) || !markers.length) return;

    markers.forEach((marker, index) => {
      if (!marker?.setIcon) return;
      marker.setIcon(vertexIcon(index === 0));
      if (index === 0) {
        marker.setZIndexOffset?.(1000);
        const el = marker.getElement?.() || marker._icon;
        if (el) {
          el.title = "Start point — click here to close the shape";
          el.setAttribute("aria-label", "Start point — click here to close the shape");
        }
      }
    });
  }

  function collectEditMarkers(layer) {
    const editing = layer.editing;
    if (!editing) return [];
    const markers = [];
    const pushRing = (ring) => {
      if (!Array.isArray(ring)) return;
      ring.forEach((marker) => {
        if (marker?.setIcon) markers.push(marker);
      });
    };

    if (Array.isArray(editing._markers)) {
      if (editing._markers[0]?.setIcon) pushRing(editing._markers);
      else editing._markers.forEach(pushRing);
    }

    const handlers = editing._verticesHandlers;
    if (Array.isArray(handlers)) {
      handlers.forEach((handler) => {
        const hMarkers = handler?._markers;
        if (!Array.isArray(hMarkers)) return;
        if (hMarkers[0]?.setIcon) pushRing(hMarkers);
        else hMarkers.forEach(pushRing);
      });
    }

    return markers;
  }

  function highlightEditFirstVertices() {
    drawLayer.eachLayer((layer) => {
      const markers = collectEditMarkers(layer);
      if (!markers.length) return;
      markers.forEach((marker, index) => {
        marker.setIcon(vertexIcon(index === 0));
        if (index === 0) {
          marker.setZIndexOffset?.(1000);
          const el = marker.getElement?.() || marker._icon;
          if (el) el.title = "Start point of this ring";
        }
      });
    });
  }

  function enableVertexEditingOnDrawLayer() {
    // Prefer the toolbar pencil handler (same code path as clicking it).
    const toolbarEdit = drawControl?._toolbars?.edit?._modes?.edit?.handler;
    if (toolbarEdit) {
      try {
        if (toolbarEdit.enabled?.()) toolbarEdit.disable();
      } catch {
        /* ignore */
      }
      toolbarEdit.enable();
      activeTool = toolbarEdit;
      return true;
    }

    // Fallback: enable each polygon's built-in editor.
    let enabledAny = false;
    drawLayer.eachLayer((layer) => {
      if (!layer.editing) return;
      try {
        layer.editing.enable();
        enabledAny = true;
      } catch (err) {
        console.warn("jWorld: could not enable vertex editing", err);
      }
    });
    return enabledAny;
  }

  function refreshFlagFills() {
    for (const [id, entry] of countryLayers.entries()) {
      const flagUrl = entry.__jworldFlagUrl;
      eachTerritoryPart(entry, (layer, index) => {
        updateFlagPattern(map, layer, `${id}p${index}`, flagUrl);
      });
    }
  }

  map.on("zoomend moveend viewreset", refreshFlagFills);

  function styleFor(country, isMine) {
    return {
      color: isMine ? "#f0d78c" : "#c9d7e6",
      weight: isMine ? 3 : 2,
      opacity: 1,
      fillColor: "#5a8cc8",
      fillOpacity: country.flag_path ? FLAG_FILL_OPACITY : EMPTY_FILL_OPACITY,
    };
  }

  function setCountries(countries, memberId, isAdmin = false) {
    countriesLayer.clearLayers();
    countryLayers.clear();

    let rendered = 0;
    let skipped = 0;

    for (const country of countries || []) {
      try {
        const geometry = normalizeGeometry(country.geometry);
        const territories = territoryLatLngList(geometry);
        if (!territories.length) {
          skipped += 1;
          continue;
        }

        const editable = Boolean(
          isAdmin || (memberId && country.owner_member_id === memberId),
        );
        const style = styleFor(country, editable);
        const flagUrl = flagPublicUrl(country.flag_path);
        const parts = [];
        const group = L.featureGroup();

        // One polygon layer per territory → each gets a full flag fill.
        for (const latlngs of territories) {
          const part = L.polygon(latlngs, style);
          part.bindTooltip(country.official_name || "Country", {
            sticky: true,
            direction: "top",
            opacity: 0.9,
          });
          part.on("click", () => handlers.onCountryClick(country));
          group.addLayer(part);
          parts.push(part);
        }

        group.__jworldCountryId = country.id;
        group.__jworldFlagUrl = flagUrl;
        group.__jworldParts = parts;
        countriesLayer.addLayer(group);
        countryLayers.set(country.id, group);
        rendered += 1;

        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            parts.forEach((part, index) => {
              updateFlagPattern(map, part, `${country.id}p${index}`, flagUrl);
            });
          });
        });
      } catch (err) {
        console.warn("jWorld: failed to render country", country?.official_name, err);
        skipped += 1;
      }
    }

    setTimeout(refreshFlagFills, 100);
    setTimeout(refreshFlagFills, 500);

    return { rendered, skipped, total: (countries || []).length };
  }

  function enableDrawing() {
    if (drawingEnabled) return;
    drawingEnabled = true;

    drawControl = new L.Control.Draw({
      position: "topright",
      draw: {
        polygon: {
          allowIntersection: true,
          showArea: false,
          shapeOptions: {
            color: "#f0d78c",
            weight: 2,
            fillOpacity: 0.25,
          },
        },
        polyline: false,
        rectangle: false,
        circle: false,
        marker: false,
        circlemarker: false,
      },
      edit: {
        featureGroup: drawLayer,
        remove: true,
      },
    });
    map.addControl(drawControl);

    map.on(L.Draw.Event.CREATED, (event) => {
      drawLayer.clearLayers();
      drawLayer.addLayer(event.layer);
      handlers.onDrawCreated(layerToGeoJSONGeometry(event.layer), event.layer);
    });

    map.on(L.Draw.Event.EDITED, (event) => {
      event.layers.eachLayer((layer) => {
        handlers.onDrawEdited(layerToGeoJSONGeometry(layer), layer);
      });
    });

    map.on(L.Draw.Event.DRAWVERTEX, () => {
      // Defer so leaflet-draw finishes adding the marker first.
      requestAnimationFrame(highlightFirstVertex);
    });
  }

  function disableDrawing() {
    if (!drawingEnabled) return;
    drawingEnabled = false;
    stopActiveTool();
    if (drawControl) {
      map.removeControl(drawControl);
      drawControl = null;
    }
    drawLayer.clearLayers();
  }

  function beginNewCountry() {
    enableDrawing();
    stopActiveTool();
    drawLayer.clearLayers();
    const drawer = new L.Draw.Polygon(map, {
      ...drawControl?.options?.draw?.polygon,
      icon: vertexIcon(false),
      touchIcon: vertexIcon(false),
    });
    drawer.enable();
    activeTool = drawer;
    return drawer;
  }

  /** Draw an extra polygon to attach to an existing country. */
  function beginAddTerritory() {
    return beginNewCountry();
  }

  function loadCountryIntoDraw(country) {
    enableDrawing();
    stopActiveTool();
    drawLayer.clearLayers();

    // Split MultiPolygon into simple polygons — leaflet-draw won't show
    // vertex handles reliably on a single multi-polygon layer.
    const territories = territoryLatLngList(country.geometry);
    if (!territories.length) return null;

    const style = {
      ...styleFor(country, true),
      fillOpacity: 0.25,
    };
    territories.forEach((latlngs) => {
      drawLayer.addLayer(L.polygon(latlngs, style));
    });

    // Same as clicking the pencil — must run after layers are in the group.
    const ok = enableVertexEditingOnDrawLayer();
    if (!ok) {
      console.warn("jWorld: edit handler did not enable");
    }

    requestAnimationFrame(() => {
      requestAnimationFrame(highlightEditFirstVertices);
      // Second pass: toolbar enable is sometimes async for marker creation.
      setTimeout(highlightEditFirstVertices, 50);
      setTimeout(highlightEditFirstVertices, 200);
    });

    return drawLayer;
  }

  function focusCountry(country) {
    const layer = countryLayers.get(country?.id);
    if (layer?.getBounds?.()?.isValid()) {
      map.fitBounds(layer.getBounds(), { padding: [40, 40], maxZoom: 6 });
      return;
    }
    const latlngs = geometryToLatLngs(country?.geometry);
    if (!latlngs) return;
    try {
      const temp = L.polygon(latlngs);
      if (temp.getBounds().isValid()) {
        map.fitBounds(temp.getBounds(), { padding: [40, 40], maxZoom: 6 });
      }
    } catch {
      /* ignore */
    }
  }

  function clearDraw() {
    stopActiveTool();
    drawLayer.clearLayers();
  }

  function destroy() {
    stopActiveTool();
    map.off();
    map.remove();
  }

  setTimeout(() => map.invalidateSize(), 50);

  return {
    map,
    setCountries,
    enableDrawing,
    disableDrawing,
    beginNewCountry,
    beginAddTerritory,
    loadCountryIntoDraw,
    focusCountry,
    clearDraw,
    refreshFlagFills,
    invalidateSize: () => map.invalidateSize(),
    destroy,
    getDrawGeometry: () => {
      const parts = [];
      drawLayer.eachLayer((layer) => {
        const geo = normalizeGeometry(layerToGeoJSONGeometry(layer));
        if (!geo) return;
        if (geo.type === "Polygon") parts.push(geo.coordinates);
        else if (geo.type === "MultiPolygon") parts.push(...geo.coordinates);
      });
      if (!parts.length) return null;
      if (parts.length === 1) {
        return { type: "Polygon", coordinates: parts[0] };
      }
      return { type: "MultiPolygon", coordinates: parts };
    },
  };
}
