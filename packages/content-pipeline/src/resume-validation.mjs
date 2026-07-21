import { existsSync, readFileSync } from "node:fs";
import { basename, resolve } from "node:path";
import {
  formatZodErrors,
  resumeDraftSchema,
  resumeRecipeSchema,
} from "@personal/content-contracts";
import { localRoot, readJson } from "./common.mjs";
import { loadKnowledgeDocuments } from "./knowledge-store.mjs";

export function resolveDraftPath(value) {
  if (value.includes("/") || value.includes("\\") || value.endsWith(".json")) {
    return resolve(value);
  }
  return resolve(localRoot, "resume-drafts", `${value}.json`);
}

export function validateDraftFile(path) {
  if (!existsSync(path)) throw new Error(`Resume draft not found at ${path}.`);
  const draft = readJson(path);
  const schemaResult = resumeDraftSchema.safeParse(draft);
  if (!schemaResult.success) {
    return { draft, errors: formatZodErrors(schemaResult.error) };
  }

  const errors = [];
  const recipePath = resolve(localRoot, "recipes", `${draft.recipeId}.json`);
  if (!existsSync(recipePath)) {
    errors.push(`Recipe ${draft.recipeId} is not available in .local/recipes.`);
    return { draft, errors };
  }
  const recipeResult = resumeRecipeSchema.safeParse(readJson(recipePath));
  if (!recipeResult.success) {
    errors.push(...formatZodErrors(recipeResult.error));
    return { draft, errors };
  }
  const recipe = recipeResult.data;
  const documents = loadKnowledgeDocuments();
  const documentsById = new Map(
    documents.map((document) => [document.id, document]),
  );
  const expectedPaths = collectHighlightPaths(draft.resume);
  const provenanceByPath = new Map();

  for (const provenance of draft.provenance) {
    if (provenanceByPath.has(provenance.path)) {
      errors.push(`Duplicate provenance entry for ${provenance.path}.`);
      continue;
    }
    provenanceByPath.set(provenance.path, provenance);
    const document = documentsById.get(provenance.sourceDocumentId);
    if (!document) {
      errors.push(
        `${provenance.path} references unknown document ${provenance.sourceDocumentId}.`,
      );
      continue;
    }
    const evidenceById = new Map(
      document.evidence.map((item) => [item.id, item]),
    );
    for (const evidenceId of provenance.evidenceIds) {
      if (!evidenceById.has(evidenceId)) {
        errors.push(
          `${provenance.path} references unknown evidence ${evidenceId} in ${document.id}.`,
        );
      }
    }
    validateMetrics(
      draft,
      provenance.path,
      provenance.evidenceIds.map((id) => evidenceById.get(id)).filter(Boolean),
      errors,
    );
  }

  if (recipe.constraints.requireEvidence) {
    for (const path of expectedPaths) {
      if (!provenanceByPath.has(path))
        errors.push(`${path} is missing provenance.`);
    }
  }
  for (const path of provenanceByPath.keys()) {
    if (!expectedPaths.has(path))
      errors.push(`${path} does not resolve to a resume highlight.`);
  }
  if (draft.resume.projects.length > recipe.constraints.projectCount) {
    errors.push(
      `Resume has ${draft.resume.projects.length} projects; recipe allows ${recipe.constraints.projectCount}.`,
    );
  }
  draft.resume.projects.forEach((project, index) => {
    if (
      (project.highlights ?? []).length > recipe.constraints.bulletsPerProject
    ) {
      errors.push(
        `projects[${index}] exceeds the ${recipe.constraints.bulletsPerProject}-bullet limit.`,
      );
    }
  });
  validateDocumentDates(draft.resume, documentsById, draft.provenance, errors);
  return { draft, recipe, errors };
}

function collectHighlightPaths(resume) {
  const paths = new Set();
  for (const section of ["projects", "work"]) {
    (resume[section] ?? []).forEach((entry, entryIndex) => {
      (entry.highlights ?? []).forEach((_, highlightIndex) => {
        paths.add(`${section}[${entryIndex}].highlights[${highlightIndex}]`);
      });
    });
  }
  return paths;
}

function valueAtPath(draft, path) {
  const match = path.match(/^(projects|work)\[(\d+)\]\.highlights\[(\d+)\]$/u);
  if (!match) return undefined;
  return draft.resume[match[1]]?.[Number(match[2])]?.highlights?.[
    Number(match[3])
  ];
}

function validateMetrics(draft, path, evidence, errors) {
  const bullet = valueAtPath(draft, path) ?? "";
  const numericClaims = bullet.match(/\b\d+(?:\.\d+)?%?\b/gu) ?? [];
  if (numericClaims.length === 0) return;
  const evidenceText = evidence
    .flatMap((item) => [item.claim, item.details, ...item.metrics])
    .join(" ");
  for (const value of new Set(numericClaims)) {
    if (!evidenceText.includes(value)) {
      errors.push(
        `${path} contains numeric claim ${value} that is absent from its evidence.`,
      );
    }
  }
}

function validateDocumentDates(resume, documentsById, provenance, errors) {
  for (const section of ["projects", "work"]) {
    (resume[section] ?? []).forEach((entry, index) => {
      const first = provenance.find((item) =>
        item.path.startsWith(`${section}[${index}].`),
      );
      if (!first) return;
      const document = documentsById.get(first.sourceDocumentId);
      if (
        !document ||
        normalize(document.title) !== normalize(entry.name ?? entry.title ?? "")
      )
        return;
      for (const field of ["startDate", "endDate"]) {
        if (
          document[field] &&
          entry[field] &&
          document[field] !== entry[field]
        ) {
          errors.push(
            `${section}[${index}].${field} does not match source document ${document.id}.`,
          );
        }
      }
    });
  }
}

function normalize(value) {
  return value.toLowerCase().replace(/[^a-z0-9]/gu, "");
}
