import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-draw";
import "leaflet-draw/dist/leaflet.draw.css";
import { flagPublicUrl } from "./supabase.js";

// Vite + Leaflet default marker icons break without this; we mostly use polygons.
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

function geometryToLatLngs(geometry) {
  if (!geometry || !geometry.type) return null;

  if (geometry.type === "Polygon") {
    return (geometry.coordinates || []).map((ring) =>
      ring.map(([lng, lat]) => [lat, lng]),
    );
  }

  if (geometry.type === "MultiPolygon") {
    return (geometry.coordinates || []).map((polygon) =>
      polygon.map((ring) => ring.map(([lng, lat]) => [lat, lng])),
    );
  }

  return null;
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

/** Keep flags see-through so basemap cities / labels stay readable. */
const FLAG_FILL_OPACITY = 0.58;
const EMPTY_FILL_OPACITY = 0.4;

function updateFlagPattern(map, layer, countryId, flagUrl) {
  const path = layer.getElement?.() || layer._path;
  if (!path || !flagUrl) {
    if (path) {
      path.setAttribute("fill", "rgba(90, 140, 200, 0.45)");
      path.setAttribute("fill-opacity", String(EMPTY_FILL_OPACITY));
    }
    return;
  }

  const svg = path.ownerSVGElement;
  if (!svg) return;

  const defs = ensureDefs(svg);
  const patternId = `jworld-flag-${countryId}`;
  let pattern = defs.querySelector(`#${CSS.escape(patternId)}`);
  if (!pattern) {
    pattern = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "pattern",
    );
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

  path.setAttribute("fill", `url(#${patternId})`);
  path.setAttribute("fill-opacity", String(FLAG_FILL_OPACITY));
}

export function createJworldMap(container, options = {}) {
  const map = L.map(container, {
    worldCopyJump: true,
    minZoom: 2,
    maxZoom: 12,
    zoomControl: true,
  }).setView([20, 10], 2);

  // Base geography (dark). Free XYZ — no API key.
  L.tileLayer(
    "https://basemap.queeniemella.cc/tiles/countries/{z}/{x}/{y}.png",
    {
      attribution:
        '&copy; <a href="https://basemap.queeniemella.cc/">queeniemella.cc</a> | &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 20,
    },
  ).addTo(map);

  // Country fills sit under place labels.
  map.createPane("jworldFlags");
  map.getPane("jworldFlags").style.zIndex = 350;
  map.getPane("jworldFlags").style.pointerEvents = "auto";

  map.createPane("jworldLabels");
  map.getPane("jworldLabels").style.zIndex = 450;
  map.getPane("jworldLabels").style.pointerEvents = "none";

  // Light place-name overlay on top of flags (cities, towns).
  // OSM Humanitarian has readable settlement labels; kept light so dark base still reads.
  L.tileLayer("https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png", {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>, Tiles courtesy of Humanitarian OpenStreetMap Team',
    subdomains: "abc",
    maxZoom: 20,
    minZoom: 4,
    opacity: 0.42,
    pane: "jworldLabels",
    className: "jworld-label-tiles",
  }).addTo(map);

  const countriesLayer = L.featureGroup({ pane: "jworldFlags" }).addTo(map);
  const drawLayer = new L.FeatureGroup({ pane: "jworldFlags" }).addTo(map);

  const countryLayers = new Map();
  let drawControl = null;
  let drawingEnabled = false;

  const handlers = {
    onCountryClick: options.onCountryClick || (() => {}),
    onDrawCreated: options.onDrawCreated || (() => {}),
    onDrawEdited: options.onDrawEdited || (() => {}),
  };

  function refreshFlagFills() {
    for (const [id, layer] of countryLayers.entries()) {
      const flagUrl = layer.__jworldFlagUrl;
      updateFlagPattern(map, layer, id, flagUrl);
    }
  }

  map.on("zoomend moveend viewreset", refreshFlagFills);

  function styleFor(country, isMine) {
    return {
      color: isMine ? "#f0d78c" : "#9ab4c8",
      weight: isMine ? 2.5 : 1.5,
      opacity: 0.95,
      fillColor: "#5a8cc8",
      fillOpacity: country.flag_path ? FLAG_FILL_OPACITY : EMPTY_FILL_OPACITY,
      pane: "jworldFlags",
    };
  }

  function setCountries(countries, memberId) {
    countriesLayer.clearLayers();
    countryLayers.clear();

    for (const country of countries || []) {
      const latlngs = geometryToLatLngs(country.geometry);
      if (!latlngs || !latlngs.length) continue;

      const isMine = memberId && country.owner_member_id === memberId;
      const isMulti = country.geometry?.type === "MultiPolygon";
      const layer = isMulti
        ? L.polygon(latlngs, styleFor(country, isMine))
        : L.polygon(latlngs, styleFor(country, isMine));

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

      // Patterns need the path in the DOM.
      requestAnimationFrame(() => {
        updateFlagPattern(map, layer, country.id, layer.__jworldFlagUrl);
      });
    }
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
    if (drawControl) {
      map.removeControl(drawControl);
      drawControl = null;
    }
    drawLayer.clearLayers();
  }

  function beginNewCountry() {
    enableDrawing();
    drawLayer.clearLayers();
    // Programmatically start polygon draw if available
    const drawer = new L.Draw.Polygon(map, drawControl?.options?.draw?.polygon);
    drawer.enable();
    return drawer;
  }

  function loadCountryIntoDraw(country) {
    enableDrawing();
    drawLayer.clearLayers();
    const latlngs = geometryToLatLngs(country.geometry);
    if (!latlngs) return null;
    const isMulti = country.geometry?.type === "MultiPolygon";
    const layer = isMulti
      ? L.polygon(latlngs, styleFor(country, true))
      : L.polygon(latlngs, styleFor(country, true));
    drawLayer.addLayer(layer);
    return layer;
  }

  function clearDraw() {
    drawLayer.clearLayers();
  }

  function destroy() {
    map.off();
    map.remove();
  }

  // Fix grey tiles when container was hidden during join gate.
  setTimeout(() => map.invalidateSize(), 50);

  return {
    map,
    setCountries,
    enableDrawing,
    disableDrawing,
    beginNewCountry,
    loadCountryIntoDraw,
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
