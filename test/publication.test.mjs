import assert from "node:assert/strict";
import {
  cpSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import test from "node:test";
import {
  extractPublication,
  loadMediaConfig,
} from "../scripts/publication/extract.mjs";

const fixture = resolve("test/fixtures/vault");
const media = loadMediaConfig(resolve("config/project-media.json"));
const sentinel = "PRIVATE_SENTINEL";

test("extracts only named approved sections in exact recipe order", () => {
  const result = extractPublication(fixture, media);
  assert.equal(result.projects.length, 1);
  assert.equal(result.projects[0].slug, "fixture-project");
  assert.deepEqual(result.resumes.general.projects[0].highlights, [
    "First approved fictional bullet.",
    "Second approved fictional bullet.",
  ]);
  assert.deepEqual(
    result.resumes.general.work.map((entry) => entry.name),
    ["Example Workshop"],
  );
  assert.deepEqual(
    result.resumes.general.education.map((entry) => entry.institution),
    ["Example University"],
  );
  assert.equal(JSON.stringify(result).includes(sentinel), false);
});

test("draft portfolio notes are not published", () =>
  withVault((vault) => {
    replace(
      vault,
      "career/Projects/Fixture Project/Fixture Project.md",
      "portfolio_status: approved",
      "portfolio_status: draft",
    );
    const result = extractPublication(vault, media);
    assert.equal(result.projects.length, 0);
  }));

test("rejects duplicate portfolio slugs", () =>
  withVault((vault) => {
    const source = readFileSync(
      join(vault, "career/Projects/Fixture Project/Fixture Project.md"),
      "utf8",
    );
    const duplicate = join(
      vault,
      "career/Projects/Fixture Project/Duplicate.md",
    );
    writeFileSync(
      duplicate,
      source.replace("title: Fixture Project", "title: Duplicate Fixture"),
    );
    assert.throws(
      () => extractPublication(vault, media),
      /Duplicate portfolio slug/u,
    );
  }));

test("rejects broken recipe links", () =>
  withVault((vault) => {
    replace(
      vault,
      "career/Framings/Portfolio Profile.md",
      "First evidence|First evidence",
      "Missing evidence|Missing evidence",
    );
    assert.throws(
      () => extractPublication(vault, media),
      /linked source is missing/u,
    );
  }));

test("rejects career Private links", () =>
  withVault((vault) => {
    replace(
      vault,
      "career/Framings/Portfolio Profile.md",
      "career/Projects/Fixture Project/First evidence|First evidence",
      "career/Private/Secret|Secret",
    );
    assert.throws(
      () => extractPublication(vault, media),
      /career\/Private is forbidden/u,
    );
  }));

test("rejects traversal outside career", () =>
  withVault((vault) => {
    replace(
      vault,
      "career/Framings/Portfolio Profile.md",
      "career/Projects/Fixture Project/First evidence|First evidence",
      "career/../Private/Secret|Secret",
    );
    assert.throws(
      () => extractPublication(vault, media),
      /must stay under career/u,
    );
  }));

test("rejects malformed project publication sections", () =>
  withVault((vault) => {
    replace(
      vault,
      "career/Projects/Fixture Project/Fixture Project.md",
      "### Case Study",
      "### Internal Commentary",
    );
    assert.throws(
      () => extractPublication(vault, media),
      /unknown publication subsection/u,
    );
  }));

test("rejects malformed publication status", () =>
  withVault((vault) => {
    replace(
      vault,
      "career/Projects/Fixture Project/Fixture Project.md",
      "portfolio_status: approved",
      "portfolio_status: public",
    );
    assert.throws(
      () => extractPublication(vault, media),
      /must be draft, approved, or retired/u,
    );
  }));

test("rejects unknown resume role headings", () =>
  withVault((vault) => {
    replace(
      vault,
      "career/Projects/Fixture Project/First evidence.md",
      "### General, Gameplay, Tools",
      "### Executive",
    );
    assert.throws(
      () => extractPublication(vault, media),
      /unknown resume role executive/u,
    );
  }));

function withVault(run) {
  const root = mkdtempSync(join(tmpdir(), "portfolio-vault-test-"));
  cpSync(fixture, root, { recursive: true });
  try {
    run(root);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

function replace(vault, relative, from, to) {
  const path = join(vault, relative);
  const source = readFileSync(path, "utf8");
  assert.ok(source.includes(from), `Fixture must include ${from}`);
  writeFileSync(path, source.replace(from, to));
}
