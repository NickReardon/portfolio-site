# Portfolio Site

Static Astro portfolio website for projects, devlogs, resume links, and contact
links. The v1 architecture is intentionally simple: Astro, Tailwind 4, Markdown,
GitHub, and Cloudflare Pages.

## Requirements

- Node.js `>=22.12.0` and npm.
- Python with `requirements.txt` installed; the privacy check reads PDFs.
- 1Password CLI only for local Cloudflare deploy commands.

## Commands

```powershell
npm install
npm run dev
npm run check
npm run build
npm run resume:validate
npm run privacy:check
npm run social:build
npm run preview
npm run format:check
```

Heavier quality checks:

```powershell
npm run audit
npm run audit:staging
npm run audit:scores
```

`npm run privacy:check` runs automatically before every build. It scans every
file Git would track — including the text, metadata and XMP of each PDF — and
fails on a phone number, a postal code, or a local filesystem path. This
repository is public, so a detail committed here is published twice: on the
site and in Git history, where it cannot be recalled.

## Project Structure

```text
/
├── docs/
│   ├── content.md
│   └── workflow.md
├── public/
│   ├── images/
│   ├── resumes/
│   └── resume.pdf
├── scripts/
│   ├── audit-pages.mjs
│   ├── build-social-card.mjs
│   ├── print-scores.mjs
│   ├── privacy-check.py
│   ├── resume-utils.mjs
│   └── validate-resume.mjs
├── src/
│   ├── components/
│   ├── content/
│   │   ├── blog/
│   │   └── projects/
│   ├── data/
│   │   └── resume.json
│   ├── layouts/
│   ├── pages/
│   ├── styles/
│   └── site.config.ts
├── AGENTS.md
├── astro.config.mjs
└── package.json
```

## Content

- Project markdown lives in `src/content/projects`.
- Blog markdown lives in `src/content/blog`.
- Content tone and authoring guidance lives in `docs/content.md`.
- Draft entries can stay in the repo with `draft: true`; production builds
  exclude them from lists and detail routes.
- Static project and blog images live under `public/images`.
- Resume content lives in `src/data/resume.json`. It is the source for the
  `/resume/` page only; nothing generates a PDF from it.
- `public/resume.pdf` is placed by hand and is the default download the site
  links to.
- Resume PDF variants live in `public/resumes/` and are listed on the unlinked
  `/resume-pdfs/` page.
- Update social links and identity text in `src/site.config.ts` as needed.

Use lowercase kebab-case for content slugs and asset filenames.

### Resume PDFs

Resume PDFs are placed by hand. Export whatever variants you want and drop them
in `public/resumes/`; `/resume-pdfs` lists everything found there at build time,
and `public/resume.pdf` is the copy the site links to as the default download.

`src/data/resume.json` is separate: it is the source for the rendered `/resume`
page only, and no longer generates any PDF. Validate it after editing:

```powershell
npm run resume:validate
```

Before committing a PDF exported from another tool, run `npm run privacy:check`.
Word, Acrobat and Canva exports routinely carry your OS account name and local
file paths in PDF metadata, which no visual review would catch.

## Workflow

Repository workflow conventions live in:

- `AGENTS.md` for coding-agent operating instructions.
- `docs/workflow.md` for branch names, commit frequency, commit messages, PR
  descriptions, verification expectations, and release flow.

Short version:

- `main` is production.
- `staging` is long-lived pre-production.
- Work branches use `<type>/<short-kebab-summary>`.
- Commits use `<type>(<scope>): <Description>`.
- Verify with the smallest command set that covers the risk, usually
  `npm run check` and `npm run build`.
- Protect `main` with pull requests and require the
  `Production Gate / Staging deployment is ready` check before merging from
  `staging`.

## Deploy To Cloudflare Pages

Use these settings when importing the GitHub repository into Cloudflare Pages:

- Production branch: `main`
- Build command: `npm run build`
- Build directory: `dist`

After the first successful deploy, add `nick-reardon.com` as the production
custom domain from the Cloudflare Pages project settings.

For the long-lived pre-production environment, create a `staging` branch and
enable preview builds for that branch. Add `staging.nick-reardon.com` as a
custom domain for the `staging` branch. Keep the DNS record proxied through
Cloudflare so it resolves to the branch deployment instead of production.

Production builds use `https://nick-reardon.com` for canonical URLs and the
sitemap. Staging and short-lived preview builds emit `noindex` metadata and a
non-indexable `robots.txt`; their URLs are derived from the branch domain or
Cloudflare Pages preview URL. Set `SITE_URL` in the build environment only when
you need to override that default.

### Local Wrangler Deploys With 1Password

For local Wrangler commands, store the Cloudflare account ID and API token in
1Password, then run Wrangler through `op run` so the values only exist in the
subprocess environment.

```powershell
Copy-Item .env.1password.example .env.1password
```

Edit `.env.1password` so each `op://...` value points at your actual 1Password
vault, item, and field. Prefer `CLOUDFLARE_API_TOKEN`; the older
`CLOUDFLARE_API_KEY` flow also requires `CLOUDFLARE_EMAIL`.

### Choosing a credential source

`scripts/deploy.mjs` reads `DEPLOY_CREDENTIALS` from `.env` (gitignored; copy
`.env.example`) to decide where Cloudflare credentials come from, so the same
command works across environments:

| Value         | Behaviour                                                                                                        |
| ------------- | ---------------------------------------------------------------------------------------------------------------- |
| `op:<file>`   | Runs Wrangler under `op run --env-file <file>`. Secrets exist only inside the subprocess.                        |
| `env`         | Credentials are already in the environment. Use in CI.                                                           |
| `file:<file>` | Loads `KEY=VALUE` pairs from `<file>`. Use where 1Password is unavailable; keep that file out of the repository. |

Unset means: use the environment if it already carries a token, otherwise
1Password via `./.env.1password`. The script reports which source it used and
never reads or prints the values themselves. `env` and `file:` are checked for a
token before the build runs; `op:` references resolve at run time, so only
Wrangler can validate them.

Check the credentials:

```powershell
op run --env-file ./.env.1password -- npx --yes wrangler whoami
```

The GitHub repository is connected to the Pages project, but Git-triggered
builds are switched off: the project has `production_deployments_enabled: false`
and `preview_deployment_setting: none`. Pushing to `main` or `staging` creates a
deployment record that stays queued forever and never builds, so the live site
does not change. Uploading `dist` with Wrangler is the only deployment path.

Deploy from the checkout of the branch you are deploying:

```powershell
git switch staging
npm run deploy:staging
```

Wrangler's `--branch` only tags the deployment; it does not affect the build.
`scripts/deploy.mjs` sets `CF_PAGES_BRANCH` for the build from the same value,
so the bundle and the deployment agree. It refuses to run when the checked-out
branch differs from the deploy target, or when the working tree is dirty;
`--allow-branch-mismatch` and `--allow-dirty` override.

Deploy production from `main` the same way, after promoting `staging`:

```powershell
git switch main
npm run deploy:production
```

`deploy:cloudflare` still takes an explicit `-- --branch <name>` for preview
branches.

Because Wrangler uploads are the only deployment path, the build stamp falls
back to the working tree's commit and branch when Cloudflare's
`CF_PAGES_COMMIT_SHA` is absent. Check what a site is serving with:

```powershell
curl -s https://staging.nick-reardon.com/ | Select-String 'name="build"'
```

Build from a clean tree before deploying. The stamp records the commit, not
whether uncommitted changes were included.
