// Rasterizes the SVG social card to a PNG that social platforms can render.
// Twitter/X, LinkedIn, Facebook, Discord, and iMessage do not display SVG
// `og:image` / `twitter:image`, so a PNG fallback is required for link previews.
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const svgPath = fileURLToPath(
  new URL("../public/images/social-card.svg", import.meta.url),
);
const pngPath = fileURLToPath(
  new URL("../public/images/social-card.png", import.meta.url),
);

const svg = await readFile(svgPath);
const png = await sharp(svg, { density: 144 })
  .resize(1200, 630, { fit: "contain" })
  .png()
  .toBuffer();

await writeFile(pngPath, png);
console.log(`Wrote ${pngPath} (${png.length} bytes)`);
