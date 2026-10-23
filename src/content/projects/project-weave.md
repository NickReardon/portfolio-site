---
title: "Project Weave"
description: "A Markdown-first Obsidian project workbench built so that indexing never touches a note and the only write-capable port can create, never modify."
date: 2026-10-22
status: "In development"
stack: "TypeScript / Obsidian API"
role: "Solo design and implementation"
timeline: "2026 - present"
tags: ["TypeScript", "Obsidian", "Developer Tools", "Architecture", "MCP"]
links:
  - kind: "repo"
    label: "Source on GitHub"
    href: "https://github.com/NickReardon/ProjectWeave"
  - kind: "docs"
    label: "Architecture"
    href: "https://github.com/NickReardon/ProjectWeave/blob/main/docs/ARCHITECTURE.md"
featured: false
draft: false
category: "Software"
---

## Overview

Project Weave is an Obsidian plugin that turns a vault of Markdown design notes into a ranked, dependency-aware backlog. It is built for a solo developer or small team working on one long-lived project, and it deliberately omits sprints, estimates, and required owners, because a project of that size does not use them.

The interesting constraint is not performance. The data is the user's own writing, in their own files, which they will keep editing in Obsidian while the plugin is running. So the design question that shapes everything else is what the plugin is permitted to touch, and the answer is enforced in the type system, in the module boundaries, and in the lint configuration rather than left to careful coding.

## The vault is the database, and it stays canonical

Markdown in the vault is the only source of truth. Indexing, plugin load, settings changes, navigation, and the dashboard preserve it byte for byte. There is no sidecar database to fall out of sync, and no migration step on install.

The parser reads projects, epics, tasks, milestones, planning periods, and relations out of frontmatter and wiki links. Everything that could be stored but does not have to be is derived instead: dependency readiness, reverse edges, provenance, and deterministic ordering are all computed from the notes rather than written back. That removes a whole category of cache invalidation bug, because there is no cache with its own opinion to invalidate.

`IndexBuilder` publishes a complete immutable snapshot. `IndexCoordinator` owns the parts that are actually hard: asynchronous rebuilds, coalesced targeted reads, snapshot revisions, stale-last-good state while a rebuild is in flight, and cancellation on unload. A plugin-lifetime publication layer sits above it, so changing the indexed folders replaces the entire indexing runtime underneath without open views losing their subscription.

## Invalid notes become diagnostics, not failures

A note that does not parse is still a note the user is in the middle of writing. The parser does not reject it. It attaches a diagnostic carrying severity, an error code, the offending field, recovery guidance, and links to related notes, and the workbench groups those by affected note. Compact banners appear above affected notes in both editing and reading mode. Neither path modifies content.

Configured validation stays out of the domain. The parser reads a task's `category` as an optional string and knows nothing about settings; `IndexBuilder` applies the vault's configured vocabulary and attaches `task.category.invalid` naming the allowed values. The domain therefore stays a pure function of the note, and an empty vocabulary validates nothing.

The same parser and validation rules run headless. A read-only CLI scanner reports project-scoped or vault-wide diagnostics as JSON, can watch for changes, and in `diagnostics:check` form scans the repository's own dogfood vault and fails the build on any error-level diagnostic. Warnings and info stay visible without failing the gate.

## One write-capable port, and it can only create

The entire plugin has exactly one port that can write, and its contract is a single operation: create a note that does not exist. There is no way to express modification, overwrite, move, or delete, so a caller holding that port cannot damage existing content even if it is wrong about everything else. Its outcomes are `created`, `exists`, `out_of_scope`, and `failed`, and an implementation must return `exists` rather than replacing a file, even when the bytes it would write are identical.

Everything that reaches that port goes through a proposal first. A creation proposal carries fingerprints of its inputs, target-absence and index-freshness preconditions, the exact rendered bytes, and the expected postconditions. The create modal shows all of it before anything is confirmed, so the preview is the bytes, not a description of them.

