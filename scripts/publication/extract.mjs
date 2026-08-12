import { existsSync, readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  directSections,
  exactSection,
  markdownBullets,
  markdownParagraphs,
  parseLinks,
  parseNamedList,
  parseSkills,
  readFrontmatter,
  readNote,
  resumeTargets,
  validateExactNames,
  validatePublicationState,
  wikiTarget,
} from "./markdown.mjs";

const allowedFields = new Set([
  "type",
  "title",
  "entry_type",
  "status",
  "organization",
  "role",
  "start_date",
  "end_date",
  "career_categories",
  "portfolio_status",
  "portfolio_slug",
  "portfolio_featured",
  "resume_status",
]);

const profilePath = "career/Framings/Portfolio Profile.md";

export function extractPublication(vaultDir, mediaConfig) {
  const root = resolve(vaultDir);
  const notes = indexNotes(root);
  const profile = approvedNote(
    notes,
    profilePath,
    ["portfolio_status", "resume_status"],
    "portfolio profile",
  );
  const profileData = extractProfile(profile);
  const projects = extractProjects(notes, mediaConfig);
  const resumes = Object.fromEntries(
    resumeTargets.map((target) => [
      target,
      extractResume(target, profile, profileData, notes, projects),
    ]),
  );
  return { profile: profileData, projects, resumes };
}

function indexNotes(root) {
  const careerRoot = resolve(root, "career");
  if (!existsSync(careerRoot)) throw new Error("Vault is missing career/.");
  const notes = new Map();
  walk(careerRoot, (path) => {
    const normalized = path.slice(root.length + 1).replaceAll("\\", "/");
    if (/^career\/Private(?:\/|$)/iu.test(normalized)) return;
    const parsedData = readFrontmatter(path);
    const publicData = Object.fromEntries(
      Object.entries(parsedData).filter(([key]) => allowedFields.has(key)),
    );
    validatePublicationState(
      publicData.portfolio_status,
      "portfolio_status",
      normalized,
    );
    validatePublicationState(
      publicData.resume_status,
      "resume_status",
      normalized,
    );
    notes.set(normalized, {
      data: publicData,
      path: normalized,
      filePath: path,
    });
  });
  return notes;
}

function walk(directory, visit) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) walk(path, visit);
    else if (entry.isFile() && entry.name.endsWith(".md")) visit(path);
  }
}

function extractProfile(note) {
  const h2 = directSections(note.body, 2, note.path);
  validateExactNames(
    h2,
    ["Portfolio Copy", "Resume Summary", "Resume Skills", "Resume Recipes"],
    ["Portfolio Copy", "Resume Summary", "Resume Skills", "Resume Recipes"],
    note.path,
  );
  const copy = directSections(h2.get("Portfolio Copy"), 3, note.path);
  validateExactNames(
    copy,
    ["Name", "Role", "Focus", "Homepage", "About", "Contact", "Public Links"],
    ["Name", "Role", "Focus", "Homepage", "About", "Contact", "Public Links"],
    note.path,
  );
  const summaries = targetSections(h2.get("Resume Summary"), note.path);
  const skills = targetSections(h2.get("Resume Skills"), note.path);
  const recipes = targetSections(h2.get("Resume Recipes"), note.path);
  const contact = parseNamedList(copy.get("Contact"), `${note.path} Contact`);
  const contactParagraphs = markdownParagraphs(copy.get("Contact"));
  const links = Object.fromEntries(
    parseLinks(copy.get("Public Links"), `${note.path} Public Links`).map(
      ({ name, url }) => [name.toLowerCase(), url],
    ),
  );
  return {
    name: singleLine(copy.get("Name"), "Name"),
    role: singleLine(copy.get("Role"), "Role"),
    focus: singleLine(copy.get("Focus"), "Focus"),
    homepage: markdownParagraphs(copy.get("Homepage")),
    about: markdownParagraphs(copy.get("About")),
    contact: {
      intro:
        contactParagraphs.find((paragraph) => !paragraph.startsWith("- ")) ??
        "",
      email: contact.Email,
      phone: contact.Phone,
      location: contact.Location,
    },
    links,
    summaries: Object.fromEntries(
      resumeTargets.map((target) => [
        target,
        markdownParagraphs(summaries.get(title(target))).join("\n\n"),
      ]),
    ),
    skills: Object.fromEntries(
      resumeTargets.map((target) => [
        target,
        parseSkills(
          skills.get(title(target)),
          `${note.path} ${title(target)} skills`,
        ),
      ]),
    ),
    recipeMarkdown: Object.fromEntries(
      resumeTargets.map((target) => [target, recipes.get(title(target))]),
    ),
  };
}

