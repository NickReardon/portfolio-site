import { site } from "../site.config";

export function GET() {
  const crawlPolicy = site.isSearchIndexable ? "Allow: /" : "Disallow: /";
  const sitemapUrl = new URL("/sitemap-index.xml", site.url);

  return new Response(
    `User-agent: *\n${crawlPolicy}\n\nSitemap: ${sitemapUrl}\n`,
    {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
    },
  );
}
