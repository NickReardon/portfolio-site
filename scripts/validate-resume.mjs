import { readResume, validateResume } from "./resume-utils.mjs";

const errors = validateResume(readResume());

if (errors.length > 0) {
  console.error("Resume validation failed:");
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log("Resume data is valid.");
