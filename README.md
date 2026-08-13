# Portfolio Site

Static Astro portfolio website and generic publication tooling. Private career,
profile, project, and resume sources live in the Obsidian vault and are never
committed here. Blog Markdown and public project media remain repository-owned.

## Requirements

- Node.js `>=22.12.0` and npm.
- Python, `rendercv[full]==2.8`, and pinned PyMuPDF for real resume rendering
  and deterministic page-fill validation.
- Access to the private vault for real publication builds.

## Local setup

```powershell
npm ci
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements-rendercv.txt
```

Optionally set the vault path in ignored `.env.local`:

```text
OBSIDIAN_VAULT_DIR=<absolute-vault-path>
```

`content:prepare` reads that ignored file. An explicit `--vault` wins when both
are present:

```powershell
npm run content:prepare -- --vault <absolute-vault-path>
npm run resume:validate
npm run resume:build
npm run social:build
npm run build
```

Generated inputs and previews live under ignored `.local/`, `public/resume.pdf`,
`public/resumes/`, and `public/images/social-card.png`. Never stage them.
Each real resume build rasterizes its single PDF page at a fixed resolution and
requires at least 92% of the usable body line bands to contain meaningful ink.
The scan excludes header and footer zones, so a future footer cannot hide an
under-filled body.

## Public CI

The public repository is self-contained without private data. Its CI uses the
fictional vault under `test/fixtures/vault`:

```powershell
npm test
npm run privacy:check
npm run build:fixture
npm run check:first-flight
npm run format:check
```

`content:prepare` fails when the profile, approved sources, exact publication
sections, media slug metadata, or recipe links are missing or malformed.

## Structure

```text
config/project-media.json       public media keyed by vault project slug
functions/robots.txt.ts         host-aware production/staging crawl policy
scripts/publication/            strict vault parser and extractor
src/content/blog/               public blog Markdown
src/assets/projects/            public project media
test/fixtures/vault/            fictional CI-only publication source
```

The generated public URLs are `/resume.pdf`,
`/resumes/resume-gameplay.pdf`, and `/resumes/resume-tools.pdf`.

## Deployment

Cloudflare Git deployments are disabled. A manual workflow in the private vault
builds one package from vault `main` plus a requested portfolio commit, deploys
that package to staging, and runs acceptance checks. After review, a separate
manual promotion workflow verifies the site SHA is contained in public `main`
and deploys that exact stored package without rebuilding. The second dispatch is
the production approval gate because required-reviewer environments are not
available on the private repository's current GitHub plan.

Required private-repository configuration:

- Secrets: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`.
- Variable: `CLOUDFLARE_PAGES_PROJECT`.
- Environment: `production`, for deployment history; the separate manual
  promotion dispatch supplies the human approval gate.

See [docs/workflow.md](docs/workflow.md) for promotion and recovery details and
[docs/content.md](docs/content.md) for the publication boundary.
