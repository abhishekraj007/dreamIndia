import { ImageResponse } from "next/og";
import { fetchQuery } from "convex/nextjs";
import type { Id } from "@convex-starter/backend/convex/_generated/dataModel";
import { api } from "@convex-starter/backend/convex/_generated/api";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

type ImageProps = {
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

export default async function Image({ params }: ImageProps) {
  const { id } = await params;
  const report = await loadReport(id);
  const title = report?.title ?? "Cockroach Dream India";
  const location = report?.locationName ?? "Public civic transformation atlas";
  const imageUrl =
    report?.afterImageUrl ||
    report?.beforeImageUrl ||
    "https://cockroachdreamindia.com/assets/road-after.png";

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          background: "#f7faf7",
          color: "#10231d",
          fontFamily: "Arial",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: 520,
            padding: 54,
            borderRight: "1px solid #dbe5df",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                color: "#0d4f3b",
                fontSize: 22,
                fontWeight: 700,
              }}
            >
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 8,
                  background: "#0d4f3b",
                }}
              />
              cockroachdreamindia
            </div>
            <div
              style={{
                display: "flex",
                marginTop: 44,
                fontSize: 54,
                lineHeight: 1.05,
                fontWeight: 800,
              }}
            >
              {title}
            </div>
            <div
              style={{
                display: "flex",
                marginTop: 20,
                fontSize: 24,
                color: "#51645d",
              }}
            >
              {location}
            </div>
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 18,
              color: "#0d4f3b",
              fontWeight: 700,
            }}
          >
            Public civic report
          </div>
        </div>
        <div style={{ display: "flex", flex: 1, position: "relative" }}>
          <img
            src={imageUrl}
            alt="Civic transformation"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
          <div
            style={{
              position: "absolute",
              left: 28,
              top: 28,
              display: "flex",
              borderRadius: 8,
              background: "rgba(13,79,59,0.88)",
              color: "white",
              padding: "10px 14px",
              fontSize: 18,
              fontWeight: 700,
            }}
          >
            Dream India vision
          </div>
        </div>
      </div>
    ),
    size,
  );
}
