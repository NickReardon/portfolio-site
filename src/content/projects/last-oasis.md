---
title: "Last Oasis"
description: "A browser-playable Godot platformer with a state-machine character controller, traversal abilities, and jam-focused authoring tools."
date: 2025-01-25
timeline: "2025 game jam"
tags: ["Game Jam", "Godot", "Platformer", "Gameplay Tools"]
projectType: "game"
role: "Primary gameplay and tooling programmer"
status: "Released"
engine: "Godot"
coverImage: "https://img.itch.zone/aW1nLzIxNTk3MzE3LnBuZw==/508x254%23mb/%2FAPpGj.png"
coverAlt: "Last Oasis cover art from the itch.io project page."
featured: true
externalUrl: "https://thingofnightmare.itch.io/last-oasis"
externalLabel: "Play on itch.io"
draft: false
---

## Overview

Last Oasis is a jam platformer about Palis, a water spirit trying to find water
and keep survivors alive in a desert. The project shipped as a browser-playable
submission to the thatgamecompany x COREBLAZER Game Jam 2025.

## What I Contributed

My main contribution was the player controller, traversal feel, ability
implementation, and small authoring tools that helped the team build and
iterate faster under jam constraints.

- Built a nested state-machine character controller covering ground, air,
  wall-slide, slam, destroy, and death behavior.
- Added traversal feel details including coyote time, variable-height jumping,
  double jump, wall jump, input buffering, spike grace frames, and slippery-tile
  handling from tile custom data.
- Built an aimable launch ability with aim, fire, and cancel states, a live
  guide line, and on-screen control prompts.
- Built a tile-to-scene authoring tool that swaps placed tiles for scene
  instances while preserving flip, transpose, and rotation data.
- Implemented chain-reaction destruction where breaking one target can expand
  outward through nearby destructibles with per-depth delay.
- Supported the playable browser build by keeping implementation choices scoped
  around what the team could finish and debug during the jam.

## What The Work Shows

This project shows gameplay programming under a tight production cycle: making a
character feel responsive, building tools only where they remove real authoring
friction, and keeping implementation decisions small enough for a short jam team
to debug and ship.
