---
title: "Tethered"
description: "Current Unreal Engine project focused on data-driven gameplay systems and extendable combat architecture."
date: 2026-01-25
tags: ["Unreal Engine", "C++", "Gameplay Tags", "Gameplay Systems"]
coverImage: "/images/projects/tethered-placeholder.svg"
coverAlt: "Diagram showing Tethered gameplay system flow from input to gameplay tags, combos, attacks, and feedback."
featured: true
draft: false
---

## Overview

Tethered is my current Unreal Engine project and the main place where I am
building larger gameplay systems outside of coursework. The goal is to keep the
implementation reliable while making it easy to extend with new content.

## System Focus

One current example is a combo system that maps combo steps to attacks through
Gameplay Tags. The intent is to support a flexible number of attacks without
hard-coding every branch of the combat flow.

## Authoring Mindset

I build systems the way I would want to use them: straightforward defaults,
clear options when more control is needed, and enough structure that future
changes do not require unnecessary refactoring.

## What I Am Learning

Tethered is helping me practice the tradeoffs that show up in production code:
how much flexibility a system should expose, how to keep data readable, and how
to make designer-facing workflows match the intended use of the system.
