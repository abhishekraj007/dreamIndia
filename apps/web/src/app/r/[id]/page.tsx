import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { fetchQuery } from "convex/nextjs";
import type { Id } from "@convex-starter/backend/convex/_generated/dataModel";
import { api } from "@convex-starter/backend/convex/_generated/api";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { issueTypeBadge, severityBadge } from "@/lib/badge-styles";
import { ReportShare } from "@/components/dream/report-share";
import { Button } from "@/components/ui/button";
import { MapPin, Navigation, Vote } from "lucide-react";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

async function loadReport(id: string) {
  try {
    return await fetchQuery(api.reports.getPublicReport, {
      id: id as Id<"transformationReports">,
    });
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const report = await loadReport(id);
  if (!report) {
    return {
      title: "Report not found | cockroachdreamindia",
    };
  }

  return {
    title: `${report.title} | cockroachdreamindia`,
    description: report.description,
    openGraph: {
      title: report.title,
      description: report.locationName,
      images: [
        {
          url: `/r/${id}/opengraph-image`,
          width: 1200,
          height: 630,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: report.title,
      description: report.locationName,
      images: [`/r/${id}/twitter-image`],
    },
  };
}

export default async function PublicReportPage({ params }: PageProps) {
  const { id } = await params;
  const report = await loadReport(id);

  if (!report) {
    notFound();
  }

  const mapsUrl =
    report.googleMapsUrl ??
    (report.lat !== undefined && report.lng !== undefined
      ? `https://www.google.com/maps/search/?api=1&query=${report.lat},${report.lng}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(report.locationName)}`);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto max-w-[1240px] px-4 py-6 sm:py-8">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div className="space-y-6">
            <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
              <div className="grid md:grid-cols-2">
                <figure className="relative min-h-[260px] bg-muted">
                  <img
                    src={report.beforeImageUrl || "/assets/road-before.png"}
                    alt="Before civic condition"
                    className="absolute inset-0 size-full object-cover"
                  />
                  <figcaption className="absolute left-3 top-3 rounded-md bg-black/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-white">
                    Before
                  </figcaption>
                </figure>
                <figure className="relative min-h-[260px] bg-muted">
                  <img
                    src={report.afterImageUrl || "/assets/road-after.png"}
                    alt="AI transformed civic vision"
                    className="absolute inset-0 size-full object-cover"
                  />
                  <figcaption className="absolute left-3 top-3 rounded-md bg-primary px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-primary-foreground">
                    Dream India vision
                  </figcaption>
                </figure>
              </div>
              <div className="p-5 sm:p-6">
                <div className="flex flex-wrap gap-2">
                  <span
                    className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${issueTypeBadge(report.issueType)}`}
                  >
                    {report.issueType}
                  </span>
                  <span
                    className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${severityBadge(report.severity)}`}
                  >
                    {report.severity}
                  </span>
                </div>
                <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
                  {report.title}
                </h1>
                <div className="mt-4 flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:flex-wrap sm:items-center">
                  <span className="inline-flex items-center gap-2">
                    <MapPin className="size-4 text-primary" />
                    {report.locationName}
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <Vote className="size-4 text-primary" />
                    {report.votes.toLocaleString()} priority votes
                  </span>
                </div>
                {report.address && (
                  <p className="mt-2 text-sm text-muted-foreground">
                    {report.address}
                  </p>
                )}
              </div>
            </div>

            <section className="rounded-lg border border-border bg-card p-5 shadow-sm sm:p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                Current condition
              </p>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                {report.description}
              </p>
            </section>

            <section className="rounded-lg border border-border bg-card p-5 shadow-sm sm:p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                Planning goal
              </p>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                {report.planningGoal}
              </p>
            </section>

            <section className="rounded-lg border border-border bg-card p-5 shadow-sm sm:p-6">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                    AI proposal
                  </p>
                  <h2 className="mt-1 text-2xl font-semibold tracking-tight">
                    Municipal planning brief
                  </h2>
                </div>
              </div>
              {report.aiProposal ? (
                <div className="prose prose-sm mt-5 max-w-none text-foreground dark:prose-invert sm:prose-base">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {report.aiProposal}
                  </ReactMarkdown>
                </div>
              ) : (
                <p className="mt-4 rounded-md border border-border bg-muted p-4 text-sm text-muted-foreground">
                  No proposal has been generated yet. Sign in and generate a
                  structured municipal brief for this report.
                </p>
              )}
            </section>
          </div>

          <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
            <ReportShare
              hasProposal={Boolean(report.aiProposal)}
              locationName={report.locationName}
              reportId={report._id}
              title={report.title}
              votes={report.votes}
            />
            <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Location
              </p>
              <Button asChild className="mt-3 w-full" variant="outline">
                <a href={mapsUrl} target="_blank" rel="noreferrer">
                  <Navigation className="size-4" />
                  Open in Google Maps
                </a>
              </Button>
              <div className="mt-4 flex flex-wrap gap-2">
                {report.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-border bg-muted px-2.5 py-1 text-xs text-muted-foreground"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
