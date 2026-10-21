# Project Element Palette

**Status: proposed.** This document describes the target model for project
content and for parsing discussion-authored posts. The shipped schema in
`src/content.config.ts` still uses `projectType` and three fixed link fields,
and no directive plugin is configured yet, so treat every example here as the
destination rather than current behavior. Fold the authoring half into
`docs/content.md` once it lands.

A complete file written against this model lives in
`docs/examples/project-palette.md`.

## 1. The Idea

A project is not a type. It is a set of elements drawn from one open palette.

A game fills `genre`, `stack`, and a `play` link. A desktop tool fills `stack`
and a `repo` link and omits `genre` entirely. A writeup fills almost nothing
beyond the required core. There is no per-type schema, no discriminated union,
and no `projectType` enum deciding which fields are legal, because the fields a
project happens to use already say what it is.

The palette has two halves, split by one question: does position matter?

- **Frontmatter** carries what describes the whole project. Section 2.
- **Body elements** carry what belongs at a point in the prose. Section 4.

Three rules keep that from turning into drift:

- **One element, one key.** `stack` holds an engine and version for a game and a
  language and runtime for a tool. It does not get a sibling called `engine` or
  `tech` later.
- **Unknown names fail the build**, for frontmatter keys and directive names
  alike. See section 5.
- **Everything optional is genuinely optional.** A missing element shortens what
  renders; it never breaks a page.

## 2. The Frontmatter Palette

Required on every project:

| Element       | Type   | Notes                                                        |
| ------------- | ------ | ------------------------------------------------------------ |
| `title`       | string | Also the discussion title when synced.                       |
| `description` | string | One sentence. Feeds cards and meta tags.                     |
| `date`        | date   | Sort key. `YYYY-MM-DD`.                                      |
| `category`    | string | Which index subsection. Stamped by the sync — see section 6. |

Optional, fill what applies:

| Element      | Type     | Typical user | Notes                                                                             |
| ------------ | -------- | ------------ | --------------------------------------------------------------------------------- |
| `timeline`   | string   | any          | Human range: "September 2025 - present". Replaces the formatted `date` in the UI. |
| `status`     | string   | any          | Free text: "Unreleased", "Released", "On hold".                                   |
| `genre`      | string   | games        | "Action rogue-lite". Half the descriptor line.                                    |
| `stack`      | string   | any          | "Unreal Engine 5.8", "Python / PySide6".                                          |
| `role`       | string   | any          | What you did on it.                                                               |
| `tags`       | string[] | any          | Descriptive, many per project. Not a grouping key.                                |
| `links`      | link[]   | any          | The header link row. See section 3.                                               |
| `coverImage` | image    | any          | Repo-owned. See section 7.                                                        |
| `coverAlt`   | string   | any          | Required whenever `coverImage` is set.                                            |
| `featured`   | boolean  | any          | Sorts first. Defaults to `false`.                                                 |
| `draft`      | boolean  | any          | Hidden in production builds. Defaults to `false`.                                 |

`status`, `stack`, and `genre` compose the one-line descriptor, in that order,
skipping whatever is absent:

```ts
[data.status, data.stack, data.genre].filter(Boolean).join(" ");
```

An unreleased Unreal project reads "Unreleased Unreal Engine 5.8 action
rogue-lite". A shipped jam game reads "Released Godot platformer". A writeup
with none of the three renders no descriptor at all rather than an empty row.

## 3. Links

One list replaces the fixed `githubUrl`, `videoUrl`, `externalUrl`, and
`externalLabel` fields, because a project can have any number of each, and a
UE5 game that is not playable in a browser still has a trailer and a repo.

```yaml
links:
  - kind: "play"
    label: "Play on itch.io"
    href: "https://thingofnightmare.itch.io/last-oasis"
  - kind: "repo"
    label: "Source"
    href: "https://github.com/NickReardon/last-oasis"
```

This is the persistent link row in the page header, which is a different element
from a video embedded partway down the body. Authored order is render order, and
`kind` selects an icon through a lookup with a fallback, so an unrecognised or
missing `kind` renders with the generic external icon instead of failing.
Playability is derived, never stored:

```ts
const playable = data.links.some((link) => link.kind === "play");
```

## 4. Body Elements

Anything whose position in the page matters goes in the body, at that position.
Three layers, cheapest first.

**Plain Markdown needs no element.** Images, tables, blockquotes and headings
already work anywhere. Astro processes relative image paths in a body, so an
inline image is hashed, converted and given a `srcset` exactly like the cover:

```markdown
![Ability activation path from input to a combo window.](../../assets/projects/tethered-combat.png)
```

**Container directives wrap Markdown** for the structures Markdown has no syntax
for, via `remark-directive`:

```markdown
:::gallery
![Combo window editor with three chained attacks.](../../assets/projects/tethered-combat.png)
![Room transition graph.](../../assets/projects/tethered-travel.png)
:::
```

**Leaf directives carry attributes and no content**, for an element that is pure
data placed at a position:

```markdown
::video{href="https://youtube.com/watch?v=xxxxxxxxxxx" label="Systems breakdown"}
```

Video embeds, and is always external. `href` points at a real video host and the
directive renders a player; a video file is never committed, because git is the
wrong store for a 100MB binary and Astro has no video pipeline to optimize one
with. The cost is that GitHub supports no external video embeds of its own, so
this directive has no preview where it is authored — a discussion renders the
line as literal text. A video uploaded to the discussion instead does preview
there, but yields a CDN URL, which section 7 rejects.

