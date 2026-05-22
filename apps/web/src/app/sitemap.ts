import type { MetadataRoute } from "next";
import { fetchQuery } from "convex/nextjs";
import { api } from "@convex-starter/backend/convex/_generated/api";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL || "https://convex-starter.app";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const reports = await fetchQuery(api.reports.listReportsForMap, {
    limit: 5000,
  }).catch(() => []);

  return [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${siteUrl}/pricing`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${siteUrl}/docs`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${siteUrl}/auth`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    ...reports.map((report) => ({
      url: `${siteUrl}/r/${report._id}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
  ];
}
