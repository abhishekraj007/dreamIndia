import type { MetadataRoute } from "next";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL || "https://convex-starter.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/dashboard", "/settings", "/todos", "/tutor", "/uploads"],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
