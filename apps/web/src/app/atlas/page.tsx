import type { Metadata } from "next";
import { fetchQuery } from "convex/nextjs";
import { api } from "@convex-starter/backend/convex/_generated/api";
import { AtlasMap } from "@/components/dream/atlas-map";
import type { AtlasPin } from "@/hooks/use-atlas-pins";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Public Atlas | cockroachdreamindia",
  description:
    "Explore public before-and-after civic transformation reports across India on an open MapLibre atlas.",
};

async function loadPins() {
  try {
    return (await fetchQuery(api.reports.listReportsForMap, {
      limit: 5000,
    })) as Array<AtlasPin>;
  } catch {
    return [];
  }
}

export default async function AtlasPage() {
  const pins = await loadPins();
  return <AtlasMap initialPins={pins} />;
}
