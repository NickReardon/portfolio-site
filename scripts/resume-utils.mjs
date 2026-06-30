import { readFileSync } from "node:fs";

export function readResume(path = "src/data/resume.json") {
  return JSON.parse(readFileSync(path, "utf8"));
}

export function validateResume(resume) {
  const errors = [];

  if (!resume || typeof resume !== "object") {
    return ["Resume must be a JSON object."];
  }

  if (!resume.basics?.name) {
    errors.push("basics.name is required.");
  }

  if (!resume.basics?.label) {
    errors.push("basics.label is required.");
  }

  if (!resume.basics?.email) {
    errors.push("basics.email is required.");
  }

  if (!resume.basics?.summary) {
    errors.push("basics.summary is required.");
  }

  validateArray(resume.projects, "projects", errors);
  validateArray(resume.education, "education", errors);
  validateArray(resume.skills, "skills", errors);

  for (const [index, project] of (resume.projects ?? []).entries()) {
    if (!project.name) {
      errors.push(`projects[${index}].name is required.`);
    }

    if (!project.description && !project.highlights?.length) {
      errors.push(
        `projects[${index}] needs either description or at least one highlight.`,
      );
    }
  }

  for (const [index, school] of (resume.education ?? []).entries()) {
    if (!school.institution) {
      errors.push(`education[${index}].institution is required.`);
    }
  }

  return errors;
}

function validateArray(value, name, errors) {
  if (value !== undefined && !Array.isArray(value)) {
    errors.push(`${name} must be an array.`);
  }
}

const DEFAULT_SUMMARY =
  "Gameplay and systems programmer building production-style Unreal Engine 5 systems on Lyra, focused on C++, modular data-driven architecture, combat, encounters, persistence, and designer-facing workflows.";

// How many highlights each project keeps when a target is selected. Keeps the
// targeted PDF close to one page; tune per target if a build spills over.
const TARGET_PROJECT_HIGHLIGHTS = 4;
const TARGET_SKILL_KEYWORDS = 8;

export function resolveTarget(resume, target) {
  if (!target) {
    return null;
  }

  const config = resume.meta?.targets?.[target];

  if (!config) {
    const available = Object.keys(resume.meta?.targets ?? {});
    throw new Error(
      `Unknown resume target "${target}". Available targets: ${
        available.length > 0 ? available.join(", ") : "(none defined)"
      }.`,
    );
  }

  return { name: target, ...config };
}

export function createRenderCvDocument(resume, options = {}) {
  const target = resolveTarget(resume, options.target);
  const socialNetworks = (resume.basics.profiles ?? [])
    .filter((profile) => ["GitHub", "LinkedIn"].includes(profile.network))
    .map((profile) =>
      pruneEmpty({
        network: profile.network,
        username: profile.username,
      }),
    );
  const pdfProjects = target
    ? selectTargetProjects(resume.projects ?? [], target.tags ?? [])
    : selectPdfProjects(resume.projects ?? []);
  const pdfSkills = target
    ? selectTargetSkills(resume.skills ?? [], target.tags ?? [])
    : selectPdfSkills(resume.skills ?? []);
  const summary = target?.summary ?? DEFAULT_SUMMARY;
  const headline = target?.label ?? resume.basics.label;

  return pruneEmpty({
    cv: {
      name: resume.basics.name,
      headline,
      location: formatLocation(resume.basics.location),
      email: resume.basics.email,
      phone: resume.basics.phone,
      website: resume.basics.url,
      social_networks: socialNetworks,
      sections: pruneEmpty({
        summary: [summary],
        skills: pdfSkills.map(mapSkill),
        projects: pdfProjects.map((project) =>
          mapProject(project, resume.basics.url),
        ),
        education: (resume.education ?? []).map(mapEducation),
        experience: (resume.work ?? []).map((job) => mapWork(job)),
        awards: (resume.awards ?? []).map(mapAward),
      }),
    },
    design: {
      theme: "engineeringresumes",
      colors: {
        links: "rgb(19, 78, 74)",
      },
      links: {
        underline: false,
      },
      page: {
        size: "a4",
        top_margin: "0.35in",
        bottom_margin: "0.35in",
        left_margin: "0.42in",
        right_margin: "0.42in",
        show_footer: false,
      },
      typography: {
        line_spacing: "0.45em",
        font_size: {
          body: "8.8pt",
          name: "20pt",
          headline: "8.8pt",
          connections: "6.4pt",
          section_titles: "1em",
        },
      },
      header: {
        connections: {
          display_urls_instead_of_usernames: true,
          space_between_connections: "0.14cm",
        },
      },
      entries: {
        highlights: {
          bullet: "•",
          nested_bullet: "•",
          space_between_bullet_and_text: "0.2em",
        },
      },
    },
  });
}

