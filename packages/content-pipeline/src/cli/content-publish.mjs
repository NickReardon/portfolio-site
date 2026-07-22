import { copyFileSync, mkdirSync } from "node:fs";
import { relative, resolve } from "node:path";
import {
  localRoot,
  parseArgs,
  platformRoot,
  resetDirectory,
  run,
  writeTextAtomic,
} from "../common.mjs";
import {
  loadPublicationRecords,
  resolvePublicationTarget,
  validatePublicationContent,
} from "../publication-store.mjs";

const args = parseArgs();
if (args.options.get("approve-publication") !== true) {
  throw new Error(
    "Publishing canonical website and resume content requires --approve-publication after human review.",
  );
}
const records = loadPublicationRecords();
if (records.length === 0) {
  throw new Error(
    "No canonical publication sources are available. Run knowledge:preview.",
  );
}
const targets = records.map((record) => {
  validatePublicationContent(record);
  return { record, target: resolvePublicationTarget(record) };
});
const stagingRoot = resolve(localRoot, "content-publish");
resetDirectory(stagingRoot);
for (const { record } of targets) {
  const stagingPath = resolve(stagingRoot, record.outputPath);
  mkdirSync(resolve(stagingPath, ".."), { recursive: true });
  writeTextAtomic(stagingPath, record.content);
}
const resumeRecord = targets.find(({ record }) => record.id === "resume");
const resumePdfStaging = resolve(stagingRoot, "resume-output");
if (resumeRecord) {
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
      resolve(stagingRoot, resumeRecord.record.outputPath),
      "--output-dir",
      resumePdfStaging,
      "--file-name",
      "resume.pdf",
    ],
    { stdio: "inherit" },
  );
}
for (const { record, target } of targets) {
  writeTextAtomic(target, record.content);
}
if (resumeRecord) {
  copyFileSync(
    resolve(resumePdfStaging, "resume.pdf"),
    resolve(platformRoot, "apps", "web", "public", "resume.pdf"),
  );
}
console.log(`Published ${targets.length} approved canonical artifact(s):`);
targets.forEach(({ target }) =>
  console.log(`- ${relative(platformRoot, target)}`),
);
if (resumeRecord) console.log("- apps\\web\\public\\resume.pdf");
