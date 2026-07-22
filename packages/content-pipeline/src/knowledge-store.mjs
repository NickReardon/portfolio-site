import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import MiniSearch from "minisearch";
import { localRoot, readJson } from "./common.mjs";
import {
  loadPublicationRecords,
  publicationToKnowledgeDocument,
} from "./publication-store.mjs";

export const miniSearchOptions = {
  fields: [
    "title",
    "summary",
    "body",
    "tags",
    "skills",
    "roles",
    "evidenceText",
  ],
  storeFields: ["id", "title", "type", "summary", "tags", "skills", "roles"],
  searchOptions: {
    boost: { title: 3, tags: 2, skills: 2, roles: 2 },
    prefix: true,
  },
};

export function loadKnowledgeDocuments() {
  const directory = resolve(localRoot, "knowledge");
  if (!existsSync(directory)) {
    throw new Error(
      "Knowledge preview is missing. Run pnpm knowledge:preview first.",
    );
  }
  return readdirSync(directory)
    .filter((name) => name.endsWith(".json"))
    .sort()
    .map((name) => readJson(join(directory, name)));
}

export function loadResumeSourceDocuments() {
  return [
    ...loadKnowledgeDocuments(),
    ...loadPublicationRecords().map(publicationToKnowledgeDocument),
  ];
}

export function toSearchDocument(document) {
  return {
    ...document,
    tags: document.tags.join(" "),
    skills: document.skills.join(" "),
    roles: document.roles.join(" "),
    evidenceText: document.evidence
      .map((item) => [item.claim, item.details, ...item.metrics].join(" "))
      .join(" "),
  };
}

export function loadIndex() {
  const path = resolve(localRoot, "index", "knowledge-index.json");
  if (!existsSync(path)) {
    throw new Error(
      "Knowledge index is missing. Run pnpm knowledge:index first.",
    );
  }
  return MiniSearch.loadJSON(readFileSync(path, "utf8"), miniSearchOptions);
}

export function searchKnowledge(query, tags = [], limit = 12) {
  const index = loadIndex();
  const normalizedTags = tags.map((tag) => tag.toLowerCase());
  return index
    .search(query || "*", {
      ...miniSearchOptions.searchOptions,
      combineWith: "OR",
      filter: (result) => {
        if (normalizedTags.length === 0) return true;
        const resultTags = String(result.tags ?? "")
          .toLowerCase()
          .split(/\s+/u);
        return normalizedTags.every((tag) => resultTags.includes(tag));
      },
    })
    .slice(0, limit);
}