A directive and not a fenced code block, for one reason: a fence opts its
contents out of Markdown parsing entirely, so image paths inside it stay dumb
strings — no optimization, and a typo'd filename ships broken instead of failing
the build. A directive wraps Markdown, so what is inside is still real Markdown.
The frontmatter fence works precisely because it holds data, not content.

Directive names are a closed registry beside `projectCategories` in
`src/site.config.ts`, and an unknown name fails the build rather than rendering
as empty markup.

## 5. Why `.strict()`

A Zod object silently discards keys it does not know. Without `.strict()`, a
misspelled `genere:` or an invented `platform:` disappears with no error, and the
only symptom is a page that renders short.

```ts
schema: ({ image }) => z.object({ /* the palette */ }).strict(),
```

That single call is what makes this a palette rather than a suggestion. It moves
enforcement to the level that actually drifts in a free-form model, which is
names, and leaves the values themselves unconstrained. The directive registry is
the same bargain for the body half.

## 6. Grouping Comes From Outside the Palette

The palette deliberately has no classifying element, so the projects index needs
its grouping key from somewhere else: the GitHub discussion sub-category a post
was authored in.

Discussions support one level of nesting, so a `Projects` section holds `Games`,
`Software`, and whatever comes next as categories. The sync maps each category to
a collection directory and the heading it stamps:

```js
const COLLECTIONS = {
  Blog: { dir: "src/content/blog" },
  Games: { dir: "src/content/projects", category: "Games" },
  Software: { dir: "src/content/projects", category: "Software" },
};
```

Two benefits over authoring `category:` by hand. The author picks the type from
the GitHub UI at creation time, so it cannot be misspelled, and each category
gets its own discussion template, since a template file binds to a category
slug: a `software` form simply omits the `genre` line.

Repo-written files set `category` themselves. It is the one element that is
required but not free-form, and section order lives beside `navigation`:

```ts
export const projectCategories = ["Games", "Software", "Writeups"];
```

Anything not listed renders after the listed groups.

## 7. Assets Stay Repo-Owned

`coverImage` uses Astro's `image()` helper, which needs a file committed under
`src/assets/projects/` so the build can hash and crop it. A discussion has
nowhere to put one, so it is never read from discussion frontmatter. Body images
are ordinary Markdown and need no schema field, but they reference the same
committed assets and so carry the same constraint.

This has a consequence for the sync. Because it rewrites a synced file in whole,
reading the cover from the discussion would delete one added by hand on the next
edit. The merge rule: **the discussion owns prose and metadata, the repo owns
assets.** Asset elements are carried over from the existing file, or absent if
there is none.

### Materializing attachments

GitHub uploads a pasted or dropped image immediately and rewrites the body to an
anonymized `*.githubusercontent.com` URL, which the API hands back verbatim in
`body`. Copying that URL into a page would hotlink it: invisible to Astro, so no
hash, no WebP, no `srcset`, and no build error when it stops resolving. Image
URLs are proxied through Camo as well, and the docs state no lifetime for either
kind.

So the sync downloads them. For each supported image URL in a body — `.png`,
`.gif`, `.jpg`, `.jpeg`, `.svg`, under GitHub's 10MB ceiling — write the bytes to
`src/assets/projects/<slug>/<content-hash>.<ext>`, rewrite the reference to a
relative path, and commit the binary beside the markdown. Hashing the content
rather than naming by upload keeps a re-edited discussion from churning the tree.

Two rules on top:

- **Never inline a materialized SVG.** GitHub accepts SVG uploads and an SVG can
  carry script. Reference it as an `img` source instead.
- **Videos are not materialized.** Use the `video` directive and a real host, per
  section 4.

## 8. Parse Contract

A discussion becomes a page only when every step passes, in order:

1. Its category appears in `COLLECTIONS`.
2. It carries the `publish` label. The label is applied by hand when a post is
   ready, which is why no discussion template pre-applies it.
3. The body contains a fenced `yaml` block. The **first** such fence wins; it is
   not assumed to be at position zero, because a form-created body may carry a
   heading above it.
4. That YAML parses, and the result passes the collection schema including
   `.strict()`.
5. Asset elements from step 4 are discarded and merged from the existing file per
   section 7.
6. Image attachments in the body are materialized and their references rewritten,
   per section 7. A video attachment is reported rather than committed, and the
   post does not sync: a reference that cannot be made repo-owned never ships.

Any failing step yields no page. The gate fails closed: a discussion that is not
positively recognised as publishable does not ship.

Body content is everything after the fence, trimmed, and is copied verbatim.
Directives are plain text, so they survive the round trip untouched: a discussion
renders `:::gallery` as a literal line and still shows the images beneath it.
That degradation is acceptable; a fenced block would have hidden them entirely.

## 9. Worked Example

See `docs/examples/project-palette.md` for a complete file: every frontmatter
element filled in, an inline image, a `gallery` container, a `video` leaf, and a
`note` callout, with comments explaining each group.

## 10. Migration

`projectType` is removed rather than replaced. Its three members mapped to
nothing consistent: `system` covered both a UE5 game presented as systems work
and a Python desktop app, while `writeup` was the schema default and unused by
every project.

Per existing file: drop `projectType`, rename `engine` to `stack`, keep `status`
as the free text it already contained, add `genre` to the games, and fold
`externalUrl` and `externalLabel` into a `links` entry with `kind: "play"`. The
projects index stops filtering on `projectType` twice and loops over
`projectCategories` instead.

Two prerequisites that are not schema work: `remark-directive` has to be added
and configured for section 4, and the two discussion templates under
`.github/DISCUSSION_TEMPLATE/` still prefill `projectType` and predate section
6, so they need splitting per sub-category.
