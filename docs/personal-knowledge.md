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

Validation and rendering are safe local operations. Publication requires both a
valid draft and the explicit `--approve-publication` flag. The pipeline renders
to a local staging directory first, then replaces only
`content/public/resume.json` and `apps/web/public/resume.pdf`.

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