function mapEducation(school) {
  return pruneEmpty({
    institution: school.institution,
    area: school.area,
    degree: school.studyType,
    location: school.location,
    start_date: school.startDate,
    end_date: school.endDate,
    highlights: [school.summary, ...(school.highlights ?? [])].filter(Boolean),
  });
}

function mapWork(job, highlightLimit = Infinity) {
  return pruneEmpty({
    company: job.name ?? job.company,
    position: job.position,
    location: job.location,
    start_date: job.startDate,
    end_date: job.endDate,
    summary: job.summary,
    highlights: limitItems(job.highlights, highlightLimit),
  });
}

function mapProject(project, siteUrl) {
  return pruneEmpty({
    name: formatProjectName(project, siteUrl),
    date:
      project.dateLabel ?? (project.endDate ? undefined : project.startDate),
    start_date: project.endDate ? project.startDate : undefined,
    end_date: project.endDate,
    highlights: project.highlights,
  });
}

function mapSkill(skill) {
  return pruneEmpty({
    label: skill.name,
    details: (skill.keywords ?? []).join(", "),
  });
}

function mapAward(award) {
  return pruneEmpty({
    label: award.title,
    details: [award.awarder, award.date, award.summary]
      .filter(Boolean)
      .join(" - "),
  });
}

function formatLocation(location) {
  if (!location) {
    return undefined;
  }

  return [
    location.city,
    [location.region, location.postalCode].filter(Boolean).join(" "),
  ]
    .filter(Boolean)
    .join(", ");
}

function formatProjectName(project, siteUrl) {
  // Playable projects link to where you can play them; everything else links to
  // its case-study page. The availability word is appended so a reader can tell
  // at a glance whether a project is playable or a writeup.
  const url =
    project.availability === "Playable" && project.url
      ? project.url
      : (absoluteUrl(project.siteUrl, siteUrl) ?? project.url);

  const name = url ? `[${project.name}](${url})` : project.name;

  return project.availability ? `${name} - ${project.availability}` : name;
}

function absoluteUrl(path, siteUrl) {
  if (!path) {
    return undefined;
  }

  if (/^https?:\/\//u.test(path)) {
    return path;
  }

  return new URL(path, siteUrl).toString();
}

// Untagged entries always appear; tagged entries appear only when at least one
// of their tags matches the target. With no target selected, every entry is
// kept (see the default selectPdf* paths above).
function matchesTarget(entryTags, targetTags) {
  if (!entryTags || entryTags.length === 0) {
    return true;
  }

  return entryTags.some((tag) => targetTags.includes(tag));
}

function selectTargetProjects(projects, targetTags) {
  return projects
    .filter((project) => matchesTarget(project.tags, targetTags))
    .map((project) => ({
      ...project,
      highlights: limitItems(project.highlights, TARGET_PROJECT_HIGHLIGHTS),
    }));
}

function selectTargetSkills(skills, targetTags) {
  return skills
    .filter((skill) => matchesTarget(skill.tags, targetTags))
    .map((skill) => ({
      ...skill,
      keywords: limitItems(skill.keywords, TARGET_SKILL_KEYWORDS),
    }));
}

function selectPdfProjects(projects) {
  const bulletLimits = new Map([
    ["Tethered", 5],
    ["Alien Survivors", 2],
    ["Last Oasis", 4],
    ["A Totally Normal Bike Ride", 2],
  ]);

  return projects
    .filter((project) => bulletLimits.has(project.name))
    .map((project) => ({
      ...project,
      highlights: limitItems(
        project.highlights,
        bulletLimits.get(project.name),
      ),
    }));
}

function selectPdfSkills(skills) {
  const keywordLimits = new Map([
    ["Languages", 6],
    ["Engines and Frameworks", 4],
    ["Unreal Engine", 8],
    ["Gameplay and Systems", 7],
    ["Tooling", 5],
  ]);

  return skills
    .filter((skill) => keywordLimits.has(skill.name))
    .map((skill) => ({
      ...skill,
      keywords: limitItems(skill.keywords, keywordLimits.get(skill.name)),
    }));
}

function limitItems(items, limit = Infinity) {
  return (items ?? []).slice(0, limit);
}

function pruneEmpty(value) {
  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === "object" ? pruneEmpty(item) : item))
      .filter((item) => item !== undefined && item !== null && item !== "");
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .map(([key, item]) => [
          key,
          typeof item === "object" ? pruneEmpty(item) : item,
        ])
        .filter(([, item]) => {
          if (Array.isArray(item)) {
            return item.length > 0;
          }

          if (item && typeof item === "object") {
            return Object.keys(item).length > 0;
          }

          return item !== undefined && item !== null && item !== "";
        }),
    );
  }

  return value;
}
