---
title: "Alien Survivor"
description: "A browser-playable Unity prototype with data-driven weapons, upgrades, enemy spawning, and runtime tuning hooks."
date: 2024-01-25
timeline: "Fall 2024 prototype"
tags: ["Unity", "Shooter", "Data-Driven Design", "Action"]
projectType: "game"
role: "Solo developer"
status: "On hold"
engine: "Unity"
coverImage: "/images/projects/alien-survivor.png"
coverAlt: "Alien Survivor cover art."
featured: true
externalUrl: "https://thingofnightmare.itch.io/alien-survivor"
externalLabel: "Play on itch.io"
draft: false
---

## Overview

Alien Survivor is a solo Unity prototype for a top-down sci-fi action game
inspired by survivor-style pressure, simple readability, and quick escalation.
Built September to December 2024, the build is available on itch.io as a
browser-playable prototype. The focus was a compact core loop with progression
data-driven enough to extend without rewriting systems.

<!-- MEDIA[gif]: gameplay - escalating enemy waves with weapons auto-firing and upgrades stacking -->

## What I Contributed

This was a solo project, so my work covered the full prototype loop from initial
implementation through web delivery.

### Enemy spawning director

- Built an enemy spawning director with spawn pacing, cap management, and
  optional object pooling to hold performance under high enemy counts.
- Implemented rarity-weighted enemy selection with per-type parameters such as
  speed, size, and squad count, plus runtime tuning hooks for spawn rate and
  movement speed.

<!-- CODE[csharp]: rarity-weighted enemy selection + spawn pacing loop -->

### Data-driven weapons and upgrades

- Built a fully data-driven weapon and upgrade framework with stat scaling and
  functional modifiers, such as homing and boundary ricochet, authored as
  editor-defined upgrade definitions.
- Created dynamic runtime UI that adapts to the available upgrades and current
  player state, scaling cleanly as new weapons and modifiers are added.

<!-- CODE[csharp]: ScriptableObject upgrade definition + functional modifier application -->
<!-- MEDIA[image]: upgrade-selection UI adapting to available upgrades -->

### Delivery

- Set up the Unity project for rapid iteration and HTML5 delivery on itch.io.

## What The Work Shows

Alien Survivor shows earlier end-to-end systems prototyping: building a compact
core loop, making progression data-driven enough to extend, and getting the work
into a playable browser build.
