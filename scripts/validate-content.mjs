import { access, readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectStatuses = new Set([
  "In development",
  "Released",
  "Prototype",
  "On hold",
]);
const projectVariants = new Set(["case-study", "jam-postmortem"]);
const strictMedia = process.argv.includes("--strict-media");
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const projectsDirectory = path.join(root, ".local", "publication", "projects");

function parseScalar(value) {
  const trimmed = value.trim();

  if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
    return JSON.parse(trimmed);
  }

  if (trimmed === "true" || trimmed === "false") {
    return trimmed === "true";
  }

  if (/^\d+$/u.test(trimmed)) {
    return Number(trimmed);
  }

  return trimmed;
}

function parseFrontmatter(source, fileName) {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---/u);
  if (!match) {
    throw new Error(`${fileName}: missing frontmatter`);
  }

  return Object.fromEntries(
    match[1]
      .split(/\r?\n/u)
      .map((line) => line.match(/^([A-Za-z][A-Za-z0-9]*):\s*(.+)$/u))
      .filter(Boolean)
      .map((lineMatch) => [lineMatch[1], parseScalar(lineMatch[2])]),
  );
}

function publicAssetPath(assetPath) {
  return path.join(root, "public", assetPath.replace(/^\//u, ""));
}

/**
 * coverImage goes through Astro's asset pipeline, so it is written relative to
 * the Markdown file that declares it. ogImage stays a site-absolute public path
 * because social crawlers need a stable, unhashed URL.
 */
function localAssetPath(field, assetPath) {
  return field === "coverImage"
    ? path.join(projectsDirectory, assetPath)
    : publicAssetPath(assetPath);
}

const errors = [];
const warnings = [];
const projectFiles = (await readdir(projectsDirectory))
  .filter((fileName) => fileName.endsWith(".md"))
  .sort();
const projects = [];

for (const fileName of projectFiles) {
  const source = await readFile(path.join(projectsDirectory, fileName), "utf8");
  const data = parseFrontmatter(source, fileName);
  const slug = fileName.replace(/\.md$/u, "");
  projects.push({ data, fileName, slug });

  for (const field of ["title", "dateLabel", "order", "variant", "status"]) {
    if (data[field] === undefined || data[field] === "") {
      errors.push(`${fileName}: missing required field ${field}`);
    }
  }

  if (!Number.isInteger(data.order) || data.order <= 0) {
    errors.push(`${fileName}: order must be a positive integer`);
  }

  if (!projectStatuses.has(data.status)) {
    errors.push(`${fileName}: invalid status ${JSON.stringify(data.status)}`);
  }

  if (!projectVariants.has(data.variant)) {
    errors.push(`${fileName}: invalid variant ${JSON.stringify(data.variant)}`);
  }

  if (data.draft !== true) {
    if (!data.coverImage) {
      errors.push(`${fileName}: published projects require coverImage`);
    }

    if (!data.coverAlt) {
      errors.push(`${fileName}: published projects require coverAlt`);
    }

    // ogImage is no longer required: the project page falls back to coverImage,
    // which is mandatory above, so every published project still has a social
    // image. Set ogImage only to override that default.
  }

  for (const field of ["coverImage", "ogImage"]) {
    const assetPath = data[field];
    if (!assetPath) {
      continue;
    }

    try {
      await access(localAssetPath(field, assetPath));
    } catch {
      errors.push(`${fileName}: ${field} does not exist at ${assetPath}`);
    }

    if (assetPath.toLowerCase().includes("placeholder")) {
      const message = `${fileName}: ${field} still uses placeholder media`;
      if (data.mediaPending === true && !strictMedia) {
        warnings.push(message);
      } else {
        errors.push(message);
      }
    }
  }

  if (data.mediaPending === true) {
    const message = `${fileName}: mediaPending must be false for release`;
    if (strictMedia) {
      errors.push(message);
    } else {
      warnings.push(message);
    }
  }
}

const projectsByOrder = new Map();
for (const project of projects) {
  const existing = projectsByOrder.get(project.data.order);
  if (existing) {
    errors.push(
      `${project.fileName}: order ${project.data.order} is already used by ${existing}`,
    );
  } else {
    projectsByOrder.set(project.data.order, project.fileName);
  }
}

const resume = JSON.parse(
  await readFile(
    path.join(root, ".local", "publication", "resumes", "general.json"),
    "utf8",
  ),
);
const resumeProjectsBySiteUrl = new Map(
  resume.projects
    .filter((project) => project.siteUrl)
    .map((project) => [project.siteUrl, project]),
);
const resumeProjectsByName = new Map(
  resume.projects.map((project) => [project.name, project]),
);

for (const project of projects) {
  const siteUrl = `/projects/${project.slug}/`;
  const resumeProject =
    resumeProjectsBySiteUrl.get(siteUrl) ??
    resumeProjectsByName.get(project.data.title);

  if (!resumeProject) {
    continue;
  }

  if (resumeProject.name !== project.data.title) {
    errors.push(
      `${project.fileName}: resume name ${JSON.stringify(resumeProject.name)} does not match ${JSON.stringify(project.data.title)}`,
    );
  }

  if (resumeProject.role && resumeProject.role !== project.data.role) {
    errors.push(
      `${project.fileName}: resume role ${JSON.stringify(resumeProject.role)} does not match ${JSON.stringify(project.data.role)}`,
    );
  }

  if (
    resumeProject.dateLabel &&
    resumeProject.dateLabel !== project.data.dateLabel
  ) {
    errors.push(
      `${project.fileName}: resume dateLabel ${JSON.stringify(resumeProject.dateLabel)} does not match ${JSON.stringify(project.data.dateLabel)}`,
    );
  }

  if (resumeProject.url && resumeProject.url !== project.data.externalUrl) {
    errors.push(
      `${project.fileName}: resume URL does not match the project externalUrl`,
    );
  }
}

for (const warning of warnings) {
  console.warn(`Warning: ${warning}`);
}

if (errors.length > 0) {
  for (const error of errors) {
    console.error(`Error: ${error}`);
  }
  process.exitCode = 1;
} else {
  console.log(
    `Validated ${projects.length} project entries${warnings.length > 0 ? ` with ${warnings.length} pending media warning(s)` : ""}.`,
  );
}
