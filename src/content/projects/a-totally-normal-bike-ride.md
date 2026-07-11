---
title: "A Totally Normal Bike Ride"
description: "A Godot physics prototype about balancing a unicycle across telephone wires, built for a three-day game jam."
date: 2025-01-24
dateLabel: "Three-day game jam"
order: 30
variant: "jam-postmortem"
tags: ["Game Jam", "Godot", "Physics", "Prototype"]
projectType: "game"
role: "Primary programmer"
status: "Prototype"
engine: "Godot"
coverImage: "/images/projects/a-totally-normal-bike-ride.png"
coverAlt: "A Totally Normal Bike Ride cover art."
ogImage: "/images/projects/a-totally-normal-bike-ride.png"
mediaPending: true
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

The three-day constraint meant the central physics joke had to become playable
quickly, then remain predictable enough for level design. The implementation
therefore separated locomotion, balance, jumping, wire authoring, and visual
time-of-day systems instead of concentrating every behavior in the player script.

## What I Contributed

As the primary programmer, I owned the physics character, wire-authoring
utilities, and environmental visual pipeline. I also handled debugging and
integration needed to turn those systems into a stable browser and Windows
build within the jam window.

### Two-body physics character

The character is a wheel and rider rigidbody joined by a pin joint. Locomotion
applies torque to the wheel while balance applies lean torque to the rider, with
separate tuning for ground and air control. Using two physical bodies preserved
the deliberately unstable premise; the design problem was providing enough
control to make recovery feel earned rather than random.

The variable jump uses a charge-and-release model. Holding the input compresses
the rider toward the wheel, and releasing applies an impulse scaled by hold
time. Ground state comes from the wheel's contact count, while a rolling
average-speed buffer drives camera and feedback decisions without reacting to
every single-frame physics fluctuation.

### Telephone-wire authoring tool

The telephone-wire tool generates a segmented physics rope between two static
anchors. It automatically spaces and sizes segments to the span, chains them
with joints, and renders their current positions as a smooth baked `Curve2D` on
a `Line2D`. Authoring a wire is reduced to placing two endpoints.

This traded some editor-tool implementation time for much faster level
iteration. Designers did not need to place, size, and connect individual rope
segments, and the generated physics structure stayed consistent across every
wire.

### Day-night cycle

A normalized day timer drives a canvas-item shader that blends a four-phase
vertical sky gradient—night, dawn, day, and dusk—with smoothstep transitions.
Scripted celestials use the same time value: the sun arcs across the sky with
eyes that track the player, while the moon scales and fades alongside stars and
tinted clouds. Sharing one normalized input kept the visual layers synchronized
without coupling their individual presentation code.

### Integration

I contributed debugging and integration so the final build had a clear input
model and could be shared through itch.io as both a browser build and a Windows
download. The delivery work also exposed physics behavior that felt acceptable
in isolation but needed tighter bounds when played as a complete level.

## What The Work Shows

The useful lesson here was handling a deliberately unstable mechanic without
letting the implementation become unclear to work with. The project needed fast
iteration, direct feedback, and systems small enough to ship in three days.
Separating the physical character from wire generation and environmental
presentation kept the core joke intact while giving the team practical places
to tune stability and polish.
