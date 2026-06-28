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
coverImage: "https://img.itch.zone/aW1nLzIwNTAxNjA1LnBuZw==/508x254%23mb/1GI9dO.png"
coverAlt: "A Totally Normal Bike Ride cover art from the itch.io project page."
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

I contributed gameplay programming work on a small team, with the priority of
keeping the prototype playable, readable, and shippable within the jam window.

- Built the two-body physics character: a wheel and rider rigidbody joined by a
  pin joint, with locomotion driven by wheel torque and balance driven by rider
  lean torque.
- Implemented the charge-and-release jump, using hold time to compress the rider
  and apply a scaled release impulse.
- Built the telephone-wire tool: two endpoints generate a segmented physics rope
  with auto-sized segments, chained joints, and a smooth rendered line.
- Built a day-night cycle driven by a normalized timer, shader gradient, sun,
  moon, stars, and tinted cloud behavior.
- Contributed debugging and integration so the final build had a clear input
  model and could be shared from itch.io.

## What The Work Shows

The useful lesson here was handling a deliberately unstable mechanic without
letting the implementation become unclear to work with. The project needed fast
iteration, direct feedback, and systems small enough to ship in three days.
