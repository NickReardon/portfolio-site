import { readFileSync, readdirSync, rmSync } from "node:fs";
import { basename, extname, resolve } from "node:path";
import YAML from "yaml";
import {
  localRoot,
  parseArgs,
  personalContentDir,
  platformRoot,
  resetDirectory,
} from "../common.mjs";
import { encryptCanonicalPublication } from "../canonical-publication.mjs";

const args = parseArgs();
if (args.options.get("approve-adoption") !== true) {
  throw new Error(
    "Adopting current public content as canonical requires --approve-adoption.",
  );
}
const sourceRoot = personalContentDir(args);
const records = collectCurrentPublications();
const adoptionRoot = resolve(localRoot, "content-adoption");
resetDirectory(adoptionRoot);
for (const record of records) {
  encryptCanonicalPublication(record, {
    sourceRoot,
    stagingRoot: adoptionRoot,
    replace: args.options.get("replace") === true,
  });
}
rmSync(adoptionRoot, { recursive: true, force: true });
console.log(
  `Adopted ${records.length} public artifact(s) into encrypted canonical sources.`,
);

function collectCurrentPublications() {
  const records = [];
  records.push(
    jsonRecord("site-profile", "content/public/site.json", ["profile"]),
  );
  records.push(jsonRecord("resume", "content/public/resume.json", []));
  records.push(
    ...markdownRecords("apps/web/src/content/projects", "project", (slug) => [
      `project-${slug}`,
    ]),
  );
  records.push(
    ...markdownRecords("apps/web/src/content/blog", "blog", () => []),
  );
  return records;
}

function jsonRecord(id, outputPath, knowledgeDocumentIds) {
  const content = readFileSync(resolve(platformRoot, outputPath), "utf8");
  const value = JSON.parse(content);
  const isResume = id === "resume";
  return {
    schemaVersion: 1,
    id,
    title: isResume ? "Public resume" : "Public site profile and page copy",
    format: "json",
    outputPath,
    summary: isResume ? value.basics.summary : value.identity.description,
    tags: isResume ? ["resume", "public"] : ["profile", "website", "public"],
    skills: [],
    roles: isResume ? [value.basics.label] : [value.identity.role],
    knowledgeDocumentIds,
    content,
  };
}

function markdownRecords(directory, kind, knowledgeIds) {
  const absoluteDirectory = resolve(platformRoot, directory);
  return readdirSync(absoluteDirectory)
    .filter((name) => name.endsWith(".md"))
    .sort()
    .map((name) => {
      const slug = basename(name, extname(name));
      const outputPath = `${directory}/${name}`;
      const content = readFileSync(resolve(platformRoot, outputPath), "utf8");
      const frontmatter = parseFrontmatter(content, outputPath);
      return {
        schemaVersion: 1,
        id: `${kind}-${slug}`,
        title: frontmatter.title,
        format: "markdown",
        outputPath,
        summary: frontmatter.description,
        tags: Array.isArray(frontmatter.tags)
          ? frontmatter.tags.map(String)
          : [],
        skills: frontmatter.engine ? [String(frontmatter.engine)] : [],
        roles: frontmatter.role ? [String(frontmatter.role)] : [],
        knowledgeDocumentIds: knowledgeIds(slug),
        content,
      };
    });
}

function parseFrontmatter(content, path) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/u);
  if (!match) throw new Error(`Markdown frontmatter is missing from ${path}.`);
  return YAML.parse(match[1]);
}
