import { parseArgs, requireOption } from "../common.mjs";
import { resolveDraftPath, validateDraftFile } from "../resume-validation.mjs";

const args = parseArgs();
const path = resolveDraftPath(requireOption(args, "draft"));
const result = validateDraftFile(path);
if (result.errors.length > 0) {
  console.error("Resume draft validation failed:");
  result.errors.forEach((error) => console.error(`- ${error}`));
  process.exitCode = 1;
} else {
  console.log(`Resume draft ${result.draft.id} is valid.`);
}
