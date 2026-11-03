import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { fileURLToPath, URL } from "node:url";
import { fallbackHtml, headTags, pages } from "./src/seo.js";

const home = pages.find((page) => page.path === "/");

// fills the seo and prerender markers in index.html with the home page's tags
function seoShell() {
  return {
    name: "seo-shell",
    transformIndexHtml(html) {
      return html
        .replace(
          /<!--seo:start-->[\s\S]*?<!--seo:end-->/,
          `<!--seo:start-->\n    ${headTags(home)}\n    <!--seo:end-->`,
        )
        .replace(
          /<!--prerender:start-->[\s\S]*?<!--prerender:end-->/,
          `<!--prerender:start-->${fallbackHtml(home)}<!--prerender:end-->`,
        );
    },
  };
}

export default defineConfig({
  plugins: [vue(), seoShell()],
  base: "/",
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
