# Personal Platform

Public pnpm monorepo for Nicholas Reardon's Astro portfolio, public resume,
resume renderer, and local personal-knowledge publishing pipeline. Private
source material lives in the encrypted sibling repository
[`personal-content`](https://github.com/NickReardon/personal-content).

The deployment boundary is deliberate: Astro and Cloudflare consume only
`content/public` and `apps/web/public`. They never require the private
repository, SOPS, age, 1Password, or decrypted local material.

## Requirements

- Node.js `>=22.12.0`
- pnpm `11.9.0`
- RenderCV with the `full` extra for PDF generation
- SOPS and age for private knowledge documents
- 1Password CLI for private decryption and local Cloudflare deployment

```powershell
pnpm install
python -m venv .venv
.\.venv\Scripts\python -m pip install "rendercv[full]"
```

## Structure

```text
personal-platform/
├── apps/
│   ├── web/                    # Astro site and public static assets
│   └── resume-generator/       # RenderCV adapter
├── packages/
│   ├── content-contracts/      # Knowledge, recipe, draft, and public schemas
│   └── content-pipeline/       # Search, validation, rendering, publication
├── content/public/             # Approved site and resume snapshots
├── .local/                     # Ignored builds, previews, indexes, and drafts
└── pnpm-workspace.yaml
```

The private sibling defaults to `../personal-content`. Override it in the
ignored `.env.local` when needed:

```dotenv
PERSONAL_CONTENT_DIR=D:\Web\personal-content
SOPS_AGE_KEY="op://Developer/Personal Content age identity/notesPlain"
```

## Website Commands

```powershell
pnpm dev
pnpm check
pnpm build
pnpm preview
pnpm format:check
pnpm privacy:check
```

Local production builds are written to `.local/build/web`. Cloudflare Pages
injects `CF_PAGES=1`, which makes the same build write to the repository-level
`dist` directory expected by the existing Pages project. Keep the Pages build
command as `npm run build` (or `pnpm build`) and its output directory as `dist`.
Project and blog Markdown snapshots remain under `apps/web/src/content`, and
public images and PDFs live under `apps/web/public`.

## Canonical Website Content

The encrypted sibling repository is the canonical authoring source for public
profile copy, project and blog documents, and the public resume. Cloudflare uses
only the approved snapshots committed here.

```powershell
pnpm knowledge:preview
pnpm content:verify
pnpm content:publish -- --approve-publication
```

`content:verify` fails when a public snapshot differs from its canonical source.
`content:publish` is the explicit private-to-public promotion boundary. The
one-time `content:adopt -- --approve-adoption` command exists for intentional
migrations and is not the normal authoring path.

## Knowledge and Resume Workflow

Private documents are SOPS-encrypted YAML with stable document and evidence
IDs. Decryption and indexes stay under `.local/`:

```powershell
pnpm knowledge:preview
pnpm knowledge:index
pnpm knowledge:search -- "persistence designer workflows" --tags gameplay,systems
```

Prepare an evidence packet and starter draft:

```powershell
pnpm resume:prepare -- --recipe gameplay-programmer
pnpm resume:prepare -- --recipe gameplay-programmer --job .local/jobs/example.txt
```

Codex reads the reported packet, condenses supported facts into the matching
draft JSON, and adds provenance for every work and project bullet. Then run:

```powershell
pnpm resume:validate -- --draft <id>
pnpm resume:render -- --draft <id>
```

Rendering writes only to `.local/resumes/<id>`. After human review, explicitly
publish the approved snapshot and canonical PDF:

```powershell
pnpm resume:publish -- --draft <id> --approve-publication
```

Publication fails for unknown evidence, missing provenance, mismatched source
dates, unsupported numeric claims, or recipe limits. It strips provenance from
the public JSON. Everything intentionally included in the published resume is
considered public.

The existing public snapshot can be validated or regenerated independently of
private content:

```powershell
pnpm resume:validate:public
pnpm resume:build
```

## Privacy Boundary

`pnpm privacy:check` examines tracked and staged files and rejects `.local`,
decrypted/private artifacts, SOPS source files, literal age identities, local
environment files, and nested copies of `personal-content`. It does not reject
ordinary resume facts.

Local agents may read the private sibling repository for knowledge, website,
and resume tasks. They must not copy private values into public patches, logs,
fixtures, or commit messages except through reviewed content or resume
publication.

## Deployment and Workflow

- `main` deploys production at `https://nick-reardon.com`.
- `staging` deploys pre-production at `https://staging.nick-reardon.com`.
- Cloudflare receives no personal-content path, SOPS identity, or 1Password key.
- Production promotion remains a pull request from `staging` to `main`.

Local Wrangler deployment still uses `.env.1password`:

```powershell
Copy-Item .env.1password.example .env.1password
pnpm deploy:cloudflare -- --project-name <project-name> --branch staging
```

See [docs/content.md](docs/content.md),
[docs/personal-knowledge.md](docs/personal-knowledge.md), and
[docs/workflow.md](docs/workflow.md) for detailed authoring and release rules.
