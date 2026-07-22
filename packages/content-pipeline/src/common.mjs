import { execFileSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { dirname, isAbsolute, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const platformRoot = fileURLToPath(
  new URL("../../../", import.meta.url),
);
export const localRoot = resolve(platformRoot, ".local");

loadLocalEnvironment();

export function parseArgs(argv = process.argv.slice(2)) {
  const options = new Map();
  const positionals = [];

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--") continue;
    if (!value.startsWith("--")) {
      positionals.push(value);
      continue;
    }

    const equalsIndex = value.indexOf("=");
    if (equalsIndex > 2) {
      options.set(value.slice(2, equalsIndex), value.slice(equalsIndex + 1));
      continue;
    }

    const name = value.slice(2);
    const next = argv[index + 1];
    if (next && !next.startsWith("--")) {
      options.set(name, next);
      index += 1;
    } else {
      options.set(name, true);
    }
  }

  return { options, positionals };
}

export function requireOption(args, name) {
  const value = args.options.get(name);
  if (!value || value === true) {
    throw new Error(`Missing required --${name} option.`);
  }
  return value;
}

export function personalContentDir(args) {
  const configured =
    args.options.get("personal-content") ?? process.env.PERSONAL_CONTENT_DIR;
  return resolve(platformRoot, configured || "../personal-content");
}

export function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

export function writeJsonAtomic(path, value) {
  writeTextAtomic(path, `${JSON.stringify(value, null, 2)}\n`);
}

export function writeTextAtomic(path, value) {
  mkdirSync(dirname(path), { recursive: true });
  const temporary = `${path}.tmp`;
  writeFileSync(temporary, value, "utf8");
  renameSync(temporary, path);
}

export function resetDirectory(path) {
  const resolvedPath = resolve(path);
  const relativePath = relative(resolve(localRoot), resolvedPath);
  if (relativePath.startsWith("..") || isAbsolute(relativePath)) {
    throw new Error(`Refusing to reset non-local directory: ${resolvedPath}`);
  }
  rmSync(resolvedPath, { recursive: true, force: true });
  mkdirSync(resolvedPath, { recursive: true });
}

export function run(command, commandArgs, options = {}) {
  return execFileSync(command, commandArgs, {
    cwd: platformRoot,
    encoding: options.encoding ?? "utf8",
    env: { ...process.env, ...options.env },
    stdio: options.stdio ?? ["ignore", "pipe", "pipe"],
  });
}

export function ensureFile(path, label) {
  if (!existsSync(path)) {
    throw new Error(`${label} not found at ${path}.`);
  }
}

function loadLocalEnvironment() {
  const path = resolve(platformRoot, ".env.local");
  if (existsSync(path) && typeof process.loadEnvFile === "function") {
    process.loadEnvFile(path);
  }
}
