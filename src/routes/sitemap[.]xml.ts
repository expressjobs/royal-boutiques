import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";

const DEFAULT_BASE_URL = "https://royabotiques.com";

const staticEntries = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/shop", changefreq: "daily", priority: "0.9" },
  { path: "/about", changefreq: "monthly", priority: "0.6" },
  { path: "/contact", changefreq: "monthly", priority: "0.6" },
  { path: "/faq", changefreq: "monthly", priority: "0.5" },
  { path: "/shipping-policy", changefreq: "monthly", priority: "0.4" },
  { path: "/returns-policy", changefreq: "monthly", priority: "0.4" },
  { path: "/privacy-policy", changefreq: "yearly", priority: "0.3" },
  { path: "/terms", changefreq: "yearly", priority: "0.3" },
  ...[
    "women",
    "men",
    "kids",
    "shoes",
    "jewelry",
    "home-living",
    "beauty",
    "sale",
    "new-arrivals",
    "dresses",
    "bags",
    "accessories",
    "luxury",
    "casual-wear",
    "office-wear",
    "evening-wear",
  ].map((slug) => ({
    path: `/category/${slug}`,
    changefreq: "weekly" as const,
    priority: "0.8",
  })),
];

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const baseUrl = (process.env.SITE_URL ?? DEFAULT_BASE_URL).replace(/\/$/, "");
        const lastmod = new Date().toISOString().slice(0, 10);
        const urls = staticEntries
          .map(
            (e) => `  <url>
    <loc>${baseUrl}${e.path}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${e.changefreq}</changefreq>
    <priority>${e.priority}</priority>
  </url>`,
          )
          .join("\n");
        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;
        return new Response(xml, {
          headers: { "Content-Type": "application/xml", "Cache-Control": "public, max-age=3600" },
        });
      },
    },
  },
});
