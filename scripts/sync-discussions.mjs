/* Mirror GitHub Discussions into the blog and project content collections.
 *
 * Discussions are the authoring surface; the repo stays the source of truth for
 * what the site ships. Running this on a discussion event and committing the
 * result keeps `npm run build` hermetic and the build stamp honest: a synced
 * post's content is a commit, exactly like a hand-written one, so commit date
 * and tree SHA keep meaning what astro.config.mjs says they mean.
 *
 * The element model and the parse contract this implements are written down in
 * docs/project-elements.md.
 *
 * Usage:
 *   node scripts/sync-discussions.mjs               sync (needs GITHUB_TOKEN)
 *   node scripts/sync-discussions.mjs --self-check  run the assertions, no network
 */
import { createHash } from "node:crypto";
import { mkdir, readdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import YAML from "yaml";

/* Discussion category name, as it appears in GitHub, mapped to where its posts
 * land. Several categories feed the projects collection, each stamping the
 * index subsection it belongs to, so the author picks a type by choosing where
 * to post rather than by typing a `category:` line that can be misspelled.
 *
 * `assets` is where body attachments are materialized. Sibling of the content
 * dir so a synced file reaches them with the same `../../assets/...` path a
 * hand-written one uses. */
const COLLECTIONS = {
  Blog: {
    dir: "src/content/blog",
    assets: "src/assets/blog",
  },
  Games: {
    dir: "src/content/projects",
    assets: "src/assets/projects",
    category: "Games",
  },
  Software: {
    dir: "src/content/projects",
    assets: "src/assets/projects",
    category: "Software",
  },
};

/* Applied by hand when a post is ready, which is why no discussion template
 * pre-applies it: the gate has to be a decision, not a default. */
const PUBLISH_LABEL = "publish";

/* Elements the repo owns. A discussion has nowhere to put an asset that
 * Astro's image() helper can hash and crop, so these are never read from one —
 * they are carried over from the file already on disk instead, which is what
 * stops a sync from deleting a cover added by hand. */
const REPO_OWNED = ["coverImage", "coverAlt"];

/* Present in every collection's schema, so a post that omits one is rejected
 * rather than committed for `astro build` to fail on later. */
const REQUIRED = ["title", "description", "date", "tags"];

/* GitHub rewrites a pasted file to one of these hosts. Both forms appear in the
 * wild: the documented githubusercontent subdomains, and the user-attachments
 * path that the current web UI inserts. */
const ATTACHMENT_HOST =
  /^https:\/\/(?:[a-z0-9-]+\.githubusercontent\.com\/|github\.com\/user-attachments\/)/u;
const IMAGE_TYPES = new Map([
  ["image/png", "png"],
  ["image/gif", "gif"],
  ["image/jpeg", "jpg"],
  ["image/svg+xml", "svg"],
]);
const VIDEO_EXTENSION = /\.(mp4|mov|webm)(?:$|[?#])/iu;
/* GitHub's own ceiling for an image upload. A larger file did not come from the
 * attachment flow, so refuse it rather than commit it. */
const MAX_ASSET_BYTES = 10 * 1024 * 1024;

const API = "https://api.github.com/graphql";

const QUERY = `
query ($owner: String!, $repo: String!, $cursor: String) {
  repository(owner: $owner, name: $repo) {
    discussionCategories(first: 100) { nodes { name } }
    discussions(first: 50, after: $cursor) {
      pageInfo { hasNextPage endCursor }
      nodes {
        number
        title
        body
        createdAt
        category { name }
        labels(first: 100) { nodes { name } pageInfo { hasNextPage } }
      }
    }
  }
}`;

/* Paginated rather than first:50-and-hope. A truncated response would read as
 * "these discussions no longer exist" and delete live posts. */
export async function fetchDiscussions(owner, repo, token) {
  const all = [];
  let cursor = null;

  do {
    const response = await fetch(API, {
      method: "POST",
      headers: {
        Authorization: `bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: QUERY,
        variables: { owner, repo, cursor },
      }),
    });

    if (!response.ok) {
      throw new Error(`GitHub API returned ${response.status}`);
    }

    const payload = await response.json();

    if (payload.errors) {
      throw new Error(payload.errors.map((error) => error.message).join("; "));
    }

    const repository = payload.data?.repository;
    if (!repository) throw new Error("GitHub returned no repository.");
    const categories = new Set(
      repository.discussionCategories.nodes.map(({ name }) => name),
    );
    const missing = Object.keys(COLLECTIONS).filter(
      (name) => !categories.has(name),
    );
    if (missing.length)
      throw new Error(`Missing discussion categories: ${missing.join(", ")}`);
    const page = repository.discussions;
    if (page.pageInfo.hasNextPage && !page.pageInfo.endCursor) {
      throw new Error(
        "Discussion pagination was incomplete; refusing to sync.",
      );
    }
    if (
      page.nodes.some((discussion) => discussion.labels.pageInfo.hasNextPage)
    ) {
      throw new Error(
        "Discussion labels were truncated; refusing to unpublish content.",
      );
    }
    all.push(...page.nodes);
    cursor = page.pageInfo.hasNextPage ? page.pageInfo.endCursor : null;
  } while (cursor);

  return all;
}

export function slugify(title) {
  return title
    .toLowerCase()
    .replace(/['’]/gu, "")
    .replace(/[^a-z0-9]+/gu, "-")
    .replace(/^-+|-+$/gu, "")
    .slice(0, 80);
}

/* The stable-URL guarantee lives here. A discussion's slug is chosen once, when
 * its file is first written, and read back out of the file on every later run.
 * Retitling a discussion therefore cannot move its page: the title is only
 * consulted for discussions this collection has never seen. */
export function resolveSlug(number, title, existing, reserved = new Set()) {
  const known = existing.get(number);
  if (known) {
    return known;
  }

  const base = slugify(title) || `discussion-${number}`;
  const taken = new Set([...existing.values(), ...reserved]);
  let candidate = base;
  let suffix = 0;
  while (taken.has(candidate)) {
    candidate = `${base}-${number}${suffix ? `-${suffix}` : ""}`;
    suffix += 1;
  }
  return candidate;
}

/* Only files carrying a `discussion:` field are considered synced. Hand-written
 * posts have no such field, so they are invisible to this script and can never
 * be rewritten or deleted by it. */
export function readSyncedSlugs(files) {
  const synced = new Map();

  for (const { name, text } of files) {
    const front = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/u.exec(text);
    const parsed = front ? YAML.parse(front[1]) : null;
    if (Number.isSafeInteger(parsed?.discussion) && parsed.discussion > 0) {
      if (synced.has(parsed.discussion)) {
        throw new Error(
          `Duplicate discussion ownership: #${parsed.discussion}`,
        );
      }
      synced.set(parsed.discussion, name.replace(/\.mdx?$/u, ""));
    }
  }

  return synced;
}

export function serializeFrontmatter(data) {
  const lines = Object.entries(data)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => {
      if (Array.isArray(value)) {
        return `${key}: [${value.map((item) => JSON.stringify(item)).join(", ")}]`;
      }

      // JSON string syntax is valid YAML, so this escapes quotes and colons for
      // free rather than hand-rolling a quoting rule that gets it subtly wrong.
      return `${key}: ${typeof value === "object" || typeof value === "string" ? JSON.stringify(value) : value}`;
    });

  return `---\n${lines.join("\n")}\n---\n`;
}

/* The first `yaml` fence is the frontmatter, wherever it sits: a post created
 * from a discussion form may carry a field heading above it, so position zero
 * is not assumed. Everything after that fence is the body, which drops such a
 * heading rather than shipping it as prose. */
export function splitFence(body) {
  const match = /^```yaml[^\n]*\r?\n([\s\S]*?)\r?\n```[ \t]*$/mu.exec(body);

  if (!match) {
    return null;
  }

  return {
    yaml: match[1],
    body: body.slice(match.index + match[0].length).trim(),
  };
}

/* Carried over from the file already on disk, so the repo keeps ownership of
 * every asset a page depends on. */
export function readRepoOwned(text) {
  const carried = {};

  if (!text) {
    return carried;
  }

  const front = /^---\r?\n([\s\S]*?)\r?\n---/u.exec(text);

  if (!front) {
    return carried;
  }

  const parsed = YAML.parse(front[1]) ?? {};

  for (const key of REPO_OWNED) {
    if (parsed[key] !== undefined) {
      carried[key] = parsed[key];
    }
  }

  return carried;
}

/* Returns the frontmatter a discussion should produce, or null for one that
 * should not become a page at all.
 *
 * Fails closed, deliberately: anything this does not positively recognise as
 * publishable is left alone. A missing label, a missing fence, YAML that does
 * not parse and a missing required element all land in the same place. */
export function discussionToFrontmatter(discussion, collection) {
  const labels = (discussion.labels?.nodes ?? []).map((label) => label.name);

  if (!labels.includes(PUBLISH_LABEL)) {
    return null;
  }

  const split = splitFence(discussion.body ?? "");

  if (!split) {
    return null;
  }

  let parsed;

  try {
    parsed = YAML.parse(split.yaml);
  } catch {
    return null;
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return null;
  }

  for (const key of REQUIRED) {
    if (parsed[key] === undefined || parsed[key] === null) {
      return null;
    }
  }

  // Repo-owned elements are dropped rather than trusted: a discussion cannot
  // add an asset, so it must not be able to claim one either.
  for (const key of REPO_OWNED) {
    delete parsed[key];
  }

  return {
    ...parsed,
    // Stamped from where the post was authored, never from the fence, so it
    // cannot be misspelled into a group of its own.
    ...(collection.category ? { category: collection.category } : {}),
    // Not authored: it marks the file as discussion-owned and pins the slug.
    discussion: discussion.number,
  };
}

/* Every attachment reference in a body, as {markdown, url} pairs. Images and
 * bare links both appear, because GitHub inserts a link rather than an image
 * for anything it does not render inline. */
export function findAttachments(body) {
  const found = [];
  const pattern = /!?\[([^\]]*)\]\((https:\/\/[^)\s]+)\)/gu;

  for (const match of body.matchAll(pattern)) {
    if (ATTACHMENT_HOST.test(match[2])) {
      found.push({ markdown: match[0], alt: match[1], url: match[2] });
    }
  }

  return found;
}

