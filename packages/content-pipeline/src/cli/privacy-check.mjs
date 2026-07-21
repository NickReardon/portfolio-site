import { platformRoot, run } from "../common.mjs";
import { inspectRepositoryFiles } from "../privacy.mjs";

const tracked = run("git", ["ls-files"]).split(/\r?\n/u).filter(Boolean);
const staged = run("git", [
  "diff",
  "--cached",
  "--name-only",
  "--diff-filter=ACMR",
])
  .split(/\r?\n/u)
  .filter(Boolean);
const findings = inspectRepositoryFiles(platformRoot, [...tracked, ...staged]);

if (findings.length > 0) {
  console.error("Privacy check failed:");
  findings.forEach((finding) => console.error(`- ${finding}`));
  process.exitCode = 1;
} else {
  console.log(
    `Privacy check passed for ${new Set([...tracked, ...staged]).size} tracked or staged file(s).`,
  );
}
