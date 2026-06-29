import { execFileSync } from "node:child_process";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import {
  createRenderCvDocument,
  readResume,
  validateResume,
} from "./resume-utils.mjs";

const buildDir = ".resume-build";
const yamlPath = join(buildDir, "resume.yaml");
const pdfPath = "public/resume.pdf";
const renderCvCommand = existsSync(".venv/Scripts/rendercv.exe")
  ? ".venv/Scripts/rendercv.exe"
  : "rendercv";

const resume = readResume();
const errors = validateResume(resume);

if (errors.length > 0) {
  console.error("Resume validation failed:");
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

rmSync(buildDir, { recursive: true, force: true });
mkdirSync(buildDir, { recursive: true });
mkdirSync(dirname(pdfPath), { recursive: true });

const renderCvDocument = createRenderCvDocument(resume);

// RenderCV reads YAML, and JSON is valid YAML. Writing JSON keeps this script
// dependency-free while still generating a disposable RenderCV input file.
writeFileSync(`${yamlPath}`, `${JSON.stringify(renderCvDocument, null, 2)}\n`);

console.log("Rendering resume PDF with RenderCV...");
execFileSync(
  renderCvCommand,
  [
    "render",
    yamlPath,
    "--output-folder",
    buildDir,
    "--pdf-path",
    "resume.pdf",
    "--dont-generate-markdown",
    "--dont-generate-html",
    "--dont-generate-png",
  ],
  {
    env: {
      ...process.env,
      NO_COLOR: "1",
      PYTHONIOENCODING: "utf-8",
    },
    stdio: "inherit",
  },
);

const renderedPdf = findNewestPdf(buildDir);

if (!renderedPdf) {
  throw new Error(`RenderCV did not create a PDF in ${buildDir}.`);
}

copyFileSync(renderedPdf, pdfPath);

if (!existsSync(pdfPath) || statSync(pdfPath).size === 0) {
  throw new Error(`Expected ${pdfPath} to exist and be non-empty.`);
}

const pageCount = countPdfPages(pdfPath);

if (pageCount !== 1) {
  throw new Error(`Expected ${pdfPath} to be 1 page, but found ${pageCount}.`);
}

console.log(`Resume PDF written to ${pdfPath}.`);

function findNewestPdf(directory) {
  const candidates = [];
  collectPdfs(directory, candidates);
  candidates.sort((left, right) => right.mtimeMs - left.mtimeMs);
  return candidates[0]?.path;
}

function collectPdfs(directory, candidates) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);

    if (entry.isDirectory()) {
      collectPdfs(path, candidates);
      continue;
    }

    if (entry.isFile() && entry.name.toLowerCase().endsWith(".pdf")) {
      candidates.push({ path, mtimeMs: statSync(path).mtimeMs });
    }
  }
}

function countPdfPages(path) {
  const contents = readFileSync(path, "latin1");
  return (contents.match(/\/Type\s*\/Page(?!s)/g) ?? []).length;
}
