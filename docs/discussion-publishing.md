# Discussion publishing

Author in GitHub Discussions and review generated content in a pull request to
`staging`. Production promotion remains a separate `staging` to `main` PR.

## Repository setup

In the repository's Discussions settings, create categories named exactly `Blog`,
`Games`, and `Software`, with slugs `blog`, `games`, and `software`. Use an open
discussion format, rather than a poll. The category templates live under
`.github/DISCUSSION_TEMPLATE/` and take effect from the default branch (`main`).
Create the `publish` label if it does not exist. Apply it only to material ready
for review. It is deliberately absent from the template defaults.

In Settings > Actions > General, enable GitHub Actions to create pull requests.
The sync job needs contents write, pull requests write, and discussions read.
An optional repository secret named `CONTENT_SYNC_TOKEN` can provide a GitHub
App or fine-grained token with contents and pull requests read/write access.
Using it allows the generated PR's push to trigger normal CI. With the default
`GITHUB_TOKEN`, GitHub suppresses those subsequent workflow runs; the sync job
still validates the generated tree, but a required PR CI check may remain pending.
Configure `CONTENT_SYNC_TOKEN` before relying on automatic CI on content PRs.
Never place tokens in discussion content or tracked files.

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
3. Review the generated PR's content, removals, and attachments. The workflow
   runs sync regression checks, formatting, element validation, an Astro staging
   build, and the privacy scan before creating or updating the PR.
4. Merge the content PR into staging, inspect desktop/mobile layouts and both
   themes, and promote through the normal release flow.

Removing `publish`, deleting a discussion, or moving it to an unsupported category
removes its synced page in the next content PR. Malformed or incomplete YAML also
withdraws that page. Review deletions carefully. An attachment download failure
instead fails the job, keeps that page's previous file, and prevents a publishing
PR update. Local sync runs can leave other partial file changes on failure; run
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
It changes local content; it never pushes or opens a PR itself.
