import { copyFileSync, mkdirSync, writeFileSync } from "node:fs";

// Public CI exercises the Astro build without installing RenderCV or
// publishing personal output. Private CI replaces these fictional PDFs.
const pdf = Buffer.from(
  "%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF\n",
);
mkdirSync("public/resumes", { recursive: true });
writeFileSync("public/resume.pdf", pdf);
copyFileSync("public/resume.pdf", "public/resumes/resume-gameplay.pdf");
copyFileSync("public/resume.pdf", "public/resumes/resume-tools.pdf");
