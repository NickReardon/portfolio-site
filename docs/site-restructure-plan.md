# Portfolio Site Restructure Plan

Implementation specification for restructuring the portfolio without replacing
the existing visual design. The work focuses on project discoverability,
consistent templates, evidence media, and eliminating duplicated project
metadata.

## Goals

1. Put credible systems work within one click and one scroll of the home page.
2. Make Tethered the strongest visual and editorial project wherever it appears.
3. Make every page understandable through its headings and media during a short
   review.
4. Use one shared implementation per repeated page or component type.
5. Remove placeholder content and media from published pages.

The redesign of the site's color system, interactive features, and a broader
blog buildout are outside this effort.

## Decisions to Lock Before Implementation

Use these defaults unless new factual information requires a change:

- Project content frontmatter is the canonical source for portfolio metadata.
- Resume entries match projects through a stable project slug. Validation keeps
  duplicated resume-facing names, roles, dates, and URLs consistent.
- Rename the project content field `timeline` to `dateLabel`.
- Use `Alien Survivor` consistently across the site and resume.
- Confirm the accurate Bike Ride role before changing any resume claim.
- Set Alien Survivor to non-featured so the Home page selects three projects and
  the Featured badge has contrast on the Projects index.
- Obtain at least one real Tethered capture before releasing the structural
  changes. A release that still uses `tethered-placeholder.svg` does not satisfy
  the goals of this plan.

## Phase 1: Project Data Foundation

### Content schema

Add and validate these project fields:

- `dateLabel`: human-readable date or event label.
- `order`: unique positive integer controlling the Projects index order.
- `variant`: exactly `case-study` or `jam-postmortem`.
- `status`: exactly `In development`, `Released`, `Prototype`, or `On hold`.

Published projects require a real cover image. Draft projects may omit one while
they remain excluded from production.

Assign the initial index order:

1. Tethered
2. Last Oasis
3. A Totally Normal Bike Ride
4. Alien Survivor

Use spaced numeric values such as 10, 20, 30, and 40 so later projects can be
inserted without renumbering every entry.

### Consistency validation

Add a validation script that fails on:

- Duplicate project order values.
- Invalid status or variant values.
- Missing published cover images.
- Published cover or Open Graph paths containing `placeholder`.
- Referenced local media files that do not exist.
- Conflicting project names, roles, dates, or URLs between project content and
  resume data.

Update all consumers of project ordering, including the Home page, Projects
index, and `llms.txt`.

### Phase 1 verification

Run:

```powershell
npm run check
npm run build
npm run format:check
```

## Phase 2: Home and Projects Discovery

### Heading hierarchy

- Remove bare global heading-size rules where they cause page types to compete.
- Scope visual heading rules to page headers, section headers, project prose,
  cards, and resume containers.
- Make project prose `h3` headings larger than body text in both size and weight,
  with clear top spacing.
- Preserve semantic heading levels independently of visual styling.

### ProjectCard

Keep one shared card component with these behaviors:

- Preserve a `headingLevel` prop. Home cards are `h3`; Projects index cards are
  `h2` unless the grid receives its own `h2` heading.
- Add a `showFeatured` prop instead of rendering the badge unconditionally.
- Use a 16:9 image.
- Render fields in this order: image, date label and optional badge, title, role,
  status and engine, description, tags.
- Keep card heights visually consistent without hiding important ownership
  information.
- Do not render a placeholder fallback for published content.

Remove unused coral badge tokens and placeholder styles after all consumers are
migrated.

### Home

- Remove the second hero paragraph that repeats the subtitle.
- Remove Featured badges from Home cards.
- Remove the Devlog section while Blog is absent from navigation.
- Let the About content use the reclaimed space without introducing a new empty
  wrapper.
- Keep Tethered first and use a real capture for its card image.

### Projects index

- Merge Playable Work and Systems Work into one ordered grid.
- Render Tethered first.
- Show Featured badges only when the catalog contains meaningful featured and
  non-featured contrast.
- Move the itch.io profile link into the introduction or a small line below the
  grid.
- Replace the near-black Alien Survivor thumbnail with a brighter capture or
  readable title treatment.

### Navigation and Blog

- Remove Blog from primary navigation.
- Keep `/blog/` and existing posts available through direct URLs and the sitemap.
- Restore the navigation link and Home Devlog section together after at least two
  substantial systems posts exist.

### Phase 2 verification

Review Home and Projects using a production build at desktop width and at a
390px mobile viewport. Confirm heading order, card alignment, navigation wrapping,
and the absence of unintended empty space.

## Phase 3: Shared Project Detail Structure

### ProjectHeader

Extract a shared header with:

1. Date label eyebrow.
2. Project title.
3. One-line description.
4. Tags.
5. Role, status, and engine detail cards.
6. Relevant action buttons.

