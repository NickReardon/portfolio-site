import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { loadEnvFile } from "node:process";
import YAML from "yaml";
import { extractPublication, loadMediaConfig } from "./publication/extract.mjs";

if (existsSync(".env.local")) loadEnvFile(".env.local");
const vault = option("vault") ?? process.env.OBSIDIAN_VAULT_DIR;
if (!vault)
  throw new Error(
    "Pass --vault <path> or set OBSIDIAN_VAULT_DIR in .env.local.",
  );

const outputRoot = resolve(".local/publication");
const media = loadMediaConfig(resolve("config/project-media.json"));
const publication = extractPublication(resolve(vault), media);

rmSync(outputRoot, { recursive: true, force: true });
mkdirSync(resolve(outputRoot, "projects"), { recursive: true });
mkdirSync(resolve(outputRoot, "resumes"), { recursive: true });

writeJson(
  resolve(outputRoot, "profile.json"),
  publicProfile(publication.profile),
);
for (const [target, resume] of Object.entries(publication.resumes)) {
  writeJson(resolve(outputRoot, "resumes", `${target}.json`), resume);
}
for (const project of publication.projects) {
  writeFileSync(
    resolve(outputRoot, "projects", `${project.slug}.md`),
    renderProject(project),
  );
}

console.log(
  `Prepared ${publication.projects.length} approved projects and ${Object.keys(publication.resumes).length} resume recipes.`,
);

function renderProject(project) {
  const { slug, caseStudy, coverImage, ...frontmatter } = project;
  if (coverImage)
    frontmatter.coverImage = `../../../src/assets/projects/${coverImage}`;
  frontmatter.draft = false;
  return `---\n${YAML.stringify(frontmatter).trim()}\n---\n\n${caseStudy.trim()}\n`;
}

function publicProfile(profile) {
  const { recipeMarkdown, summaries, skills, ...siteProfile } = profile;
  return siteProfile;
}

function writeJson(path, value) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}

function option(name) {
  const args = process.argv.slice(2);
  const index = args.indexOf(`--${name}`);
  if (index >= 0) return args[index + 1];
  const inline = args.find((arg) => arg.startsWith(`--${name}=`));
  return inline?.slice(name.length + 3);
}
