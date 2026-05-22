import type { Metadata } from "next";
import { fetchQuery } from "convex/nextjs";
import { api } from "@convex-starter/backend/convex/_generated/api";
import { InteractiveAtlas } from "@/components/dream/interactive-atlas";
import { demoReports, demoStats } from "@/lib/dream-data";
import type { DreamReport, DreamStats } from "@/lib/dream-types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "cockroachdreamindia",
  description:
    "Document bad infrastructure in India, pin exact locations, and visualize realistic AI-powered Dream India transformations.",
};

async function loadReports() {
  try {
    const [reports, stats] = await Promise.all([
      fetchQuery(api.reports.listReports, { limit: 24 }),
      fetchQuery(api.reports.impactStats),
    ]);
    return {
      reports: reports.length ? (reports as DreamReport[]) : demoReports,
      stats: (stats as DreamStats) ?? demoStats,
    };
  } catch {
    return { reports: demoReports, stats: demoStats };
  }
}

export default async function Home() {
  const { reports, stats } = await loadReports();
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "cockroachdreamindia",
    applicationCategory: "CivicTechnology",
    operatingSystem: "Web",
    description:
      "A civic transformation atlas for reporting bad infrastructure and visualizing better planned Indian places.",
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <InteractiveAtlas initialReports={reports} initialStats={stats} />
    </>
  );
}
