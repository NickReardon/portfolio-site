import { createHash } from "node:crypto";
import {
  cpSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { relative, resolve } from "node:path";

const vaultSha = required("VAULT_SHA");
const siteSha = required("SITE_SHA");
const output = resolve(".local/deployment-package");

rmSync(output, { recursive: true, force: true });
mkdirSync(output, { recursive: true });
cpSync(resolve("dist"), resolve(output, "dist"), { recursive: true });
cpSync(resolve("functions"), resolve(output, "functions"), { recursive: true });

const files = listFiles(output)
  .sort()
  .map((path) => ({
    path: relative(output, path).replaceAll("\\", "/"),
    sha256: createHash("sha256").update(readFileSync(path)).digest("hex"),
    bytes: statSync(path).size,
  }));
const manifest = {
  schemaVersion: 1,
  vaultSha,
  siteSha,
  files,
};
writeFileSync(
  resolve(output, "publication-manifest.json"),
  `${JSON.stringify(manifest, null, 2)}\n`,
);
console.log(
  `Packaged ${files.length} deployment files for site ${siteSha.slice(0, 12)}.`,
);

function listFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = resolve(directory, entry.name);
    return entry.isDirectory() ? listFiles(path) : [path];
  });
}

function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required.`);
  return value;
}
