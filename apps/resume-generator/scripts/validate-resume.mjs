import { readResume, validateResume } from "./resume-utils.mjs";
import { fileURLToPath } from "node:url";

const defaultSource = fileURLToPath(
  new URL("../../../content/public/resume.json", import.meta.url),
);
const sourceIndex = process.argv.indexOf("--source");
const source = sourceIndex >= 0 ? process.argv[sourceIndex + 1] : defaultSource;

const errors = validateResume(readResume(source));

if (errors.length > 0) {
  console.error("Resume validation failed:");
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log("Resume data is valid.");
