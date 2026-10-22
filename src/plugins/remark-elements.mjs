/* Body elements: the half of the palette whose position in the page matters.
 * See docs/project-elements.md section 4.
 *
 * Directives rather than typed code fences, for one reason: a fence opts its
 * contents out of Markdown parsing entirely, so image paths inside one stay
 * dumb strings and lose both the build's optimization and its missing-file
 * error. A directive wraps Markdown, so what is inside stays Markdown.
 *
 * The registry lives here rather than in site.config.ts because astro.config
 * loads this before the app's module graph exists. */

const YOUTUBE_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "youtu.be",
  "www.youtu.be",
]);
const MEDIA_FILE = /\.(mp4|webm|mov)$/iu;

function escapeAttribute(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

/* Only a watch URL needs rewriting; a direct file plays as-is. Anything else
 * degrades to a link rather than throwing, because a working link is never the
 * wrong answer for a host this does not know how to frame. */
function videoHtml({ href, label }) {
  const title = escapeAttribute(label ?? "Video");
  let url;

  try {
    url = new URL(href);
  } catch {
    throw new Error(`video href is not a URL: ${href}`);
  }

  /* `new URL` parses `javascript:` and `data:` as happily as it does https, and
   * escaping an attribute does not disarm a scheme. Everything below writes
   * this value into an href or src, so the allowlist belongs here, before any
   * markup exists. */
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new Error(`video href must be http(s): ${href}`);
  }

  if (YOUTUBE_HOSTS.has(url.hostname)) {
    const raw = url.hostname.endsWith("youtu.be")
      ? url.pathname.slice(1)
      : (url.searchParams.get("v") ?? url.pathname.split("/").pop());
    // A video id is this alphabet and nothing else. Anything else is a path
    // being smuggled into an embed URL whose host this plugin fixes.
    const id = /^[\w-]+$/u.test(raw ?? "") ? raw : null;

    if (id) {
      // nocookie so an embed does not set tracking cookies on a page that asks
      // the visitor for nothing.
      const src = `https://www.youtube-nocookie.com/embed/${id}`;
      return `<iframe src="${src}" title="${title}" loading="lazy" allowfullscreen allow="accelerometer; encrypted-media; picture-in-picture"></iframe>`;
    }
  }

  // `url.href` rather than the authored string: what was parsed and checked is
  // what gets written, so no odd encoding slips between the two.
  if (MEDIA_FILE.test(url.pathname)) {
    return `<video controls preload="metadata" src="${escapeAttribute(url.href)}"></video>`;
  }

  return `<p><a href="${escapeAttribute(url.href)}">${title}</a></p>`;
}

/* name -> how it renders. `container` takes Markdown children, `leaf` takes
 * attributes and builds its own markup. */
const ELEMENTS = {
  gallery: { kind: "container", tag: "div", class: "element-gallery" },
  note: { kind: "container", tag: "aside", class: "element-note" },
  video: {
    kind: "leaf",
    tag: "div",
    class: "element-video",
    html: videoHtml,
    required: ["href"],
  },
};

const DIRECTIVE_TYPES = new Set([
  "containerDirective",
  "leafDirective",
  "textDirective",
]);

function place(node, file) {
  const line = node.position?.start?.line;
  return line ? `${file.path ?? "content"}:${line}` : (file.path ?? "content");
}

/* Astro's own remark stack brings unist-util-visit, but depending on a package
 * this one does not declare is how a build breaks on someone else's upgrade.
 * The tree is small and the walk is six lines. */
function walk(node, visitor) {
  if (!node || typeof node !== "object") {
    return;
  }

  visitor(node);

  for (const child of node.children ?? []) {
    walk(child, visitor);
  }
}

export function remarkElements() {
  return (tree, file) => {
    walk(tree, (node) => {
      if (!DIRECTIVE_TYPES.has(node.type)) {
        return;
      }

      const element = ELEMENTS[node.name];

      /* The same bargain .strict() makes for frontmatter keys: an unknown name
       * is a build error, not markup that silently renders empty. */
      if (!element) {
        throw new Error(
          `Unknown body element ":::${node.name}" at ${place(node, file)}. ` +
            `Known elements: ${Object.keys(ELEMENTS).join(", ")}.`,
        );
      }

      const attributes = node.attributes ?? {};

      for (const key of element.required ?? []) {
        if (!attributes[key]) {
          throw new Error(
            `Body element ":::${node.name}" at ${place(node, file)} needs a "${key}" attribute.`,
          );
        }
      }

      node.data = {
        ...node.data,
        hName: element.tag,
        hProperties: { class: element.class },
      };

      if (element.kind === "leaf") {
        node.children = [{ type: "html", value: element.html(attributes) }];
      }
    });
  };
}
