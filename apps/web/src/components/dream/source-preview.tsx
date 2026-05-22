"use client";

import { useEffect, useState } from "react";
import { useAction } from "convex/react";
import { api } from "@convex-starter/backend/convex/_generated/api";
import { Loader2, MapPin, Navigation, Search, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Coords = { lat: number; lng: number };

type Props = {
  lat: string;
  lng: string;
  locationName: string;
  address: string;
  beforeImage: string | null;
  hasUploadedFile: boolean;
  onLocationResolved: (args: {
    coords: Coords;
    formattedAddress: string | null;
    locationName: string | null;
  }) => void;
  onMessage: (message: string) => void;
};

function streetViewSrc(
  convexSiteUrl: string | undefined,
  lat: string,
  lng: string,
) {
  if (!convexSiteUrl || !lat || !lng) return null;
  const url = new URL("/maps/street-view", convexSiteUrl);
  url.searchParams.set("lat", lat);
  url.searchParams.set("lng", lng);
  return url.toString();
}

function staticMapSrc(
  convexSiteUrl: string | undefined,
  lat: string,
  lng: string,
) {
  if (!convexSiteUrl || !lat || !lng) return null;
  const url = new URL("/maps/static", convexSiteUrl);
  url.searchParams.set("lat", lat);
  url.searchParams.set("lng", lng);
  return url.toString();
}

export function SourcePreview({
  lat,
  lng,
  locationName,
  address,
  beforeImage,
  hasUploadedFile,
  onLocationResolved,
  onMessage,
}: Props) {
  const convexSiteUrl = process.env.NEXT_PUBLIC_CONVEX_SITE_URL;
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [streetViewError, setStreetViewError] = useState(false);
  const forwardGeocode = useAction(api.geo.forwardGeocode);

  useEffect(() => {
    setStreetViewError(false);
  }, [lat, lng]);

  const mapSrc = staticMapSrc(convexSiteUrl, lat, lng);
  const sourceImg = beforeImage ?? streetViewSrc(convexSiteUrl, lat, lng);
  const sourceLabel = hasUploadedFile
    ? "Your photo"
    : sourceImg && !beforeImage
      ? "Google Street View"
      : "No source yet";

  async function runSearch() {
    const trimmed = query.trim();
    if (!trimmed) return;
    setSearching(true);
    try {
      const res = await forwardGeocode({ query: trimmed });
      if (!res) {
        onMessage(`No results for "${trimmed}".`);
        return;
      }
      onLocationResolved({
        coords: { lat: res.lat, lng: res.lng },
        formattedAddress: res.formattedAddress,
        locationName: res.locationName,
      });
      onMessage(
        `Pinned to ${res.locationName ?? res.formattedAddress ?? trimmed}.`,
      );
    } catch (error) {
      onMessage(error instanceof Error ? error.message : "Search failed.");
    } finally {
      setSearching(false);
    }
  }

  const mapsLink =
    lat && lng
      ? `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
      : null;

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <div className="flex flex-col gap-3 border-b border-border p-3 sm:p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Source location preview
            </p>
            <h2 className="mt-0.5 truncate text-base font-semibold sm:text-lg">
              {locationName || "Choose a location"}
            </h2>
            {address && (
              <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                {address}
              </p>
            )}
          </div>
          {mapsLink && (
            <a
              href={mapsLink}
              target="_blank"
              rel="noreferrer"
              className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1.5 text-xs font-medium hover:bg-muted"
            >
              <Navigation className="size-3.5" />
              Open
            </a>
          )}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            runSearch();
          }}
          className="flex gap-2"
        >
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search road, street, area or landmark"
              className="h-10 pl-8"
              aria-label="Search location"
            />
          </div>
          <Button
            type="submit"
            size="sm"
            variant="outline"
            disabled={searching || !query.trim()}
            className="h-10 shrink-0"
          >
            {searching ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Search className="size-4" />
            )}
            <span className="hidden sm:inline">Find</span>
          </Button>
        </form>
      </div>

      <div className="grid grid-cols-1 gap-px bg-border sm:grid-cols-2">
        <div className="relative aspect-[4/3] bg-muted sm:aspect-[5/4]">
          {mapSrc ? (
            <img
              src={mapSrc}
              alt="Map of selected location"
              className="absolute inset-0 size-full object-cover"
            />
          ) : (
            <EmptyPanel
              icon={<MapPin className="size-5" />}
              title="Map preview"
              hint={
                convexSiteUrl
                  ? "Pick a location to see the map"
                  : "Add NEXT_PUBLIC_CONVEX_SITE_URL"
              }
            />
          )}
          <span className="absolute left-2 top-2 rounded-md bg-background/85 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-foreground shadow-sm backdrop-blur">
            Map
          </span>
        </div>

        <div className="relative aspect-[4/3] bg-muted sm:aspect-[5/4]">
          {sourceImg && !streetViewError ? (
            <img
              src={sourceImg}
              alt="Source photo to be transformed"
              className="absolute inset-0 size-full object-cover"
              onError={() => setStreetViewError(true)}
            />
          ) : (
            <EmptyPanel
              icon={<Sparkles className="size-5" />}
              title="Source image"
              hint={
                streetViewError
                  ? "Street View not available here. Upload a photo."
                  : "Upload a photo or search a location"
              }
            />
          )}
          <span className="absolute left-2 top-2 rounded-md bg-background/85 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-foreground shadow-sm backdrop-blur">
            {sourceLabel}
          </span>
        </div>
      </div>
    </div>
  );
}

function EmptyPanel({
  icon,
  title,
  hint,
}: {
  icon: React.ReactNode;
  title: string;
  hint: string;
}) {
  return (
    <div className="absolute inset-0 grid place-items-center p-4 text-center">
      <div>
        <div className="mx-auto grid size-9 place-items-center rounded-full bg-background text-muted-foreground shadow-sm">
          {icon}
        </div>
        <p className="mt-2 text-sm font-medium text-foreground">{title}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>
      </div>
    </div>
  );
}
