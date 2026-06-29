---
title: "Tethered"
description: "Unreal Engine 5 action rogue-lite prototype focused on modular combat, encounter, travel, and persistence systems."
date: 2026-01-25
timeline: "September 2025 - present"
tags: ["Unreal Engine", "C++", "GAS", "Lyra", "Gameplay Systems"]
projectType: "system"
role: "Lead System Designer and Gameplay Engineer"
status: "In development"
engine: "Unreal Engine 5"
coverImage: "/images/projects/tethered-placeholder.svg"
coverAlt: "Diagram showing Tethered gameplay system flow from input to gameplay tags, combos, attacks, and feedback."
featured: true
draft: false
---

## Overview

Tethered is a single-player isometric action rogue-lite prototype built on Unreal
Engine 5 and the Lyra framework. I lead the system design and gameplay
architecture for the project, with a focus on modular combat, encounter flow,
room-to-room travel, and persistent run state.

The project is structured around a production-style question: how can a small
team add weapons, enemies, rooms, upgrades, and encounter behaviors mostly by
authoring data instead of rewriting systems code?

## System Focus

Tethered uses three Ability System Component owners for different layers of
gameplay state: the player, enemies, and the world. Player state owns player
abilities, attributes, and equipment. Enemy characters own per-enemy abilities
and health. The Lyra GameState owns world-level state, event broadcasting,
encounter orchestration, and spawn modifiers.

That world-level ASC acts as a shared event bus. Encounter triggers, spawn
modifiers, room gates, and run-state systems communicate through gameplay events
and attributes instead of direct component references. The goal is to keep room
logic, enemy definitions, and run modifiers independent while still allowing them
to respond to the same live world state.

Current systems include:

- A seamless-travel subsystem that snapshots run state before travel and
  reconstructs player and world state after the destination experience loads.
- A pluggable save backend behind a save-manager interface, keeping disk I/O
  separate from live gameplay state.
- Data-driven encounter definitions, wave rules, and room-completion listeners.
- Spawn modifiers that evaluate world state and apply Gameplay Effects to
  spawned actors at spawn time.
- A combo and attack-routing system that resolves attacks from owned Gameplay
  Tags at runtime so upgrades can change behavior without branching combat code.

## Encounter Architecture

Encounters are initiated by trigger volumes that send encounter definitions to
the world layer as gameplay events. The encounter ability reads those
definitions, spawns waves, and advances through modular completion rules.

Room completion uses a listener interface: doors, exit portals, and loot
spawners register as listeners when the encounter starts, then respond when the
encounter completes. Adding a new room-clear behavior means implementing the
listener contract and registering it, not changing the encounter system itself.

## Testing and Integration

I test the systems through manual in-editor passes, PIE smoke tests, and
cross-travel integration checks. A GameInstance-based test relay stores expected
state before travel and asserts after the destination experience loads, which
lets the project verify state survival across GameState teardown and
reconstruction.

## Authoring Mindset

Most of the architecture is built around designer-facing authoring: data assets
for encounters and waves, Gameplay Tags for combat routing, Game Feature Plugin
isolation for project-specific systems, and interfaces where direct coupling
would make iteration harder.

## What I Am Learning

Tethered is where I practice larger Unreal architecture tradeoffs: deciding
where state should live, how much flexibility a system should expose, how to
avoid fragile load-order assumptions, and how to keep content workflows readable
as the project grows.
