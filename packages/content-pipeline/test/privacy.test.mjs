import assert from "node:assert/strict";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { inspectRepositoryFiles } from "../src/privacy.mjs";

const root = join(process.cwd(), ".local", "test-privacy");

test("privacy inspection rejects forbidden paths and age identities", () => {
  mkdirSync(join(root, "safe"), { recursive: true });
  writeFileSync(
    join(root, "safe", "key.txt"),
    ["AGE", "SECRET", "KEY"].join("-") + "-TEST",
  );
  const findings = inspectRepositoryFiles(root, [
    ".local/draft.json",
    "safe/key.txt",
  ]);
  assert.equal(findings.length, 2);
  rmSync(root, { recursive: true, force: true });
});

test("privacy inspection allows 1Password references and rejects literal SOPS keys", () => {
  mkdirSync(join(root, "safe"), { recursive: true });
  writeFileSync(
    join(root, "safe", "references.env"),
    'SOPS_AGE_KEY="op://Developer/Personal Content age identity/notesPlain"',
  );
  writeFileSync(
    join(root, "safe", "literal.env"),
    "SOPS_AGE_KEY=literal-private-value",
  );
  const referenceFindings = inspectRepositoryFiles(root, [
    "safe/references.env",
  ]);
  const literalFindings = inspectRepositoryFiles(root, ["safe/literal.env"]);
  assert.equal(referenceFindings.length, 0);
  assert.equal(literalFindings.length, 1);
  rmSync(root, { recursive: true, force: true });
});
