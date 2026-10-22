---
title: "Renderer: building an Odin editor around plain data"
description: "An Odin 3D editor combining hot reload, a generated inspector, undoable scene editing, and GPU-driven render scaling."
date: "2026-10-22"
status: "In development"
stack: "Odin / SDL3 / wgpu"
role: "Engine and editor programming"
timeline: "October 2026"
tags: ["Odin", "Graphics", "Editor Tools", "Data-Oriented Design"]
links:
  [
    {
      "kind": "repo",
      "label": "Source on GitHub",
      "href": "https://github.com/NickReardon/renderer",
    },
    {
      "kind": "docs",
      "label": "Design decisions",
      "href": "https://github.com/NickReardon/renderer/blob/main/docs/DESIGN.md",
    },
  ]
featured: false
draft: false
category: "Software"
discussion: 61
---

## Overview

Renderer is a 3D editor and modeler project growing toward a small game engine. It uses Odin, SDL3, and wgpu, with an emphasis on keeping scene data, rendering, and editor interactions understandable as the project expands.

The current editor creates primitive objects, supports selection and transform gizmos, and exposes editable properties in a generated Inspector. The interesting work is how those features fit together: scene state survives compatible code reloads, edits share one undo system, and the viewport can adjust its render resolution from measured GPU time.

## Hot reload needs more than a memory size check

The application separates a persistent host from a reloadable game library. The host owns the window and main loop. When a new library is built, the host loads a versioned copy and passes it the existing `Game_Memory` block. Loading a copy keeps the build output available for the next rebuild.

The important question is whether the new code can still interpret that memory. Comparing the block's size misses changes such as swapping two fields or replacing a floating-point field with an integer of the same size.

Renderer instead computes a layout hash from Odin's runtime type information. It includes field names, offsets, types, enum values, union variants, and referenced layouts. Matching hashes allow the new library to adopt the existing state; a mismatch restarts it. Recursive types are tracked during hashing so following a pointer back to the same type terminates.

This makes compatibility an explicit part of iteration. Changes in a field's meaning still require a deliberate restart: a type hash cannot distinguish degrees from radians when both use the same type. The [layout hash implementation and regression tests](https://github.com/NickReardon/renderer/tree/c45ac11fef99e6dc67b61d4cdbaeafc52eccf706/src/core) make that boundary concrete.

## One scene representation supports the editor

Entities live in a fixed pool and are referenced by an index plus a generation. Reusing a slot gives the new object a different generation, allowing lookups to reject stale handles. Mesh data lives separately behind handles.

The entity model uses plain structs and feature flags. That gives selection, transforms, inspection, and history one consistent representation to work with. A compile-time 512-byte entity size budget puts a visible constraint on growth; it is a design limit, rather than a performance result.

The Inspector uses tagged fields and runtime reflection to choose widgets. A supported field can become editable by adding its inspection metadata, including its label, drag step, or numeric bounds. UI layout comes from Clay, while the project's own immediate-mode widgets handle interaction and text editing.

## Undo follows the data

Undo compares the live entity pool with a committed snapshot. Changed slots produce before-and-after records; applying a record restores the corresponding entity state.

That keeps editing features from each needing a separate command implementation. Inspector changes, gizmo movement, creation, deletion, and duplication all feed the same history. A drag is committed when it finishes, so a single gesture becomes one step. Selection-only changes update the snapshot without filling the undo stack.

The generation handling matters here too. Undo can restore an older entity, but a later allocation must still receive a fresh generation. The [undo tests](https://github.com/NickReardon/renderer/blob/c45ac11fef99e6dc67b61d4cdbaeafc52eccf706/src/game/undo_test.odin) cover that interaction alongside deletion, duplication, redo invalidation, and gesture boundaries.

## Rendering with explicit boundaries

The renderer accepts handles and a per-frame draw list. Draws are sorted so compatible instances of the same mesh can be submitted together, with per-instance data stored in a GPU buffer. Backend-specific wgpu types stay inside the rendering layer.

The viewport supports fixed and dynamic render scales. The dynamic controller estimates a new scale from the current scale and the square root of the ratio between its target GPU time and measured GPU time. It reserves headroom, ignores small deviations, drops resolution faster than it raises it, and snaps adjustments to steps to reduce oscillation.

Below native resolution, the viewport can use FSR 1 or bilinear upscaling. Above native resolution, it renders a larger image and filters it down. This creates an inspectable quality-and-frame-time control, with GPU time and render size visible in the editor, rather than relying on an assumed performance gain.

## Key takeaways

- Plain scene data gives hot reload, inspection, and undo a shared foundation.
- Reload compatibility needs a structural check, with deliberate restarts for changes the type system cannot describe.
- Editor gestures need clear transaction boundaries so history matches the user's actions.
- Render scaling benefits from measured GPU cost and bounded adjustments, rather than an unconditional resolution change.

The [repository](https://github.com/NickReardon/renderer) includes Windows and macOS build instructions, focused test suites, and a design log recording the tradeoffs behind these systems.
