# Personal Knowledge and Resume Workflow

## Data Model

Private knowledge documents are SOPS-encrypted YAML in the sibling
`personal-content` repository. Each decrypted document must include:

- `schemaVersion`, stable `id`, `type`, and `title`.
- Optional start and end dates.
- Tags, skills, and role categories for retrieval.
- A searchable summary and long-form body.
- Evidence records with stable IDs, claims, details, verified metrics, and
  source labels.

Resume recipes define retrieval priorities, excluded tags, page and project
limits, bullet limits, and whether evidence is mandatory.

Encrypted publication records are the canonical source for public site copy,
project and blog Markdown, and the public resume JSON. `knowledge:preview`
decrypts both knowledge documents and publication records under `.local/`, and
`knowledge:index` makes both source classes searchable.

## Website and Resume Source Publication

The initial migration command is intentionally guarded and should only be used
to adopt an existing public artifact deliberately:

```powershell
pnpm content:adopt -- --approve-adoption
```

Normal authoring flows from the encrypted canonical record to a reviewable
public snapshot:

```powershell
pnpm knowledge:preview
pnpm content:verify
pnpm content:publish -- --approve-publication
```

`content:publish` validates every record and restricts outputs to the approved
site JSON, resume JSON, and Astro project/blog content directories. It cannot
overwrite application code. Cloudflare consumes only the committed snapshots.

## Agent Drafting Contract

`resume:prepare` writes an ignored packet and starter draft. An agent may rewrite
the resume but must:

1. Use only facts supported by packet evidence.
2. Add one provenance entry for every project and work highlight.
3. Preserve structured names, dates, titles, and employers unless the source
   documents support a change.
4. Never invent or infer a numeric metric.
5. Leave packets, drafts, job descriptions, and rendered previews in `.local/`.

Provenance uses paths such as `projects[0].highlights[2]` with a source document
ID and one or more evidence IDs. It remains private and is removed during
publication.

## Publication

Validation and rendering are safe local operations. Resume publication requires
both a valid draft and the explicit `--approve-publication` flag. It first
encrypts the reviewed resume into its canonical `personal-content` publication
record, then updates the public resume snapshot and PDF.

Always review the local PDF before publishing. After publication, run:

```powershell
pnpm privacy:check
pnpm check
pnpm build
pnpm format:check
```

## Encryption Operations

The age private identity is stored in the 1Password `Developer` vault. The
public recipient is committed in the private repository's `.sops.yaml`.

```powershell
op run --env-file .\.env.local -- sops edit ..\personal-content\encrypted\projects\tethered.sops.yaml
pnpm knowledge:preview
pnpm knowledge:index
```

Never print decrypted documents or the age identity in automation logs. Key
rotation must update every encrypted document before the old identity is
removed.
