import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-draw";
import "leaflet-draw/dist/leaflet.draw.css";
import { flagPublicUrl } from "./supabase.js";
import {
  formatTerritoryLabel,
  listTerritoryNames,
  syncTerritoryNames,
} from "./territories.js";
import { normalizeGeometry, unwrapRing } from "./geometry.js";
import {
  CAPITAL_NAME_ZOOM,
  CAPITAL_STAR_ZOOM,
  capitalLabelOf,
  capitalPointOf,
} from "./capital.js";
import {
  findShapeAtLatLng,
  loadFineOutlines,
  loadWorldShapes,
  refineHit,
} from "./worldShapes.js";

export { normalizeGeometry };

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

/**
 * Local SVG paint URL. Do NOT use the page path (e.g. /jworld#id) — on GitHub
 * Pages that 404s and returns the SPA redirect HTML, so the flag never paints.
 */
function svgPaintUrl(patternId) {
  return `url(#${patternId})`;
}

function ringToLatLngs(ring) {
  return unwrapRing(ring).map(([lng, lat]) => [lat, lng]);
}

function geometryToLatLngs(geometry) {
  const geo = normalizeGeometry(geometry);
  if (!geo) return null;

  if (geo.type === "Polygon") {
    return geo.coordinates.map((ring) => ringToLatLngs(ring));
  }

  return geo.coordinates.map((polygon) =>
    polygon.map((ring) => ringToLatLngs(ring)),
  );
}

