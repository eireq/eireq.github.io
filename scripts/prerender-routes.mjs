import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { flagSlug, shortName } from "../src/data/flags.js";
import {
  SITE,
  escapeHtml,
  fallbackHtml,
  headTags,
  pageUrl,
  pages,
} from "../src/seo.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "dist");
const shellPath = join(dist, "index.html");
const shell = readFileSync(shellPath, "utf8");

if (!shell.includes("<!--seo:start-->") || !shell.includes("<!--prerender:start-->")) {
  throw new Error("dist/index.html is missing seo markers");
}

function fill(page) {
  const next = shell
    .replace(
      /<!--seo:start-->[\s\S]*?<!--seo:end-->/,
      `<!--seo:start-->\n    ${headTags(page)}\n    <!--seo:end-->`,
    )
    .replace(
      /<!--prerender:start-->[\s\S]*?<!--prerender:end-->/,
      `<!--prerender:start-->${fallbackHtml(page)}<!--prerender:end-->`,
    );

  const canonical = `<link rel="canonical" href="${pageUrl(page.path)}">`;
  if (!next.includes(canonical)) {
    throw new Error(`failed to fill ${page.path}`);
  }
  return next;
}

function writePage(page) {
  const html = fill(page);
  if (page.path === "/") {
    writeFileSync(shellPath, html);
    return;
  }

  const file = join(dist, page.path.slice(1), "index.html");
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, html);
}

function clip(text, max = 155) {
  const clean = String(text || "").replace(/\s+/g, " ").trim();
  if (!clean) return "";
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1).replace(/\s+\S*$/, "");
  return `${cut || clean.slice(0, max - 1)}…`;
}

function flagPages() {
  const flags = JSON.parse(
    readFileSync(join(root, "src/assets/master_flags.json"), "utf8"),
  );
  const seen = new Set(pages.map((page) => page.path));
  const built = [];

  for (const flag of flags) {
    const slug = flagSlug(flag);
    const path = `/flagdb/detail/${slug}`;
    if (!slug || seen.has(path)) continue;
    seen.add(path);

    const name = shortName(flag) || "flag";
    const blurb =
      clip(flag.funFact || flag.emblemMeaning) ||
      `${name} in eire's flag database.`;

    built.push({
      path,
      title: `${name} flag — eire`,
      description: blurb,
      fallback: `<h1>${escapeHtml(name)}</h1><p>${escapeHtml(blurb)}</p><p><a href="/flagdb">flag database</a></p>`,
    });
  }

  return built;
}

const flagRoutes = flagPages();
const all = [...pages, ...flagRoutes];

for (const page of all) writePage(page);

const lastmod = new Date().toISOString().slice(0, 10);
const urls = all
  .map(
    (page) =>
      `  <url><loc>${page.path === "/" ? `${SITE}/` : `${SITE}${page.path}`}</loc><lastmod>${lastmod}</lastmod></url>`,
  )
  .join("\n");

writeFileSync(
  join(dist, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
);

console.log(`wrote ${all.length} html pages and sitemap.xml`);
