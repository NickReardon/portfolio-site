// Rasterizes the SVG social card to a PNG that social platforms can render.
// Twitter/X, LinkedIn, Facebook, Discord, and iMessage do not display SVG
// `og:image` / `twitter:image`, so a PNG fallback is required for link previews.
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const profilePath = fileURLToPath(
  new URL("../.local/publication/profile.json", import.meta.url),
);
const pngPath = fileURLToPath(
  new URL("../public/images/social-card.png", import.meta.url),
);

const profile = JSON.parse(await readFile(profilePath, "utf8"));
const escape = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
const svg = Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630"><rect width="1200" height="630" fill="#f5f5f4"/><rect x="76" y="78" width="12" height="474" fill="#0f766e"/><text x="130" y="260" font-family="Arial,sans-serif" font-size="72" font-weight="700" fill="#0c0a09">${escape(profile.name)}</text><text x="132" y="330" font-family="Arial,sans-serif" font-size="34" fill="#44403c">${escape(profile.role)}</text><text x="132" y="415" font-family="Arial,sans-serif" font-size="25" fill="#57534e">${escape(profile.focus)}</text></svg>`,
);
const png = await sharp(svg, { density: 144 })
  .resize(1200, 630, { fit: "contain" })
  .png()
  .toBuffer();

await writeFile(pngPath, png);
console.log(`Wrote ${pngPath} (${png.length} bytes)`);
