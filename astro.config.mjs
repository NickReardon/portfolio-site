// @ts-check
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

import tailwindcss from "@tailwindcss/vite";

const productionBranch = "main";
const stagingBranch = "staging";
const productionUrl = "https://nick-reardon.com";
const stagingUrl = "https://staging.nick-reardon.com";

/**
 * @param {string | undefined} url
 */
function normalizeUrl(url) {
  if (!url) {
    return undefined;
  }

  return /^https?:\/\//u.test(url) ? url : `https://${url}`;
}

const branch = process.env.CF_PAGES_BRANCH;
const siteUrl =
  normalizeUrl(process.env.SITE_URL) ??
  (branch === stagingBranch
    ? stagingUrl
    : branch && branch !== productionBranch
      ? (normalizeUrl(process.env.CF_PAGES_URL) ?? productionUrl)
      : productionUrl);

// https://astro.build/config
export default defineConfig({
  site: siteUrl,
  integrations: [sitemap()],
  vite: {
    plugins: [tailwindcss()],
  },
});
