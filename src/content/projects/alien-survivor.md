---
title: "Alien Survivor"
description: "A browser-playable Unity prototype with data-driven weapons, upgrades, enemy spawning, and runtime tuning hooks."
date: 2024-01-25
dateLabel: "Fall 2024 prototype"
order: 40
variant: "jam-postmortem"
tags: ["Unity", "Shooter", "Data-Driven Design", "Action"]
projectType: "game"
role: "Solo developer"
status: "On hold"
engine: "Unity"
coverImage: "/images/projects/alien-survivor.png"
coverAlt: "Alien Survivor cover art."
ogImage: "/images/projects/alien-survivor.png"
featured: false
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

The prototype was an end-to-end exercise in keeping escalation manageable. High
enemy counts, repeated weapon upgrades, and runtime UI all needed to grow from
data while the playable build remained simple enough to tune and deliver.

## What I Contributed

As the solo developer, I owned the gameplay loop, spawning, weapons, upgrades,
runtime UI, tuning hooks, and itch.io delivery. I organized the project around
small data-driven definitions so adding an enemy, weapon modifier, or upgrade
did not require another branch in a central controller.

### Enemy spawning director

The enemy spawning director manages pacing, population caps, and optional object
pooling to keep behavior predictable under higher enemy counts. Rarity-weighted
selection chooses among enemy definitions containing parameters such as speed,
size, and squad count.

Separating selection from pacing meant the encounter curve could change without
rewriting individual enemy behavior. Runtime hooks for spawn rate and movement
speed also made it possible to tune pressure while the game was running rather
than rebuilding for every adjustment. The trade-off was maintaining more
configuration data, but that data made escalation visible and editable.

### Data-driven weapons and upgrades

Weapons and upgrades use editor-defined data with both stat scaling and
functional modifiers. Effects such as homing and boundary ricochet are upgrade
behaviors rather than special cases embedded in the weapon loop. That decision
kept numeric progression and behavior-changing progression in the same authoring
workflow while allowing their application logic to remain separate.

The runtime upgrade UI reads the available definitions and current player state
instead of assuming a fixed catalog. Adding another weapon or modifier therefore
extends the choices without requiring a matching hard-coded interface layout.
This was especially useful for testing combinations because the UI represented
the same data the gameplay systems consumed.

### Delivery

I set up the Unity project for rapid iteration and HTML5 delivery on itch.io,
keeping the prototype immediately playable without an installer. Shipping the
browser build provided a concrete boundary for the experiment: systems needed
to support the current loop reliably before their scope expanded further.

## What The Work Shows

Alien Survivor shows earlier end-to-end systems prototyping: building a compact
core loop, making progression data-driven enough to extend, and getting the work
into a playable browser build. It also shows the value of separating runtime
pacing, content selection, and upgrade behavior early, even in a small solo
prototype where a single controller might initially appear faster.
