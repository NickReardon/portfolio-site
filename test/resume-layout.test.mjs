import assert from "node:assert/strict";
import test from "node:test";
import { createRenderCvDocument } from "../scripts/resume-utils.mjs";

const resume = {
  basics: {
    name: "Example Person",
    label: "Example Engineer",
    email: "example@example.com",
    summary: "An approved fictional summary.",
  },
  projects: [],
  education: [],
  skills: [],
};

test("uses readable target-aware typography for one-page resumes", () => {
  const general = createRenderCvDocument(resume, { target: "general" });
  const gameplay = createRenderCvDocument(resume, { target: "gameplay" });
  const tools = createRenderCvDocument(resume, { target: "tools" });

  assert.equal(general.design.typography.font_size.body, "10.4pt");
  assert.equal(gameplay.design.typography.font_size.body, "11.2pt");
  assert.equal(tools.design.typography.font_size.body, "11.05pt");
  assert.equal(general.design.page.top_margin, "0.48in");
  assert.equal(gameplay.design.page.top_margin, "0.52in");
  assert.equal(tools.design.page.top_margin, "0.62in");
});
