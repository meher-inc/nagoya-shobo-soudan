import { CITIES, cityUrl, guessCity } from "./cities";

type Env = { ASSETS: Fetcher; CANONICAL_ORIGIN: string };

const SECURITY_HEADERS: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "Content-Security-Policy":
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'",
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/robots.txt") {
      return text(`User-agent: *\nAllow: /\nSitemap: ${env.CANONICAL_ORIGIN}/sitemap.xml\n`, "text/plain");
    }
    if (url.pathname === "/sitemap.xml") {
      // サイトマップには同じホストの URL だけを載せる（各都市のサイトは各都市のサイトマップにある）
      const urls = [`${env.CANONICAL_ORIGIN}/`];
      const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
        .map((u) => `  <url><loc>${u}</loc></url>`)
        .join("\n")}\n</urlset>\n`;
      return text(body, "application/xml");
    }

    if (url.pathname === "/" || url.pathname === "/index.html") {
      const asset = await env.ASSETS.fetch(new Request(new URL("/", url), request));
      const cf = (request as Request & { cf?: { country?: string; regionCode?: string } }).cf;
      const guess = guessCity(cf?.country, cf?.regionCode);
      const arrow =
        '<svg class="city-arrow" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>';
      const cards = CITIES.map(
        (c) =>
          `<li><a class="city" data-city="${c.slug}" href="${cityUrl(c.slug)}"><span class="city-text"><span class="city-name">${c.name}</span><span class="city-pref">${c.pref}</span></span>${arrow}</a></li>`,
      ).join("");
      const html = (await asset.text())
        .replace('data-guess=""', `data-guess="${guess}"`)
        .replace("<!--CITY_CARDS-->", cards)
        .replaceAll("%ORIGIN%", env.CANONICAL_ORIGIN);
      return new Response(html, {
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "no-store",
          ...SECURITY_HEADERS,
        },
      });
    }

    const res = await env.ASSETS.fetch(request);
    const out = new Response(res.body, res);
    for (const [k, v] of Object.entries(SECURITY_HEADERS)) out.headers.set(k, v);
    return out;
  },
} satisfies ExportedHandler<Env>;

function text(body: string, type: string): Response {
  return new Response(body, { headers: { "Content-Type": `${type}; charset=utf-8`, "Cache-Control": "public, max-age=3600" } });
}
