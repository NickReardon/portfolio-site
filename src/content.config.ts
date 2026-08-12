import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "zod";

const projects = defineCollection({
  loader: glob({
    pattern: "**/*.{md,mdx}",
    base: "./.local/publication/projects",
  }),
  // `image()` resolves cover paths through Astro's asset pipeline, so covers get
  // content hashing, responsive srcsets, and modern formats. It also turns a
  // broken cover path into a build error instead of a silent 404.
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string(),
      date: z.coerce.date(),
      dateLabel: z.string(),
      order: z.number().int().positive(),
      variant: z.enum(["case-study", "jam-postmortem"]),
      tags: z.array(z.string()),
      projectType: z.enum(["game", "system", "writeup"]).default("writeup"),
      role: z.string().optional(),
      status: z.enum(["In development", "Released", "Prototype", "On hold"]),
      engine: z.string().optional(),
      coverImage: image().optional(),
      coverAlt: z.string().optional(),
      // Stays a plain public path: social crawlers want a stable absolute URL,
      // and PNG is more widely supported by them than the pipeline's WebP.
      ogImage: z.string().optional(),
      mediaPending: z.boolean().default(false),
      featured: z.boolean().default(false),
      githubUrl: z.url().optional(),
      videoUrl: z.url().optional(),
      externalUrl: z.url().optional(),
      externalLabel: z.string().optional(),
      draft: z.boolean().default(false),
    }),
});

const blog = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/blog" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    tags: z.array(z.string()),
    coverImage: z.string().optional(),
    coverAlt: z.string().optional(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { projects, blog };
