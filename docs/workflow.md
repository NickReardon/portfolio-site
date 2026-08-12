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
<type>/<short-kebab-summary>
```

Use this form for both human-created and agent-created implementation branches
unless a different team convention is needed.

Create local auxiliary worktrees inside this project under `.workspace/worktrees/`.
Do not create new worktrees in user-global scratch directories such as
`~/.codex/worktrees/` unless that location is explicitly requested. The
`.workspace/` directory is local-only and ignored by Git.

Create local auxiliary worktrees inside this project under `.workspace/worktrees/`.
Do not create new worktrees in user-global scratch directories such as
`~/.codex/worktrees/` unless that location is explicitly requested. The
`.workspace/` directory is local-only and ignored by Git.

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

All changes must reach `main` through a pull request. Do not push directly to
`main`, and do not directly push one branch ref over another, including
`staging` to `main`, unless the operation is explicitly approved for a specific
case.

Production PRs must use `staging` as the source branch and `main` as the target
branch. The public gate enforces that source relationship. Deployment approval
belongs to the private vault workflow, which stages a specific portfolio SHA
before that SHA is promoted to public `main`.

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
- `docs/content.md`: detailed writing, image, and frontmatter guidance.

## Release Flow

1. Merge work branches into `staging`.
2. Dispatch `Publish Portfolio` from private vault `main`, targeting `staging`.
3. The workflow builds and deploys one immutable package to staging, then runs
   HTTP, indexing, accessibility, performance, media, and PDF checks.
4. Review staging, then open and merge the `staging` to `main` pull request.
   Use a merge commit; squashing would discard the exact staged commit from
   `main` and correctly block production promotion.
5. Dispatch `Promote Portfolio Package` from private vault `main` with the
   successful staging run ID. This separate manual dispatch is the production
   approval gate because required-reviewer environments are unavailable on the
   private repository's current GitHub plan.
6. The promotion workflow proves the staged site SHA is contained in public
   `main`, downloads and verifies the stored package, and uploads it to
   production without rebuilding.
7. Confirm production crawl policy, sitemap, and artifact hashes.

Cloudflare Git deployments must remain disabled. Direct Wrangler uploads from
the private workflow are the only deployment path. The package artifact is
private and retained for seven days.

Use a production hotfix branch from `main` only when staging cannot wait. Backport
or merge the hotfix into `staging` afterward so the branches do not diverge.

## GitHub Branch Protection

Configure a branch protection rule or ruleset for `main` with:

- Require a pull request before merging.
- Require status checks to pass before merging.
- Required check: `Production Gate / Require staging promotion`.
- Require branches to be up to date before merging when practical.
- Restrict direct pushes to repository maintainers only when emergency hotfix
  access is needed; otherwise block direct pushes to `main`.

Cloudflare Pages keeps `main` as the production branch and `staging` as the
long-lived preview branch, but Git-based automatic builds are disabled.
