import assert from "node:assert/strict";
import test from "node:test";
import {
  publicationToKnowledgeDocument,
  resolvePublicationTarget,
  validatePublicationContent,
} from "../src/publication-store.mjs";

const publication = {
  schemaVersion: 1,
  id: "project-example",
  title: "Example",
  format: "markdown",
  outputPath: "apps/web/src/content/projects/example.md",
  summary: "A public project source.",
  tags: ["gameplay"],
  skills: ["C++"],
  roles: ["gameplay-programmer"],
  knowledgeDocumentIds: ["project-example"],
  content: "---\ntitle: Example\n---\n\nBody.\n",
};

test("publication targets are restricted to approved public content paths", () => {
  assert.doesNotThrow(() => resolvePublicationTarget(publication));
  assert.throws(
    () =>
      resolvePublicationTarget({
        ...publication,
        outputPath: "apps/web/src/pages/index.astro",
      }),
    /forbidden path/u,
  );
});

test("publication content must be valid and becomes searchable evidence", () => {
  assert.doesNotThrow(() => validatePublicationContent(publication));
  const document = publicationToKnowledgeDocument(publication);
  assert.equal(document.id, "publication-project-example");
  assert.equal(document.evidence[0].details, publication.content);
});

test("invalid JSON publication content is rejected", () => {
  assert.throws(
    () =>
      validatePublicationContent({
        ...publication,
        format: "json",
        outputPath: "content/public/site.json",
        content: "not json\n",
      }),
    /invalid JSON/u,
  );
});
