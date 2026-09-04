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

  // This repository is public and the built site ships resume.json verbatim, so
  // contact details finer-grained than city/region must not live here.
  if (resume.basics?.phone) {
    errors.push("basics.phone must be omitted from the published resume.");
  }

  if (resume.basics?.location?.postalCode) {
    errors.push(
      "basics.location.postalCode must be omitted from the published resume.",
    );
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
