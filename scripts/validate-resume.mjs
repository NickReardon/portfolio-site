import { readFileSync } from "node:fs";
import { validateResume } from "./resume-utils.mjs";

const errors = [];
for (const target of ["general", "gameplay", "tools"]) {
  const resume = JSON.parse(
    readFileSync(`.local/publication/resumes/${target}.json`, "utf8"),
  );
  errors.push(...validateResume(resume).map((error) => `${target}: ${error}`));
}

if (errors.length > 0) {
  console.error("Resume validation failed:");
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log("Resume data is valid.");