/** One latlng-ring-list per territory (so each can get its own flag). */
function territoryLatLngList(geometry) {
  const geo = normalizeGeometry(geometry);
  if (!geo) return [];

  if (geo.type === "Polygon") {
    return [geo.coordinates.map((ring) => ringToLatLngs(ring))];
  }

  return geo.coordinates.map((polygon) =>
    polygon.map((ring) => ringToLatLngs(ring)),
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

function paintFlag(layer, path, patternId) {
  const paint = svgPaintUrl(patternId);
  // Leaflet's own style updates copy options.fillColor onto the path.
  // Keep the pattern URL there so pan, zoom, and selection do not paint blue over the flag.
  layer.options.fillColor = paint;
  layer.options.fillOpacity = FLAG_FILL_OPACITY;
  path.setAttribute("fill", paint);
  path.setAttribute("fill-opacity", String(FLAG_FILL_OPACITY));
}

function updateFlagPattern(map, layer, patternKey, flagUrl) {
  const path = layer.getElement?.() || layer._path;
  if (!path) return;

  if (!flagUrl) {
    layer.options.fillColor = "#5a8cc8";
    layer.options.fillOpacity = EMPTY_FILL_OPACITY;
    path.setAttribute("fill", "#5a8cc8");
    path.setAttribute("fill-opacity", String(EMPTY_FILL_OPACITY));
    return;
  }

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
    image.setAttribute("crossorigin", "anonymous");
    image.setAttributeNS("http://www.w3.org/1999/xlink", "href", flagUrl);
    image.setAttribute("href", flagUrl);
    image.addEventListener("error", () => {
      layer.options.fillColor = "#5a8cc8";
      layer.options.fillOpacity = FLAG_FILL_OPACITY;
      path.setAttribute("fill", "#5a8cc8");
    });
    pattern.appendChild(image);
    defs.appendChild(pattern);
  } else {
    const image = pattern.querySelector("image");
    if (image && image.getAttribute("href") !== flagUrl) {
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

  paintFlag(layer, path, patternId);
}

function eachTerritoryPart(entry, fn) {
  if (entry?.__jworldParts?.length) {
    entry.__jworldParts.forEach((layer, index) => fn(layer, index));
    return;
  }
  fn(entry, 0);
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function capitalZoomMode(zoom) {
  const z = Number(zoom);
  if (!Number.isFinite(z)) return "hidden";
  if (z >= CAPITAL_NAME_ZOOM) return "named";
  if (z >= CAPITAL_STAR_ZOOM) return "star";
  return "hidden";
}

function capitalDivIcon({ name, showName, selected, countryName }) {
  const aria = name
    ? `${name}, capital of ${countryName || "country"}`
    : `Capital of ${countryName || "country"}`;
  const label =
    showName && name
      ? `<span class="jw-capital-name">${escapeHtml(name)}</span>`
      : "";
  const selectedClass = selected ? " is-selected" : "";
  return L.divIcon({
    className: "jw-capital-divicon",
    html: `<span class="jw-capital-marker${selectedClass}" role="img" aria-label="${escapeHtml(aria)}"><svg class="jw-capital-star" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.2 14.8 8.6 21.8 9.3 16.6 14l1.6 6.8L12 17.6 5.8 20.8 7.4 14 2.2 9.3l7-.7z"/></svg>${label}</span>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });
}

function mountCapitalMarkers(map, getCountries, hooks = {}) {
  const layer = L.layerGroup().addTo(map);
  const markers = new Map();
  let mode = "";

  function sync(force = false) {
    const nextMode = capitalZoomMode(map.getZoom());
    if (!force && nextMode === mode) return;
    mode = nextMode;

    if (nextMode === "hidden") {
      if (markers.size) {
        layer.clearLayers();
        markers.clear();
      }
      return;
    }

    const showName = nextMode === "named";
    const selectedId = hooks.getSelectedId?.() || null;
    const seen = new Set();
    for (const country of getCountries() || []) {
      const point = capitalPointOf(country);
      if (!point || !country?.id) continue;
      seen.add(country.id);
      const name = capitalLabelOf(country);
      const selected = country.id === selectedId;
      const sig = `${point.lat},${point.lng}|${showName ? 1 : 0}|${selected ? 1 : 0}|${name}|${country.official_name || ""}`;
      let marker = markers.get(country.id);
      if (!marker) {
        marker = L.marker([point.lat, point.lng], {
          icon: capitalDivIcon({
            name,
            showName,
            selected,
            countryName: country.official_name,
          }),
          keyboard: false,
          bubblingMouseEvents: true,
          zIndexOffset: selected ? 200 : 40,
        });
        marker.on("click", (event) => {
          if (hooks.isPlacing?.()) {
            hooks.onMarkerPlace?.(event.latlng);
            return;
          }
          L.DomEvent.stopPropagation(event);
          const current =
            (getCountries() || []).find((item) => item.id === country.id) ||
            country;
          hooks.onClick?.(current);
        });
        layer.addLayer(marker);
        markers.set(country.id, marker);
        marker.__sig = sig;
      } else if (marker.__sig !== sig) {
        marker.setLatLng([point.lat, point.lng]);
        marker.setIcon(
          capitalDivIcon({
            name,
            showName,
            selected,
            countryName: country.official_name,
          }),
        );
        marker.setZIndexOffset(selected ? 200 : 40);
        marker.__sig = sig;
      }
    }

    for (const [id, marker] of markers) {
      if (seen.has(id)) continue;
      layer.removeLayer(marker);
      markers.delete(id);
    }
  }

  function onZoom() {
    sync(false);
  }

  map.on("zoom zoomend", onZoom);
  sync(true);

  return {
    sync: () => sync(true),
    destroy() {
      map.off("zoom zoomend", onZoom);
      layer.remove();
      markers.clear();
    },
  };
}

export function createJworldMap(container, options = {}) {
  const map = L.map(container, {
    worldCopyJump: true,
    minZoom: 2,
    maxZoom: 20,
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
  let snapMode = false;
  let snapLayer = null;
  let snapCollection = null;
  let snapFine = null;
  let onSnapSelect = null;
  let onSnapMiss = null;
  let onSnapApproximate = null;
  let onSnapLowRes = null;

  map.createPane("jworldSnap");
  const snapPaneEl = map.getPane("jworldSnap");
  snapPaneEl.style.zIndex = 650;
  snapPaneEl.style.pointerEvents = "none";

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

  function pruneFlagPatterns() {
    const live = new Set();
    for (const [id, entry] of countryLayers.entries()) {
      eachTerritoryPart(entry, (_layer, index) => {
        const safeId = String(`${id}p${index}`).replace(/[^a-zA-Z0-9]/g, "");
        live.add(`jworldflag${safeId}`);
      });
    }
    const pane = map.getPane("overlayPane");
    pane?.querySelectorAll("defs.jworld-flag-defs pattern").forEach((node) => {
      if (!live.has(node.id)) node.remove();
    });
  }

  function refreshFlagFills() {
    pruneFlagPatterns();
    for (const [id, entry] of countryLayers.entries()) {
      const flagUrl = entry.__jworldFlagUrl;
      eachTerritoryPart(entry, (layer, index) => {
        updateFlagPattern(map, layer, `${id}p${index}`, flagUrl);
      });
    }
  }

  map.on("zoomend moveend viewreset", refreshFlagFills);

  let selectedCountryId = null;
  let capitalSource = [];
  let placingCapital = false;
  let onCapitalPlace = null;

  const capitals = mountCapitalMarkers(map, () => capitalSource, {
    onClick: (country) => handlers.onCountryClick(country),
    isPlacing: () => placingCapital,
    onMarkerPlace: (latlng) => finishPlace(latlng),
    getSelectedId: () => selectedCountryId,
  });

  function finishPlace(latlng) {
    if (!placingCapital || !onCapitalPlace || !latlng) return;
    const wrapped = latlng.wrap?.() || latlng;
    const place = onCapitalPlace;
    cancelPlaceCapital();
    place({ lat: wrapped.lat, lng: wrapped.lng });
  }

  function handleCapitalClick(event) {
    finishPlace(event.latlng);
  }

  function beginPlaceCapital(onPlace) {
    cancelPlaceCapital();
    placingCapital = true;
    onCapitalPlace = onPlace;
    setCountryHitTesting(false);
    map.getContainer()?.classList.add("jworld-capital-cursor");
    map.on("click", handleCapitalClick);
  }

  function cancelPlaceCapital() {
    placingCapital = false;
    onCapitalPlace = null;
    map.off("click", handleCapitalClick);
    map.getContainer()?.classList.remove("jworld-capital-cursor");
    setCountryHitTesting(true);
  }

  function showCapital(point) {
    if (!Number.isFinite(point?.lat) || !Number.isFinite(point?.lng)) return;
    const zoom = Math.max(map.getZoom() || 0, CAPITAL_NAME_ZOOM);
    map.setView([point.lat, point.lng], zoom);
  }

  function strokeStyle(isMine, isSelected = false) {
    if (isSelected) return { color: "#efe6c8", weight: 2, opacity: 1 };
    if (isMine) return { color: "#cbb98a", weight: 1.5, opacity: 0.95 };
    return { color: "#b7c3d1", weight: 1.25, opacity: 0.9 };
  }

  function styleFor(country, isMine, isSelected = false) {
    return {
      ...strokeStyle(isMine, isSelected),
      fillColor: "#5a8cc8",
      fillOpacity: country.flag_path ? FLAG_FILL_OPACITY : EMPTY_FILL_OPACITY,
    };
  }

  function applySelectionStyles() {
    for (const [id, entry] of countryLayers.entries()) {
      const style = strokeStyle(
        Boolean(entry.__jworldEditable),
        id === selectedCountryId,
      );
      // Stroke only. Passing fillColor would replace the flag URL Leaflet stores.
      eachTerritoryPart(entry, (layer) => layer.setStyle(style));
    }
  }

  function setSelected(id) {
    selectedCountryId = id || null;
    applySelectionStyles();
    refreshFlagFills();
    capitals.sync();
  }

  function setCountries(countries, memberId, isAdmin = false) {
    capitalSource = countries || [];
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
        const style = styleFor(
          country,
          editable,
          country.id === selectedCountryId,
        );
        const flagUrl = flagPublicUrl(country.flag_path);
        const parts = [];
        const group = L.featureGroup();
        const names = syncTerritoryNames(
          geometry,
          listTerritoryNames(country, geometry),
          country.official_name,
        );

        // One polygon layer per territory → each gets a full flag fill.
        territories.forEach((latlngs, index) => {
          const part = L.polygon(latlngs, style);
          const label = formatTerritoryLabel(
            names[index],
            country.official_name || "Country",
          );
          part.bindTooltip(label, {
            sticky: true,
            direction: "top",
            opacity: 0.9,
          });
          part.on("click", () => handlers.onCountryClick(country));
          group.addLayer(part);
          parts.push(part);
        });

        group.__jworldCountryId = country.id;
        group.__jworldCountry = country;
        group.__jworldEditable = editable;
        group.__jworldFlagUrl = flagUrl;
        group.__jworldParts = parts;
        countriesLayer.addLayer(group);
        countryLayers.set(country.id, group);
        rendered += 1;

        parts.forEach((part, index) => {
          updateFlagPattern(map, part, `${country.id}p${index}`, flagUrl);
        });
      } catch (err) {
        console.warn("jWorld: failed to render country", country?.official_name, err);
        skipped += 1;
      }
    }

    requestAnimationFrame(refreshFlagFills);
    pruneFlagPatterns();
    capitals.sync();
    if (placingCapital) setCountryHitTesting(false);

    return { rendered, skipped, total: (countries || []).length };
  }

  function enableDrawing() {
    if (drawingEnabled) return;
    drawingEnabled = true;

    drawControl = new L.Control.Draw({
      position: "topright",
      draw: {
        polygon: {
          allowIntersection: false,
          showArea: false,
          drawError: {
            color: "#d96a6a",
            timeout: 2000,
            message: "Edges can't cross",
          },
          shapeOptions: {
            color: "#cbb98a",
            weight: 1.5,
            fillOpacity: 0.18,
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
        poly: {
          allowIntersection: false,
        },
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

  /** Country paths keep pointer-events:auto even if the pane is none — disable them. */
  function setCountryHitTesting(enabled) {
    countriesLayer.eachLayer((group) => {
      const parts = group.__jworldParts || [];
      for (const part of parts) {
        part.options.interactive = enabled;
        const path = part.getElement?.() || part._path;
        if (path) path.style.pointerEvents = enabled ? "auto" : "none";
      }
    });
  }

  function handleSnapMapClick(event) {
    if (!snapMode || !snapCollection) return;
    // worldCopyJump / Pacific views can yield lng outside [-180, 180].
    const latlng = event.latlng?.wrap?.() || event.latlng;
    let hit = findShapeAtLatLng(snapCollection, latlng);
    if (hit && snapFine) hit = refineHit(snapFine, hit, latlng);
    if (!hit) {
      onSnapMiss?.();
      return;
    }
    if (hit.lowResolution) {
      onSnapLowRes?.(hit);
      return;
    }
    if (hit.approximate) {
      onSnapApproximate?.(hit);
      return;
    }
    const cb = onSnapSelect;
    endSnapToShape();
    cb?.(hit);
  }

  function endSnapToShape() {
    snapMode = false;
    onSnapSelect = null;
    onSnapMiss = null;
    onSnapApproximate = null;
    onSnapLowRes = null;
    map.off("click", handleSnapMapClick);
    if (snapLayer) {
      map.removeLayer(snapLayer);
      snapLayer = null;
    }
    setCountryHitTesting(true);
    if (map.getContainer()) {
      map.getContainer().classList.remove("jworld-snap-cursor");
    }
  }

  /**
   * Click a real-world country/island to use its outline.
   * Uses map-level hit testing (country layers otherwise steal clicks).
   */
  async function beginSnapToShape({
    onSelect,
    onMiss,
    onApproximate,
    onLowResolution,
    onReady,
  } = {}) {
    enableDrawing();
    stopActiveTool();
    drawLayer.clearLayers();
    endSnapToShape();

    snapMode = true;
    onSnapSelect = onSelect || null;
    onSnapMiss = onMiss || null;
    onSnapApproximate = onApproximate || null;
    onSnapLowRes = onLowResolution || null;
    if (map.getContainer()) {
      map.getContainer().classList.add("jworld-snap-cursor");
    }
    setCountryHitTesting(false);

    try {
      const [guide, fine] = await Promise.all([
        loadWorldShapes(),
        loadFineOutlines().catch((err) => {
          console.warn("jWorld: fine coastlines unavailable", err);
          return null;
        }),
      ]);
      snapCollection = guide;
      snapFine = fine;
    } catch (err) {
      endSnapToShape();
      throw err;
    }

    if (!snapMode) return false;

    // Visual guide only — clicks go to the map, then point-in-polygon.
    snapLayer = L.geoJSON(snapCollection, {
      pane: "jworldSnap",
      interactive: false,
      style: {
        color: "#cbb98a",
        weight: 1,
        opacity: 0.85,
        fillColor: "#cbb98a",
        fillOpacity: 0.12,
      },
    }).addTo(map);

    map.on("click", handleSnapMapClick);
    onReady?.();
    return true;
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

  function boundsAreUsable(bounds) {
    if (!bounds?.isValid?.()) return false;
    const width = Math.abs(bounds.getEast() - bounds.getWest());
    return width > 0 && width <= 180;
  }

  function focusCountry(country) {
    const layer = countryLayers.get(country?.id);
    const parts = layer?.__jworldParts || [];
    let best = null;
    let bestArea = 0;
    for (const part of parts) {
      const bounds = part.getBounds?.();
      if (!boundsAreUsable(bounds)) continue;
      const area =
        Math.abs(bounds.getEast() - bounds.getWest()) *
        Math.abs(bounds.getNorth() - bounds.getSouth());
      if (area > bestArea) {
        best = bounds;
        bestArea = area;
      }
    }
    if (best) {
      map.fitBounds(best, { padding: [40, 40], maxZoom: 12 });
      return;
    }
    const latlngs = geometryToLatLngs(country?.geometry);
    if (!latlngs) return;
    try {
      const temp = L.polygon(latlngs);
      if (boundsAreUsable(temp.getBounds())) {
        map.fitBounds(temp.getBounds(), { padding: [40, 40], maxZoom: 12 });
      }
    } catch {
      /* ignore */
    }
  }

  function clearDraw() {
    stopActiveTool();
    endSnapToShape();
    drawLayer.clearLayers();
  }

  function destroy() {
    stopActiveTool();
    endSnapToShape();
    cancelPlaceCapital();
    capitals.destroy();
    map.off();
    map.remove();
  }

  setTimeout(() => map.invalidateSize(), 50);

  return {
    map,
    setCountries,
    setSelected,
    enableDrawing,
    disableDrawing,
    beginNewCountry,
    beginAddTerritory,
    beginSnapToShape,
    endSnapToShape,
    loadCountryIntoDraw,
    focusCountry,
    beginPlaceCapital,
    cancelPlaceCapital,
    showCapital,
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

const BASEMAP_URL =
  "https://basemap.queeniemella.cc/tiles/countries/{z}/{x}/{y}.png";
const BASEMAP_ATTR =
  '&copy; <a href="https://basemap.queeniemella.cc/">queeniemella.cc</a> | &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

/** Small read-only map of one country's borders, for the wiki page. */
export function createCountryPreview(container, geometry, country = null) {
  const map = L.map(container, {
    zoomControl: true,
    attributionControl: true,
    scrollWheelZoom: true,
    minZoom: 1,
    maxZoom: 14,
  });

  L.tileLayer(BASEMAP_URL, {
    attribution: BASEMAP_ATTR,
    maxZoom: 20,
  }).addTo(map);

  const territories = territoryLatLngList(geometry);
  let best = null;
  let bestArea = 0;
  for (const latlngs of territories) {
    const layer = L.polygon(latlngs, {
      color: "#cbb98a",
      weight: 1.5,
      fillColor: "#5a8cc8",
      fillOpacity: 0.45,
    }).addTo(map);
    const bounds = layer.getBounds?.();
    if (!bounds?.isValid?.()) continue;
    const width = Math.abs(bounds.getEast() - bounds.getWest());
    if (width <= 0 || width > 180) continue;
    const area = width * Math.abs(bounds.getNorth() - bounds.getSouth());
    if (area > bestArea) {
      best = bounds;
      bestArea = area;
    }
  }

  const capitals = mountCapitalMarkers(map, () => (country ? [country] : []));

  if (best) map.fitBounds(best, { padding: [18, 18], maxZoom: 12 });
  else map.setView([20, 10], 1);
  capitals.sync();

  setTimeout(() => {
    map.invalidateSize();
    capitals.sync();
  }, 50);
  return {
    destroy() {
      capitals.destroy();
      map.off();
      map.remove();
    },
  };
}
