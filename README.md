# Portfolio Site

Static Astro portfolio website for projects, devlogs, resume links, and contact
links. The v1 architecture is intentionally simple: Astro, Tailwind 4, Markdown,
GitHub, and Cloudflare Pages.

## Requirements

- Node.js `>=22.12.0`
- npm
- RenderCV for regenerating `public/resume.pdf` locally
- 1Password CLI only for local Cloudflare deploy commands

## Commands

```powershell
npm install
npm run dev
npm run check
npm run build
npm run resume:validate
npm run resume:build
npm run social:build
npm run preview
npm run format:check
```

Heavier quality checks:

```powershell
npm run audit
npm run audit:staging
```

## Project Structure

```text
/
├── docs/
│   └── workflow.md
├── public/
│   ├── images/
│   └── resume.pdf
├── scripts/
│   ├── audit-pages.mjs
│   ├── build-resume.mjs
│   ├── build-social-card.mjs
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
- Draft entries can stay in the repo with `draft: true`; production builds
  exclude them from lists and detail routes.
- Static project and blog images live under `public/images`.
- Resume content lives in `src/data/resume.json`. This is the only manually
  edited resume source for both the `/resume/` page and generated PDF.
- `public/resume.pdf` is generated from `src/data/resume.json` as a one-page A4
  PDF and committed so normal site builds do not require RenderCV.
- Update social links and identity text in `src/site.config.ts` as needed.

Use lowercase kebab-case for content slugs and asset filenames.

### Resume PDF

Install RenderCV in your local Python environment before regenerating the PDF:

```powershell
python -m venv .venv
.\.venv\Scripts\python -m pip install rendercv
```

Update `src/data/resume.json`, then run:

```powershell
npm run resume:validate
npm run resume:build
```

The build script writes temporary RenderCV input under `.resume-build/`, copies
the rendered PDF to `public/resume.pdf`, and fails if the generated PDF is not
exactly one page. Commit the JSON source and PDF together.

## Workflow

Repository workflow conventions live in:

- `AGENTS.md` for coding-agent operating instructions.
- `docs/workflow.md` for branch names, commit frequency, commit messages, PR
  descriptions, verification expectations, and release flow.

Short version:

- `main` is production.
- `staging` is long-lived pre-production.
- Agent branches use `codex/<type>/<short-kebab-summary>`.
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

Check the credentials:

```powershell
op run --env-file ./.env.1password -- npx --yes wrangler whoami
```

Deploy the built `dist` directory:

```powershell
npm run deploy:cloudflare -- --project-name <cloudflare-pages-project-name> --branch main
```

Use `--branch staging` for the staging Pages deployment.
