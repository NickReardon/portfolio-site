---
title: "Down Bad: Searching for Love & Blood"
description: "A Godot narrative game built as a simulated phone OS, with a state-machine dialogue runtime, signal-driven services, and real-time audio, shipped to web and Windows in four days."
date: 2026-07-20
dateLabel: "GMTK Game Jam 2026"
order: 15
variant: "jam-postmortem"
tags: ["Game Jam", "Godot", "Dialogue Systems", "UI Programming", "Audio"]
projectType: "game"
role: "Sole programmer and lead designer"
status: "Released"
engine: "Godot 4.7"
featured: false
mediaPending: true
externalUrl: "https://thingofnightmare.itch.io/down-bad-searching-for-love-blood"
externalLabel: "Play on itch.io"
draft: true
---

## Overview

Down Bad is a narrative game presented as a simulated smartphone operating
system: a home screen, launchable apps, and a messaging app where the story
plays out as live conversations. It shipped to browser and Windows during GMTK
Game Jam 2026, a four-day jam.

I was the only programmer on a five-person team, and I led design. The rest of
the team covered art, music composition, and narrative writing. The interesting
constraint was that the phone metaphor made almost everything a UI problem:
there is no character controller and no physics, so the entire experience rests
on conversation pacing, presentation, and how convincingly the interface
behaves.

## What I Contributed

I was responsible for all of the engine work: the app shell, the dialogue
runtime, the dating and matchmaking logic, the messaging interface, and the
audio integration. I structured the project around a small number of decoupled
services so that writing, tuning, and interface work could proceed without
blocking on one another during a four-day window.

A four-day budget makes "what should I not write" a real design question. I
leaned on existing solutions for dialogue and audio and spent the hours on the
parts that were specific to this game.

### Conversation runtime

Dialogue runs through an explicit state machine with `IDLE`,
`WAITING_FOR_ADVANCE`, `WAITING_FOR_RESPONSE`, `WAITING_FOR_NEXT`, and terminal
completed and blocked states. A conversation system above it manages several
concurrent conversations, sequences sessions, and exposes a signal surface the
interface subscribes to rather than polls.

Making the states explicit cost more setup than driving dialogue from a single
update path, but it made pacing bugs legible: a stuck conversation is always
observably in one state, which matters when writers are adding content faster
than a programmer can read it.

### Building on an existing dialogue framework

I used the `dialogue_manager` addon as the scripting backend and layered the
runtime, flow control, and pacing logic on top of it, rather than modifying the
addon or replacing it. The writers kept a familiar authoring format while the
timing, branching, and presentation behavior stayed mine to tune. Treating a
third-party framework as a substrate rather than something to fork is the same
approach I take with Lyra in Unreal.

### Messaging interface

The messaging page is the centerpiece: dynamic bubble instantiation for
incoming, outgoing, and image messages, typing indicators, timed delivery, and
branching response trays. Message-pop sounds are synthesized at runtime as
`AudioStreamWAV` data rather than shipped as assets, which kept the audio
responsive to message type without adding files during a jam.

### Data-driven characters

Characters, profiles, and their conversation hooks are `Resource` catalogs, so
adding or cutting a romance path was a content edit. This mattered more than
usual on a four-day timeline, because the narrative scope moved repeatedly and
the systems needed to absorb that without code changes.

### Audio, and what I chose not to write

The in-game music player wanted a spectrum visualizer. Rather than write
frequency-analysis display code during a four-day jam, I adapted an existing
implementation to the project's audio buses and visual style, and wired it into
the music player alongside playlist handling, crossfading, and scheduled track
transitions.

That was the same call I made on dialogue. Both problems had mature existing
solutions, and neither was what made this game distinct. Adapting them cost
integration and debugging time instead of authoring time, which was the cheaper
of the two on a four-day clock.

### Shipping and iteration

I set up multi-platform export and versioning, using AI tooling to stand up the
build scripts and a regression suite around dialogue flow, notifications, and
endings. After the jam I patched web-specific problems that did not appear in
the Windows build, including restoring the spectrum visualizer and correcting
atlas-texture profile images.

## What The Work Shows

This project shows systems work in a domain with no gameplay physics to lean
on, where the engineering is all state, timing, and presentation. It also shows
how I spend a fixed budget: adopt the mature solution where one exists, extend
it at its seams rather than forking it, and put original work into the systems
that are actually specific to the game. Shipping to two platforms inside four
days, then fixing what only broke on one of them, is the part I would point at
first.
