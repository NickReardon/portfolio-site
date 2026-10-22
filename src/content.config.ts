import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "zod";

/* A project is a set of elements drawn from one palette rather than an instance
 * of a type: a game fills `genre` and a play link, a tool fills neither and
 * nothing branches on which. See docs/project-elements.md.
 *
 * `.strict()` is what keeps that honest. Zod discards unknown keys silently by
 * default, so without it a misspelled `genere:` disappears and the only symptom
 * is a page that renders short. */

/* The header link row. One list rather than a field per destination, because a
 * project can have any number of each and an unreleased game still has a
 * trailer and a repo. `kind` only picks an icon, so an unknown one falls back
 * instead of failing. */
const projectLink = z.object({
  kind: z.string().optional(),
  label: z.string(),
  href: z.url(),
});

/* Written by scripts/sync-discussions.mjs, not by hand: it marks a file as
 * owned by a discussion and carries the number the slug is pinned to. Declared
 * so `.strict()` does not reject a synced file. */
const discussion = z.number().int().positive().optional();

const projects = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/projects" }),
  // A function so the image() helper is available: covers are imported assets
  // that Astro validates, hashes and optimizes, not public URL strings.
  schema: ({ image }) =>
    z
      .object({
        title: z.string(),
        description: z.string(),
        date: z.coerce.date(),
        // Which index subsection. The one element that is required but not
        // free-form, stamped from the discussion sub-category when synced.
        category: z.string(),
        // Joined in this order into the card's descriptor, skipping absences:
        // "Unreleased Unreal Engine 5.8 action rogue-lite".
        status: z.string().optional(),
        stack: z.string().optional(),
        genre: z.string().optional(),
        role: z.string().optional(),
        timeline: z.string().optional(),
        tags: z.array(z.string()),
        links: z.array(projectLink).default([]),
        coverImage: image().optional(),
        coverAlt: z.string().optional(),
        featured: z.boolean().default(false),
        draft: z.boolean().default(false),
        discussion,
      })
      .strict()
      // A cover with no alt text is a build error rather than a lint note: it
      // ships to a screen reader as an unlabelled image and doubles as the
      // page's og:image.
      .refine((data) => !data.coverImage || Boolean(data.coverAlt), {
        message: "coverAlt is required whenever coverImage is set.",
        path: ["coverAlt"],
      }),
});

const blog = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/blog" }),
  schema: z
    .object({
      title: z.string(),
      description: z.string(),
      date: z.coerce.date(),
      tags: z.array(z.string()),
      coverImage: z.string().optional(),
      coverAlt: z.string().optional(),
      draft: z.boolean().default(false),
      discussion,
    })
    .strict(),
});

export const collections = { projects, blog };
