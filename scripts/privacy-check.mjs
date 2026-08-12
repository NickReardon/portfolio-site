import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { resolve } from "node:path";

const tracked = execFileSync("git", ["ls-files", "-z"], { encoding: "utf8" })
  .split("\0")
  .filter(Boolean);
const forbiddenPaths = [
  /^src\/content\/projects\//u,
  /^src\/data\/resume\.json$/u,
  /^\.local\//u,
  /^public\/resume\.pdf$/u,
  /^public\/resumes\/.*\.pdf$/u,
  /^public\/images\/social-card\.(?:png|svg)$/u,
  /(?:^|\/)career\//u,
];
const errors = [];

for (const path of tracked) {
  if (!existsSync(path)) continue;
  const isFictionalVaultFixture = path.startsWith("test/fixtures/vault/");
  if (
    !isFictionalVaultFixture &&
    forbiddenPaths.some((pattern) => pattern.test(path))
  ) {
    errors.push(`tracked forbidden path: ${path}`);
    continue;
  }
  if (/\.(?:png|jpe?g|gif|webp|ico|pdf)$/iu.test(path)) continue;
  const contents = readFileSync(path, "utf8");
  if (/D:[\\/]Obsidian/iu.test(contents))
    errors.push(`vault path leaked in ${path}`);
  if (
    /PRIVATE_SENTINEL_[A-Z0-9_]+/u.test(contents) &&
    !path.startsWith("test/")
  ) {
    errors.push(`privacy sentinel leaked in ${path}`);
  }
}

for (const root of [
  ".local/publication",
  ".resume-build",
  "dist",
  "public/resume.pdf",
  "public/resumes",
  "public/images/social-card.png",
]) {
  if (!existsSync(root)) continue;
  for (const path of filesUnder(root)) {
    if (readFileSync(path).includes(Buffer.from("PRIVATE_SENTINEL"))) {
      errors.push(`privacy sentinel reached generated output: ${path}`);
    }
  }
}

if (errors.length) {
  for (const error of errors) console.error(`Error: ${error}`);
  process.exit(1);
}
console.log(`Privacy check passed across ${tracked.length} tracked files.`);

function filesUnder(path) {
  const absolute = resolve(path);
  if (!existsSync(absolute)) return [];
  if (statSync(absolute).isFile()) return [absolute];
  const entries = readdirSync(absolute, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const child = resolve(absolute, entry.name);
    return entry.isDirectory() ? filesUnder(child) : [child];
  });
}
