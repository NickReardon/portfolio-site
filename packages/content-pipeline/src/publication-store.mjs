import { existsSync, readFileSync, readdirSync } from "node:fs";
import { isAbsolute, join, relative, resolve } from "node:path";
import {
  publicationRecordSchema,
  formatZodErrors,
} from "@personal/content-contracts";
import { localRoot, platformRoot, readJson } from "./common.mjs";

const allowedOutputPatterns = [
  /^content\/public\/(resume|site)\.json$/u,
  /^apps\/web\/src\/content\/(projects|blog)\/[a-z0-9][a-z0-9-]*\.md$/u,
];

export function loadPublicationRecords() {
  const directory = resolve(localRoot, "publications");
  if (!existsSync(directory)) return [];
  return readdirSync(directory)
    .filter((name) => name.endsWith(".json"))
    .sort()
    .map((name) => {
      const result = publicationRecordSchema.safeParse(
        readJson(join(directory, name)),
      );
      if (!result.success) {
        throw new Error(
          `${name} is invalid:\n- ${formatZodErrors(result.error).join("\n- ")}`,
        );
      }
      return result.data;
    });
}

export function resolvePublicationTarget(record) {
  const normalized = record.outputPath
    .replaceAll("\\", "/")
    .replace(/^\.\//u, "");
  if (!allowedOutputPatterns.some((pattern) => pattern.test(normalized))) {
    throw new Error(
      `Publication ${record.id} targets forbidden path ${record.outputPath}.`,
    );
  }
  const target = resolve(platformRoot, normalized);
  const relativePath = relative(platformRoot, target);
  if (relativePath.startsWith("..") || isAbsolute(relativePath)) {
    throw new Error(
      `Publication ${record.id} resolves outside the public platform.`,
    );
  }
  return target;
}

export function validatePublicationContent(record) {
  if (record.format === "json") {
    try {
      JSON.parse(record.content);
    } catch (error) {
      throw new Error(
        `Publication ${record.id} contains invalid JSON: ${error.message}`,
      );
    }
    if (!record.content.endsWith("\n")) {
      throw new Error(`Publication ${record.id} must end with a newline.`);
    }
    return;
  }
  if (
    !record.content.startsWith("---\n") ||
    !record.content.includes("\n---\n")
  ) {
    throw new Error(
      `Publication ${record.id} must contain Markdown frontmatter.`,
    );
  }
  if (!record.content.endsWith("\n")) {
    throw new Error(`Publication ${record.id} must end with a newline.`);
  }
}

export function publicationToKnowledgeDocument(record) {
  return {
    schemaVersion: 1,
    id: `publication-${record.id}`,
    type: "note",
    title: record.title,
    tags: record.tags,
    skills: record.skills,
    roles: record.roles,
    summary: record.summary,
    body: record.content,
    evidence: [
      {
        id: "approved-publication",
        claim: record.summary,
        details: record.content,
        metrics: [],
        sources: [record.outputPath],
      },
    ],
  };
}

export function publicationDrift(record) {
  const target = resolvePublicationTarget(record);
  validatePublicationContent(record);
  if (!existsSync(target)) return "missing";
  return readFileSync(target, "utf8") === record.content ? null : "different";
}
