---
title: "Stock Backtesting"
description: "A Python and PySide6 desktop application for downloading market data, charting ETF price history, and running trading-strategy backtests."
date: 2024-05-15
timeline: "Software development course project"
tags: ["Python", "PySide6", "Qt", "Desktop Tools", "Backtesting"]
projectType: "system"
role: "Solo implementation (team design and planning)"
status: "Educational project"
engine: "Python / PySide6"
featured: false
draft: true
---

<!--
  DRAFT - do not un-draft until the section 13 checklist is cleared:
  1. Confirm the actual project date (frontmatter date + timeline above are placeholders).
  2. Scrub the public repo (github.com/NickReardon/Stock-Backtesting) for any
     committed API keys or AWS/boto3 credentials BEFORE adding a live link.
  3. Decide whether the PyInstaller/SmartScreen code-signing work (career-profile
     section 9) is THIS app; if so, fold it into the "Packaging" section below so
     it does not read as a separate effort.
  4. When cleared: add `githubUrl` and/or `externalUrl` to the frontmatter and
     set `draft: false`.
-->

## Overview

Stock Backtesting is a Python and PySide6 desktop application for downloading
market data, plotting ETF price history, and running trading-strategy backtests.
The team handled design and planning under a course-defined scope; I built all
of the implementation. It is an educational engineering project, not production
trading software.

<!-- MEDIA[image]: app window - ETF selector, date range, strategy picker, embedded chart -->

## What I Contributed

### Desktop UI

- Built a PySide6 desktop interface for selecting ETFs, date ranges, and
  strategies, with Matplotlib charts embedded directly in the Qt UI for price
  history and strategy performance.
- Ran market-data downloads on a background QThread to keep the GUI responsive
  during fetches, and added a small pub/sub system for live price-update events.

<!-- CODE[python]: embedding a Matplotlib FigureCanvas in a PySide6 widget -->

### Swappable data adapters

- Designed a data-access abstraction with swappable adapters for Yahoo Finance,
  local JSON, Alpha Vantage, and Polygon-style sources, so adding a provider
  does not touch consumer code.

<!-- CODE[python]: the data-adapter interface + one concrete provider implementation -->

### Dynamic strategy loading

- Added dynamic strategy loading via Python module discovery from a
  `strategies/` directory, so a new strategy drops in as a file exposing the
  expected functions with no controller changes.
- Implemented SMA Crossover, MACD, and Bollinger Bands strategies on shared
  infrastructure for reading prepared data, tracking cash and shares, logging
  trades, computing return metrics, and writing CSV outputs.

<!-- CODE[python]: module-discovery loader that registers strategies from strategies/ -->
<!-- MEDIA[image]: strategy performance chart with trade markers -->

## Packaging

<!-- TODO: if the section 9 PyInstaller executable + Windows SmartScreen / code-signing
     work belongs to this app, document it here (artifact signing, false-positive
     mitigation) so the two references read as one effort. -->

## What The Work Shows

This project shows desktop application engineering and interface-driven design:
isolating I/O behind adapters, keeping a GUI responsive under background work,
and structuring strategies and data sources so the system extends by adding
files rather than editing the controller.
