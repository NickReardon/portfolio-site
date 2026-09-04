# Image Pipeline Plan

Planned follow-up for fully self-hosted, pipeline-optimized project cover
images. This is not yet implemented; the current state is documented first.

## Current state

- Project cover images live in content frontmatter as `coverImage` strings.
- Three projects point at the itch.io CDN
  (`https://img.itch.zone/...`); `tethered` uses a local SVG.
- `astro.config.mjs` authorizes `img.itch.zone` via `image.remotePatterns`,
  so Astro optimizes those remote images at build time (format + sizing).

## Why this is interim

- The build depends on the itch.io CDN being reachable and on those URLs
  staying valid. If itch changes or removes an image, the build breaks.
- The itch source images are pre-downscaled (508x254) while cards render up to
  640px wide and detail pages up to 760px, so the sources are slightly
  upscaled. Self-hosted originals at the right resolution would look sharper.

## Target state

Move cover images into the Astro asset pipeline so they are bundled, hashed,
and optimized (WebP/AVIF + responsive `srcset`) with no third-party
dependency.

### Steps

1. Save full-resolution source images under `src/content/projects/` (next to
   each markdown file) or a shared `src/assets/projects/` directory. Aim for at
   least 1520px wide so the 760px detail image has a 2x source.
2. Switch the `coverImage` schema field to Astro's `image()` helper so it is
   validated and typed as `ImageMetadata`:

   ```ts
   // src/content.config.ts
   import { defineCollection } from "astro:content";
   import { glob } from "astro/loaders";

   const projects = defineCollection({
     loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/projects" }),
     schema: ({ image }) =>
       z.object({
         // ...
         coverImage: image().optional(),
         // ...
       }),
   });
   ```

   Note: `image()` is provided via the schema callback argument, so the schema
   becomes a function instead of a plain object.

3. Update frontmatter to relative paths, e.g.
   `coverImage: ./last-oasis.png`.
4. `ProjectCard.astro` and `projects/[slug].astro` already pass `coverImage`
   straight to `<Image src={...} />`; with `image()` the value becomes
   `ImageMetadata` and Astro will optimize automatically. Verify `width`/
   `height` handling still produces the intended aspect ratios.
5. Remove the `img.itch.zone` entry from `image.remotePatterns` in
   `astro.config.mjs` once no content references the remote host.
6. Confirm `og:image` / per-project social images still resolve to absolute
   URLs (see `BaseLayout.astro`), since `ImageMetadata.src` is a hashed build
   path rather than a stable public path.

### Verification

- `npm run check`, `npm run build`, `npm run format:check`.
- Inspect `dist/_astro/` for the optimized cover variants.
- Re-run `npm run audit` and confirm the "Improve image delivery" audit on
  Home, Projects, and the Last Oasis detail page improves.
