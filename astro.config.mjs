// @ts-check
import { spawn } from "node:child_process";
import { existsSync, statSync } from "node:fs";
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

import tailwindcss from "@tailwindcss/vite";

/**
 * Rebuild the resume PDF when the dev server starts, but only if the resume
 * data or build scripts are newer than the existing PDF. The build runs in the
 * background and never blocks or crashes the dev server: if RenderCV is not
 * installed the child process simply exits non-zero and we log a warning.
 *
 * @returns {import('astro').AstroIntegration}
 */
function resumePdfBuild() {
  const pdfPath = "public/resume.pdf";
  const sources = [
    "src/data/resume.json",
    "scripts/resume-utils.mjs",
    "scripts/build-resume.mjs",
  ];

  const isStale = () => {
    if (!existsSync(pdfPath)) {
      return true;
    }

    const pdfModified = statSync(pdfPath).mtimeMs;
    return sources.some(
      (source) => existsSync(source) && statSync(source).mtimeMs > pdfModified,
    );
  };

  return {
    name: "resume-pdf-build",
    hooks: {
      "astro:server:setup": ({ logger }) => {
        if (!isStale()) {
          logger.info("Resume PDF is up to date; skipping rebuild.");
          return;
        }

        logger.info("Resume data changed; rebuilding resume PDF...");
        const child = spawn(process.execPath, ["scripts/build-resume.mjs"], {
          stdio: "inherit",
        });
        child.on("error", (error) => {
          logger.warn(`Skipped resume PDF build: ${error.message}`);
        });
        child.on("exit", (code) => {
          if (code === 0) {
            logger.info("Resume PDF rebuilt.");
          } else {
            logger.warn(
              `Resume PDF build exited with code ${code}. Is RenderCV installed? (npm run resume:build to see the error)`,
            );
          }
        });
      },
    },
  };
}

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
  integrations: [sitemap(), resumePdfBuild()],
  image: {
    // Authorize itch.io's CDN so Astro can optimize remote project cover
    // images at build time. See docs/image-pipeline-plan.md for the planned
    // move to fully self-hosted, pipeline-optimized images.
    remotePatterns: [{ protocol: "https", hostname: "img.itch.zone" }],
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
