"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import type { GeoJSONSource, Map as MapLibreMap } from "maplibre-gl";
import { issueTypeBadge, severityBadge } from "@/lib/badge-styles";
import {
  useAtlasPins,
  type AtlasFeatureCollection,
  type AtlasPin,
} from "@/hooks/use-atlas-pins";
import { Button } from "@/components/ui/button";
import {
  ExternalLink,
  Loader2,
  MapPinned,
  Navigation,
  Vote,
} from "lucide-react";

const INDIA_CENTER: [number, number] = [78.9629, 20.5937];
const EMPTY_GEOJSON: AtlasFeatureCollection = {
  type: "FeatureCollection",
  features: [],
};

function styleUrlForTheme(theme: string | undefined) {
  if (theme === "dark") {
    return "https://tiles.openfreemap.org/styles/liberty";
  }
  return "https://tiles.openfreemap.org/styles/bright";
}

export function AtlasMap({
  initialPins = [],
}: {
  initialPins?: Array<AtlasPin>;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { resolvedTheme } = useTheme();
  const { geojson, isLoading, pins, reportsById, setViewport, visiblePins } =
    useAtlasPins(initialPins);
  const selectedPin = selectedId ? (reportsById.get(selectedId) ?? null) : null;
  const mapStyleUrl = styleUrlForTheme(resolvedTheme);

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    let cancelled = false;
    setMapReady(false);

    async function mountMap() {
      const maplibregl = await import("maplibre-gl");
      if (cancelled || !containerRef.current) {
        return;
      }

      const map = new maplibregl.Map({
        container: containerRef.current,
        style: mapStyleUrl,
        center: INDIA_CENTER,
        zoom: 4,
        minZoom: 3,
        maxZoom: 17,
      });
      mapRef.current = map;

      map.addControl(
        new maplibregl.NavigationControl({ showCompass: false }),
        "top-left",
      );

      function updateViewport() {
        const bounds = map.getBounds();
        setViewport({
          west: bounds.getWest(),
          south: bounds.getSouth(),
          east: bounds.getEast(),
          north: bounds.getNorth(),
        });
      }

      function setPointerCursor(layerId: string) {
        map.on("mouseenter", layerId, () => {
          map.getCanvas().style.cursor = "pointer";
        });
        map.on("mouseleave", layerId, () => {
          map.getCanvas().style.cursor = "";
        });
      }

      map.on("load", () => {
        map.addSource("reports", {
          type: "geojson",
          data: EMPTY_GEOJSON as any,
          cluster: true,
          clusterMaxZoom: 14,
          clusterRadius: 50,
        });

        map.addLayer({
          id: "clusters",
          type: "circle",
          source: "reports",
          filter: ["has", "point_count"],
          paint: {
            "circle-color": [
              "step",
              ["get", "point_count"],
              "#0f766e",
              25,
              "#d97706",
              100,
              "#be123c",
            ],
            "circle-radius": [
              "step",
              ["get", "point_count"],
              18,
              25,
              24,
              100,
              32,
            ],
            "circle-stroke-color": "#ffffff",
            "circle-stroke-width": 2,
          },
        });

        map.addLayer({
          id: "cluster-count",
          type: "symbol",
          source: "reports",
          filter: ["has", "point_count"],
          layout: {
            "text-field": "{point_count_abbreviated}",
            "text-size": 12,
            "text-font": ["Noto Sans Regular"],
          },
          paint: {
            "text-color": "#ffffff",
          },
        });

        map.addLayer({
          id: "unclustered-point",
          type: "circle",
          source: "reports",
          filter: ["!", ["has", "point_count"]],
          paint: {
            "circle-color": ["get", "color"],
            "circle-radius": 8,
            "circle-stroke-color": "#ffffff",
            "circle-stroke-width": 2,
          },
        });

        map.addLayer(
          {
            id: "unclustered-point-halo",
            type: "circle",
            source: "reports",
            filter: ["!", ["has", "point_count"]],
            paint: {
              "circle-color": ["get", "color"],
              "circle-opacity": 0.18,
              "circle-radius": 16,
            },
          },
          "unclustered-point",
        );

        map.on("click", "clusters", async (event) => {
          const features = map.queryRenderedFeatures(event.point, {
            layers: ["clusters"],
          });
          const feature = features[0];
          const clusterId = feature?.properties?.cluster_id;
          if (clusterId === undefined || feature.geometry.type !== "Point") {
            return;
          }
          const source = map.getSource("reports") as GeoJSONSource;
          const zoom = await source.getClusterExpansionZoom(Number(clusterId));
          map.easeTo({
            center: feature.geometry.coordinates as [number, number],
            zoom,
          });
        });

        map.on("click", "unclustered-point", (event) => {
          const feature = event.features?.[0];
          const id = feature?.properties?.id;
          if (typeof id === "string") {
            setSelectedId(id);
          }
        });

        setPointerCursor("clusters");
        setPointerCursor("unclustered-point");
        updateViewport();
        setMapReady(true);
      });

      map.on("moveend", updateViewport);
    }

    mountMap();

    return () => {
      cancelled = true;
      setMapReady(false);
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [mapStyleUrl, setViewport]);

  useEffect(() => {
    if (!mapReady) {
      return;
    }
    const source = mapRef.current?.getSource("reports") as
      | GeoJSONSource
      | undefined;
    source?.setData(geojson as any);
  }, [geojson, mapReady]);

  return (
    <main className="relative h-[calc(100vh-64px)] min-h-[620px] overflow-hidden bg-muted text-foreground">
      <div
        ref={containerRef}
        className="absolute inset-0"
        aria-label="Dream India public report map"
      />

      {(isLoading || !mapReady) && (
        <div className="absolute inset-0 z-10 grid place-items-center bg-background/70 backdrop-blur-sm">
          <div className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 text-sm font-medium shadow-sm">
            <Loader2 className="size-4 animate-spin text-primary" />
            Loading atlas pins
          </div>
        </div>
      )}

      <div className="absolute left-3 top-3 z-20 rounded-lg border border-border bg-card/95 p-3 shadow-sm backdrop-blur sm:left-4 sm:top-4">
        <div className="flex items-center gap-2">
          <span className="grid size-9 place-items-center rounded-md bg-primary text-primary-foreground">
            <MapPinned className="size-4" />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Public atlas
            </p>
            <p className="text-sm font-semibold">
              {visiblePins.length.toLocaleString()} visible /{" "}
              {pins.length.toLocaleString()} total
            </p>
          </div>
        </div>
      </div>

      <aside className="absolute bottom-3 left-3 right-3 z-20 max-h-[48vh] overflow-y-auto rounded-lg border border-border bg-card/95 p-4 shadow-xl backdrop-blur lg:bottom-4 lg:left-auto lg:right-4 lg:top-4 lg:max-h-none lg:w-[380px]">
        {selectedPin ? (
          <ReportPanel pin={selectedPin} />
        ) : (
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
              Click a pin
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">
              Explore civic transformations across India
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Clustered pins keep dense areas readable on phones and large
              displays. Select any report to open its public brief.
            </p>
            <div className="mt-4 space-y-2">
              {visiblePins.slice(0, 5).map((pin) => (
                <button
                  key={pin._id}
                  type="button"
                  onClick={() => setSelectedId(pin._id)}
                  className="w-full rounded-md border border-border px-3 py-2 text-left text-sm transition hover:bg-muted"
                >
                  <span className="font-medium">{pin.title}</span>
                  <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                    {pin.locationName}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </aside>
    </main>
  );
}

function ReportPanel({
  pin,
}: {
  pin: ReturnType<typeof useAtlasPins>["pins"][number];
}) {
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${pin.lat},${pin.lng}`;

  return (
    <div>
      <div className="grid grid-cols-2 overflow-hidden rounded-md border border-border bg-muted">
        <img
          src={pin.beforeImageUrl || "/assets/road-before.png"}
          alt="Before condition"
          className="h-32 w-full object-cover"
        />
        <img
          src={pin.afterImageUrl || "/assets/road-after.png"}
          alt="After transformation"
          className="h-32 w-full object-cover"
        />
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <span
          className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${issueTypeBadge(pin.issueType)}`}
        >
          {pin.issueType}
        </span>
        <span
          className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${severityBadge(pin.severity)}`}
        >
          {pin.severity}
        </span>
      </div>
      <h2 className="mt-3 text-xl font-semibold tracking-tight">{pin.title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{pin.locationName}</p>
      <div className="mt-4 flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <Vote className="size-4 text-primary" />
        {pin.votes.toLocaleString()} priority votes
      </div>
      <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
        <Button asChild>
          <Link href={`/r/${pin._id}`}>
            <ExternalLink className="size-4" />
            Open report
          </Link>
        </Button>
        <Button asChild variant="outline">
          <a href={mapsUrl} target="_blank" rel="noreferrer">
            <Navigation className="size-4" />
            Google Maps
          </a>
        </Button>
      </div>
    </div>
  );
}
