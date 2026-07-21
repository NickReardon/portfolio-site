import { copyFileSync, mkdirSync } from "node:fs";
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
if (args.options.get("approve-publication") !== true) {
  throw new Error(
    "Publishing requires the explicit --approve-publication flag after human review.",
  );
}
const result = validateDraftFile(
  resolveDraftPath(requireOption(args, "draft")),
);
if (result.errors.length > 0)
  throw new Error(`Draft is invalid:\n- ${result.errors.join("\n- ")}`);
const stagingDir = resolve(localRoot, "publish", result.draft.id);
const inputPath = resolve(stagingDir, "resume.json");
mkdirSync(stagingDir, { recursive: true });
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
    stagingDir,
    "--file-name",
    "resume.pdf",
  ],
  { stdio: "inherit" },
);

const publicJson = resolve(platformRoot, "content", "public", "resume.json");
const publicPdf = resolve(platformRoot, "apps", "web", "public", "resume.pdf");
writeJsonAtomic(publicJson, result.draft.resume);
copyFileSync(resolve(stagingDir, "resume.pdf"), publicPdf);
console.log(
  `Published approved draft ${result.draft.id} to content/public and apps/web/public.`,
);
