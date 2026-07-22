import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { basename, relative, resolve } from "node:path";
import YAML from "yaml";
import {
  publicationRecordSchema,
  formatZodErrors,
} from "@personal/content-contracts";
import { writeTextAtomic } from "./common.mjs";
import { validatePublicationContent } from "./publication-store.mjs";

export function encryptCanonicalPublication(
  record,
  { sourceRoot, stagingRoot, replace = false },
) {
  const parsed = publicationRecordSchema.safeParse(record);
  if (!parsed.success) {
    throw new Error(
      `${record.id} is invalid:\n- ${formatZodErrors(parsed.error).join("\n- ")}`,
    );
  }
  validatePublicationContent(parsed.data);
  const configPath = resolve(sourceRoot, ".sops.yaml");
  if (!existsSync(configPath)) {
    throw new Error(`SOPS configuration is unavailable at ${configPath}.`);
  }
  const ageRecipient = YAML.parse(readFileSync(configPath, "utf8"))
    ?.creation_rules?.[0]?.age;
  if (!ageRecipient) {
    throw new Error("The SOPS configuration does not define an age recipient.");
  }
  const destination = publicationDestination(parsed.data, sourceRoot);
  if (existsSync(destination) && !replace) {
    throw new Error(
      `Canonical source already exists at ${destination}. Explicit replacement is required.`,
    );
  }
  const plaintextPath = resolve(stagingRoot, relative(sourceRoot, destination));
  writeTextAtomic(plaintextPath, YAML.stringify(parsed.data, { lineWidth: 0 }));
  const encrypted = spawnSync(
    "sops",
    ["--encrypt", "--age", ageRecipient, plaintextPath],
    { encoding: "utf8", windowsHide: true },
  );
  if (encrypted.status !== 0 || !encrypted.stdout) {
    throw new Error(
      `Unable to encrypt ${record.id}: ${encrypted.stderr || encrypted.error?.message || "unknown SOPS error"}`,
    );
  }
  writeTextAtomic(destination, encrypted.stdout);
  return destination;
}

function publicationDestination(record, sourceRoot) {
  const group = record.format === "json" ? "site" : record.id.split("-")[0];
  return resolve(
    sourceRoot,
    "publications",
    group,
    `${basename(record.id)}.sops.yaml`,
  );
}
