---
# Every frontmatter element of the palette, filled in for one project. Lives in
# docs/ so it is not globbed into the projects collection: copy it, do not link
# to it.
#
# Frontmatter carries what describes the whole project. Anything whose position
# in the page matters is a body element instead, further down.
#
# Required core.
title: "Tethered"
description: "Unreal Engine 5 action rogue-lite prototype focused on modular combat, encounter, travel, and persistence systems."
date: 2026-01-25

# Grouping. The one element that is required but not free-form, because the
# projects index renders a subsection per category. A discussion-authored post
# gets this stamped from its sub-category instead of writing it here.
category: "Games"

# Descriptor elements, joined in this order and skipped when absent:
#   "Unreleased Unreal Engine 5.8 action rogue-lite"
status: "Unreleased"
stack: "Unreal Engine 5.8"
genre: "action rogue-lite"

# Credit and dates. `timeline` replaces the formatted `date` wherever a project
# shows one, for work that has no single ship date.
role: "Lead System Designer and Gameplay Engineer"
timeline: "September 2025 - present"

# Descriptive, many per project, never a grouping key.
tags: ["Unreal Engine", "C++", "GAS", "Lyra", "Gameplay Systems"]

# The persistent link row in the page header, which is not the same thing as a
# video embedded partway down the body. This project has no `play` entry at all:
# playability is derived from this list, so a game with no browser build simply
# does not claim one.
links:
  - kind: "repo"
    label: "Source"
    href: "https://github.com/NickReardon/tethered"

# The cover is repo-owned: Astro's image() helper needs it committed under
# src/assets/projects/ so the build can hash and crop it, which is why a sync
# never reads it from a discussion and never overwrites it.
coverImage: "../../assets/projects/tethered-placeholder.svg"
coverAlt: "Diagram showing Tethered gameplay system flow from input to gameplay tags, combos, attacks, and feedback."

# Presentation flags.
featured: true
draft: false
---

## Overview

Tethered is a single-player isometric action rogue-lite built on Unreal Engine 5
and the Lyra framework. I lead the gameplay architecture, with a focus on
modular combat, encounter flow, room-to-room travel, and persistent run state.

A plain Markdown image needs no element at all. Astro processes relative paths
in the body, so this is hashed, converted and given a `srcset` exactly like the
cover:

![Ability activation path from input through gameplay tags to a combo window.](../../assets/projects/tethered-placeholder.svg)

## Systems

Combat is driven by the Gameplay Ability System rather than bespoke attack code.
Abilities declare their own tags, costs, and cancel windows as data assets, so a
designer adds a combo by authoring an asset instead of compiling a new class.

A grid of images is a container directive. It wraps real Markdown rather than
replacing it, so each image inside is still processed by the build and a typo in
a filename still fails it:

:::gallery
![Combo window editor showing three chained attacks with cancel windows.](../../assets/projects/tethered-placeholder.svg)
![Room transition graph with persistent run state carried across loads.](../../assets/projects/tethered-placeholder.svg)
:::

Encounter and travel state persist through a save subsystem keyed on the run
rather than the level, which keeps room transitions from reloading actor state
that the run already owns.

A leaf directive carries attributes and no content, for an element that is pure
data placed at a position:

::video{href="https://youtube.com/watch?v=xxxxxxxxxxx" label="Travel and persistence breakdown"}

## Authoring Notes

Callouts are the third directive shape, for an aside that should not read as
body prose:

:::note
Directive names are a closed registry in `src/site.config.ts`. An unknown name
fails the build rather than rendering as empty markup, which is the same bargain
`.strict()` makes for frontmatter keys.
:::

Everything above survives a round trip through a GitHub discussion unchanged,
because it is all plain Markdown text. A discussion renders `:::gallery` as a
literal line and still shows the two images beneath it. That degradation is the
reason these are directives and not fenced code blocks: a fence would opt its
contents out of Markdown entirely, taking the image processing with it.

## Key Takeaways

- Driving combat timing from tag windows rather than animation notifies kept the
  authoring surface in data and out of Blueprint graphs.
- Keying persistence on the run rather than the level removed an entire class of
  transition bug, at the cost of a save payload that grows with run length.
