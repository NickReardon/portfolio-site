// Deploy `dist` to Cloudflare Pages.
//
// Wrangler's --branch flag only tags the resulting deployment; it has no effect
// on the build. Building on one branch and uploading as another therefore ships
// the wrong configuration: a staging bundle uploaded to main carries noindex,
// Disallow: /, and a canonical pointing at staging, which de-indexes production
// silently. This script makes the build and the upload agree by construction.
import { execFileSync } from "node:child_process";

const PROJECT = "portfolio-site";
const PRODUCTION_BRANCH = "main";
const args = process.argv.slice(2);
const branchIndex = args.findIndex((arg) => arg === "--branch");
const branch = branchIndex === -1 ? undefined : args[branchIndex + 1];

if (!branch) {
  throw new Error(
    "Pass the target branch, for example: npm run deploy:cloudflare -- --branch staging",
  );
}

const head = execFileSync("git", ["rev-parse", "--abbrev-ref", "HEAD"], {
  encoding: "utf8",
}).trim();

const isProduction = branch === PRODUCTION_BRANCH;

// Production has no override. Every incident so far came from a bundle built
// for one branch reaching another, and an escape hatch is exactly the thing
// that gets reached for under pressure.
if (isProduction && head !== branch) {
  throw new Error(
    `Refusing to deploy production: checked out on "${head}", not "${PRODUCTION_BRANCH}". ` +
      `Production must be built from its own branch. Run: git switch ${PRODUCTION_BRANCH}`,
  );
}

if (head !== branch && !args.includes("--allow-branch-mismatch")) {
  throw new Error(
    `Refusing to deploy: checked out on "${head}" but deploying to "${branch}". ` +
      `Deploy a branch from its own checkout so the site is built from what that ` +
      `branch actually contains. Pass --allow-branch-mismatch to override.`,
  );
}

// A stale main ships old content under a production URL, which looks like a
// successful deploy and reads as a rollback.
if (isProduction) {
  const localHead = execFileSync("git", ["rev-parse", "HEAD"], {
    encoding: "utf8",
  }).trim();
  let remoteHead;

  // Compare against the real remote, not a possibly stale local ref.
  try {
    execFileSync("git", ["fetch", "--quiet", "origin", PRODUCTION_BRANCH], {
      stdio: "ignore",
    });
  } catch {
    // Offline is not a reason to block a deploy; the ref comparison below
    // still runs against whatever was last fetched.
  }

  try {
    remoteHead = execFileSync(
      "git",
      ["rev-parse", `origin/${PRODUCTION_BRANCH}`],
      { encoding: "utf8" },
    ).trim();
  } catch {
    remoteHead = undefined;
  }

  if (remoteHead && remoteHead !== localHead) {
    throw new Error(
      `Refusing to deploy production: local ${PRODUCTION_BRANCH} is ${localHead.slice(0, 7)} ` +
        `but origin/${PRODUCTION_BRANCH} is ${remoteHead.slice(0, 7)}. Run: git pull --ff-only`,
    );
  }
}

const status = execFileSync("git", ["status", "--porcelain"], {
  encoding: "utf8",
}).trim();

if (status && isProduction) {
  throw new Error(
    "Refusing to deploy production: the working tree has uncommitted changes. " +
      "Production must ship exactly what is committed on " +
      `${PRODUCTION_BRANCH}.`,
  );
}

if (status && !args.includes("--allow-dirty")) {
  throw new Error(
    "Refusing to deploy: the working tree has uncommitted changes, so the build " +
      "stamp would name a commit that does not match what is shipped. Commit, " +
      "stash, or pass --allow-dirty.",
  );
}

const run = (command, commandArgs) =>
  execFileSync(command, commandArgs, {
    stdio: "inherit",
    shell: true,
    env: { ...process.env, CF_PAGES_BRANCH: branch },
  });

run("npm", ["run", "build"]);
run("op", [
  "run",
  "--env-file",
  "./.env.1password",
  "--",
  "npx",
  "--yes",
  "wrangler",
  "pages",
  "deploy",
  "dist",
  "--project-name",
  PROJECT,
  "--branch",
  branch,
]);
