import { execFileSync } from "node:child_process";

for (const target of ["general", "gameplay", "tools"]) {
  execFileSync(
    process.execPath,
    ["scripts/build-resume.mjs", "--target", target],
    {
      stdio: "inherit",
    },
  );
}
