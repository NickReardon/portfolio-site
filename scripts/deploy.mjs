// Deploy `dist` to Cloudflare Pages.
//
// Wrangler's --branch flag only tags the resulting deployment; it has no effect
// on the build. Building on one branch and uploading as another therefore ships
// the wrong configuration: a staging bundle uploaded to main carries noindex,
// Disallow: /, and a canonical pointing at staging, which de-indexes production
// silently. This script makes the build and the upload agree by construction.
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";

const PROJECT = "portfolio-site";
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

if (head !== branch && !args.includes("--allow-branch-mismatch")) {
  throw new Error(
    `Refusing to deploy: checked out on "${head}" but deploying to "${branch}". ` +
      `Deploy a branch from its own checkout so the site is built from what that ` +
      `branch actually contains. Pass --allow-branch-mismatch to override.`,
  );
}

const status = execFileSync("git", ["status", "--porcelain"], {
  encoding: "utf8",
}).trim();

if (status && !args.includes("--allow-dirty")) {
  throw new Error(
    "Refusing to deploy: the working tree has uncommitted changes, so the build " +
      "stamp would name a commit that does not match what is shipped. Commit, " +
      "stash, or pass --allow-dirty.",
  );
}

// Where Cloudflare credentials come from, so the same script works on a laptop
// with 1Password, in CI with injected variables, and anywhere else with a
// plain env file. Set DEPLOY_CREDENTIALS in .env; see .env.example.
//
//   op:<file>    run Wrangler under `op run --env-file <file>`
//   env          credentials are already in the environment
//   file:<file>  load KEY=VALUE pairs from <file>
//
// Unset means: use the environment if it already carries a token, otherwise
// 1Password if its env file is present.
const DEFAULT_OP_ENV_FILE = "./.env.1password";

try {
  process.loadEnvFile(".env");
} catch {
  // No .env is the normal case; the fallbacks below still apply.
}

function resolveCredentialSource() {
  const configured = process.env.DEPLOY_CREDENTIALS?.trim();

  if (!configured) {
    if (process.env.CLOUDFLARE_API_TOKEN || process.env.CLOUDFLARE_API_KEY) {
      return { kind: "env" };
    }

    if (existsSync(DEFAULT_OP_ENV_FILE)) {
      return { kind: "op", file: DEFAULT_OP_ENV_FILE };
    }

    throw new Error(
      "No Cloudflare credentials found. Set DEPLOY_CREDENTIALS in .env " +
        `(see .env.example), or provide ${DEFAULT_OP_ENV_FILE}.`,
    );
  }

  if (configured === "env") {
    return { kind: "env" };
  }

  const [kind, ...rest] = configured.split(":");
  const file = rest.join(":");

  if ((kind === "op" || kind === "file") && file) {
    return { kind, file };
  }

  throw new Error(
    `Unrecognised DEPLOY_CREDENTIALS "${configured}". Use env, op:<file>, or file:<file>.`,
  );
}

const source = resolveCredentialSource();

if (source.kind === "file") {
  try {
    process.loadEnvFile(source.file);
  } catch (error) {
    throw new Error(
      `Could not read credentials from ${source.file}: ${error.message}`,
    );
  }
}

// `op` resolves its own references at run time, so only the direct modes can be
// checked up front. Values are never read or logged, only their presence.
if (
  source.kind !== "op" &&
  !process.env.CLOUDFLARE_API_TOKEN &&
  !process.env.CLOUDFLARE_API_KEY
) {
  throw new Error(
    "Cloudflare credentials are missing: expected CLOUDFLARE_API_TOKEN " +
      `(or CLOUDFLARE_API_KEY) via DEPLOY_CREDENTIALS="${process.env.DEPLOY_CREDENTIALS ?? "env"}".`,
  );
}

const run = (command, commandArgs) =>
  execFileSync(command, commandArgs, {
    stdio: "inherit",
    shell: true,
    env: { ...process.env, CF_PAGES_BRANCH: branch },
  });

const wrangler = [
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
];

console.log(
  `Deploying to ${branch} using credentials from: ${
    source.kind === "env"
      ? "the environment"
      : `${source.kind} (${source.file})`
  }`,
);

run("npm", ["run", "build"]);

if (source.kind === "op") {
  run("op", ["run", "--env-file", source.file, "--", ...wrangler]);
} else {
  run(wrangler[0], wrangler.slice(1));
}