/* A hotlinked GitHub asset is invisible to the build: no hash, no WebP, no
 * srcset, and no error when it stops resolving. So an image is downloaded into
 * the repo and the reference rewritten to point at the committed file.
 *
 * Video is not, and is not hotlinked either. Git is the wrong store for media
 * that large and there is no pipeline that would make committing it worthwhile,
 * so a video attachment rejects the post instead: see the `video` element in
 * src/plugins/remark-elements.mjs for where it belongs. */
async function materialize(body, { slug, assets }) {
  const attachments = findAttachments(body);
  let next = body;
  let written = 0;

  for (const attachment of attachments) {
    if (VIDEO_EXTENSION.test(attachment.url)) {
      throw new Error(
        `video attachment cannot be committed: ${attachment.url}. Host it and use ::video{href=...}.`,
      );
    }

    const response = await fetch(attachment.url);

    if (!response.ok) {
      throw new Error(
        `attachment ${attachment.url} returned ${response.status}`,
      );
    }

    const type = response.headers
      .get("content-type")
      ?.split(";")[0]
      .trim()
      .toLowerCase();
    const extension = IMAGE_TYPES.get(type);
    if (!extension) {
      throw new Error(
        `attachment ${attachment.url} is not a supported image (${type})`,
      );
    }
    const chunks = [];
    let size = 0;
    for await (const chunk of response.body) {
      size += chunk.byteLength;
      if (size > MAX_ASSET_BYTES) {
        throw new Error(
          `attachment ${attachment.url} exceeds the ${MAX_ASSET_BYTES} byte ceiling`,
        );
      }
      chunks.push(chunk);
    }
    const bytes = Buffer.concat(chunks);
    // Named by content, so re-editing a discussion does not churn the tree with
    // a second copy of an unchanged image.
    const hash = createHash("sha256").update(bytes).digest("hex").slice(0, 16);
    const file = `${hash}.${extension}`;

    await mkdir(path.join(assets, slug), { recursive: true });
    await writeFile(path.join(assets, slug, file), bytes);

    const relative = `../../assets/${path.basename(assets)}/${slug}/${file}`;
    next = next.replaceAll(
      attachment.markdown,
      `![${attachment.alt}](${relative})`,
    );
    written += 1;
  }

  return { body: next, written };
}

