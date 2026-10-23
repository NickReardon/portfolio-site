# Discussion publishing

Author in GitHub Discussions. Applying the `publish` label validates the
generated content and commits it straight to `main`, so a labelled discussion
reaches `https://nick-reardon.com` with no further step. Editing the discussion
republishes it; removing the label unpublishes it.

The gates are the `publish` label and the `draft` flag, both of which live in
the discussion, plus the validation the sync job runs before it pushes. There is
no content pull request to merge.

## Repository setup

In the repository's Discussions settings, create categories named exactly `Blog`,
`Games`, and `Software`, with slugs `blog`, `games`, and `software`. Use an open
discussion format, rather than a poll. The category templates live under
`.github/DISCUSSION_TEMPLATE/` and take effect from the default branch (`main`).
Create the `publish` label if it does not exist. Apply it only to material ready
for review. It is deliberately absent from the template defaults.

The sync job needs contents write and discussions read. It pushes to `main`, so
`main`'s branch protection must list the GitHub Actions bot as a bypass actor.
Everything else about that protection stays as it is: humans still reach `main`
only through a pull request carrying `Production Gate / Staging deployment is
ready`. Without the bypass the job validates, commits, and then fails on a
rejected push.

`GITHUB_TOKEN` is sufficient and no `CONTENT_SYNC_TOKEN` is required. Be aware
that GitHub starts no workflow run from a push made with `GITHUB_TOKEN`, so
`ci.yml` does not re-run on these content commits. The sync job runs the same
checks itself, before the push, and fails closed. Cloudflare Pages still
deploys, because its Pages integration is a GitHub App reacting to the push
webhook rather than an Actions workflow. Never place tokens in discussion
content or tracked files.

The workflow must reach `main` before discussion events trigger it. Once it is
there, it always checks out current `staging` and opens or updates the single
`content/sync-discussions` branch and PR. Do not edit that generated branch by
hand: the next run regenerates it from staging plus the current discussions.
After the first production promotion, test it from the Actions tab with
**Run workflow**. The manual-dispatch button also requires the workflow to exist
on the default branch.
All three categories must exist; a missing category fails before any files change.

## Authoring and review

1. Create a discussion in Blog, Games, or Software. Fill the fenced YAML block
   and write Markdown after it. See [project-elements.md](project-elements.md).
2. Apply `publish` when ready. Created, edited, deleted, labeled, unlabeled, and
   category-change events run a full sync. Manual dispatch is also available.
3. The workflow runs sync regression checks, formatting, element validation, an
   Astro production build, and the privacy scan. If all of them pass it commits
   the result to `main`; if any fails, nothing is pushed.
4. Cloudflare Pages deploys `main`. Check the published page on desktop and
   mobile in both themes, and fix anything wrong by editing the discussion.

Removing `publish`, deleting a discussion, or moving it to an unsupported category
removes its synced page on the next sync, which is to say immediately and in
production. Malformed or incomplete YAML also withdraws that page, so a careless
edit to the fenced block unpublishes it. An attachment download failure instead
fails the job, keeps that page's previous file, and pushes nothing. Local sync runs can leave other partial file changes on failure; run
them in a clean worktree and inspect `git diff` before committing anything.

Handwritten notes have no `discussion` field and are never overwritten or deleted.
New slugs avoid every existing Markdown filename; a renamed discussion retains
its original slug. Repo-owned `coverImage` and `coverAlt` survive subsequent syncs.
Body attachments are downloaded under `src/assets/blog/` or `src/assets/projects/`
and referenced locally. Only PNG, GIF, JPEG, and SVG media types are accepted,
with a streamed 10 MiB limit. SVGs remain image references, never inline markup.
Videos must use an external host and the video directive. Assets are not garbage
collected automatically; remove unreferenced files in a separate reviewed change.

## Local checks

```sh
npm run discussions:validate
npm run elements:validate
npm run format:check
npm run build
python scripts/privacy-check.py
```

`npm run discussions:validate` is offline and exercises filename collisions,
retitling, ownership, repeat runs, attachments, and unpublishing in a temporary
directory. `npm run discussions:sync` makes network requests and requires
`GITHUB_TOKEN` with discussions read access and `GITHUB_REPOSITORY=owner/name`.
It changes local content; it never pushes anything itself.
