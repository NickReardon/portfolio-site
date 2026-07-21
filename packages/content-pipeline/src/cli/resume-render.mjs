import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import {
  localRoot,
  parseArgs,
  platformRoot,
  requireOption,
  run,
  writeJsonAtomic,
} from "../common.mjs";
import { resolveDraftPath, validateDraftFile } from "../resume-validation.mjs";

const args = parseArgs();
const result = validateDraftFile(
  resolveDraftPath(requireOption(args, "draft")),
);
if (result.errors.length > 0)
  throw new Error(`Draft is invalid:\n- ${result.errors.join("\n- ")}`);
const inputPath = resolve(localRoot, "render-input", `${result.draft.id}.json`);
const outputDir = resolve(localRoot, "resumes", result.draft.id);
mkdirSync(outputDir, { recursive: true });
writeJsonAtomic(inputPath, result.draft.resume);
run(
  process.execPath,
  [
    resolve(
      platformRoot,
      "apps",
      "resume-generator",
      "scripts",
      "build-resume.mjs",
    ),
    "--source",
    inputPath,
    "--output-dir",
    outputDir,
    "--file-name",
    "resume.pdf",
  ],
  { stdio: "inherit" },
);
console.log(`Local resume rendered under .local/resumes/${result.draft.id}/.`);
