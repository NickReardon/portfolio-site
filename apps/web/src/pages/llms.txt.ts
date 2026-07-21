import { getCollection } from "astro:content";
import { site } from "../site.config";
import {
  entrySlug,
  isVisibleContent,
  sortNewestFirst,
  sortProjects,
} from "../utils/content";

export async function GET() {
  const projects = (await getCollection("projects"))
    .filter(isVisibleContent)
    .sort(sortProjects);
  const posts = (await getCollection("blog"))
    .filter(isVisibleContent)
    .sort(sortNewestFirst);

  const absolute = (path: string) => new URL(path, site.url).toString();

  const lines = [
    `# ${site.name}`,
    "",
    `> ${site.description}`,
    "",
    `${site.role} focused on ${site.focus}.`,
    "",
    "## Pages",
    `- [Home](${absolute("/")})`,
    `- [Projects](${absolute("/projects/")})`,
    `- [Blog](${absolute("/blog/")})`,
    `- [About](${absolute("/about/")})`,
    `- [Contact](${absolute("/contact/")})`,
    `- [Resume](${absolute("/resume/")})`,
  ];

  if (projects.length > 0) {
    lines.push("", "## Projects");
    for (const project of projects) {
      const url = absolute(`/projects/${entrySlug(project.id)}/`);
      lines.push(
        `- [${project.data.title}](${url}): ${project.data.description}`,
      );
    }
  }

  if (posts.length > 0) {
    lines.push("", "## Writing");
    for (const post of posts) {
      const url = absolute(`/blog/${entrySlug(post.id)}/`);
      lines.push(`- [${post.data.title}](${url}): ${post.data.description}`);
    }
  }

  return new Response(`${lines.join("\n")}\n`, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
