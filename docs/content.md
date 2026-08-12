# Content and Publication Boundary

## Ownership

- The private Obsidian vault is canonical for profile, About, Contact, career,
  project case-study, and resume wording.
- This repository owns blog Markdown, public media, Astro presentation code,
  fictional fixtures, and generic extraction/rendering tooling.
- `.local/publication/`, resume PDFs, and social cards are generated and
  ignored. They must never be committed.

The vault contract is defined by its existing `meta/rules/career.md`. It uses
one control note, `career/Framings/Portfolio Profile.md`, and named sections on
existing career notes. Do not create a second publication hierarchy here.

## Extraction boundary

The extractor reads only:

- allowlisted frontmatter needed for display and ordering;
- approved `## Portfolio Copy` sections;
- approved, role-scoped `## Resume Framing` bullets;
- sources explicitly ordered in the profile note's resume recipes.

It rejects draft sources, missing links, duplicate slugs, unknown recipe roles,
malformed sections, path traversal, and every link into `career/Private`.
Unrelated note bodies, source properties, interview notes, and arbitrary wiki
links are not part of the publication graph.

## Project media

Media remains public and repository-owned. `config/project-media.json` maps a
vault `portfolio_slug` to presentation metadata and files in
`src/assets/projects/`. A missing mapping is a build error.

Use lowercase kebab-case asset names. Meaningful images require useful alt text.
Set `mediaPending: true` only while a replacement capture is planned; normal
validation warns and release validation fails.

## Local authoring loop

Edit and approve wording in the vault, then run:

```powershell
npm run content:prepare -- --vault <absolute-vault-path>
npm run resume:preview -- --target gameplay
npm run build
```

Valid targets are `general`, `gameplay`, and `tools`. AI may help propose local
edits, but neither public nor private CI calls a model. CI renders only committed
approved wording.

## Privacy fixtures

`test/fixtures/vault` is deliberately fictional. Private sentinels sit beside
approved fixture sections, and tests prove they do not reach extracted output.
Public CI builds exclusively from those fixtures.