Confirmation does not trust the preview. The commit coordinator re-reads its inputs, compares fingerprints, and re-validates before writing. If the project note or the template changed between preview and confirmation, the commit aborts and asks for a new preview rather than writing something the user did not see. Ordered multi-file proposals preflight every target and output before the first write, stop at the first unexpected failure, and report written and unwritten paths exactly.

The renderer underneath is a pure function of its request. It has no clock, network, environment, or file access, and every value comes from the creation context its caller injects. Each rendered note is then re-parsed with the ordinary entity parser before it is returned, so the renderer cannot emit something the index would later reject.

Template resolution fails closed on purpose. A broken, ambiguous, malformed, or wrong-kind template blocks its variant instead of falling through to another source, because falling back would quietly produce bytes other than the ones selected.

## Dependency direction is enforced by lint, not convention

Domain, indexing, and application code do not import Obsidian, Node, Electron, UI modules, or transports. Obsidian API usage is confined to adapters, the entry point, settings, and views.

That rule is a lint error rather than a paragraph in a contributing guide. Across `src/`, ESLint bans the `node:*` import pattern along with `child_process`, `crypto`, `electron`, `fs`, `path`, and `worker_threads`, and bans the `Buffer`, `process`, `require`, `__dirname`, and `__filename` globals. The exception is scoped to two directories: the agent gateway and the desktop adapter, which are the only places allowed to know they are on a desktop.

Mobile compatibility then falls out of the boundary rather than existing as a second code path. The core plugin is portable because the layers that would break it cannot reach the APIs that would break it, and the one desktop-only feature is quarantined where the lint exception already lives.

## Agent access as a scoped, revocable grant

Read-only agent access is three pieces in three places: a gateway hosted inside Obsidian, an MCP companion that the user's MCP client launches as a stdio subprocess, and a local authenticated pipe or socket between them. It is desktop-only, disabled by default, and mobile never starts it.

A grant is bound to exactly one indexed project, with an explicit choice between metadata only and metadata plus note text. The content-root list appears only for the second choice and stays empty for a metadata-only grant. The create action stays disabled until the chosen project and every chosen folder resolve against the vault, naming whichever one does not. No write or proposal tools are exposed at all.

Grants are immutable once created. There is no edit operation, so correcting a mistake means revoking and replacing, which keeps a grant's scope equal to what it was approved as. Settings lists every grant with its label, id, project, and scope, so what an agent can see is readable without opening anything.

Creating a grant also copies a complete, ready-to-paste client configuration to the clipboard, once, and never shows or stores it again. It arrives whole rather than as loose values to assemble, and the one thing the plugin cannot know, where the companion file was placed, is left as an unmistakable placeholder rather than omitted, so it is obvious what remains to edit. The plugin and companion must come from the same release tag; a mismatch fails closed and tells the client which companion to install.

## Verification

Fixture-backed suites cover the parser, index, queries, the dashboard projection, template rendering, incremental updates, lifecycle, and release inventory, run under Vitest alongside `node --test` scripts for the packaging and release tooling. CI runs the same complete gate on every supported Node version, including the dogfood vault diagnostics scan.

## Key takeaways

- When the data is the user's own files, a port that structurally cannot modify them is a stronger guarantee than a code path that is careful not to.
- Preview, fingerprint, re-validate, commit is worth the extra round trip once the thing being written is someone's notes.
- Lint rules hold an architecture better than documentation does, and the payoff showed up as mobile support that needed no separate implementation.
- Deriving readiness and ordering instead of storing them deleted the cache invalidation problem rather than solving it.
- An agent capability expressed as a scoped, immutable, revocable grant stays reviewable long after it is granted.

The [repository](https://github.com/NickReardon/ProjectWeave) carries the specifications, the decision records behind each of these choices, and the preview install path through BRAT. It is not yet listed in Obsidian's Community Plugins directory.
