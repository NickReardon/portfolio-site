export async function onRequest({ request }) {
  const url = new URL(request.url);
  const production = url.hostname === "nick-reardon.com";
  const policy = production ? "Allow: /" : "Disallow: /";
  const body = `User-agent: *\n${policy}\n\nSitemap: https://nick-reardon.com/sitemap-index.xml\n`;
  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      ...(production ? {} : { "X-Robots-Tag": "noindex, nofollow" }),
    },
  });
}
