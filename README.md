# Portfolio Site

Static Astro portfolio website for projects, devlogs, resume links, and contact
links. The v1 architecture is intentionally simple: Astro, Tailwind 4, Markdown,
GitHub, and Cloudflare Pages.

## Commands

```bash
npm run dev
npm run build
npm run preview
npm run check
```

## Content

- Project markdown lives in `src/content/projects`.
- Blog markdown lives in `src/content/blog`.
- Draft entries can stay in the repo with `draft: true`; production builds exclude
  them from lists and detail routes.
- Replace `public/resume.pdf` with your real resume before launch.
- Update social links and identity text in `src/site.config.ts` as needed.

## Deploy To Cloudflare Pages

Use these settings when importing the GitHub repository into Cloudflare Pages:

- Production branch: `main`
- Build command: `npm run build`
- Build directory: `dist`

After the first successful deploy, add `nick-reardon.com` as the production
custom domain from the Cloudflare Pages project settings.

For the long-lived pre-production environment, create a `staging` branch and
enable preview builds for that branch. Add `staging.nick-reardon.com` as a
custom domain for the `staging` branch. Keep the DNS record proxied through
Cloudflare so it resolves to the branch deployment instead of production.

Production builds use `https://nick-reardon.com` for canonical URLs and the
sitemap. Staging and short-lived preview builds emit `noindex` metadata and a
non-indexable `robots.txt`; their URLs are derived from the branch domain or
Cloudflare Pages preview URL. Set `SITE_URL` in the build environment only when
you need to override that default.

```sh
npm create astro@latest -- --template minimal
```

> 🧑‍🚀 **Seasoned astronaut?** Delete this file. Have fun!

## 🚀 Project Structure

Inside of your Astro project, you'll see the following folders and files:

```text
/
├── public/
├── src/
│   └── pages/
│       └── index.astro
└── package.json
```

Astro looks for `.astro` or `.md` files in the `src/pages/` directory. Each page is exposed as a route based on its file name.

There's nothing special about `src/components/`, but that's where we like to put any Astro/React/Vue/Svelte/Preact components.

Any static assets, like images, can be placed in the `public/` directory.

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run build`           | Build your production site to `./dist/`          |
| `npm run preview`         | Preview your build locally, before deploying     |
| `npm run astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `npm run astro -- --help` | Get help using the Astro CLI                     |

## 👀 Want to learn more?

Feel free to check [our documentation](https://docs.astro.build) or jump into our [Discord server](https://astro.build/chat).
