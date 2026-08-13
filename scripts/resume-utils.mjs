import { readFileSync } from "node:fs";

export const DEFAULT_RENDER_CV_THEME = "engineeringresumes";
export const OFFICIAL_RENDER_CV_THEMES = [
  "classic",
  "ember",
  "engineeringclassic",
  "engineeringresumes",
  "harvard",
  "ink",
  "moderncv",
  "opal",
  "sb2nov",
];

export function readResume(path = ".local/publication/resumes/general.json") {
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

export function createRenderCvDocument(resume, options = {}) {
  const theme = options.theme ?? DEFAULT_RENDER_CV_THEME;
  const layout = getResumeLayout(options.target ?? "general");
  const socialNetworks = (resume.basics.profiles ?? [])
    .filter((profile) => ["GitHub", "LinkedIn"].includes(profile.network))
    .map((profile) =>
      pruneEmpty({
        network: profile.network,
        username: profile.username,
      }),
    );
  const pdfProjects = resume.projects ?? [];
  const pdfSkills = resume.skills ?? [];
  const summary = resume.basics.summary ?? DEFAULT_SUMMARY;
  const headline = resume.basics.label;

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
      theme,
      colors: {
        links: "rgb(19, 78, 74)",
      },
      links: {
        underline: false,
      },
      page: {
        size: "a4",
        top_margin: layout.verticalMargin,
        bottom_margin: layout.verticalMargin,
        left_margin: layout.horizontalMargin,
        right_margin: layout.horizontalMargin,
        show_footer: false,
      },
      typography: {
        line_spacing: layout.lineSpacing,
        font_size: {
          body: layout.bodyFontSize,
          name: layout.nameFontSize,
          headline: layout.headlineFontSize,
          connections: layout.connectionsFontSize,
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

function getResumeLayout(target) {
  if (target === "general") {
    return {
      bodyFontSize: "10.4pt",
      connectionsFontSize: "9.6pt",
      headlineFontSize: "10.2pt",
      horizontalMargin: "0.52in",
      lineSpacing: "0.56em",
      nameFontSize: "22pt",
      verticalMargin: "0.48in",
    };
  }

  if (target === "tools") {
    return {
      bodyFontSize: "11.05pt",
      connectionsFontSize: "10pt",
      headlineFontSize: "10.6pt",
      horizontalMargin: "0.54in",
      lineSpacing: "0.6em",
      nameFontSize: "23pt",
      verticalMargin: "0.62in",
    };
  }

  return {
    bodyFontSize: "11.2pt",
    connectionsFontSize: "10pt",
    headlineFontSize: "10.6pt",
    horizontalMargin: "0.56in",
    lineSpacing: "0.62em",
    nameFontSize: "23pt",
    verticalMargin: "0.52in",
  };
}

function mapEducation(school) {
  // The graduation date is shown on the right (school.dateLabel overrides the
  // start/end range for cases like "Expected ..."). The summary/highlights are
  // intentionally omitted here: they only restate that date, and repeating it
  // below the entry would duplicate the date in the PDF. The web resume still
  // renders them, since its sidebar has no right-aligned date.
  return pruneEmpty({
    institution: school.institution,
    area: school.area,
    degree: school.studyType,
    location: school.location,
    date: school.dateLabel,
    start_date: school.dateLabel ? undefined : school.startDate,
    end_date: school.dateLabel ? undefined : school.endDate,
  });
}

function mapWork(job) {
  return pruneEmpty({
    company: job.name ?? job.company,
    position: job.position,
    location: job.location,
    start_date: job.startDate,
    end_date: job.endDate,
    summary: job.summary,
    highlights: job.highlights,
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
  // Mirror the web resume: a plain (unlinked) project name followed by a
  // "Project page" link and, for playable projects, a "Play on itch.io" link,
  // separated by a pipe when both are present.
  const links = [];
  const pageUrl = absoluteUrl(project.siteUrl, siteUrl);

  if (pageUrl) {
    links.push(`[Project page](${pageUrl})`);
  }

  if (project.availability === "Playable" && project.url) {
    links.push(`[Play on itch.io](${project.url})`);
  }

  return links.length > 0
    ? `${project.name} — ${links.join(" | ")}`
    : project.name;
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
