import assert from "node:assert/strict";
import test from "node:test";
import {
  knowledgeDocumentSchema,
  resumeDraftSchema,
  resumeRecipeSchema,
} from "@personal/content-contracts";

const document = {
  schemaVersion: 1,
  id: "project-example",
  type: "project",
  title: "Example",
  tags: ["gameplay"],
  skills: ["C++"],
  roles: ["gameplay-programmer"],
  summary: "A representative project.",
  body: "Long-form notes.",
  evidence: [
    {
      id: "example-system",
      claim: "Built a tested system.",
      details: "The test covered 12 scenarios.",
      metrics: ["12"],
      sources: ["test-report"],
    },
  ],
};

test("knowledge documents require stable ids and structured evidence", () => {
  assert.equal(knowledgeDocumentSchema.safeParse(document).success, true);
  assert.equal(
    knowledgeDocumentSchema.safeParse({ ...document, id: "Not valid" }).success,
    false,
  );
});

test("recipes carry deterministic evidence and layout limits", () => {
  const result = resumeRecipeSchema.safeParse({
    schemaVersion: 1,
    id: "gameplay",
    title: "Gameplay Programmer",
    priorities: ["gameplay"],
    excludeTags: [],
    constraints: {
      pages: 1,
      projectCount: 4,
      bulletsPerProject: 5,
      requireEvidence: true,
    },
  });
  assert.equal(result.success, true);
});

test("draft provenance paths only address work and project highlights", () => {
  const draft = {
    schemaVersion: 1,
    id: "example-draft",
    recipeId: "gameplay",
    createdAt: "2026-07-21T12:00:00.000Z",
    resume: {
      basics: {
        name: "Name",
        label: "Role",
        email: "email@example.com",
        summary: "Summary",
      },
      work: [],
      education: [],
      projects: [],
      skills: [],
      awards: [],
    },
    provenance: [
      {
        path: "basics.summary",
        sourceDocumentId: "profile",
        evidenceIds: ["summary"],
      },
    ],
  };
  assert.equal(resumeDraftSchema.safeParse(draft).success, false);
});
