import { closeSync, openSync, readFileSync, readSync } from "node:fs";
import YAML from "yaml";

export const publicationStates = new Set(["draft", "approved", "retired"]);
export const resumeTargets = ["general", "gameplay", "tools"];

export function readNote(path) {
  return parseNote(readFileSync(path, "utf8"), path);
}

export function readFrontmatter(path) {
  const descriptor = openSync(path, "r");
  try {
    const buffer = Buffer.alloc(65536);
    const bytes = readSync(descriptor, buffer, 0, buffer.length, 0);
    const source = buffer
      .subarray(0, bytes)
      .toString("utf8")
      .replaceAll("\r\n", "\n");
    if (!source.startsWith("---\n"))
      throw new Error(`${path}: missing YAML frontmatter.`);
    const end = source.indexOf("\n---\n", 4);
    if (end < 0)
      throw new Error(
        `${path}: frontmatter exceeds 64 KiB or is unterminated.`,
      );
    let data;
    try {
      data = YAML.parse(source.slice(4, end)) ?? {};
    } catch {
      throw new Error(`${path}: malformed YAML frontmatter.`);
    }
    if (!data || Array.isArray(data) || typeof data !== "object") {
      throw new Error(`${path}: frontmatter must be a mapping.`);
    }
    return data;
  } finally {
    closeSync(descriptor);
  }
}

export function parseNote(source, label = "note") {
  const normalized = source.replaceAll("\r\n", "\n");
  if (!normalized.startsWith("---\n")) {
    throw new Error(`${label}: missing YAML frontmatter.`);
  }

  const end = normalized.indexOf("\n---\n", 4);
  if (end < 0) {
    throw new Error(`${label}: unterminated YAML frontmatter.`);
  }

  let data;
  try {
    data = YAML.parse(normalized.slice(4, end)) ?? {};
  } catch {
    throw new Error(`${label}: malformed YAML frontmatter.`);
  }

  if (!data || Array.isArray(data) || typeof data !== "object") {
    throw new Error(`${label}: frontmatter must be a mapping.`);
  }

  return { data, body: normalized.slice(end + 5), label };
}

export function validatePublicationState(value, field, label) {
  if (value === undefined) return;
  if (!publicationStates.has(value)) {
    throw new Error(`${label}: ${field} must be draft, approved, or retired.`);
  }
}

export function directSections(markdown, level, label) {
  const prefix = "#".repeat(level);
  const heading = new RegExp(`^${prefix} (.+?)\\s*$`, "gmu");
  const deeperOrPeer = new RegExp(`^#{1,${level}} `, "mu");
  const matches = [...markdown.matchAll(heading)];
  const result = new Map();

  for (let index = 0; index < matches.length; index += 1) {
    const name = matches[index][1].trim();
    if (result.has(name)) {
      throw new Error(`${label}: duplicate ${prefix} ${name} section.`);
    }
    const start = matches[index].index + matches[index][0].length;
    const tail = markdown.slice(start);
    const boundary = tail.search(deeperOrPeer);
    result.set(name, tail.slice(0, boundary < 0 ? undefined : boundary).trim());
  }

  return result;
}

export function exactSection(markdown, level, name, label) {
  const prefix = "#".repeat(level);
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
  const heading = new RegExp(`^${prefix} ${escaped}\\s*$`, "gmu");
  const matches = [...markdown.matchAll(heading)];
  if (matches.length === 0) {
    throw new Error(`${label}: missing ${"#".repeat(level)} ${name}.`);
  }
  if (matches.length > 1) {
    throw new Error(`${label}: duplicate ${prefix} ${name} section.`);
  }
  const start = matches[0].index + matches[0][0].length;
  const tail = markdown.slice(start);
  const boundary = tail.search(new RegExp(`^#{1,${level}} `, "mu"));
  return tail.slice(0, boundary < 0 ? undefined : boundary).trim();
}

export function validateExactNames(sections, expected, required, label) {
  for (const name of sections.keys()) {
    if (!expected.includes(name)) {
      throw new Error(`${label}: unknown publication subsection "${name}".`);
    }
  }
  for (const name of required) {
    if (!sections.get(name)?.trim()) {
      throw new Error(`${label}: missing publication subsection "${name}".`);
    }
  }
}

export function markdownBullets(markdown, label) {
  const bullets = markdown
    .split("\n")
    .map((line) => /^-\s+(.+?)\s*$/u.exec(line)?.[1])
    .filter(Boolean);
  if (bullets.length === 0) {
    throw new Error(`${label}: expected at least one Markdown bullet.`);
  }
  return bullets;
}

export function markdownParagraphs(markdown) {
  return markdown
    .split(/\n\s*\n/u)
    .map((value) => value.replaceAll(/\s*\n\s*/gu, " ").trim())
    .filter(Boolean);
}

export function parseNamedList(markdown, label) {
  const result = {};
  for (const item of markdownBullets(markdown, label)) {
    const separator = item.indexOf(":");
    if (separator < 1) {
      throw new Error(`${label}: expected "Name: value" list entries.`);
    }
    const name = item.slice(0, separator).trim();
    const value = item.slice(separator + 1).trim();
    if (!name || !value || result[name]) {
      throw new Error(`${label}: malformed or duplicate named list entry.`);
    }
    result[name] = value;
  }
  return result;
}

export function parseSkills(markdown, label) {
  return Object.entries(parseNamedList(markdown, label)).map(
    ([name, value]) => ({
      name,
      keywords: value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    }),
  );
}

export function wikiTarget(raw, label) {
  const match = /^\[\[([^\]]+)\]\]$/u.exec(raw.trim());
  if (!match) throw new Error(`${label}: expected a wiki link.`);
  const target = match[1].split("|")[0].split("#")[0].replaceAll("\\", "/");
  if (!target.startsWith("career/") || target.includes("..")) {
    throw new Error(`${label}: wiki-link target must stay under career/.`);
  }
  if (/^career\/Private(?:\/|$)/iu.test(target)) {
    throw new Error(`${label}: career/Private is forbidden.`);
  }
  return target;
}

export function parseLinks(markdown, label) {
  return markdownBullets(markdown, label).map((item) => {
    const separator = item.indexOf(":");
    if (separator < 1) throw new Error(`${label}: malformed public link.`);
    const name = item.slice(0, separator).trim();
    const url = item.slice(separator + 1).trim();
    try {
      const parsed = new URL(url);
      if (!["http:", "https:", "mailto:"].includes(parsed.protocol))
        throw new Error();
    } catch {
      throw new Error(
        `${label}: public link must be an absolute HTTP(S) or mailto URL.`,
      );
    }
    return { name, url };
  });
}
