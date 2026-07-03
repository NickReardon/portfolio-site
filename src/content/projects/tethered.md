---
title: "Tethered"
description: "Unreal Engine 5 action rogue-lite prototype focused on modular combat, encounter, travel, and persistence systems."
date: 2026-01-25
timeline: "September 2025 - present"
tags: ["Unreal Engine", "C++", "GAS", "Lyra", "Gameplay Systems"]
projectType: "system"
role: "Lead System Designer and Gameplay Engineer"
status: "In development"
engine: "Unreal Engine 5.8"
coverImage: "/images/projects/tethered-placeholder.svg"
coverAlt: "Diagram showing Tethered gameplay system flow from input to gameplay tags, combos, attacks, and feedback."
featured: true
draft: false
---

## Overview

Tethered is a single-player isometric action rogue-lite with fast-paced melee
combat, built on Unreal Engine 5 and the Lyra framework. I lead the system
design and gameplay architecture, with a focus on modular combat, encounter
flow, room-to-room travel, and persistent run state.

It is a functional prototype built to demonstrate how core gameplay systems sit
on a modular, data-driven architecture that can expand into a full game. The
thesis behind the project: a small team can use Lyra-aligned structure to keep
systems decoupled and add content by authoring data rather than writing new
systems code. Developed in collaboration with a student team at CSU Fullerton,
the project serves as a technical demonstration of Lyra-aligned systems in a
high-iteration environment.

<!-- MEDIA[video]: combat + encounter vertical-slice reel (hub -> arena -> wave clear -> upgrade). This is the high-leverage one to record before the next studio touchpoint. -->

## Team

I lead system design and gameplay architecture (combat, encounter, travel,
persistence). The wider team covers sound (Daniel DiPietrantonio), AI (Kathy
Nguyen), and physics (Sinan Abdul-Hafiz), with Lidia Morrison as project
advisor.

## Core Gameplay Loop

Hub world, loadout selection, run initiation, seamless travel into arena rooms,
wave-based encounters, room-clear gating, upgrade acquisition, and return. World
state carries across rooms and across runs.

<!-- MEDIA[gif]: seamless travel - hub to arena with no visible loading seam -->

## Architecture

Tethered uses three Ability System Component (ASC) owners for different layers
of gameplay state:

- **PlayerState** hosts player abilities, attributes, and equipment.
- **Enemy Character** hosts per-enemy abilities and health.
- **Lyra GameState** hosts world-level state, event broadcasting, encounter
  orchestration, and spawn modifiers.

All systems gate on Lyra experience initialization before touching any ASC,
which prevents null-reference failures during level load.

### World ASC as a shared event bus

The world-level ASC broadcasts and coordinates system-level events and state
changes, keeping room triggers, encounter orchestrators, and spawn modifiers
decoupled while still communicating at runtime. A dedicated attribute set holds
run-level scalars: difficulty multiplier, curse and blessing stacks, threat
level, and floor number. World state is reconstructed after every room
transition so enemies scale and gain behaviors from active modifiers without
changes to their base definitions.

<!-- CODE[cpp]: world ASC event broadcast / encounter event handler. Drop a verified snippet from the live 5.8 codebase here - confirm exact class names before pasting (see positioning notes). -->

### Game Feature Plugin isolation

Game-specific code lives primarily in a single Game Feature Plugin that extends
Lyra through GameFeatureAction injection points and subclasses core engine and
Lyra classes. This keeps project code separate from Lyra base systems so new
features do not modify existing ones.

### Seamless travel subsystem

A GameInstance-owned travel subsystem owns level transitions and implements the
engine's loading-process interface, so the engine polls it each frame to decide
whether to show a loading screen. It snapshots run state before travel, triggers
server travel, waits for the destination experience to load, then reconstructs
player and world state before clearing the loading screen. A per-world bridge
helper hooks the new world's Lyra experience-loaded event back into the
persistent travel subsystem.

### Persistence and pluggable save backend

