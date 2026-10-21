---
# Every element of the palette, filled in for one project. Lives in docs/ so it
# is not globbed into the projects collection: copy it, do not link to it.
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

# Authored order is render order. `kind` picks an icon through a lookup with a
# fallback, so an unknown kind renders generically rather than failing. A game
# with no browser build simply has no `play` entry: playability is derived from
# this list, never stored as a flag.
links:
  - kind: "video"
    label: "Systems breakdown"
    href: "https://youtube.com/watch?v=xxxxxxxxxxx"
  - kind: "repo"
    label: "Source"
    href: "https://github.com/NickReardon/tethered"

# Repo-owned assets. Astro's image() helper needs these committed under
# src/assets/projects/ so the build can hash and crop them, which is why a sync
# never reads them from a discussion and never overwrites them.
coverImage: "../../assets/projects/tethered-placeholder.svg"
coverAlt: "Diagram showing Tethered gameplay system flow from input to gameplay tags, combos, attacks, and feedback."
gallery:
  - src: "../../assets/projects/tethered-combat.png"
    alt: "Combo window editor showing three chained attacks with cancel windows."

# Presentation flags.
featured: true
draft: false
---

## Overview

Tethered is a single-player isometric action rogue-lite built on Unreal Engine 5
and the Lyra framework. I lead the gameplay architecture, with a focus on
modular combat, encounter flow, room-to-room travel, and persistent run state.

This file exists to show the palette in use. Compare it against a desktop tool,
which fills the same core, omits `genre` and the `play` link entirely, and reads
`stack: "Python / PySide6"` without any of that becoming a different schema.

## Systems

Combat is driven by the Gameplay Ability System rather than bespoke attack code.
Abilities declare their own tags, costs, and cancel windows as data assets, so a
designer adds a combo by authoring an asset instead of compiling a new class.

Encounter and travel state persist through a save subsystem keyed on the run
rather than the level, which keeps room transitions from reloading actor state
that the run already owns.

## Key Takeaways

- Driving combat timing from tag windows rather than animation notifies kept the
  authoring surface in data and out of Blueprint graphs.
- Keying persistence on the run rather than the level removed an entire class of
  transition bug, at the cost of a save payload that grows with run length.