async function main() {
  const token = process.env.GITHUB_TOKEN;
  const repository = process.env.GITHUB_REPOSITORY;

  if (!token || !repository) {
    throw new Error("GITHUB_TOKEN and GITHUB_REPOSITORY must both be set.");
  }

  const [owner, repo] = repository.split("/");
  const discussions = await fetchDiscussions(owner, repo, token);
  return syncDiscussions(discussions);
}

export async function syncDiscussions(discussions) {
  let written = 0;
  let removed = 0;
  let assets = 0;
  const skipped = [];

  // Several categories can feed one directory, so a directory is read once and
  // every category pointing at it is resolved against the same file list.
  const directories = [
    ...new Set(Object.values(COLLECTIONS).map((entry) => entry.dir)),
  ];

  for (const dir of directories) {
    const categories = Object.entries(COLLECTIONS).filter(
      ([, entry]) => entry.dir === dir,
    );
    const names = (await readdir(dir)).filter((name) => /\.mdx?$/u.test(name));
    const files = await Promise.all(
      names.map(async (name) => ({
        name,
        text: await readFile(path.join(dir, name), "utf8"),
      })),
    );

    const existing = readSyncedSlugs(files);
    const reserved = new Set(names.map((name) => name.replace(/\.mdx?$/u, "")));
    const original = new Map(existing);
    const live = new Set();

    for (const [category, collection] of categories) {
      for (const discussion of discussions) {
        if (discussion.category?.name !== category) {
          continue;
        }

        const frontmatter = discussionToFrontmatter(discussion, collection);
        if (!frontmatter) {
          continue;
        }

        const slug = resolveSlug(
          discussion.number,
          discussion.title,
          existing,
          reserved,
        );
        const current = files.find(
          (file) => file.name.replace(/\.mdx?$/u, "") === slug,
        );
        const filename = current?.name ?? `${slug}.md`;
        const split = splitFence(discussion.body);

        let prose;

        try {
          const result = await materialize(split.body, {
            slug,
            assets: collection.assets,
          });
          prose = result.body;
          assets += result.written;
        } catch (error) {
          // One unusable attachment rejects one post, and says why, rather than
          // failing the whole run or shipping a broken reference.
          // Network failures must not delete the previously published page.
          if (existing.has(discussion.number)) live.add(slug);
          skipped.push(`#${discussion.number}: ${error.message}`);
          continue;
        }

        live.add(slug);
        existing.set(discussion.number, slug);
        reserved.add(slug);

        const next = `${serializeFrontmatter({
          ...frontmatter,
          ...readRepoOwned(current?.text),
        })}\n${prose}\n`;

        if (current?.text !== next) {
          await writeFile(path.join(dir, filename), next, "utf8");
          written += 1;
        }
      }
    }

    // A synced file whose discussion is gone, unpublished, or recategorised.
    for (const slug of original.values()) {
      if (!live.has(slug)) {
        await unlink(
          path.join(
            dir,
            files.find((file) => file.name.replace(/\.mdx?$/u, "") === slug)
              .name,
          ),
        );
        removed += 1;
      }
    }
  }

  console.log(
    `Synced discussions: ${written} written, ${removed} removed, ${assets} assets.`,
  );

  for (const reason of skipped) {
    console.log(`Skipped ${reason}`);
  }
  if (skipped.length)
    throw new Error(
      "Attachment sync failed; no publishing PR should be created.",
    );
  return { written, removed, assets };
}