A GameInstance save-manager subsystem holds active run state in memory and
delegates disk I/O to a pluggable save-backend interface. The backend can be
swapped, for example for a future server-backed implementation, without changes
to any other system. Persistence acts as a single source of truth between the
live ASC and the save file, using Unreal's native SaveGame system for unlocked
weapons, character stats, and permanent upgrades, saving at checkpoints such as
room completion and hub return, with validation to handle missing or malformed
data gracefully.

### Encounter orchestration

Encounters are driven by an encounter Gameplay Ability on the world ASC. Trigger
volumes send encounter definitions to the GameState as gameplay events, which
the encounter ability reads to begin spawning waves. Wave-advance conditions are
modular rule abilities composed per wave without modifying the encounter
ability, so new encounter types are authored entirely through data.

<!-- CODE[cpp]: wave-advance rule ability / encounter definition data asset. Placeholder for a verified snippet. -->

### Spawn modifiers

A persistent spawn-modifier ability listens for spawn events and evaluates
modifier rules against current world state, applying matching Gameplay Effects
to spawned actor ASCs at spawn time. New modifier types are data entries, not
code changes.

### Room completion via listener interface

On encounter initiation, the trigger volume passes a list of room-completion
listener references to the encounter ability as initiation data. On completion,
the ability notifies each registered listener directly. Doors, exit portals, and
loot spawners respond to room clear with no coupling to the encounter system
beyond the interface contract. New behaviors are added by implementing the
interface and registering at the trigger volume.

### Designer-facing combo and attack routing

An input-tag routing map drives combat: each combo step evaluates owned Gameplay
Tags at runtime to resolve AI and player-executed attacks, so upgrades modify
movesets without branching logic. The combo system expands during runtime
through upgrades.

<!-- MEDIA[gif]: combo routing - same input producing different attacks after an upgrade is applied -->

### AI

Enemies are Behavior Tree driven, with reusable behavior subtrees for shared
actions (chase, select attack, reposition) so enemy profiles compose from shared
logic without monolithic per-enemy code. EQS handles basic tactical decisions,
and perception range triggers the transition from idle into combat.

### Chaos destruction

Environmental walls and pillars are converted into Geometry Collections that
simulate physics and respond to designer-defined events, with per-object mass
and break thresholds, integrated with VFX for readable destruction feedback.

### Engine migration (5.6 to 5.8)

I carried the GAS-based Lyra project up two major engine versions, 5.6 to 5.7 to
5.8, resolving API deprecations, build and registration breakage, and Lyra
base-class changes at each hop. The project builds and opens cleanly on 5.8.

### Server-authoritative design

Gameplay is built using server-authoritative GAS flows rather than client-local
shortcuts. This design choice keeps authority boundaries explicit and better
positions the architecture for future cooperative multiplayer work without
requiring a core systems rewrite.

## Testing and Integration

I test through manual in-editor passes, PIE smoke tests, and cross-travel
integration checks. A GameInstance-based test-relay pattern writes expectations
before travel and asserts after the destination experience loads. Per-system
tests cover travel round trips, persistence reconstruction, weapon and ability
survival across travel, run-reset of mid-run upgrades, encounter activation and
wave advance, double-encounter blocking, spawn-modifier application gating on
world tags, and full save-to-disk and relaunch restoration.

<!-- CODE[cpp]: GameInstance test-relay - write-expectation-before-travel / assert-after-load. Placeholder for a verified snippet. -->

## Narrative and World

A Control-inspired brutalist megacorp tower, mechs versus aliens, with themes of
identity and consciousness - a project with deep investment in both narrative
and technical systems.

## Key Takeaways

Through developing _Tethered_, the primary focus has been navigating architectural tradeoffs:

- **Decoupled State Management**: Establishing clear ownership between local player state, transient world state, and persistent save data.
- **Workflow Efficiency**: Creating extensible data-driven frameworks (encounters, combos, spawn rules) so that new content can be added and balanced without compiler overhead.
- **Robust Lifecycles**: Handling complex Unreal Engine lifecycles, particularly managing state reconstruction during seamless travel transitions.