function targetSections(markdown, label) {
  const sections = directSections(markdown, 3, label);
  validateExactNames(
    sections,
    ["General", "Gameplay", "Tools"],
    ["General", "Gameplay", "Tools"],
    label,
  );
  return sections;
}

function extractProjects(notes, mediaConfig) {
  const projects = [];
  const slugs = new Set();
  for (const indexed of notes.values()) {
    if (indexed.data.portfolio_status !== "approved") continue;
    if (indexed.path === profilePath) continue;
    if (indexed.data.entry_type !== "project") {
      throw new Error(
        `${indexed.path}: only project entries may be portfolio-approved.`,
      );
    }
    const note = hydrate(indexed);
    const slug = note.data.portfolio_slug;
    if (!slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(slug)) {
      throw new Error(
        `${note.path}: approved project requires a valid portfolio_slug.`,
      );
    }
    if (slugs.has(slug)) throw new Error(`Duplicate portfolio slug: ${slug}.`);
    slugs.add(slug);
    const media = mediaConfig[slug];
    if (!media)
      throw new Error(
        `${note.path}: no public media metadata for slug ${slug}.`,
      );
    const publication = exactSection(note.body, 2, "Portfolio Copy", note.path);
    const sections = directSections(publication, 3, note.path);
    validateExactNames(
      sections,
      ["Summary", "Case Study", "Links"],
      ["Summary", "Case Study"],
      note.path,
    );
    const links = sections.has("Links")
      ? parseLinks(sections.get("Links"), `${note.path} Links`)
      : [];
    const external = links[0];
    projects.push({
      slug,
      title: requiredString(note.data.title, note.path, "title"),
      description: markdownParagraphs(sections.get("Summary")).join(" "),
      caseStudy: sections.get("Case Study"),
      date: note.data.start_date ?? note.data.end_date ?? "2000-01-01",
      dateLabel: formatDateLabel(note.data),
      role: note.data.role,
      featured: note.data.portfolio_featured === true,
      externalUrl: external?.url,
      externalLabel: external?.name,
      ...media,
    });
  }
  return projects.sort((a, b) => a.order - b.order);
}

function extractResume(target, profile, profileData, notes, projects) {
  const recipe = parseRecipe(
    profileData.recipeMarkdown[target],
    `${profile.path} ${title(target)} recipe`,
  );
  const seen = new Set();
  const output = { projects: [], work: [], education: [] };
  for (const item of recipe) {
    if (seen.has(item.target))
      throw new Error(
        `${profile.path}: duplicate recipe source ${item.target}.`,
      );
    seen.add(item.target);
    const note = approvedNote(
      notes,
      `${item.target}.md`,
      ["resume_status"],
      `${target} recipe source`,
    );
    if (item.kind === "project") {
      if (note.data.entry_type !== "project")
        throw new Error(`${note.path}: recipe target is not a project.`);
      const highlights = item.sources
        .map((source) => {
          const evidence = approvedNote(
            notes,
            `${source}.md`,
            ["resume_status"],
            `${target} evidence source`,
          );
          return resumeBullets(evidence, target);
        })
        .flat();
      if (highlights.length === 0)
        throw new Error(
          `${note.path}: project recipe has no role-approved bullets.`,
        );
      const published = projects.find(
        (project) => project.slug === note.data.portfolio_slug,
      );
      output.projects.push({
        name: requiredString(note.data.title, note.path, "title"),
        role: note.data.role,
        description: published?.description,
        startDate: month(note.data.start_date),
        endDate:
          note.data.status === "active" ? "present" : month(note.data.end_date),
        dateLabel: published?.dateLabel,
        siteUrl: published ? `/projects/${published.slug}/` : undefined,
        url: published?.externalUrl,
        availability: published?.externalUrl ? "Playable" : undefined,
        highlights,
      });
    } else if (item.kind === "experience") {
      if (note.data.entry_type !== "experience")
        throw new Error(`${note.path}: recipe target is not experience.`);
      output.work.push({
        name: note.data.organization ?? note.data.title,
        position: note.data.role,
        startDate: month(note.data.start_date),
        endDate: month(note.data.end_date),
        highlights: resumeBullets(note, target),
      });
    } else if (item.kind === "education") {
      if (note.data.entry_type !== "education")
        throw new Error(`${note.path}: recipe target is not education.`);
      output.education.push({
        institution: note.data.title,
        area: degreeArea(note.data.role),
        studyType: degreeType(note.data.role),
        endDate: month(note.data.end_date),
        dateLabel:
          note.data.status === "active"
            ? `Expected ${season(note.data.end_date)}`
            : monthLabel(note.data.end_date),
      });
    } else {
      throw new Error(
        `${profile.path}: unknown recipe item type ${item.kind}.`,
      );
    }
  }
  return {
    basics: {
      name: profileData.name,
      label: profileData.role,
      email: profileData.contact.email,
      phone: profileData.contact.phone,
      url: profileData.links.website,
      summary: profileData.summaries[target],
      location: parseLocation(profileData.contact.location),
      profiles: ["github", "linkedin", "itch.io"]
        .filter((name) => profileData.links[name])
        .map((name) => ({
          network: networkName(name),
          url: profileData.links[name],
        })),
    },
    projects: output.projects,
    work: output.work,
    education: output.education,
    skills: profileData.skills[target],
    awards: [],
  };
}

