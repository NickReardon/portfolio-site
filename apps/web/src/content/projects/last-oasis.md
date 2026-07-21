---
title: "Last Oasis"
description: "A browser-playable Godot platformer with a state-machine character controller, traversal abilities, and jam-focused authoring tools."
date: 2025-01-25
dateLabel: "2025 game jam"
order: 20
variant: "jam-postmortem"
tags: ["Game Jam", "Godot", "Platformer", "Gameplay Tools"]
projectType: "game"
role: "Primary gameplay and tooling programmer"
status: "Released"
engine: "Godot"
coverImage: "/images/projects/last-oasis.png"
coverAlt: "Last Oasis cover art."
ogImage: "/images/projects/last-oasis.png"
mediaPending: true
featured: true
externalUrl: "https://thingofnightmare.itch.io/last-oasis"
externalLabel: "Play on itch.io"
draft: false
---

## Overview

Last Oasis is a jam platformer about Palis, a water spirit trying to find water
and keep survivors alive in a desert. The project shipped as a browser-playable
submission to the thatgamecompany x COREBLAZER Game Jam 2025.

The short production window made responsiveness and authoring speed equally
important. The character needed enough movement depth to carry the experience,
while the design team needed tools that could turn level ideas into playable
content without repeated programmer intervention.

## What I Contributed

As the primary gameplay and tooling programmer, I owned the core character
controller, traversal feel, special abilities, and the authoring tools used by
the design team. I concentrated the implementation around a small number of
reusable systems so movement changes and level-authoring changes could be tested
independently during the jam.

### Character controller

The controller uses a nested state machine covering ground, air, wall-slide,
slam, destroy, and death states. Keeping transitions explicit made it possible
to tune one movement mode without burying unrelated behavior in a single update
function. The trade-off was more state-transition code, but it made movement
bugs easier to isolate under jam pressure.

Traversal tuning includes coyote time, variable-height jumping, double jump,
wall jump with diminishing returns and input buffering, spike grace frames, and
slippery-tile handling read from tile custom data. These details were small in
isolation but collectively made the platforming more forgiving and readable.

### Chain-reaction destructibles

The destructible system begins with a facing raycast, then uses an expanding
overlap query to break neighboring objects outward with a delay per depth. This
kept the interaction deterministic at the point of impact while still producing
a readable spreading reaction. Separating the initial hit from propagation also
made the effect tunable without changing the player's input behavior.

### Launch ability

I built the aimable launch ability as a separate component with aim, fire, and
cancel states, a live guide line, and on-screen control prompts. Treating it as
an independent component prevented an occasional ability from complicating the
core locomotion state machine and kept its input and presentation logic together.

### Authoring and world tools

An editor-time `@tool` TileMapLayer swaps placed tiles for scene instances keyed
by tile custom data while preserving flip, transpose, and rotation. The same
workflow drives hazards, destructibles, and dissolving platforms. Designers can
lay out the level with familiar tile tools, while runtime objects still receive
their own scene behavior.

I also built an input-icon autoload that maps live InputMap bindings to on-screen
key and mouse icons, including exported-build `.remap` handling. Presentation
work included velocity-driven squash and stretch, skew, momentum-aware sprite
flipping, dynamic lighting, depth-based cave darkening, and shader-driven
tilemap effects. These systems were deliberately small and data-facing so they
could improve polish without creating new integration bottlenecks.

## What The Work Shows

This project shows gameplay programming under a tight production cycle: making a
character feel responsive, building tools only where they remove real authoring
friction, and keeping implementation decisions small enough for a short jam team
to debug and ship. The state-machine and editor-tool decisions both traded a
little setup time for clearer iteration during the part of development when the
team had the least time to absorb regressions.
