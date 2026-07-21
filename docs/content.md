# Tone and Content Authoring Guide

This document defines the guidelines for writing and formatting content on the portfolio site. It applies to case studies, pages, blog posts, and resume entries.

## 1. Core Voice and Perspective

- **Authoritative & Engineering-Focused**: Lead with technical decisions, architecture, and tradeoffs. Write from the perspective of an active developer explaining their systems design rather than a learner doing an exercise.
- **Action-Oriented Verbs**: Use strong, descriptive verbs to describe work (e.g., _Architected_, _Implemented_, _Optimized_, _Migrated_) rather than passive or generalized verbs (_Helped with_, _Worked on_, _Learned about_).
- **Designer-Centric Systems**: Frame systems programming in the context of user/designer enablement. Highlight how system choices (e.g., data assets, modular components, tags) allow others to extend content without compiling new code.

## 2. Neutralizing Academic Context

To avoid reading as a junior-level candidate, we frame academic experience neutrally:

- **Lead with Specialization**: Lead summaries and introductions with your role (e.g., _Gameplay and Systems Programmer_) rather than your status as a student.
- **Reframe Assignments**: Frame course projects and capstones as collaborative engineering efforts or technical demonstrations. Mention the university context as secondary or within the education section rather than in the project's hook.
- **Showcase Tradeoffs**: Instead of saying a project was "for a class," discuss the architectural decisions made to solve the project's constraints.

## 3. Confident & Direct Contributions

- **No Defensive Disclaimers**: State exactly what you built, designed, or contributed. Do not write disclaimers explaining repository hosting (e.g., "the repo is on my teammate's account") or explaining what has not been built yet (e.g., "networking is not yet tested").
- **Own the Scope**: If a feature wasn't built, frame it positively under architectural readiness (e.g., "designed to support server-authoritative GAS flows for future network expansion") rather than listing it as a missing feature.

## 4. Keeping Case Studies Objective

- **No Interview/Coaching Notes**: Do not include sections like "Strongest Talking Points" or internal notes coaching yourself on how to pitch the project. The page should read as an objective case study.
- **Key Takeaways**: Use a "Key Takeaways" section at the end of case studies to outline major architectural lessons, systems tradeoffs, and workflow improvements.

## 5. Canonical Project Metadata

Project content under `apps/web/src/content` is the canonical source for portfolio-facing project
metadata. The Home page, Projects index, and project headers must read their
title, role, status, engine, date label, tags, featured state, and ordering from
the content collection rather than redefining those values at the page level.

Resume project entries use the project page URL as their stable link to content.
When a resume-facing field must be duplicated, `pnpm content:validate` checks
that names, roles, date labels, and external URLs still agree.

Required project fields include:

- `dateLabel`: the human-readable date or event label.
- `order`: a unique positive integer controlling project order.
- `variant`: `case-study` or `jam-postmortem`.
- `status`: `In development`, `Released`, `Prototype`, or `On hold`.

Published projects require a cover image, useful alternative text, and an Open
Graph image. Draft entries may omit media while they remain excluded from
production.

## 6. Project Page Structures

### Case studies

Use this order for an in-development flagship case study:

1. Overview.
2. Team and specific ownership.
3. Core gameplay loop.
4. Architecture introduction.
5. System subsections shaped around problem, decision, trade-off, and evidence.
6. Testing and integration.
7. Key Takeaways.

Target 800 to 1,200 words.

### Jam postmortems

Use this order for shipped jam work:

1. Overview of the game, jam, and constraint.
2. What I Contributed.
3. System subsections describing the relevant decision and trade-off.
4. At least one gameplay motion asset.
5. What the Work Shows.

Target 400 to 700 words. Put specific ownership before detailed implementation
claims.

## 7. Media and Publishing

- Do not publish placeholder images, placeholder paths, or internal media/code
  reminder comments.
- Alternative text describes meaningful images. A visible caption is optional
  and does not replace alternative text.
- Embedded videos require an accessible title. Videos that communicate
  meaningful evidence also require captions or a nearby transcript.
- Autoplay video must be muted, inline, and disabled when the visitor prefers
  reduced motion.
- Open Graph images must be real project captures with a social-friendly crop.
- Set `mediaPending: true` only as a temporary implementation marker. Normal
  validation reports it; `pnpm content:validate:release` rejects it.

Before publishing project changes, run:

```powershell
pnpm content:validate:release
pnpm privacy:check
pnpm check
pnpm build
pnpm format:check
```

## 8. Knowledge-Derived Resume Content

The approved public resume snapshot lives at `content/public/resume.json`.
Long-form private source documents live only in the encrypted sibling repository.
Use the knowledge pipeline and evidence-backed draft workflow documented in
`docs/personal-knowledge.md`; do not manually copy private source directories
into the public monorepo.
