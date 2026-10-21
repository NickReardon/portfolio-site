/* Assertions for the body-element plugin in src/plugins/remark-elements.mjs.
 *
 * The nodes are built by hand rather than parsed, so this needs no Markdown
 * stack: the plugin's job starts after remark-directive has already produced
 * directive nodes, and that is the part worth pinning down.
 *
 * Usage: node scripts/validate-elements.mjs
 */
import { strict as assert } from "node:assert";
import { remarkElements } from "../src/plugins/remark-elements.mjs";

const transform = remarkElements();
const file = { path: "sample.md" };

function run(node) {
  const tree = { type: "root", children: [node] };
  transform(tree, file);
  return tree.children[0];
}

function container(name, children = []) {
  return { type: "containerDirective", name, children };
}

function leaf(name, attributes) {
  return { type: "leafDirective", name, attributes, children: [] };
}

// A container keeps its Markdown children and only gains a tag and class, which
// is the whole reason these are directives and not fenced code blocks.
const image = { type: "image", url: "../../assets/projects/a.png", alt: "A" };
const gallery = run(container("gallery", [image]));
assert.equal(gallery.data.hName, "div");
assert.equal(gallery.data.hProperties.class, "element-gallery");
assert.deepEqual(gallery.children, [image]);

const note = run(container("note", []));
assert.equal(note.data.hName, "aside");
assert.equal(note.data.hProperties.class, "element-note");

// A watch URL is rewritten to a nocookie embed; the label becomes the iframe
// title, because an untitled frame is unusable with a screen reader.
const watch = run(
  leaf("video", { href: "https://youtube.com/watch?v=abc123", label: "Tour" }),
);
assert.equal(watch.data.hName, "div");
assert.match(
  watch.children[0].value,
  /^<iframe src="https:\/\/www\.youtube-nocookie\.com\/embed\/abc123"/u,
);
assert.match(watch.children[0].value, /title="Tour"/u);

// Short links carry the id in the path instead of a query parameter.
assert.match(
  run(leaf("video", { href: "https://youtu.be/xyz789" })).children[0].value,
  /embed\/xyz789/u,
);

// A direct file plays locally rather than being framed.
assert.match(
  run(leaf("video", { href: "https://cdn.example.com/clip.mp4" })).children[0]
    .value,
  /^<video controls preload="metadata" src="https:\/\/cdn\.example\.com\/clip\.mp4">/u,
);

// A host the plugin cannot frame degrades to a link. A working link is never
// the wrong answer, so this is deliberately not an error.
assert.match(
  run(leaf("video", { href: "https://vimeo.com/123", label: "Clip" }))
    .children[0].value,
  /^<p><a href="https:\/\/vimeo\.com\/123">Clip<\/a><\/p>$/u,
);

// Attribute values are escaped, so a label cannot close the tag it sits in.
assert.match(
  run(leaf("video", { href: "https://youtu.be/a", label: '"><script>' }))
    .children[0].value,
  /title="&quot;&gt;&lt;script&gt;"/u,
);

// A scheme is not disarmed by escaping the attribute it sits in, so anything
// that is not http(s) is refused before any markup exists.
for (const href of [
  "javascript:alert(1)",
  "data:text/html,<script>alert(1)</script>",
  "vbscript:msgbox(1)",
  "file:///etc/passwd",
]) {
  assert.throws(
    () => run(leaf("video", { href })),
    /must be http\(s\)/u,
    `expected ${href} to be refused`,
  );
}

// A path smuggled in where a video id belongs does not reach the embed URL.
assert.match(
  run(leaf("video", { href: "https://youtu.be/..%2f..%2fevil" })).children[0]
    .value,
  /^<p><a href=/u,
);

// The two failure modes that keep the registry honest: an unknown name is a
// build error rather than empty markup, and a required attribute is not
// optional.
assert.throws(() => run(container("callout")), /Unknown body element/u);
assert.throws(() => run(leaf("video", {})), /needs a "href" attribute/u);

// Position is reported where the source has one, so the error names a line.
assert.throws(
  () =>
    run({
      type: "containerDirective",
      name: "nope",
      children: [],
      position: { start: { line: 42 } },
    }),
  /sample\.md:42/u,
);

console.log("remark-elements self-check passed.");
