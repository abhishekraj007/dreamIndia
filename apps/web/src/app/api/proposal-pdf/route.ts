import React from "react";
import { Readable } from "node:stream";
import { getToken } from "@convex-dev/better-auth/nextjs";
import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
  renderToStream,
} from "@react-pdf/renderer";
import type { Id } from "@convex-starter/backend/convex/_generated/dataModel";
import { createAuth } from "@convex-starter/backend/convex/lib/betterAuth";
import { api, fetchQuery } from "@/lib/convex-client";

export const runtime = "nodejs";

const styles = StyleSheet.create({
  page: {
    padding: 38,
    backgroundColor: "#ffffff",
    color: "#16231f",
    fontFamily: "Helvetica",
  },
  eyebrow: {
    fontSize: 9,
    color: "#0f766e",
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontFamily: "Helvetica-Bold",
    lineHeight: 1.2,
    marginBottom: 8,
  },
  meta: {
    fontSize: 10,
    color: "#5b6b64",
    marginBottom: 18,
  },
  divider: {
    height: 1,
    backgroundColor: "#d8e0dc",
    marginBottom: 18,
  },
  heading: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: "#0d4f3b",
    marginTop: 10,
    marginBottom: 6,
  },
  paragraph: {
    fontSize: 10.5,
    lineHeight: 1.55,
    marginBottom: 7,
  },
  bulletRow: {
    display: "flex",
    flexDirection: "row",
    gap: 6,
    marginBottom: 5,
  },
  bullet: {
    width: 10,
    fontSize: 10,
  },
  bulletText: {
    flex: 1,
    fontSize: 10.5,
    lineHeight: 1.5,
  },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 38,
    right: 38,
    color: "#6b7a73",
    fontSize: 8,
  },
});

function cleanMarkdownLine(line: string) {
  return line
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/__(.*?)__/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .trim();
}

function renderMarkdown(markdown: string) {
  return markdown
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      const headingMatch = line.match(/^#{1,4}\s+(.+)$/);
      if (headingMatch) {
        return React.createElement(
          Text,
          { key: `heading-${index}`, style: styles.heading },
          cleanMarkdownLine(headingMatch[1] ?? ""),
        );
      }

      const bulletMatch = line.match(/^(?:[-*]|\d+\.)\s+(.+)$/);
      if (bulletMatch) {
        return React.createElement(
          View,
          { key: `bullet-${index}`, style: styles.bulletRow },
          React.createElement(Text, { style: styles.bullet }, "-"),
          React.createElement(
            Text,
            { style: styles.bulletText },
            cleanMarkdownLine(bulletMatch[1] ?? ""),
          ),
        );
      }

      return React.createElement(
        Text,
        { key: `paragraph-${index}`, style: styles.paragraph },
        cleanMarkdownLine(line),
      );
    });
}

function createProposalDocument(report: any) {
  return React.createElement(
    Document,
    null,
    React.createElement(
      Page,
      { size: "A4", style: styles.page },
      React.createElement(
        Text,
        { style: styles.eyebrow },
        "Cockroach Dream India civic proposal",
      ),
      React.createElement(Text, { style: styles.title }, report.title),
      React.createElement(
        Text,
        { style: styles.meta },
        `${report.locationName}${report.address ? `, ${report.address}` : ""} | ${report.issueType} | ${report.severity}`,
      ),
      React.createElement(View, { style: styles.divider }),
      ...renderMarkdown(report.aiProposal),
      React.createElement(
        Text,
        { style: styles.footer },
        "Generated from a public civic transformation report on cockroachdreamindia.",
      ),
    ),
  );
}

function pdfFileName(title: string) {
  return `${
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "proposal"
  }.pdf`;
}

export async function POST(request: Request) {
  const token = await getToken(createAuth);
  if (!token) {
    return Response.json(
      { error: "Sign in before downloading a proposal PDF." },
      { status: 401 },
    );
  }

  const body = (await request.json().catch(() => null)) as {
    reportId?: string;
  } | null;
  if (!body?.reportId) {
    return Response.json({ error: "reportId is required." }, { status: 400 });
  }

  const report = await fetchQuery(
    api.reports.getPublicReport,
    { id: body.reportId as Id<"transformationReports"> },
    { token },
  );

  if (!report) {
    return Response.json({ error: "Report not found." }, { status: 404 });
  }
  if (!report.aiProposal) {
    return Response.json(
      { error: "Generate the proposal before downloading a PDF." },
      { status: 400 },
    );
  }

  const stream = await renderToStream(createProposalDocument(report));
  const webStream = Readable.toWeb(
    stream as unknown as Readable,
  ) as ReadableStream;

  return new Response(webStream, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${pdfFileName(report.title)}"`,
    },
  });
}
