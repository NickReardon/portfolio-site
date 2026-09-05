import type { CollectionEntry } from "astro:content";

type DraftableEntry = {
  data: {
    draft?: boolean;
  };
};

export function isVisibleContent<T extends DraftableEntry>(entry: T) {
  return import.meta.env.PROD ? !entry.data.draft : true;
}

export function sortProjects(
  a: CollectionEntry<"projects">,
  b: CollectionEntry<"projects">,
) {
  const featuredDelta = Number(b.data.featured) - Number(a.data.featured);
  if (featuredDelta !== 0) {
    return featuredDelta;
  }

  return b.data.date.valueOf() - a.data.date.valueOf();
}

export function sortNewestFirst<T extends { data: { date: Date } }>(
  a: T,
  b: T,
) {
  return b.data.date.valueOf() - a.data.date.valueOf();
}

export function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
    year: "numeric",
  }).format(date);
}

export function entrySlug(id: string) {
  return id.replace(/\.(md|mdx)$/, "");
}