async function selfCheck() {
  const { strict: assert } = await import("node:assert");

  assert.equal(slugify("Building the Portfolio"), "building-the-portfolio");
  assert.equal(slugify("It's 2026: What Now?"), "its-2026-what-now");
  assert.equal(slugify("***"), "");

  const existing = readSyncedSlugs([
    { name: "hand-written.md", text: '---\ntitle: "X"\ndraft: false\n---\n' },
    { name: "synced-post.md", text: '---\ntitle: "Y"\ndiscussion: 42\n---\n' },
  ]);
  assert.deepEqual([...existing], [[42, "synced-post"]]);

  // A known discussion keeps its slug after a retitle: the fixed URL.
  assert.equal(
    resolveSlug(42, "A Completely New Title", existing),
    "synced-post",
  );
  // A new discussion colliding with an existing slug is disambiguated.
  assert.equal(resolveSlug(7, "Synced Post", existing), "synced-post-7");
  // An unslugifiable title still produces a usable filename.
  assert.equal(resolveSlug(9, "***", existing), "discussion-9");

  assert.equal(
    serializeFrontmatter({ title: 'He said "hi"', tags: ["A"], draft: false }),
    '---\ntitle: "He said \\"hi\\""\ntags: ["A"]\ndraft: false\n---\n',
  );

  // The fence is found where it sits, not at position zero, and the heading a
  // discussion form puts above it does not reach the page.
  const split = splitFence(
    '### Post\n\n```yaml\ntitle: "T"\n```\n\n## Body\n\nProse.\n',
  );
  assert.equal(split.yaml, 'title: "T"');
  assert.equal(split.body, "## Body\n\nProse.");
  assert.equal(splitFence("No fence here."), null);

  const publishable = {
    number: 5,
    title: "T",
    labels: { nodes: [{ name: "publish" }] },
    body:
      '```yaml\ntitle: "T"\ndescription: "D"\ndate: 2026-01-01\ntags: ["A"]\n' +
      'coverImage: "../../assets/projects/claimed.png"\n```\n\nProse.\n',
  };

  const frontmatter = discussionToFrontmatter(publishable, {
    category: "Games",
  });
  // Category is stamped from where the post lives, the number is recorded, and
  // a cover the discussion tried to claim is dropped.
  assert.equal(frontmatter.category, "Games");
  assert.equal(frontmatter.discussion, 5);
  assert.equal(frontmatter.coverImage, undefined);

  // Every gate refuses on its own.
  assert.equal(
    discussionToFrontmatter({ ...publishable, labels: { nodes: [] } }, {}),
    null,
  );
  assert.equal(
    discussionToFrontmatter({ ...publishable, body: "Prose only." }, {}),
    null,
  );
  assert.equal(
    discussionToFrontmatter(
      { ...publishable, body: '```yaml\ntitle: "T"\n```\n' },
      {},
    ),
    null,
  );
  assert.equal(
    discussionToFrontmatter(
      { ...publishable, body: "```yaml\n: : :\n```\n" },
      {},
    ),
    null,
  );

  // A cover on disk survives a re-sync; anything else in that file does not.
  assert.deepEqual(
    readRepoOwned(
      '---\ntitle: "Old"\ncoverImage: "../../assets/projects/a.png"\ncoverAlt: "A"\n---\n',
    ),
    { coverImage: "../../assets/projects/a.png", coverAlt: "A" },
  );
  assert.deepEqual(readRepoOwned(undefined), {});

  // Only GitHub-hosted references are attachments. A relative path is already
  // repo-owned and an unrelated host is someone else's link.
  const attachments = findAttachments(
    "![a](https://user-images.githubusercontent.com/1/a.png)\n" +
      "![b](https://github.com/user-attachments/assets/abc)\n" +
      "![c](../../assets/projects/c.png)\n" +
      "[d](https://example.com/d.png)\n",
  );
  assert.deepEqual(
    attachments.map((item) => item.alt),
    ["a", "b"],
  );

  console.log("sync-discussions self-check passed.");
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
) {
  if (process.argv.includes("--self-check")) {
    await selfCheck();
  } else {
    await main();
  }
}
