import { existsSync, readFileSync } from "node:fs";
import { isAbsolute, relative, resolve } from "node:path";
import {
  resumeRecipeSchema,
  formatZodErrors,
} from "@personal/content-contracts";
import {
  localRoot,
  parseArgs,
  platformRoot,
  readJson,
  requireOption,
  writeJsonAtomic,
} from "../common.mjs";
import {
  loadResumeSourceDocuments,
  searchKnowledge,
} from "../knowledge-store.mjs";

const args = parseArgs();
const recipeId = requireOption(args, "recipe");
const recipePath = resolve(localRoot, "recipes", `${recipeId}.json`);
if (!existsSync(recipePath))
  throw new Error(`Recipe ${recipeId} is unavailable. Run knowledge:preview.`);
const parsedRecipe = resumeRecipeSchema.safeParse(readJson(recipePath));
if (!parsedRecipe.success)
  throw new Error(formatZodErrors(parsedRecipe.error).join("\n"));
const recipe = parsedRecipe.data;
const jobText = readJobText(args.options.get("job"));
const query = [...recipe.priorities, jobText].join(" ").slice(0, 12000);
const matches = searchKnowledge(
  query,
  [],
  Number(args.options.get("limit") ?? 12),
);
const excluded = new Set(recipe.excludeTags.map((tag) => tag.toLowerCase()));
const matchIds = matches
  .filter(
    (match) =>
      !String(match.tags ?? "")
        .split(/\s+/u)
        .some((tag) => excluded.has(tag.toLowerCase())),
  )
  .map((match) => match.id);
const documentsById = new Map(
  loadResumeSourceDocuments().map((document) => [document.id, document]),
);
const documents = matchIds.map((id) => documentsById.get(id)).filter(Boolean);
const id = String(
  args.options.get("id") ??
    `${recipe.id}-${new Date().toISOString().replace(/\D/gu, "").slice(0, 14)}`,
);
const publicResume = readJson(
  resolve(platformRoot, "content", "public", "resume.json"),
);
const createdAt = new Date().toISOString();
const packet = {
  schemaVersion: 1,
  id,
  createdAt,
  recipe,
  jobDescription: jobText || null,
  documents,
  instructions: [
    "Create or edit the matching .local/resume-drafts JSON file.",
    "Use only claims supported by the included evidence records.",
    "Add one provenance entry for every project and work highlight.",
    "Do not invent metrics, dates, titles, employers, or project names.",
    "Run resume:validate and resume:render before requesting publication.",
  ],
};
const draft = {
  schemaVersion: 1,
  id,
  recipeId: recipe.id,
  createdAt,
  resume: publicResume,
  provenance: [],
};
const packetPath = resolve(localRoot, "resume-packets", `${id}.json`);
const draftPath = resolve(localRoot, "resume-drafts", `${id}.json`);
writeJsonAtomic(packetPath, packet);
writeJsonAtomic(draftPath, draft);
console.log(`Resume packet: ${relative(platformRoot, packetPath)}`);
console.log(`Starter draft: ${relative(platformRoot, draftPath)}`);
console.log(
  "The starter intentionally fails evidence validation until an agent supplies provenance.",
);

function readJobText(value) {
  if (!value || value === true) return "";
  const path = resolve(platformRoot, value);
  const localPath = relative(resolve(localRoot), path);
  if (localPath.startsWith("..") || isAbsolute(localPath)) {
    throw new Error("Job descriptions must be stored under .local/.");
  }
  if (!existsSync(path))
    throw new Error(`Job description not found at ${path}.`);
  return readFileSync(path, "utf8");
}
