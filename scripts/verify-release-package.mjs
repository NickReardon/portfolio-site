import { createHash } from "node:crypto";
import { existsSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(process.argv[2] ?? ".local/deployment-package");
const manifest = JSON.parse(
  readFileSync(resolve(root, "publication-manifest.json"), "utf8"),
);
if (process.env.VAULT_SHA && manifest.vaultSha !== process.env.VAULT_SHA) {
  throw new Error("Vault SHA does not match the stored package manifest.");
}
if (process.env.SITE_SHA && manifest.siteSha !== process.env.SITE_SHA) {
  throw new Error("Site SHA does not match the stored package manifest.");
}
for (const file of manifest.files) {
  const path = resolve(root, file.path);
  if (!existsSync(path) || statSync(path).size !== file.bytes) {
    throw new Error(
      `Package file is missing or has the wrong size: ${file.path}`,
    );
  }
  const hash = createHash("sha256").update(readFileSync(path)).digest("hex");
  if (hash !== file.sha256)
    throw new Error(`Package hash mismatch: ${file.path}`);
}
console.log(
  `Verified ${manifest.files.length} deployment files for site ${manifest.siteSha.slice(0, 12)}.`,
);
