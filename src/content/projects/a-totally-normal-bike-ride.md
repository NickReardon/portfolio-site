---
title: "A Totally Normal Bike Ride"
description: "A Godot physics prototype about balancing a unicycle across telephone wires, built for a three-day game jam."
date: 2025-01-24
timeline: "Three-day game jam"
tags: ["Game Jam", "Godot", "Physics", "Prototype"]
projectType: "game"
role: "Gameplay programmer"
status: "Prototype"
engine: "Godot"
coverImage: "/images/projects/a-totally-normal-bike-ride.png"
coverAlt: "A Totally Normal Bike Ride cover art."
featured: true
externalUrl: "https://bcthunder.itch.io/a-totally-normal-bike-ride"
externalLabel: "Play on itch.io"
draft: false
---

## Overview

A Totally Normal Bike Ride is a jam prototype built around an intentionally
unstable bike-platforming premise. The project shipped with a browser build and
a Windows download, which made it easy for judges and players to try without
extra setup.

## What I Contributed

I was the primary programmer on a small team, with the priority of keeping the
prototype playable, readable, and shippable within the three-day jam window.

### Two-body physics character

- Built the two-body physics character: a wheel and a rider rigidbody joined by
  a pin joint, where locomotion is torque on the wheel and balance is lean
  torque on the rider, with separate ground and air tuning.
- Implemented a charge-and-release variable jump: holding compresses the rider
  toward the wheel and release applies an impulse scaled by hold time, with
  ground state read from wheel contact count and a rolling average-speed buffer
  for camera and feedback.

<!-- MEDIA[gif]: balancing run across telephone wires + charge-and-release jump -->
<!-- CODE[gdscript]: pin-joint locomotion - wheel torque + rider lean balance -->

### Telephone-wire authoring tool

- Built the telephone-wire tool: a segmented physics rope strung between two
  static anchors, with segments auto-spaced and auto-sized to the span, chained
  by joints anchor to anchor, and rendered each frame as a smooth baked Curve2D
  on a Line2D. Authoring a new wire is just placing two endpoints.

<!-- CODE[gdscript]: power-line tool - generate segmented rope between two anchors -->
<!-- MEDIA[image]: editor view of placing two endpoints to author a wire -->

### Day-night cycle

- Built a day-night cycle: a normalized day timer drives a custom canvas-item
  shader that blends a four-phase vertical sky gradient (night, dawn, day, dusk)
  with smoothstep, alongside scripted celestials - a sun that arcs across the
  sky with eyes that track the player, plus a fading and scaling moon, fading
  stars, and tinted clouds.

<!-- MEDIA[gif]: full day-night cycle timelapse -->

### Integration

- Contributed debugging and integration so the final build had a clear input
  model and could be shared from itch.io with both a browser build and a Windows
  download.

## What The Work Shows

The useful lesson here was handling a deliberately unstable mechanic without
letting the implementation become unclear to work with. The project needed fast
iteration, direct feedback, and systems small enough to ship in three days.
