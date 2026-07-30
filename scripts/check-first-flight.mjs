/**
 * Check that each built page fits inside the TCP slow-start window.
 *
 * A new connection can send ~10 packets (RFC 6928), roughly 14.6KB, before it
 * has to wait for an ACK. A page that fits in that window — and that needs no
 * second request to paint — renders after a single round trip.
 *
 * Sizes are measured with Brotli quality 5 rather than 11: CDNs compress on the
 * fly at a middling quality, so q11 flatters the result. q11 is reported too,
 * as a floor.
 *
 * Usage: node scripts/check-first-flight.mjs
 */
import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { dirname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { brotliCompressSync, gzipSync, constants } from "node:zlib";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const distDir = join(root, "dist");

/**
 * 14 KiB rather than the full 14.6KB: HTTP response headers are sent in the
 * same window and need room too.
 */
const BUDGET_BYTES = 14336;

/**
 * Inlined CSS is re-sent on every page rather than cached once. Past this the
 * re-send cost starts to outweigh the round trip that inlining saves, which is
 * the cue to flip `build.inlineStylesheets` back to "never" and serve the
 * stylesheet externally with immutable caching.
 */
const INLINE_CSS_WARN_BYTES = 8192;

/**
 * Pages a cold visitor lands on. Only these fail the build — detail pages and
 * the resume grow with content by design, so they are reported, not gated.
 */
const ENFORCED_ROUTES = new Set([
  "/",
  "/about/",
  "/blog/",
  "/contact/",
  "/projects/",
]);

function brotli(buffer, quality) {
  return brotliCompressSync(buffer, {
    params: { [constants.BROTLI_PARAM_QUALITY]: quality },
  }).length;
}

function findHtmlFiles(dir) {
  const found = [];

  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      found.push(...findHtmlFiles(full));
    } else if (entry.endsWith(".html")) {
      found.push(full);
    }
  }

  return found;
}

/** Map a built file path to the URL it will be served at. */
function routeFor(file) {
  const rel = relative(distDir, file).split(sep).join("/");
  if (rel === "index.html") {
    return "/";
  }
  return rel.endsWith("/index.html")
    ? `/${rel.slice(0, -"index.html".length)}`
    : `/${rel}`;
}

/** Total compressed weight of every inlined <style> block on the page. */
function inlineCssBytes(html) {
  const blocks = html.match(/<style[^>]*>[\s\S]*?<\/style>/gi) ?? [];
  if (blocks.length === 0) {
    return 0;
  }
  return brotli(Buffer.from(blocks.join(""), "utf8"), 5);
}

if (!existsSync(distDir)) {
  console.error("No dist/ directory. Run `npm run build` first.");
  process.exit(1);
}

const results = findHtmlFiles(distDir)
  .map((file) => {
    const buffer = readFileSync(file);
    const route = routeFor(file);

    return {
      route,
      enforced: ENFORCED_ROUTES.has(route),
      raw: buffer.length,
      gzip: gzipSync(buffer).length,
      brotli5: brotli(buffer, 5),
      brotli11: brotli(buffer, 11),
      inlineCss: inlineCssBytes(buffer.toString("utf8")),
    };
  })
  .sort((a, b) => b.brotli5 - a.brotli5);

const pct = (bytes) => `${Math.round((bytes / BUDGET_BYTES) * 100)}%`;

console.log(`First-flight budget: ${BUDGET_BYTES} bytes (brotli q5)\n`);
console.log("| Page | Raw | Gzip | Brotli q11 | Brotli q5 | Budget | |");
console.log("| --- | ---: | ---: | ---: | ---: | ---: | :-- |");

for (const r of results) {
  const over = r.brotli5 > BUDGET_BYTES;
  const mark = over ? (r.enforced ? "FAIL" : "over") : "ok";
  console.log(
    `| ${r.route} | ${r.raw} | ${r.gzip} | ${r.brotli11} | ${r.brotli5} | ${pct(r.brotli5)} | ${mark} |`,
  );
}

const failures = results.filter((r) => r.enforced && r.brotli5 > BUDGET_BYTES);
const overBudget = results.filter(
  (r) => !r.enforced && r.brotli5 > BUDGET_BYTES,
);
const worstInline = Math.max(0, ...results.map((r) => r.inlineCss));

console.log("");

if (worstInline > 0) {
  const note =
    worstInline > INLINE_CSS_WARN_BYTES
      ? `WARNING: over the ${INLINE_CSS_WARN_BYTES} byte threshold. Consider serving CSS externally with immutable caching instead of inlining it.`
      : `(warns above ${INLINE_CSS_WARN_BYTES})`;
  console.log(`Largest inlined CSS: ${worstInline} bytes brotli q5 ${note}`);
}

if (overBudget.length > 0) {
  console.log(
    `Over budget but not enforced: ${overBudget.map((r) => r.route).join(", ")}`,
  );
}

if (failures.length > 0) {
  console.error(
    `\n${failures.length} entry page(s) over the ${BUDGET_BYTES} byte budget:`,
  );
  for (const f of failures) {
    console.error(
      `  ${f.route} — ${f.brotli5} bytes (+${f.brotli5 - BUDGET_BYTES})`,
    );
  }
  process.exit(1);
}

console.log("\nAll enforced pages fit in the first flight.");