function parseRecipe(markdown, label) {
  const items = [];
  let current;
  for (const line of markdown.split("\n")) {
    const item = /^- (project|experience|education):\s*(\[\[.+\]\])\s*$/u.exec(
      line,
    );
    if (item) {
      current = {
        kind: item[1],
        target: wikiTarget(item[2], label),
        sources: [],
      };
      items.push(current);
      continue;
    }
    const evidence = /^  -\s*(\[\[.+\]\])\s*$/u.exec(line);
    if (evidence) {
      if (!current || current.kind !== "project")
        throw new Error(`${label}: evidence must follow a project.`);
      current.sources.push(wikiTarget(evidence[1], label));
      continue;
    }
    if (line.trim() && !line.startsWith("Recipe items"))
      throw new Error(`${label}: malformed recipe line.`);
  }
  if (items.length === 0) throw new Error(`${label}: recipe is empty.`);
  return items;
}

function resumeBullets(note, target) {
  const section = exactSection(note.body, 2, "Resume Framing", note.path);
  const headings = directSections(section, 3, note.path);
  const bullets = [];
  for (const [roles, markdown] of headings) {
    const normalized = roles
      .split(",")
      .map((role) => role.trim().toLowerCase());
    for (const role of normalized) {
      if (!resumeTargets.includes(role))
        throw new Error(`${note.path}: unknown resume role ${role}.`);
    }
    if (normalized.includes(target))
      bullets.push(...markdownBullets(markdown, `${note.path} ${roles}`));
  }
  return bullets;
}

function getNote(notes, path, purpose) {
  const normalized = path.replaceAll("\\", "/");
  if (/^career\/Private(?:\/|$)/iu.test(normalized))
    throw new Error(`${purpose}: career/Private is forbidden.`);
  const note = notes.get(normalized);
  if (!note) throw new Error(`${purpose}: linked source is missing.`);
  return note;
}

function assertApproved(note, field) {
  if (note.data[field] !== "approved")
    throw new Error(`${note.path}: ${field} is not approved.`);
}

function approvedNote(notes, path, fields, purpose) {
  const indexed = getNote(notes, path, purpose);
  for (const field of fields) assertApproved(indexed, field);
  return hydrate(indexed);
}

function hydrate(note) {
  if (note.body !== undefined) return note;
  const parsed = readNote(note.filePath);
  return { ...note, body: parsed.body };
}

function requiredString(value, label, field) {
  if (typeof value !== "string" || !value.trim())
    throw new Error(`${label}: ${field} is required.`);
  return value.trim();
}

function singleLine(markdown, name) {
  const value = markdown.trim();
  if (!value || value.includes("\n"))
    throw new Error(`Portfolio Profile: ${name} must be one line.`);
  return value;
}

function title(value) {
  return `${value[0].toUpperCase()}${value.slice(1)}`;
}
function month(value) {
  return typeof value === "string" ? value.slice(0, 7) : undefined;
}
function monthLabel(value) {
  if (!value) return undefined;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(value));
}
function season(value) {
  if (!value) return "";
  const monthNumber = Number(value.slice(5, 7));
  const seasonName =
    monthNumber <= 5 ? "Spring" : monthNumber <= 8 ? "Summer" : "Fall";
  return `${seasonName} ${value.slice(0, 4)}`;
}
function formatDateLabel(data) {
  if (data.status === "active" && data.start_date)
    return `${monthLabel(data.start_date)} - present`;
  if (data.start_date && data.end_date)
    return `${monthLabel(data.start_date)} - ${monthLabel(data.end_date)}`;
  return data.end_date
    ? monthLabel(data.end_date)
    : data.start_date
      ? monthLabel(data.start_date)
      : "Project";
}
function parseLocation(value) {
  if (!value) return undefined;
  const [city, region] = value.split(",").map((item) => item.trim());
  return { city, region, countryCode: "US" };
}
function networkName(name) {
  return name === "itch.io" ? "Itch.io" : title(name);
}
function degreeType(role = "") {
  return role.startsWith("BS ")
    ? "Bachelor of Science"
    : role.startsWith("AS ")
      ? "Associate of Science"
      : role;
}
function degreeArea(role = "") {
  return role.replace(/^(?:BS|AS)\s+/u, "") || undefined;
}

export function loadMediaConfig(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}
