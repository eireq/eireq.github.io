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

export function layerToGeoJSONGeometry(layer) {
  const geo = layer.toGeoJSON();
  return geo?.geometry || null;
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

function updateFlagPattern(map, layer, countryId, flagUrl) {
  const path = layer.getElement?.() || layer._path;
  if (!path) return;

  // Always keep a visible solid fill so countries never "vanish".
  applySolidFill(path, flagUrl ? FLAG_FILL_OPACITY : EMPTY_FILL_OPACITY);
  if (!flagUrl) return;

  const svg = path.ownerSVGElement;
  if (!svg) return;

  const defs = ensureDefs(svg);
  // Avoid hyphens-only issues in CSS selectors: strip non-alnum from id.
  const safeId = String(countryId).replace(/[^a-zA-Z0-9]/g, "");
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

  // Progressive enhancement: only switch to pattern after we have a paint server.
  path.setAttribute("fill", svgPaintUrl(patternId));
  path.setAttribute("fill-opacity", String(FLAG_FILL_OPACITY));
}

export function createJworldMap(container, options = {}) {
  const map = L.map(container, {
    worldCopyJump: true,
    minZoom: 2,
    maxZoom: 8,
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

  function stopActiveTool() {
    if (!activeTool) return;
    try {
      activeTool.disable();
    } catch {
      /* ignore */
    }
    activeTool = null;
  }

  function refreshFlagFills() {
    for (const [id, layer] of countryLayers.entries()) {
      updateFlagPattern(map, layer, id, layer.__jworldFlagUrl);
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
        const latlngs = geometryToLatLngs(geometry);
        if (!latlngs || !latlngs.length) {
          skipped += 1;
          continue;
        }

        const editable = Boolean(
          isAdmin || (memberId && country.owner_member_id === memberId),
        );
        const layer = L.polygon(latlngs, styleFor(country, editable));

        layer.__jworldCountryId = country.id;
        layer.__jworldFlagUrl = flagPublicUrl(country.flag_path);
        layer.bindTooltip(country.official_name || "Country", {
          sticky: true,
          direction: "top",
          opacity: 0.9,
        });
        layer.on("click", () => handlers.onCountryClick(country));
        countriesLayer.addLayer(layer);
        countryLayers.set(country.id, layer);
        rendered += 1;

        // Double rAF: wait until Leaflet has inserted the SVG path.
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            updateFlagPattern(map, layer, country.id, layer.__jworldFlagUrl);
          });
        });
      } catch (err) {
        console.warn("jWorld: failed to render country", country?.official_name, err);
        skipped += 1;
      }
    }

    // Keep countries visible after tiles settle.
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
    const drawer = new L.Draw.Polygon(map, drawControl?.options?.draw?.polygon);
    drawer.enable();
    activeTool = drawer;
    return drawer;
  }

  function loadCountryIntoDraw(country) {
    enableDrawing();
    stopActiveTool();
    drawLayer.clearLayers();
    const latlngs = geometryToLatLngs(country.geometry);
    if (!latlngs) return null;
    const layer = L.polygon(latlngs, styleFor(country, true));
    drawLayer.addLayer(layer);

    // Start edit mode immediately — same as clicking the tiny pencil.
    const editor = new L.EditToolbar.Edit(map, {
      featureGroup: drawLayer,
      selectedPathOptions: {
        maintainColor: true,
        opacity: 0.4,
        dashArray: null,
      },
    });
    editor.enable();
    activeTool = editor;
    return layer;
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
    loadCountryIntoDraw,
    focusCountry,
    clearDraw,
    refreshFlagFills,
    invalidateSize: () => map.invalidateSize(),
    destroy,
    getDrawGeometry: () => {
      let geometry = null;
      drawLayer.eachLayer((layer) => {
        geometry = layerToGeoJSONGeometry(layer);
      });
      return geometry;
    },
  };
}
