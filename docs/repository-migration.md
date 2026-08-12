# One-time Public Repository Migration

This migration is an explicit exception to the normal pull-request-only branch
rules. Its purpose is to replace career-bearing history with one reviewed,
code-only root while preserving the post-migration `staging` to `main` flow.

## Before replacement

1. Preserve the user's two locally modified PDFs only under ignored
   `.workspace/pre-migration/` for visual comparison.
2. Build the final tree in an isolated worktree based on the latest staging
   implementation.
3. Validate fictional public CI, real private extraction, all three one-page
   PDFs, desktop/mobile pages, package hashes, and privacy scans.
4. Disable Cloudflare Git deployments and temporarily allow the two protected
   branch refs to be replaced.

## Replacement

1. Create a new root commit containing only the reviewed public tree.
2. Force-with-lease that root to both public `main` and `staging`.
3. Delete obsolete public remote branches and archive pull requests 1 through 10.
4. Restore branch protection, including PR-only promotion from `staging` to
   `main` and the required public checks.
5. Remove or invalidate stale local worktrees so an old-history branch cannot
   be pushed accidentally.

Do not retain a Git archive of the former history.

## Sensitive-reference follow-up

Rewriting branches does not recall external clones and may not remove cached
commit URLs, pull-request refs, or other server-side references. Submit a GitHub
Support cached-reference removal request for qualifying contact data after the
rewrite. GitHub may decline removal for data it does not classify as sensitive.
Record the support case separately; do not place removed personal data in this
repository or in the ticket beyond what GitHub requires.

References:

- https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository
- https://developers.cloudflare.com/pages/get-started/direct-upload/
- https://developers.cloudflare.com/pages/configuration/headers/
