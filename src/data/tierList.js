import { filterFlagsByMode, flagSlug, loadFlags, shortName } from "./flags.js";

export const TIER_STORAGE_KEY = "eire-tier-list-v1";

export const TIER_PALETTE = [
  "#ff6b6b",
  "#ffa94d",
  "#ffd43b",
  "#a9e34b",
  "#74c0fc",
  "#da77f2",
  "#63e6be",
  "#ff8787",
  "#66d9e8",
  "#e599f7",
  "#ffa8a8",
  "#ffc078",
];

const MAX_TITLE = 80;
const MAX_LABEL = 16;
const MAX_TIERS = 12;
const MAX_ID = 80;
const COLOR_RE = /^#[0-9a-fA-F]{6}$/;

const DEFAULT_LABELS = ["S", "A", "B", "C", "D", "F"];

export function defaultTiers() {
  return DEFAULT_LABELS.map((label, index) => ({
    id: label.toLowerCase(),
    label,
    color: TIER_PALETTE[index],
    ids: [],
  }));
}

export function countryInitials(name) {
  const words = String(name || "")
    .split(/\s+/)
    .filter((word) => word && !/^(of|the|and|de|da|di|la|le|el|al)$/i.test(word));
  const pick = words.length ? words : [String(name || "?").trim() || "?"];
  if (pick.length === 1) return pick[0].slice(0, 2).toUpperCase();
  return pick
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

export function labelInk(hex) {
  const raw = String(hex || "").replace("#", "");
  if (!/^[0-9a-fA-F]{6}$/.test(raw)) return "#111";
  const value = Number.parseInt(raw, 16);
  const r = (value >> 16) & 255;
  const g = (value >> 8) & 255;
  const b = value & 255;
  const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  return luminance > 0.62 ? "#111" : "#fff";
}

export function countryRecords(flags) {
  const list = filterFlagsByMode(flags, "countries")
    .filter((flag) => flag?.svgUrl && flag?.name)
    .map((flag) => {
      const name = shortName(flag);
      return {
        id: name,
        name,
        svgUrl: flag.svgUrl,
        slug: flagSlug(flag),
      };
    });

  const counts = new Map();
  for (const country of list) {
    counts.set(country.name, (counts.get(country.name) || 0) + 1);
  }
  for (const country of list) {
    if ((counts.get(country.name) || 0) > 1) {
      country.id = `${country.name}#${country.slug.slice(-8)}`;
    }
  }

  list.sort((a, b) => a.name.localeCompare(b.name, "en"));
  return list;
}

export async function loadCountryRecords() {
  return countryRecords(await loadFlags());
}

export function sanitizeTierState(raw, validIds) {
  const allowed = validIds instanceof Set ? validIds : null;
  const title = String(raw?.title || "").slice(0, MAX_TITLE);
  const source = Array.isArray(raw?.tiers) ? raw.tiers.slice(0, MAX_TIERS) : [];
  const seen = new Set();
  const usedTierIds = new Set();
  const tiers = [];

  source.forEach((tier, index) => {
    const label = String(tier?.label || "").trim().slice(0, MAX_LABEL) || "?";
    const color = COLOR_RE.test(String(tier?.color || ""))
      ? String(tier.color).toLowerCase()
      : TIER_PALETTE[index % TIER_PALETTE.length];
    const ids = [];
    const list = Array.isArray(tier?.ids) ? tier.ids : [];
    for (const item of list) {
      if (seen.size >= 500) break;
      const id = String(item || "").slice(0, MAX_ID);
      if (!id || seen.has(id)) continue;
      if (allowed && !allowed.has(id)) continue;
      seen.add(id);
      ids.push(id);
    }
    let id = String(tier?.id || `tier-${index}`).slice(0, 40) || `tier-${index}`;
    while (usedTierIds.has(id)) id = `${id}-${usedTierIds.size}`.slice(0, 40);
    usedTierIds.add(id);
    tiers.push({ id, label, color, ids });
  });

  if (!tiers.length) return { title, tiers: defaultTiers() };
  return { title, tiers };
}

export function tierStatesEqual(a, b) {
  if (!a || !b) return false;
  if ((a.title || "") !== (b.title || "")) return false;
  if (!Array.isArray(a.tiers) || !Array.isArray(b.tiers)) return false;
  if (a.tiers.length !== b.tiers.length) return false;
  return a.tiers.every((tier, index) => {
    const other = b.tiers[index];
    return (
      tier.label === other.label &&
      tier.color === other.color &&
      tier.ids.join("\0") === other.ids.join("\0")
    );
  });
}

function bytesToBinary(bytes) {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return binary;
}

function binaryToBytes(binary) {
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export function encodeTierShare(state) {
  const clean = sanitizeTierState(state, null);
  const payload = {
    v: 1,
    n: clean.title,
    t: clean.tiers.map((tier) => [tier.label, tier.color, tier.ids]),
  };
  const bytes = new TextEncoder().encode(JSON.stringify(payload));
  return btoa(bytesToBinary(bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

export function decodeTierShare(token) {
  try {
    const text = String(token || "");
    if (!text || text.length > 100000) return null;
    const padded = text.replace(/-/g, "+").replace(/_/g, "/");
    const pad = padded.length % 4 === 0 ? "" : "=".repeat(4 - (padded.length % 4));
    const binary = atob(padded + pad);
    const payload = JSON.parse(new TextDecoder().decode(binaryToBytes(binary)));
    if (!payload || payload.v !== 1 || !Array.isArray(payload.t)) return null;
    const tiers = payload.t.map((row, index) => ({
      id: `shared-${index}`,
      label: Array.isArray(row) ? row[0] : "",
      color: Array.isArray(row) ? row[1] : "",
      ids: Array.isArray(row) ? row[2] : [],
    }));
    return sanitizeTierState({ title: payload.n, tiers }, null);
  } catch {
    return null;
  }
}

export function shareHash(state) {
  return `#t.${encodeTierShare(state)}`;
}

const PNG_SIGNATURE = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
const PNG_METADATA_KEY = "eireq-tier-list-v1";
const PNG_TEXT = new TextEncoder();
const PNG_TEXT_DECODER = new TextDecoder();

function pngCrc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const chunk = new Uint8Array(data.length + 12);
  const view = new DataView(chunk.buffer);
  view.setUint32(0, data.length);
  chunk.set(PNG_TEXT.encode(type), 4);
  chunk.set(data, 8);
  view.setUint32(chunk.length - 4, pngCrc32(chunk.subarray(4, chunk.length - 4)));
  return chunk;
}

function isPng(bytes) {
  return (
    bytes.length >= PNG_SIGNATURE.length &&
    PNG_SIGNATURE.every((byte, index) => bytes[index] === byte)
  );
}

export function addTierPngMetadata(input, state) {
  const bytes = input instanceof Uint8Array ? input : new Uint8Array(input);
  if (!isPng(bytes)) throw new Error("not a PNG image");

  let offset = PNG_SIGNATURE.length;
  while (offset + 12 <= bytes.length) {
    const view = new DataView(bytes.buffer, bytes.byteOffset + offset, 4);
    const length = view.getUint32(0);
    const end = offset + 12 + length;
    if (end > bytes.length) throw new Error("invalid PNG chunk");
    const type = PNG_TEXT_DECODER.decode(bytes.subarray(offset + 4, offset + 8));
    if (type === "IEND") {
      const payload = PNG_TEXT.encode(`${PNG_METADATA_KEY}\0${encodeTierShare(state)}`);
      const metadata = pngChunk("tEXt", payload);
      const output = new Uint8Array(bytes.length + metadata.length);
      output.set(bytes.subarray(0, offset), 0);
      output.set(metadata, offset);
      output.set(bytes.subarray(offset), offset + metadata.length);
      return output;
    }
    offset = end;
  }
  throw new Error("invalid PNG image");
}

export function readTierPngMetadata(input) {
  const bytes = input instanceof Uint8Array ? input : new Uint8Array(input);
  if (!isPng(bytes)) return null;

  let offset = PNG_SIGNATURE.length;
  while (offset + 12 <= bytes.length) {
    const length = new DataView(bytes.buffer, bytes.byteOffset + offset, 4).getUint32(0);
    const end = offset + 12 + length;
    if (end > bytes.length) return null;
    const typeBytes = bytes.subarray(offset + 4, offset + 8);
    const type = PNG_TEXT_DECODER.decode(typeBytes);
    if (type === "tEXt") {
      const chunk = bytes.subarray(offset + 4, end - 4);
      const expectedCrc = new DataView(bytes.buffer, bytes.byteOffset + end - 4, 4).getUint32(0);
      if (pngCrc32(chunk) === expectedCrc) {
        const text = PNG_TEXT_DECODER.decode(bytes.subarray(offset + 8, end - 4));
        const separator = text.indexOf("\0");
        if (separator > -1 && text.slice(0, separator) === PNG_METADATA_KEY) {
          return decodeTierShare(text.slice(separator + 1));
        }
      }
    }
    if (type === "IEND") return null;
    offset = end;
  }
  return null;
}

export function readShareHash(hash = "") {
  const value = String(hash || "");
  if (!value.startsWith("#t.")) return null;
  return decodeTierShare(value.slice(3));
}

export function readTierStorage() {
  try {
    const raw = localStorage.getItem(TIER_STORAGE_KEY);
    if (!raw) return null;
    return sanitizeTierState(JSON.parse(raw), null);
  } catch {
    return null;
  }
}

export function writeTierStorage(state) {
  try {
    const clean = sanitizeTierState(state, null);
    localStorage.setItem(TIER_STORAGE_KEY, JSON.stringify(clean));
  } catch {
    // private mode or a full quota — the page still works for this visit
  }
}

const BOARD_W = 1400;
const PAD = 36;
const LABEL_W = 124;
const FLAG_W = 84;
const FLAG_H = 56;
const GAP = 8;
const BLOCK_PAD = 12;
const BLOCK_GAP = 10;

function columnsFor(width) {
  const inner = width - PAD * 2 - LABEL_W - BLOCK_PAD * 2;
  return Math.max(1, Math.floor((inner + GAP) / (FLAG_W + GAP)));
}

function wrapLines(ctx, text, maxWidth) {
  const words = String(text || "").split(/\s+/).filter(Boolean);
  if (!words.length) return [""];
  const lines = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (line && ctx.measureText(next).width > maxWidth) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines.slice(0, 2);
}

function buildLayout(ctx, { title, subtitle, footer, tiers }) {
  const width = BOARD_W;
  const columns = columnsFor(width);
  ctx.font = "700 40px Arial, sans-serif";
  const titleLines = wrapLines(ctx, title, width - PAD * 2);
  let y = PAD;
  const titleStart = y;
  y += titleLines.length * 48;
  const subtitleY = y;
  y += subtitle ? 30 : 0;
  y += 16;

  const blocks = [];
  for (const tier of tiers) {
    const count = tier.ids.length;
    const rows = Math.max(1, Math.ceil(count / columns) || 1);
    const height = BLOCK_PAD * 2 + rows * FLAG_H + (rows - 1) * GAP;
    const flags = tier.ids.map((id, index) => ({
      id,
      x: PAD + LABEL_W + BLOCK_PAD + (index % columns) * (FLAG_W + GAP),
      y: y + BLOCK_PAD + Math.floor(index / columns) * (FLAG_H + GAP),
    }));
    blocks.push({
      label: tier.label || "?",
      color: tier.color,
      x: PAD,
      y,
      w: width - PAD * 2,
      h: height,
      flags,
    });
    y += height + BLOCK_GAP;
  }

  y += 18;
  const footerY = y;
  y += PAD;
  return {
    width,
    height: y,
    titleLines,
    titleStart,
    subtitle,
    subtitleY,
    blocks,
    footer,
    footerY,
  };
}

function drawContain(ctx, image, x, y, w, h) {
  const aspect = image.naturalWidth / image.naturalHeight;
  if (!Number.isFinite(aspect) || aspect <= 0) return false;
  const box = w / h;
  let dw = w;
  let dh = h;
  if (aspect > box) dh = w / aspect;
  else dw = h * aspect;
  ctx.drawImage(image, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
  return true;
}

function paintLayout(ctx, layout, images, names) {
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, layout.width, layout.height);
  ctx.fillStyle = "#fff";
  ctx.font = "700 40px Arial, sans-serif";
  ctx.textBaseline = "top";
  layout.titleLines.forEach((line, index) => {
    ctx.fillText(line, PAD, layout.titleStart + index * 48);
  });
  if (layout.subtitle) {
    ctx.fillStyle = "#888";
    ctx.font = "18px Arial, sans-serif";
    ctx.fillText(layout.subtitle, PAD, layout.subtitleY);
  }

  for (const block of layout.blocks) {
    ctx.fillStyle = "#111";
    ctx.fillRect(block.x, block.y, block.w, block.h);
    ctx.strokeStyle = "#222";
    ctx.strokeRect(block.x + 0.5, block.y + 0.5, block.w - 1, block.h - 1);
    ctx.fillStyle = block.color;
    ctx.fillRect(block.x, block.y, LABEL_W, block.h);
    ctx.fillStyle = labelInk(block.color);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    let size = 34;
    const maxLabel = LABEL_W - 16;
    while (size > 12) {
      ctx.font = `700 ${size}px Arial, sans-serif`;
      if (ctx.measureText(block.label).width <= maxLabel) break;
      size -= 2;
    }
    ctx.fillText(block.label, block.x + LABEL_W / 2, block.y + block.h / 2);
    ctx.textAlign = "left";
    ctx.textBaseline = "top";

    for (const flag of block.flags) {
      ctx.fillStyle = "#1a1a1a";
      ctx.fillRect(flag.x, flag.y, FLAG_W, FLAG_H);
      const image = images?.get(flag.id);
      let drew = false;
      if (image) {
        try {
          drew = drawContain(ctx, image, flag.x + 3, flag.y + 3, FLAG_W - 6, FLAG_H - 6);
        } catch {
          drew = false;
        }
      }
      if (!drew) {
        const name = names?.get(flag.id)?.name || flag.id;
        ctx.fillStyle = "#ddd";
        ctx.font = "700 16px Arial, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(countryInitials(name), flag.x + FLAG_W / 2, flag.y + FLAG_H / 2);
        ctx.textAlign = "left";
        ctx.textBaseline = "top";
      }
      ctx.strokeStyle = "#333";
      ctx.strokeRect(flag.x + 0.5, flag.y + 0.5, FLAG_W - 1, FLAG_H - 1);
    }
  }

  if (layout.footer) {
    ctx.fillStyle = "#555";
    ctx.font = "16px Arial, sans-serif";
    ctx.textBaseline = "top";
    ctx.fillText(layout.footer, PAD, layout.footerY);
  }
}

export function renderTierListCanvas({ title, subtitle, footer, tiers, names, images }) {
  const scratch = document.createElement("canvas").getContext("2d");
  const layout = buildLayout(scratch, { title, subtitle, footer, tiers });
  const canvas = document.createElement("canvas");
  const scale = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = Math.round(layout.width * scale);
  canvas.height = Math.round(layout.height * scale);
  const ctx = canvas.getContext("2d");
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  paintLayout(ctx, layout, images, names);
  return canvas;
}
