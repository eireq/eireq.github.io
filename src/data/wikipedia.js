const summaryCache = new Map();
const extractCache = new Map();

async function wikiJson(url) {
  const response = await fetch(url, {
    headers: { Accept: "application/json" },
  });
  if (!response.ok) return null;
  return response.json();
}

export async function fetchFlagArticle(flagName) {
  const title = String(flagName || "").trim();
  if (!title) return null;
  if (summaryCache.has(title)) return summaryCache.get(title);

  const candidates = [title, title.replace(/^Flag of /i, "")].filter(
    (value, index, list) => value && list.indexOf(value) === index,
  );

  for (const candidate of candidates) {
    const summary = await wikiJson(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(candidate.replace(/ /g, "_"))}`,
    );
    if (!summary || summary.type === "disambiguation" || !summary.extract) {
      continue;
    }

    let fullText = summary.extract;
    try {
      const params = new URLSearchParams({
        action: "query",
        prop: "extracts",
        explaintext: "1",
        exsectionformat: "plain",
        titles: summary.title,
        format: "json",
        origin: "*",
      });
      const data = await wikiJson(
        `https://en.wikipedia.org/w/api.php?${params}`,
      );
      const page = Object.values(data?.query?.pages || {})[0];
      if (page?.extract) {
        fullText = page.extract;
        extractCache.set(title, fullText);
      }
    } catch {
      // summary extract is enough as fallback
    }

    const article = {
      title: summary.title,
      description: summary.description || "",
      extract: summary.extract,
      fullText,
      url: summary.content_urls?.desktop?.page || summary.content_urls?.mobile?.page || null,
    };
    summaryCache.set(title, article);
    return article;
  }

  summaryCache.set(title, null);
  return null;
}

const colorCache = new Map();

function expandHex(value) {
  const hex = value.toUpperCase();
  if (/^#[0-9A-F]{3}$/.test(hex)) {
    return `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`;
  }
  return hex;
}

export async function extractColorsFromSvg(svgUrl) {
  const url = svgUrl?.replace(/^http:/, "https:");
  if (!url) return [];
  if (colorCache.has(url)) return colorCache.get(url);

  try {
    const response = await fetch(url);
    if (!response.ok) {
      colorCache.set(url, []);
      return [];
    }
    const svgText = await response.text();
    const found = [...svgText.matchAll(/#(?:[0-9a-fA-F]{3}){1,2}\b/g)].map(
      (match) => expandHex(match[0]),
    );
    const skip = new Set(["#000000", "#FFFFFF"]);
    const unique = [];
    for (const hex of found) {
      if (skip.has(hex) || unique.includes(hex)) continue;
      unique.push(hex);
      if (unique.length >= 8) break;
    }
    colorCache.set(url, unique);
    return unique;
  } catch {
    colorCache.set(url, []);
    return [];
  }
}
