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

/* `status`, `stack` and `genre` are one sentence split across three elements, so
 * they render as one line and a project fills whichever apply: "Unreleased
 * Unreal Engine 5.8 action rogue-lite", or just "Released Godot" from a project
 * that never named a genre. Three separate spans put the burden of reading them
 * as a phrase on the reader. */
export function projectDescriptor(data: {
  status?: string;
  stack?: string;
  genre?: string;
}) {
  return [data.status, data.stack, data.genre].filter(Boolean).join(" ");
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

/* Covers are authored at whatever shape they were captured in — the itch.io
 * ones are 2:1, the diagrams 16/10 — while every slot that shows them is
 * 16/10. Cropping to that ratio at build time rather than with object-fit
 * means each cover is already the right shape when it reaches CSS: a matching
 * slot shows all of it, and a taller one letterboxes it evenly.
 *
 * `width`/`height` give the largest box of `ratio` the source can fill, so a
 * cover is only ever cropped, never upscaled.
 *
 * `widths` is the srcset ladder, capped at that same box. The cap is the point:
 * Astro clamps srcset widths against the source's own width, which for a 2:1
 * source is wider than any 16/10 crop of it can be. Ask for one of those wider
 * entries and sharp cannot reach the height, so it quietly returns a less
 * cropped image and the ratio stops being a guarantee. */
export function coverBox(
  image: { width: number; height: number },
  ratio = 16 / 10,
  ladder = [300, 424, 600, 848, 1520],
) {
  const height = Math.min(image.height, Math.round(image.width / ratio));
  const width = Math.round(height * ratio);
  return { width, height, widths: [...ladder.filter((w) => w < width), width] };
}
