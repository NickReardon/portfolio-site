# Agent Instructions

This repo is a static Astro portfolio site for Nicholas Reardon. Treat it as a
small production website: changes should be focused, documented when they alter
workflow or deployment, and verified before handoff.

## Working Rules

- Start every task by checking `git status --short` and identifying user-owned
  changes. Do not revert or rewrite changes you did not make.
- Prefer small, coherent changes over broad refactors. Keep unrelated cleanup out
  of feature and bugfix work.
- Use the existing Astro, Tailwind, TypeScript, and content collection patterns
  before adding new abstractions or dependencies.
- Never commit secrets, local credential files, build output, audit output, or
  generated caches.
- For user-facing visual changes, check desktop and mobile layouts before
  finishing.
- Update documentation in the same change when commands, deployment behavior,
  branching, content structure, or recurring workflows change.

## Commands

Run the narrowest useful verification for the task:

```powershell
npm run check
npm run build
npm run format:check
```

Use `npm run audit` only for accessibility/performance work or before a release
candidate because it is heavier than the normal build checks.

## Branching

- `main` is production and deploys to `https://nick-reardon.com`.
- `staging` is the long-lived pre-production branch and deploys to
  `https://staging.nick-reardon.com`.
- Agent-created implementation branches should use:
  `codex/<type>/<short-kebab-summary>`.
- Human feature branches should use:
  `<type>/<short-kebab-summary>`.

Allowed branch types:

- `feat` for new user-facing functionality or content sections.
- `fix` for defects and regressions.
- `docs` for documentation-only changes.
- `chore` for tooling, dependency, and housekeeping changes.
- `refactor` for behavior-preserving code structure changes.
- `content` for project, blog, resume, and portfolio copy changes.

Keep branches short-lived. Merge to `staging` for preview validation before
promoting to `main`.

## Commits

Use scoped Conventional Commit-style subjects:

```text
<type>(<scope>): <Description>
```

Examples:

```text
feat(projects): Add project detail callouts
fix(seo): Correct staging canonical URLs
docs(workflow): Document agent workflow
content(tethered): Update Tethered project case study
```

Commit after each coherent unit of work once relevant checks pass. Avoid WIP
commits unless handing off incomplete work; if a WIP commit is unavoidable, make
that explicit in the subject or body.

Split commits when changes have different review concerns, such as code,
content, dependency updates, and deployment configuration.

## Pull Request Descriptions

Use this structure for PRs and substantial handoffs:

```markdown
## Summary

- What changed and why.

## Verification

- Commands run and results.
- Manual layout or content checks performed.

## Deployment Notes

- Environment variables, Cloudflare settings, redirects, or follow-up deploy
  steps, if any.

## Screenshots

- Include before/after screenshots for visual changes when practical.
```

If checks were not run, say why. If there are known risks or follow-ups, list
them explicitly.

## Naming Conventions

- Astro components: `PascalCase.astro`.
- Utility modules: `camelCase.ts` or descriptive kebab-case when the repo already
  uses it.
- Content slugs and asset names: lowercase kebab-case.
- TypeScript variables/functions: `camelCase`.
- Constants scoped to config values: descriptive `camelCase` unless exported as
  a public constant.
- CSS custom properties: kebab-case.

## Documentation Ownership

- Keep high-level project setup and deployment instructions in `README.md`.
- Keep workflow rules in `docs/workflow.md`.
- Keep agent-specific operating rules in this file.
- Add content-authoring guidance to `docs/content.md` if content workflows become
  more detailed than the README can comfortably hold.
