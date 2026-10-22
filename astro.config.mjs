// @ts-check
import { execFileSync } from "node:child_process";
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import { unified } from "@astrojs/markdown-remark";
import remarkDirective from "remark-directive";
import { remarkElements } from "./src/plugins/remark-elements.mjs";

// Cloudflare sets these on its own builds. A local Wrangler upload does not, so
// fall back to the working tree's commit and branch: a hand-uploaded deployment
// should still be traceable to what produced it.
/**
 * @param {string[]} args
 */
function gitValue(args) {
  try {
    return execFileSync("git", args, { encoding: "utf8" }).trim() || undefined;
  } catch {
    return undefined;
  }
}

const commitSha =
  process.env.CF_PAGES_COMMIT_SHA ?? gitValue(["rev-parse", "HEAD"]);
const commitBranch =
  process.env.CF_PAGES_BRANCH ??
  gitValue(["rev-parse", "--abbrev-ref", "HEAD"]);
// The commit date, not the build time: rebuilding unchanged content should not
// claim the site was updated.
const commitTime = gitValue(["log", "-1", "--format=%cI"]);
// The content hash, not the commit hash. GitHub's merge button always mints a
// new commit, so main and staging never share a commit SHA even when their
// content is identical. Their trees do, which is what "is main up to date?"
// actually asks.
const treeSha = gitValue(["rev-parse", "HEAD^{tree}"]);

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
  // Astro 7 defaults to Sätteri, its Rust Markdown pipeline, which takes no
  // remark plugins. Body elements need one: remark-directive extends the
  // parser itself to read `:::name`, which a Rust parser cannot be handed. So
  // this opts back into unified, whose feature set is otherwise the same.
  //
  // remarkDirective parses the syntax; remarkElements decides what each name
  // renders as, and rejects names it does not know.
  markdown: {
    processor: unified({
      remarkPlugins: [remarkDirective, remarkElements],
    }),
  },
  vite: {
    define: {
      "import.meta.env.CF_PAGES_COMMIT_SHA": JSON.stringify(commitSha ?? null),
      "import.meta.env.CF_PAGES_BRANCH": JSON.stringify(commitBranch ?? null),
      "import.meta.env.BUILD_COMMIT_TIME": JSON.stringify(commitTime ?? null),
      "import.meta.env.BUILD_TREE_SHA": JSON.stringify(treeSha ?? null),
    },
  },
});
