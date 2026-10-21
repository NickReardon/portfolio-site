# Project Element Palette

**Status: proposed.** This document describes the target model for project
frontmatter and for parsing discussion-authored content. The shipped schema in
`src/content.config.ts` still uses `projectType` and three fixed link fields, so
treat every example here as the destination, not current behavior. Fold the
authoring half into `docs/content.md` once the schema lands.

## 1. The Idea

A project is not a type. It is a set of elements drawn from one open palette.

A game fills `genre`, `stack`, and a `play` link. A desktop tool fills `stack`
and a `repo` link and omits `genre` entirely. A writeup fills almost nothing
beyond the required core. There is no per-type schema, no discriminated union,
and no `projectType` enum deciding which fields are legal, because the fields a
project happens to use already say what it is.

Three rules keep that from turning into drift:

- **One element, one key.** `stack` holds an engine and version for a game and a
  language and runtime for a tool. It does not get a sibling called `engine` or
  `tech` later.
- **Unknown keys fail the build.** See section 4.
- **Everything optional is genuinely optional.** A missing element shortens what
  renders; it never breaks a page.

## 2. The Palette

Required on every project:

| Element       | Type   | Notes                                    |
| ------------- | ------ | ---------------------------------------- |
| `title`       | string | Also the discussion title when synced.   |
| `description` | string | One sentence. Feeds cards and meta tags. |
| `date`        | date   | Sort key. `YYYY-MM-DD`.                  |

Optional, fill what applies:

| Element      | Type     | Typical user | Notes                                                                             |
| ------------ | -------- | ------------ | --------------------------------------------------------------------------------- |
| `timeline`   | string   | any          | Human range: "September 2025 - present". Replaces the formatted `date` in the UI. |
| `status`     | string   | any          | Free text: "Unreleased", "Released", "On hold".                                   |
| `genre`      | string   | games        | "Action rogue-lite". Half the descriptor line.                                    |
| `stack`      | string   | any          | "Unreal Engine 5.8", "Python / PySide6".                                          |
| `role`       | string   | any          | What you did on it.                                                               |
| `tags`       | string[] | any          | Descriptive, many per project. Not a grouping key.                                |
| `links`      | link[]   | any          | See section 3.                                                                    |
| `coverImage` | image    | any          | Repo-owned. See section 6.                                                        |
| `coverAlt`   | string   | any          | Required whenever `coverImage` is set.                                            |
| `gallery`    | image[]  | any          | Repo-owned. Screenshots beyond the cover.                                         |
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
  - kind: "video"
    label: "Trailer"
    href: "https://youtube.com/watch?v=xxxxxxxxxxx"
```

Authored order is render order. `kind` selects an icon through a lookup with a
fallback, so an unrecognised or missing `kind` renders with the generic external
icon instead of failing. Playability is derived, never stored:

```ts
const playable = data.links.some((link) => link.kind === "play");
```

## 4. Why `.strict()`

A Zod object silently discards keys it does not know. Without `.strict()`, a
misspelled `genere:` or an invented `platform:` disappears with no error, and the
only symptom is a page that renders short.

```ts
schema: ({ image }) => z.object({ /* the palette */ }).strict(),
```

That single call is what makes this a palette rather than a suggestion. It moves
enforcement to the level that actually drifts in a free-form model, which is key
names, and leaves the values themselves unconstrained.

## 5. Grouping Comes From Outside the Palette

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

Two benefits over a `category:` field in frontmatter. The author picks the type
from the GitHub UI at creation time, so it cannot be misspelled, and each
category gets its own discussion template, since a template file binds to a
category slug: a `software` form simply omits the `genre` line.

Repo-written files set `category` themselves. It is the one element that is
required but not free-form, and section order lives beside `navigation`:

```ts
export const projectCategories = ["Games", "Software", "Writeups"];
```

Anything not listed renders after the listed groups.

## 6. Assets Stay Repo-Owned

`coverImage` and `gallery` use Astro's `image()` helper, which needs a file
committed under `src/assets/projects/` so the build can hash and crop it. A
discussion has nowhere to put one, so these elements are never read from
discussion frontmatter.

This has a consequence for the sync. Because it rewrites a synced file in whole,
reading assets from the discussion would delete a cover added by hand on the next
edit. The merge rule: **the discussion owns prose and metadata, the repo owns
assets.** Asset elements are carried over from the existing file, or absent if
there is none.

## 7. Parse Contract

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
   section 6.

Any failing step yields no page. The gate fails closed: a discussion that is not
positively recognised as publishable does not ship. Body content is everything
after the fence, trimmed.

## 8. Worked Examples

A game, authored in the `Games` category:

```yaml
title: "Tethered"
description: "Unreal Engine 5 action rogue-lite prototype focused on modular combat, encounter, travel, and persistence systems."
date: 2026-01-25
timeline: "September 2025 - present"
status: "Unreleased"
genre: "action rogue-lite"
stack: "Unreal Engine 5.8"
role: "Lead System Designer and Gameplay Engineer"
tags: ["Unreal Engine", "C++", "GAS", "Lyra", "Gameplay Systems"]
featured: true
draft: false
```

A desktop tool, authored in `Software`. No `genre`, no `play` link, same
palette:

```yaml
title: "Stock Backtesting"
description: "A Python and PySide6 desktop application for downloading market data, charting ETF price history, and running trading-strategy backtests."
date: 2024-05-15
timeline: "Software development course project"
status: "Archived"
stack: "Python / PySide6"
role: "Solo implementation (team design and planning)"
tags: ["Python", "PySide6", "Qt", "Desktop Tools", "Backtesting"]
links:
  - kind: "repo"
    label: "Source"
    href: "https://github.com/NickReardon/stock-backtesting"
featured: false
draft: true
```

## 9. Migration

`projectType` is removed rather than replaced. Its three members mapped to
nothing consistent: `system` covered both a UE5 game presented as systems work
and a Python desktop app, while `writeup` was the schema default and unused by
every project.

Per existing file: drop `projectType`, rename `engine` to `stack`, keep `status`
as the free text it already contained, add `genre` to the games, and fold
`externalUrl` and `externalLabel` into a `links` entry with `kind: "play"`. The
projects index stops filtering on `projectType` twice and loops over
`projectCategories` instead.

The two discussion templates under `.github/DISCUSSION_TEMPLATE/` still prefill
`projectType` and predate section 5, so they need splitting per sub-category when
the schema lands.
