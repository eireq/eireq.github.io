const summaryCache = new Map();
const svgMetaCache = new Map();

const NAMED_COLORS = {
  white: "#FFFFFF",
  black: "#000000",
  red: "#FF0000",
  blue: "#0000FF",
  green: "#008000",
  yellow: "#FFFF00",
  orange: "#FFA500",
  purple: "#800080",
  navy: "#000080",
  maroon: "#800000",
  gold: "#FFD700",
  crimson: "#DC143C",
  darkblue: "#00008B",
  darkred: "#8B0000",
  skyblue: "#87CEEB",
};

async function wikiJson(url) {
  const response = await fetch(url, {
    headers: { Accept: "application/json" },
  });
  if (!response.ok) return null;
  return response.json();
}

function parseWikiSections(text) {
  const source = String(text || "").trim();
  if (!source) return [];

  const sections = [];
  const parts = source.split(/\n(?===+[^\n]+==+\s*$)/m);

  for (const part of parts) {
    const match = part.match(/^==+\s*([^=]+?)\s*==+\s*\n?([\s\S]*)$/);
    if (match) {
      const body = match[2].trim();
      if (!body) continue;
      sections.push({
        heading: match[1].trim(),
        paragraphs: body
          .split(/\n{2,}/)
          .map((item) => item.replace(/\n+/g, " ").trim())
          .filter(Boolean),
      });
      continue;
    }

    const paragraphs = part
      .split(/\n{2,}/)
      .map((item) => item.replace(/\n+/g, " ").trim())
      .filter(Boolean);
    if (paragraphs.length) {
      sections.push({ heading: null, paragraphs });
    }
  }

  return sections;
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
        exsectionformat: "wiki",
        titles: summary.title,
        format: "json",
        origin: "*",
      });
      const data = await wikiJson(
        `https://en.wikipedia.org/w/api.php?${params}`,
      );
      const page = Object.values(data?.query?.pages || {})[0];
      if (page?.extract) fullText = page.extract;
    } catch {
      // summary extract is enough as fallback
    }

    const article = {
      title: summary.title,
      description: summary.description || "",
      extract: summary.extract,
      fullText,
      sections: parseWikiSections(fullText),
      url:
        summary.content_urls?.desktop?.page ||
        summary.content_urls?.mobile?.page ||
        null,
    };
    summaryCache.set(title, article);
    return article;
  }

  summaryCache.set(title, null);
  return null;
}

function expandHex(value) {
  const hex = value.toUpperCase();
  if (/^#[0-9A-F]{3}$/.test(hex)) {
    return `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`;
  }
  return hex;
}

function rgbToHex(r, g, b) {
  const toHex = (value) =>
    Math.max(0, Math.min(255, Math.round(Number(value))))
      .toString(16)
      .padStart(2, "0")
      .toUpperCase();
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function ratioFromSize(width, height) {
  if (!(width > 0) || !(height > 0)) return null;
  const value = width / height;
  const known = [
    [1, "1:1"],
    [1.25, "5:4"],
    [1.333, "4:3"],
    [1.5, "3:2"],
    [1.6, "8:5"],
    [1.666, "5:3"],
    [1.777, "16:9"],
    [2, "2:1"],
  ];
  // also common flag ratios expressed height:width style as width:height
  const flagRatios = [
    [1.5, "2:3"],
    [1.666, "3:5"],
    [2, "1:2"],
    [1.333, "3:4"],
  ];

  for (const [target, label] of [...flagRatios, ...known]) {
    if (Math.abs(value - target) < 0.04) return label;
  }

  const rounded = Math.round(value * 100) / 100;
  return `${rounded}:1`;
}

function extractMetaFromSvg(svgText) {
  const colors = [];
  const pushColor = (hex) => {
    const value = expandHex(hex);
    if (!/^#[0-9A-F]{6}$/.test(value)) return;
    if (!colors.includes(value)) colors.push(value);
  };

  for (const match of svgText.matchAll(/#(?:[0-9a-fA-F]{3}){1,2}\b/g)) {
    pushColor(match[0]);
  }

  for (const match of svgText.matchAll(
    /rgba?\(\s*([0-9.]+)\s*,\s*([0-9.]+)\s*,\s*([0-9.]+)/gi,
  )) {
    pushColor(rgbToHex(match[1], match[2], match[3]));
  }

  for (const match of svgText.matchAll(
    /\b(?:fill|stroke)\s*[:=]\s*["']?\s*([a-zA-Z]+)\b/g,
  )) {
    const named = NAMED_COLORS[match[1].toLowerCase()];
    if (named) pushColor(named);
  }

  let proportions = null;
  const viewBox = svgText.match(
    /viewBox=["']\s*([0-9.+-eE]+)\s+([0-9.+-eE]+)\s+([0-9.+-eE]+)\s+([0-9.+-eE]+)\s*["']/,
  );
  if (viewBox) {
    proportions = ratioFromSize(Number(viewBox[3]), Number(viewBox[4]));
  }

  if (!proportions) {
    const width = svgText.match(/\bwidth=["']([0-9.]+)(?:px)?["']/i);
    const height = svgText.match(/\bheight=["']([0-9.]+)(?:px)?["']/i);
    if (width && height) {
      proportions = ratioFromSize(Number(width[1]), Number(height[1]));
    }
  }

  return {
    colors: colors.slice(0, 10),
    proportions,
  };
}

async function resolveSvgUrl(svgUrl) {
  const url = svgUrl?.replace(/^http:/, "https:");
  if (!url) return null;

  if (url.includes("upload.wikimedia.org/")) return url;

  const fileName = decodeURIComponent(
    url.split("/").pop() || "",
  ).replace(/\+/g, " ");
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
    const data = await wikiJson(
      `https://commons.wikimedia.org/w/api.php?${params}`,
    );
    const page = Object.values(data?.query?.pages || {})[0];
    return page?.imageinfo?.[0]?.url || url;
  } catch {
    return url;
  }
}

export async function extractSvgMeta(svgUrl) {
  const empty = { colors: [], proportions: null };
  if (!svgUrl) return empty;
  if (svgMetaCache.has(svgUrl)) return svgMetaCache.get(svgUrl);

  try {
    const resolved = await resolveSvgUrl(svgUrl);
    const response = await fetch(resolved);
    if (!response.ok) {
      svgMetaCache.set(svgUrl, empty);
      return empty;
    }
    const svgText = await response.text();
    if (!/<svg[\s>]/i.test(svgText)) {
      svgMetaCache.set(svgUrl, empty);
      return empty;
    }
    const meta = extractMetaFromSvg(svgText);
    svgMetaCache.set(svgUrl, meta);
    return meta;
  } catch {
    svgMetaCache.set(svgUrl, empty);
    return empty;
  }
}

/** @deprecated use extractSvgMeta */
export async function extractColorsFromSvg(svgUrl) {
  const meta = await extractSvgMeta(svgUrl);
  return meta.colors;
}
