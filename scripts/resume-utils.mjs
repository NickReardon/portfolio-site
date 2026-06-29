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

export function createRenderCvDocument(resume) {
  const socialNetworks = (resume.basics.profiles ?? [])
    .filter((profile) => ["GitHub", "LinkedIn"].includes(profile.network))
    .map((profile) =>
      pruneEmpty({
        network: profile.network,
        username: profile.username,
      }),
    );
  const pdfProjects = selectPdfProjects(resume.projects ?? []);
  const pdfSkills = selectPdfSkills(resume.skills ?? []);

  return pruneEmpty({
    cv: {
      name: resume.basics.name,
      headline: resume.basics.label,
      location: formatLocation(resume.basics.location),
      email: resume.basics.email,
      phone: resume.basics.phone,
      website: resume.basics.url,
      social_networks: socialNetworks,
      sections: pruneEmpty({
        summary: [
          "Computer science student building modular gameplay systems in Unreal Engine 5 on Lyra, focused on combat, encounters, persistence, and designer-facing workflows.",
        ],
        skills: pdfSkills.map(mapSkill),
        projects: pdfProjects.map(mapProject),
        experience: (resume.work ?? []).map((job) => mapWork(job, 1)),
        education: (resume.education ?? []).map(mapEducation),
        awards: (resume.awards ?? []).map(mapAward),
      }),
    },
    design: {
      theme: "engineeringresumes",
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
          connections: "8.2pt",
          section_titles: "1em",
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
    highlights: school.highlights,
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

function mapProject(project) {
  return pruneEmpty({
    name: project.name,
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

  return [location.city, location.region].filter(Boolean).join(", ");
}

function selectPdfProjects(projects) {
  const bulletLimits = new Map([
    ["Tethered", 4],
    ["Alien Survivors", 2],
    ["Last Oasis", 3],
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
    ["Languages", 5],
    ["Engines and Frameworks", 3],
    ["Unreal Engine", 7],
    ["Gameplay and Systems", 5],
    ["Tooling", 4],
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
