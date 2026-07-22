import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readdirSync,
  renameSync,
  rmSync,
} from "node:fs";
import { basename, join, relative, resolve } from "node:path";
import YAML from "yaml";
import {
  formatZodErrors,
  knowledgeDocumentSchema,
  publicationRecordSchema,
  resumeRecipeSchema,
} from "@personal/content-contracts";
import {
  localRoot,
  parseArgs,
  personalContentDir,
  resetDirectory,
  writeJsonAtomic,
} from "../common.mjs";

const args = parseArgs();
const sourceRoot = personalContentDir(args);
const encryptedRoot = resolve(sourceRoot, "encrypted");
const recipeRoot = resolve(sourceRoot, "resume-recipes");
const publicationRoot = resolve(sourceRoot, "publications");
const stagingRoot = resolve(localRoot, "preview-staging");
const knowledgeOutput = resolve(stagingRoot, "knowledge");
const recipeOutput = resolve(stagingRoot, "recipes");
const publicationOutput = resolve(stagingRoot, "publications");

if (!existsSync(encryptedRoot)) {
  throw new Error(
    `Encrypted knowledge directory not found at ${encryptedRoot}.`,
  );
}
assertSopsAvailable();
resetDirectory(stagingRoot);
mkdirSync(knowledgeOutput, { recursive: true });
mkdirSync(recipeOutput, { recursive: true });
mkdirSync(publicationOutput, { recursive: true });

const documents = decryptCollection(
  encryptedRoot,
  knowledgeDocumentSchema,
  knowledgeOutput,
);
const recipes = existsSync(recipeRoot)
  ? decryptCollection(recipeRoot, resumeRecipeSchema, recipeOutput)
  : [];
const publications = existsSync(publicationRoot)
  ? decryptCollection(
      publicationRoot,
      publicationRecordSchema,
      publicationOutput,
    )
  : [];

promotePreview("knowledge");
promotePreview("recipes");
promotePreview("publications");
rmSync(stagingRoot, { recursive: true, force: true });

console.log(
  `Prepared ${documents.length} knowledge document(s), ${publications.length} publication source(s), and ${recipes.length} recipe(s) under .local/.`,
);

function promotePreview(name) {
  const source = resolve(stagingRoot, name);
  const destination = resolve(localRoot, name);
  rmSync(destination, { recursive: true, force: true });
  renameSync(source, destination);
}

function decryptCollection(directory, schema, outputDirectory) {
  const paths = walk(directory).filter((path) => path.endsWith(".sops.yaml"));
  const ids = new Set();
  return paths.map((path) => {
    const result = spawnSync("sops", ["--decrypt", path], {
      encoding: "utf8",
      env: process.env,
      windowsHide: true,
    });
    if (result.status !== 0) {
      throw new Error(
        `Unable to decrypt ${relative(sourceRoot, path)}. Check SOPS_AGE_KEY and 1Password access.`,
      );
    }
    const parsed = schema.safeParse(YAML.parse(result.stdout));
    if (!parsed.success) {
      throw new Error(
        `${relative(sourceRoot, path)} is invalid:\n- ${formatZodErrors(parsed.error).join("\n- ")}`,
      );
    }
    if (ids.has(parsed.data.id)) {
      throw new Error(`Duplicate document id ${parsed.data.id}.`);
    }
    ids.add(parsed.data.id);
    writeJsonAtomic(
      join(outputDirectory, `${parsed.data.id}.json`),
      parsed.data,
    );
    return parsed.data;
  });
}

function walk(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? walk(path) : [path];
  });
}

function assertSopsAvailable() {
  const result = spawnSync("sops", ["--version"], {
    encoding: "utf8",
    windowsHide: true,
  });
  if (result.error || result.status !== 0) {
    throw new Error(
      "SOPS is required for knowledge:preview but is not installed or not on PATH.",
    );
  }
}
