import { existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const reportsDir = join(root, "reports");
const auditTmpDir = join(root, ".audit-tmp");
const command = process.argv[2];
const baseUrl =
  process.argv[3] ?? process.env.AUDIT_BASE_URL ?? "http://127.0.0.1:4321";
const cli = {
  lighthouse: join(root, "node_modules", "lighthouse", "cli", "index.js"),
  pa11y: join(root, "node_modules", "pa11y", "bin", "pa11y.js"),
};

const pages = [
  { name: "home", path: "/" },
  { name: "projects", path: "/projects/" },
  { name: "last-oasis", path: "/projects/last-oasis/" },
  { name: "blog", path: "/blog/" },
  { name: "resume", path: "/resume/" },
  { name: "contact", path: "/contact/" },
];

function urlFor(path) {
  return new URL(path, baseUrl).toString();
}

function run(label, executable, args, options = {}) {
  console.log(`\n${label}`);
  const capture = options.capture ?? false;
  const result = spawnSync(executable, args, {
    cwd: root,
    encoding: capture ? "utf8" : undefined,
    env: {
      ...process.env,
      TEMP: auditTmpDir,
      TMP: auditTmpDir,
    },
    shell: false,
    stdio: capture ? "pipe" : "inherit",
  });

  if (result.error) {
    console.error(result.error.message);
  }

  return {
    error: result.error,
    status: result.status ?? 1,
    stderr: result.stderr ?? "",
    stdout: result.stdout ?? "",
  };
}

function runLighthouse() {
  mkdirSync(reportsDir, { recursive: true });
  mkdirSync(auditTmpDir, { recursive: true });

  return pages.reduce((exitCode, page) => {
    const outputPath = join(reportsDir, `lighthouse-${page.name}.html`);
    const result = run(
      `Lighthouse: ${urlFor(page.path)}`,
      process.execPath,
      [
        cli.lighthouse,
        urlFor(page.path),
        "--quiet",
        "--chrome-flags=--headless=new",
        "--output=html",
        `--output-path=${outputPath}`,
      ],
      { capture: true },
    );

    if (
      result.status !== 0 &&
      existsSync(outputPath) &&
      result.stderr.includes("EPERM")
    ) {
      console.warn(
        `Report written; Chrome cleanup hit a Windows file lock: ${outputPath}`,
      );
      return exitCode;
    }

    if (result.status !== 0) {
      process.stdout.write(result.stdout);
      process.stderr.write(result.stderr);
    }

    return exitCode === 0 ? result.status : exitCode;
  }, 0);
}

function runPa11y() {
  mkdirSync(auditTmpDir, { recursive: true });

  return pages.reduce((exitCode, page) => {
    const result = run(`Pa11y: ${urlFor(page.path)}`, process.execPath, [
      cli.pa11y,
      urlFor(page.path),
    ]);
    return exitCode === 0 ? result.status : exitCode;
  }, 0);
}

if (command === "lighthouse") {
  process.exit(runLighthouse());
}

if (command === "pa11y") {
  process.exit(runPa11y());
}

console.error(
  "Usage: node scripts/audit-pages.mjs <lighthouse|pa11y> [base-url]",
);
process.exit(1);
