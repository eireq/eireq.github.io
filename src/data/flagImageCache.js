import { imageUrl } from "./flags.js";

const memory = new Map();
const CACHE_NAME = "eire-flag-images-v1";
const inflight = new Map();

async function resolveUploadUrl(svgUrl) {
  const url = imageUrl(svgUrl);
  if (!url) return "";
  if (url.includes("upload.wikimedia.org/")) return url;

  const fileName = decodeURIComponent(url.split("/").pop() || "").replace(
    /\+/g,
    " ",
  );
  if (!fileName) return url;

  try {
    const params = new URLSearchParams({
      action: "query",
      titles: `File:${fileName}`,
      prop: "imageinfo",
      iiprop: "url",
      format: "json",
      origin: "*",
    });
    const data = await fetch(
      `https://commons.wikimedia.org/w/api.php?${params}`,
    ).then((response) => response.json());
    const page = Object.values(data?.query?.pages || {})[0];
    return page?.imageinfo?.[0]?.url || url;
  } catch {
    return url;
  }
}

async function readCache(requestUrl) {
  if (!("caches" in window)) return null;
  try {
    const cache = await caches.open(CACHE_NAME);
    const match = await cache.match(requestUrl);
    if (!match) return null;
    const blob = await match.blob();
    return URL.createObjectURL(blob);
  } catch {
    return null;
  }
}

async function writeCache(requestUrl, response) {
  if (!("caches" in window)) return;
  try {
    const cache = await caches.open(CACHE_NAME);
    await cache.put(requestUrl, response.clone());
  } catch {
    // quota / private mode — ignore
  }
}

export async function cachedFlagImageUrl(svgUrl) {
  const original = imageUrl(svgUrl);
  if (!original) return "";
  if (memory.has(original)) return memory.get(original);

  if (inflight.has(original)) return inflight.get(original);

  const task = (async () => {
    const resolved = await resolveUploadUrl(original);
    const cached = await readCache(resolved);
    if (cached) {
      memory.set(original, cached);
      return cached;
    }

    try {
      const response = await fetch(resolved);
      if (!response.ok) {
        memory.set(original, resolved);
        return resolved;
      }
      await writeCache(resolved, response);
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      memory.set(original, objectUrl);
      return objectUrl;
    } catch {
      memory.set(original, resolved || original);
      return resolved || original;
    }
  })();

  inflight.set(original, task);
  try {
    return await task;
  } finally {
    inflight.delete(original);
  }
}

export async function prefetchFlagImages(urls = []) {
  const unique = [...new Set(urls.filter(Boolean))];
  await Promise.all(unique.map((url) => cachedFlagImageUrl(url)));
}
