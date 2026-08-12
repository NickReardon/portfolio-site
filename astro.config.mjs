// @ts-check
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

import tailwindcss from "@tailwindcss/vite";

const productionUrl = "https://nick-reardon.com";

// https://astro.build/config
export default defineConfig({
  site: productionUrl,
  integrations: [sitemap()],
  build: {
    // Inline the stylesheet instead of linking it. An external stylesheet is
    // render-blocking, so first paint costs a second round trip: fetch the HTML,
    // parse the head, discover the CSS, fetch that too. Inlined, every page
    // paints after a single round trip. `npm run check:first-flight` proves the
    // result still fits the TCP slow-start window.
    //
    // The trade-off is that CSS is re-sent per page rather than cached once.
    // Flip back to "never" (and add a hand-written critical block, plus the
    // immutable caching already set up in public/_headers) when any of these
    // hold:
    //   - inlined CSS exceeds ~8KB brotli, which check:first-flight warns on
    //   - an enforced page exceeds the 14KB budget
    //   - visitors routinely span several pages per session
    //   - a client router is added: Astro's <ClientRouter /> refetches whole
    //     documents, so inlined CSS would be re-sent on every navigation
    inlineStylesheets: "always",
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
