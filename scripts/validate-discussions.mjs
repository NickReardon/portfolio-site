import { strict as assert } from "node:assert";
import {
  mkdtemp,
  mkdir,
  readFile,
  readdir,
  rm,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import YAML from "yaml";
import {
  fetchDiscussions,
  readSyncedSlugs,
  syncDiscussions,
} from "./sync-discussions.mjs";

const originalDirectory = process.cwd();
const originalFetch = globalThis.fetch;
const directory = await mkdtemp(
  path.join(os.tmpdir(), "discussion-validation-"),
);
const projects = "src/content/projects";

function discussion(number, title, body = "Prose.") {
  return {
    number,
    title,
    category: { name: "Games" },
    labels: { nodes: [{ name: "publish" }] },
    body: `\`\`\`yaml\ntitle: ${JSON.stringify(title)}\ndescription: Example\ndate: 2026-01-01\ntags: []\nlinks: [{label: Play, href: "https://example.com"}]\n\`\`\`\n\n${body}`,
  };
}

try {
  // A partial API snapshot must never be interpreted as deleted discussions.
  const repository = {
    discussionCategories: {
      nodes: ["Blog", "Games", "Software"].map((name) => ({ name })),
    },
    discussions: {
      nodes: [],
      pageInfo: { hasNextPage: false, endCursor: null },
    },
  };
  globalThis.fetch = async () => Response.json({ data: { repository } });
  assert.deepEqual(await fetchDiscussions("owner", "repo", "test-token"), []);
  repository.discussions.pageInfo.hasNextPage = true;
  await assert.rejects(
    fetchDiscussions("owner", "repo", "test-token"),
    /pagination was incomplete/,
  );
  repository.discussions.pageInfo.hasNextPage = false;
  repository.discussionCategories.nodes.pop();
  await assert.rejects(
    fetchDiscussions("owner", "repo", "test-token"),
    /Missing discussion categories: Software/,
  );
  globalThis.fetch = originalFetch;

  process.chdir(directory);
  await mkdir(projects, { recursive: true });
  await mkdir("src/content/blog", { recursive: true });
  const handwritten = "---\ntitle: Handwritten\n---\n\ndiscussion: 99\n";
  await writeFile(`${projects}/same.md`, handwritten);
  await writeFile(`${projects}/same-1.md`, handwritten);
  assert.equal(
    readSyncedSlugs([{ name: "same.md", text: handwritten }]).size,
    0,
  );

  // Handwritten filenames and collisions within the same run stay distinct.
  await syncDiscussions([discussion(1, "Same"), discussion(2, "Same")]);
  assert.equal(await readFile(`${projects}/same.md`, "utf8"), handwritten);
  assert.equal(await readFile(`${projects}/same-1.md`, "utf8"), handwritten);
  assert.ok((await readdir(projects)).includes("same-1-1.md"));
  assert.ok((await readdir(projects)).includes("same-2.md"));

  // Retitling preserves the URL and repo-owned covers; links remain valid YAML.
  const first = `${projects}/same-1-1.md`;
  let text = await readFile(first, "utf8");
  text = text.replace(
    "---\n",
    '---\ncoverImage: "../../assets/projects/cover.png"\ncoverAlt: "Cover"\n',
  );
  await writeFile(first, text);
  await syncDiscussions([discussion(1, "Renamed"), discussion(2, "Same")]);
  const updated = await readFile(first, "utf8");
  const frontmatter = YAML.parse(updated.split("---")[1]);
  assert.equal(frontmatter.title, "Renamed");
  assert.equal(frontmatter.coverAlt, "Cover");
  assert.equal(frontmatter.links[0].href, "https://example.com");
  assert.deepEqual(
    await syncDiscussions([discussion(1, "Renamed"), discussion(2, "Same")]),
    {
      written: 0,
      removed: 0,
      assets: 0,
    },
  );

  // A failed attachment request rejects publication and keeps the old page.
  globalThis.fetch = async () => new Response("Unavailable", { status: 503 });
  await assert.rejects(
    syncDiscussions([
      discussion(
        1,
        "Renamed",
        "![image](https://github.com/user-attachments/assets/abc)",
      ),
      discussion(2, "Same"),
    ]),
    /Attachment sync failed/,
  );
  assert.equal(await readFile(first, "utf8"), updated);

  // Extensionless GitHub uploads use the actual media type, not a guessed PNG.
  globalThis.fetch = async () =>
    new Response("image bytes", {
      headers: { "content-type": "image/jpeg" },
    });
  await syncDiscussions([
    discussion(
      1,
      "Renamed",
      "![image](https://github.com/user-attachments/assets/abc)",
    ),
    discussion(2, "Same"),
  ]);
  assert.match(await readFile(first, "utf8"), /\.jpg\)/u);
  assert.equal((await readdir("src/assets/projects/same-1-1")).length, 1);
  globalThis.fetch = async () =>
    new Response("video bytes", {
      headers: { "content-type": "video/mp4" },
    });
  await assert.rejects(
    syncDiscussions([
      discussion(
        1,
        "Renamed",
        "![image](https://github.com/user-attachments/assets/abc)",
      ),
      discussion(2, "Same"),
    ]),
    /Attachment sync failed/,
  );
  globalThis.fetch = originalFetch;

  // Unpublishing deletes only discussion-owned pages, including MDX files.
  await writeFile(
    `${projects}/legacy.mdx`,
    "---\ntitle: Legacy\ndiscussion: 3\n---\n",
  );
  await syncDiscussions([]);
  assert.deepEqual((await readdir(projects)).sort(), ["same-1.md", "same.md"]);
  console.log("discussion sync integration checks passed.");
} finally {
  process.chdir(originalDirectory);
  globalThis.fetch = originalFetch;
  await rm(directory, { recursive: true, force: true });
}
