import { execFileSync } from "node:child_process";
import {
  copyFileSync,
  cpSync,
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
  DEFAULT_RENDER_CV_THEME,
  OFFICIAL_RENDER_CV_THEMES,
  readResume,
  validateResume,
} from "./resume-utils.mjs";

const args = process.argv.slice(2);
const target = parseOption(args, "target") ?? process.env.RESUME_TARGET ?? null;
const theme =
  parseOption(args, "theme") ??
  process.env.RESUME_THEME ??
  DEFAULT_RENDER_CV_THEME;
const fullLength = parseFlag(args, "full") || process.env.RESUME_FULL === "1";
const buildDir = ".resume-build";
const customThemeRoot = "rendercv-themes";
const pdfOutputDir = join("public", "resumes");
const yamlPath = join(buildDir, "resume.yaml");
const canonicalPdfPath = join("public", "resume.pdf");
// All generated PDFs are collected under public/resumes. The default one-page
// build is also copied to public/resume.pdf for stable site links.
const pdfFileName = createPdfFileName({ fullLength, target, theme });
const pdfPath = join(pdfOutputDir, pdfFileName);
const renderCvCommand = existsSync(".venv/Scripts/rendercv.exe")
  ? ".venv/Scripts/rendercv.exe"
  : "rendercv";
const officialThemes = new Set(OFFICIAL_RENDER_CV_THEMES);
const isCanonicalBuild =
  !fullLength && !target && theme === DEFAULT_RENDER_CV_THEME;

const resume = readResume();
const errors = validateResume(resume);

if (errors.length > 0) {
  console.error("Resume validation failed:");
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

if (target) {
  console.log(`Building resume for target: ${target}`);
}

if (theme !== DEFAULT_RENDER_CV_THEME) {
  console.log(`Building resume with theme: ${theme}`);
}

if (fullLength) {
  console.log("Building full-length resume");
}

validateThemeName(theme);

function parseOption(args, name) {
  const prefix = `--${name}=`;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === `--${name}`) {
      const value = args[index + 1];

      if (!value || value.startsWith("--")) {
        throw new Error(`Expected a value after --${name}.`);
      }

      return value;
    }

    if (arg.startsWith(prefix)) {
      const value = arg.slice(prefix.length);

      if (!value) {
        throw new Error(`Expected a value after --${name}=.`);
      }

      return value;
    }
  }

  return undefined;
}

function parseFlag(args, name) {
  return args.includes(`--${name}`);
}

rmSync(buildDir, { recursive: true, force: true });
mkdirSync(buildDir, { recursive: true });
mkdirSync(dirname(pdfPath), { recursive: true });

if (!officialThemes.has(theme)) {
  copyCustomTheme(theme);
}

const renderCvDocument = createRenderCvDocument(resume, {
  fullLength,
  target,
  theme,
});

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
    pdfFileName,
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

if (!fullLength && pageCount !== 1) {
  throw new Error(`Expected ${pdfPath} to be 1 page, but found ${pageCount}.`);
}

if (isCanonicalBuild) {
  copyFileSync(pdfPath, canonicalPdfPath);
}

console.log(`Resume PDF written to ${pdfPath}.`);

if (isCanonicalBuild) {
  console.log(`Canonical resume PDF written to ${canonicalPdfPath}.`);
}

function createPdfFileName({ fullLength, target, theme }) {
  const suffixes = [
    target,
    fullLength ? "full" : null,
    theme === DEFAULT_RENDER_CV_THEME ? null : theme,
  ].filter(Boolean);

  return suffixes.length > 0
    ? `resume-${suffixes.join("-")}.pdf`
    : "resume.pdf";
}

function validateThemeName(theme) {
  if (/^[a-z0-9]+$/u.test(theme)) {
    return;
  }

  throw new Error(
    `Invalid RenderCV theme "${theme}". Use an official theme or a lowercase alphanumeric custom theme name.`,
  );
}

function copyCustomTheme(theme) {
  const source = join(customThemeRoot, theme);
  const destination = join(buildDir, theme);

  if (!existsSync(source)) {
    throw new Error(
      `Unknown RenderCV theme "${theme}". Official themes: ${OFFICIAL_RENDER_CV_THEMES.join(
        ", ",
      )}. For a custom/community theme, place it at ${source}.`,
    );
  }

  if (!directoryContainsTypstTemplate(source)) {
    throw new Error(
      `Custom RenderCV theme "${theme}" must contain at least one *.j2.typ template file.`,
    );
  }

  cpSync(source, destination, { recursive: true });
}

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

function directoryContainsTypstTemplate(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);

    if (entry.isDirectory() && directoryContainsTypstTemplate(path)) {
      return true;
    }

    if (entry.isFile() && entry.name.endsWith(".j2.typ")) {
      return true;
    }
  }

  return false;
}

function countPdfPages(path) {
  const contents = readFileSync(path, "latin1");
  return (contents.match(/\/Type\s*\/Page(?!s)/g) ?? []).length;
}