Render hero media immediately below the header at full content width. Remove the
small right-side thumbnail layout.

### Project variants

Continue using one Astro project-detail shell. The `variant` field may control
header actions, media treatment, and variant-specific styling, but Markdown
remains responsible for section order.

Use these editorial structures:

#### Case study: Tethered

1. Overview, including the relevant narrative and capstone context.
2. Team and specific ownership.
3. Core Gameplay Loop.
4. Architecture introduction.
5. One `h3` section per system, shaped around problem, decision, trade-off, and
   evidence where available.
6. Testing and Integration.
7. Key Takeaways.

Keep the final body between 800 and 1,200 words. Tethered is already within this
range, so the work is restructuring rather than expansion.

#### Jam postmortem

1. Overview of the game, jam, and constraint.
2. What I Contributed, with ownership stated before implementation details.
3. One `h3` section per system, using a lighter problem, decision, and trade-off
   structure.
4. At least one gameplay motion asset.
5. What the Work Shows.

Target 400 to 700 words per jam project.

### Content cleanup

- Fold Tethered's Narrative and World section into its Overview.
- Keep Key Takeaways as the case-study closer, matching the content guide.
- Normalize `Key Contributions` and `Implementation Details` to
  `What I Contributed` on jam pages.
- Remove internal media and code placeholder comments from published content.

## Phase 4: Evidence Media

Build `ProjectMedia` when real media is ready. It must support:

- Astro-optimized static images.
- Self-hosted MP4 and WebM sources.
- Lazy-loaded YouTube embeds.
- Configurable aspect ratio with a 16:9 default.
- Required alternative text for meaningful images.
- Required accessible titles for embedded video.
- Optional visible captions that do not replace alternative text.
- Video posters, `playsinline`, and explicit preload behavior.
- Reduced-motion behavior that prevents unsolicited autoplay.
- Captions or a nearby transcript when a video communicates meaningful evidence.

Do not provide a placeholder mode.

### Required media

- Tethered: one hero capture used by the detail page, Home card, Projects card,
  and a properly cropped Open Graph asset where appropriate.
- Tethered: at least two in-body pieces of system evidence.
- Each jam project: at least one gameplay GIF or clip.
- Alien Survivor: a brighter card thumbnail.

Open Graph images must be real captures, exist at build time, and use dimensions
appropriate for social sharing rather than relying on an arbitrary gameplay
crop.

## Phase 5: Content Completion

Current approximate body lengths are:

- Tethered: 1,072 words.
- Last Oasis: 309 words.
- A Totally Normal Bike Ride: 337 words.
- Alien Survivor: 231 words.

Expand the three jam pages to the 400-to-700-word range by adding useful context,
decisions, trade-offs, and evidence rather than filler. Keep each ownership claim
specific and place it before detailed architecture.

After content migration, confirm that project names and roles are identical on
cards, project headers, and the resume.

## Phase 6: Documentation and Release Verification

Update `docs/content.md` with:

- Canonical metadata ownership.
- Project schema fields and allowed values.
- Case-study and jam-postmortem structures.
- Media accessibility and publishing requirements.
- The no-placeholder publication rule.

Run the full verification set:

```powershell
npm run check
npm run build
npm run format:check
npm run audit
```

Perform final production-preview checks for:

- Home.
- Projects index.
- Tethered.
- All three jam pages.
- Resume.
- Direct Blog route.
- Desktop and 390px mobile layouts.
- Semantic heading hierarchy.
- Reduced-motion media behavior.
- Missing or broken links and assets.
- Open Graph metadata.
- Draft exclusion from production.

## Acceptance Criteria

- Tethered appears first and is the strongest visual project on Home and Projects.
- The Projects index is a single grid.
- Blog is absent from primary navigation while its route remains available.
- Project cards share one implementation and consistent internal layout.
- Card heading levels remain semantically correct on both surfaces.
- Jam date labels appear on cards and headers.
- Project `h3` headings are visually distinct from body text.
- Names and roles match across project content and resume data.
- Featured badges appear only where they communicate a real distinction.
- Every published project has a real card image and Open Graph image.
- Tethered has a full-width hero and at least two in-body evidence assets.
- Each jam project has at least one motion asset.
- No published path, component fallback, or content comment contains a placeholder.
- Home and Tethered pass a headings-and-media-only skimming review.
- All required checks pass against the production build.

## Suggested Commit Boundaries

1. `feat(content): Normalize project metadata schema`
2. `feat(portfolio): Restructure project discovery surfaces`
3. `feat(projects): Unify project detail layouts`
4. `content(projects): Restructure project case studies`
5. `feat(media): Add project evidence media`
6. `docs(content): Document project publishing workflow`

Do not include unrelated generated resume PDF changes in these commits unless
the resume is intentionally regenerated as part of the canonical-string update.
