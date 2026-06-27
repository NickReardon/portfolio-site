# Workflow

This document defines the default collaboration workflow for the portfolio site.
It applies to humans and coding agents unless a task explicitly says otherwise.

## Branch Model

- `main` is the production branch.
- `staging` is the long-lived pre-production branch.
- Short-lived work branches should branch from the freshest relevant base:
  `staging` for normal site work, `main` only for production hotfixes.

Branch naming:

```text
codex/<type>/<short-kebab-summary>
<type>/<short-kebab-summary>
```

Use the `codex/` prefix for agent-created branches. Omit it for human-created
branches unless a different team convention is needed.

Recommended branch types:

- `feat`: new pages, components, sections, or user-facing behavior.
- `fix`: broken behavior, incorrect rendering, bad metadata, or deploy issues.
- `docs`: documentation only.
- `chore`: tooling, dependencies, cleanup, config maintenance.
- `refactor`: behavior-preserving code structure.
- `content`: portfolio copy, blog posts, project entries, resume updates, images.

## Commit Frequency

Commit at stable checkpoints, not after every file edit.

Good commit boundaries:

- A complete bug fix with verification.
- A complete content update for one page, project, or post.
- A complete component or layout change.
- A tooling/configuration change with documentation updates.
- A dependency update after build/check verification.

Avoid mixing unrelated concerns. For example, a project writeup update and an
Astro config change should usually be separate commits.

Incomplete work should stay uncommitted unless the explicit goal is handoff. If
handoff requires a commit, use a clear subject such as:

```text
wip: sketch project filtering UI
```

## Commit Messages

Use scoped Conventional Commit-style subjects:

```text
<type>(<scope>): <Description>
```

Guidelines:

- Use a short lowercase scope that names the affected area, such as `projects`,
  `blog`, `seo`, `deploy`, `workflow`, `nav`, or `theme`.
- Use a capitalized description after the colon.
- Use present-tense imperative wording: `Add`, `Fix`, `Document`, `Update`.
- Keep the subject under roughly 72 characters.
- Use the body for context, tradeoffs, follow-ups, or verification details when
  the subject is not enough.
- Reference issues or external tasks in the body when applicable.

Examples:

```text
feat(projects): Add featured project filtering
fix(content): Prevent draft projects from rendering detail pages
docs(deploy): Document Cloudflare staging workflow
content(last-oasis): Update Last Oasis project entry
chore(a11y): Add accessibility audit scripts
```

## Pull Requests And Handoffs

Every substantial PR or agent handoff should include:

- Summary: what changed and why.
- Verification: commands run, manual checks, and results.
- Deployment notes: environment variables, Cloudflare settings, branch impact, or
  post-merge steps.
- Screenshots: required for visible layout changes when practical.
- Known follow-ups: anything intentionally left out.

Recommended PR body:

```markdown
## Summary

-

## Verification

-

## Deployment Notes

-

## Screenshots

-

## Follow-ups

-
```

## Verification Policy

Use the smallest check set that covers the risk:

- Documentation-only: proofread and check links/paths.
- Content-only: `npm run check`; use `npm run build` when routes, slugs, images,
  or frontmatter schema are affected.
- Component/layout changes: `npm run check`, `npm run build`, and browser checks
  at mobile and desktop widths.
- Config/deploy changes: `npm run build`; preview or staging deploy validation
  when Cloudflare behavior is affected.
- Release candidate: `npm run check`, `npm run build`, and `npm run audit` when
  audit dependencies are installed and available.

If a check cannot be run, record the reason in the PR or final handoff.

## Documentation Rules

Update docs in the same branch when a change affects:

- Setup commands or required tool versions.
- Build, deploy, preview, audit, or formatting commands.
- Cloudflare Pages behavior, custom domains, redirects, or environment variables.
- Content structure, frontmatter fields, image requirements, or draft handling.
- Branching, commit, review, or release workflow.

Documentation locations:

- `README.md`: project overview, setup, commands, content locations, deployment.
- `AGENTS.md`: agent-specific operating instructions.
- `docs/workflow.md`: branch, commit, PR, verification, and documentation policy.
- Future `docs/content.md`: detailed writing, image, and frontmatter guidance if
  content work outgrows the README.

## Release Flow

1. Merge work branches into `staging`.
2. Validate the staging deployment at `https://staging.nick-reardon.com`.
3. Confirm metadata, draft visibility, canonical URLs, and key pages.
4. Merge or fast-forward `staging` into `main`.
5. Validate production at `https://nick-reardon.com`.

Use a production hotfix branch from `main` only when staging cannot wait. Backport
or merge the hotfix into `staging` afterward so the branches do not diverge.
