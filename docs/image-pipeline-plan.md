# Image Pipeline

Project cover images run through Astro's asset pipeline. This documents how it
works and the one gap that is still open.

## Current state

- Cover sources live in `src/assets/projects/`, not `public/`. Anything under
  `public/` is copied verbatim and bypasses optimization entirely.
- `coverImage` in `src/content.config.ts` uses Astro's `image()` helper, so it is
  typed as `ImageMetadata` and a broken path fails the build instead of 404ing
  silently at runtime.
- Frontmatter points at the asset relatively, e.g.
  `coverImage: "../../assets/projects/last-oasis.png"`.
- `ProjectCard.astro` and `ProjectMedia.astro` request explicit `widths` plus a
  `sizes` attribute, so Astro emits WebP variants and a responsive `srcset`.
- Covers are content-hashed into `/_astro/`, which is what makes the
  `immutable` cache header in `public/_headers` safe.

Measured effect on the three raster covers: 142kB → 21kB, 59kB → 9kB, and
42kB → 3kB for the largest generated variant.

## Rules worth keeping

- **Never generate a width above the source's own.** Upscaling costs bytes and
  returns blur, not detail. Both components filter their width lists against
  `ImageMetadata.width`.
- **Never pass `widths` to an SVG.** Vectors scale on their own; asking for
  variants just emits byte-identical copies. Both components skip widths when
  `format === "svg"`.
- **Covers below the fold stay lazy.** The homepage hero is text, so no cover is
  ever the LCP element. Eagerly fetching them only steals slow-start bandwidth
  from the document — see `docs/`-adjacent notes in `astro.config.mjs`.
- **`ogImage` stays a plain public path.** Social crawlers want a stable,
  unhashed URL, and they handle PNG more reliably than WebP. It is optional:
  `projects/[slug].astro` falls back to `coverImage.src`, which resolves to the
  emitted original (Astro emits it alongside the WebP variants), so every
  published project still has a social image without duplicating files.

## Open gap: source resolution

The three raster sources are only 508x254. Cards lay out around 368px and detail
pages up to ~1100px, so they are sharp enough at 1x on cards but soft on detail
pages and on high-DPI screens.

This cannot be fixed in code — generating larger variants from a 508px source
produces bigger blurry files, which is why the width lists are capped. It needs
the original captures re-exported at roughly 1520px wide, after which the only
change required is raising the width lists in `ProjectCard.astro` and
`ProjectMedia.astro`.

## Verification

- `npm run build` — watch the "generating optimized images" step for the emitted
  variants.
- `npm run check:first-flight` — confirms the document budget is unaffected.
- Inspect `dist/_astro/` for the WebP variants, and confirm `og:image` in a built
  project page resolves to a file that exists.
- `npm run audit` — the "Improve image delivery" Lighthouse audit on Home,
  Projects, and a detail page.
