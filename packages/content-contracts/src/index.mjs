import { z } from "zod";

const stringList = z.array(z.string().min(1)).default([]);
const scalarStringList = z
  .array(z.union([z.string(), z.number()]).transform(String))
  .default([]);

export const evidenceSchema = z.object({
  id: z.string().min(1),
  claim: z.string().min(1),
  details: z.string().default(""),
  metrics: scalarStringList,
  sources: stringList,
});

export const knowledgeDocumentSchema = z.object({
  schemaVersion: z.literal(1),
  id: z.string().regex(/^[a-z0-9][a-z0-9-]*$/u),
  type: z.enum(["profile", "experience", "education", "project", "note"]),
  title: z.string().min(1),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  tags: stringList,
  skills: stringList,
  roles: stringList,
  summary: z.string().min(1),
  body: z.string().default(""),
  evidence: z.array(evidenceSchema).default([]),
});

export const resumeRecipeSchema = z.object({
  schemaVersion: z.literal(1),
  id: z.string().regex(/^[a-z0-9][a-z0-9-]*$/u),
  title: z.string().min(1),
  priorities: stringList,
  excludeTags: stringList,
  constraints: z.object({
    pages: z.number().int().positive().default(1),
    projectCount: z.number().int().positive().default(4),
    bulletsPerProject: z.number().int().positive().default(5),
    requireEvidence: z.boolean().default(true),
  }),
});

const profileSchema = z.object({
  network: z.string(),
  username: z.string().optional(),
  url: z.string().optional(),
});

const basicsSchema = z
  .object({
    name: z.string().min(1),
    label: z.string().min(1),
    email: z.string().min(1),
    phone: z.string().optional(),
    url: z.string().optional(),
    summary: z.string().min(1),
    location: z.record(z.string(), z.string()).optional(),
    profiles: z.array(profileSchema).default([]),
  })
  .passthrough();

const resumeEntrySchema = z
  .object({
    name: z.string().optional(),
    title: z.string().optional(),
    institution: z.string().optional(),
    position: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    dateLabel: z.string().optional(),
    summary: z.string().optional(),
    description: z.string().optional(),
    highlights: stringList,
  })
  .passthrough();

export const publicResumeSchema = z
  .object({
    $schema: z.string().optional(),
    meta: z.record(z.string(), z.unknown()).optional(),
    basics: basicsSchema,
    work: z.array(resumeEntrySchema).default([]),
    education: z.array(resumeEntrySchema).default([]),
    projects: z.array(resumeEntrySchema).default([]),
    skills: z.array(resumeEntrySchema).default([]),
    awards: z.array(resumeEntrySchema).default([]),
  })
  .passthrough();

export const provenanceEntrySchema = z.object({
  path: z.string().regex(/^(projects|work)\[\d+\]\.highlights\[\d+\]$/u),
  sourceDocumentId: z.string().min(1),
  evidenceIds: z.array(z.string().min(1)).min(1),
});

export const resumeDraftSchema = z.object({
  schemaVersion: z.literal(1),
  id: z.string().regex(/^[a-z0-9][a-z0-9-]*$/u),
  recipeId: z.string().min(1),
  createdAt: z.iso.datetime(),
  resume: publicResumeSchema,
  provenance: z.array(provenanceEntrySchema),
});

export function formatZodErrors(error) {
  return error.issues.map((issue) => {
    const path = issue.path.length > 0 ? issue.path.join(".") : "document";
    return `${path}: ${issue.message}`;
  });
}
