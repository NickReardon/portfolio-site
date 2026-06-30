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
coverImage: "/images/projects/last-oasis.png"
coverAlt: "Last Oasis cover art."
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

On a shared team repository, my work was the player controller, traversal feel,
the launch ability, and small authoring tools that helped the team build and
iterate faster under jam constraints. (The repo lives under a teammate's
account; my contribution is the player controller and player scene plus the
world and tooling systems below.)

### Character controller

- Built a nested state-machine character controller covering ground, air,
  wall-slide, slam, destroy, and death states.
- Added traversal feel details: coyote time, variable-height jumping, double
  jump, wall jump with diminishing returns and input buffering, spike grace
  frames, and slippery-tile handling read from tile custom data.

<!-- MEDIA[gif]: traversal showcase - wall jump, variable jump, slippery tiles, coyote time -->
<!-- CODE[gdscript]: a state from the nested state machine (e.g. wall-slide enter/exit + transition rules) -->

### Chain-reaction destructibles

- Built a chain-reaction destructible system: a facing raycast breaks a target,
  then an expanding overlap query breaks neighbors outward with per-depth delay.

<!-- MEDIA[gif]: chain-reaction destruction propagating outward -->

### Launch ability

- Built an aimable launch ability as a separate component with aim, fire, and
  cancel states, a live guide line, and on-screen control prompts.

### Authoring and world tools

- Built an editor-time tile-to-scene tool (a `@tool` TileMapLayer) that swaps
  placed tiles for scene instances keyed by tile custom data while preserving
  each tile's flip, transpose, and rotation. It drives hazards, destructibles,
  and dissolving platforms.
- Built an input-icon autoload mapping live InputMap bindings to on-screen key
  and mouse icons, with exported-build `.remap` handling.
- Built velocity-driven squash and stretch with skew and momentum-aware sprite
  flipping, plus world and environment systems: dynamic lighting, depth-based
  cave darkening, and shader-driven tilemap effects.

<!-- CODE[gdscript]: the @tool tile-to-scene swap preserving flip/transpose/rotation -->

## What The Work Shows

This project shows gameplay programming under a tight production cycle: making a
character feel responsive, building tools only where they remove real authoring
friction, and keeping implementation decisions small enough for a short jam team
to debug and ship.
