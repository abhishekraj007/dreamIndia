"use client";

import { useEffect, useState } from "react";
import { useAction } from "convex/react";
import { api } from "@convex-starter/backend/convex/_generated/api";
import {
  Check,
  Loader2,
  MapPin,
  Maximize2,
  Navigation,
  Search,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Coords = { lat: number; lng: number };

type LocationSuggestion = {
  placeId: string | null;
  lat: number;
  lng: number;
  formattedAddress: string | null;
  locationName: string | null;
};

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
  onImageOpen?: (args: {
    src: string;
    title: string;
    subtitle?: string;
  }) => void;
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
  onImageOpen,
}: Props) {
  const convexSiteUrl = process.env.NEXT_PUBLIC_CONVEX_SITE_URL;
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Array<LocationSuggestion>>([]);
  const [searching, setSearching] = useState(false);
  const [streetViewError, setStreetViewError] = useState(false);
  const searchLocations = useAction(api.geo.searchLocations);

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
      const results = await searchLocations({ query: trimmed });
      setSuggestions(results);
      if (results.length === 0) {
        onMessage(`No results for "${trimmed}".`);
        return;
      }
      onMessage(`Choose a source result for "${trimmed}".`);
    } catch (error) {
      onMessage(error instanceof Error ? error.message : "Search failed.");
    } finally {
      setSearching(false);
    }
  }

  function selectSuggestion(suggestion: LocationSuggestion) {
    onLocationResolved({
      coords: { lat: suggestion.lat, lng: suggestion.lng },
      formattedAddress: suggestion.formattedAddress,
      locationName: suggestion.locationName,
    });
    setQuery(suggestion.locationName ?? suggestion.formattedAddress ?? "");
    setSuggestions([]);
    onMessage(
      `Pinned to ${suggestion.locationName ?? suggestion.formattedAddress ?? "selected location"}.`,
    );
  }

  const mapsLink =
    lat && lng
      ? `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
      : null;

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="flex flex-col gap-2.5 border-b border-border p-3 sm:p-4">
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
          onSubmit={(event) => {
            event.preventDefault();
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

        {suggestions.length > 0 && (
          <div className="grid gap-2 rounded-xl border border-border bg-background p-2 shadow-sm">
            {suggestions.map((suggestion) => (
              <button
                key={
                  suggestion.placeId ??
                  `${suggestion.lat.toFixed(5)}-${suggestion.lng.toFixed(5)}`
                }
                type="button"
                onClick={() => selectSuggestion(suggestion)}
                className="group flex min-h-12 items-start gap-2 rounded-lg px-2 py-2 text-left transition-transform hover:bg-muted active:scale-[0.99]"
              >
                <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-md bg-primary/10 text-primary">
                  <MapPin className="size-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-foreground">
                    {suggestion.locationName ?? "Selected place"}
                  </span>
                  {suggestion.formattedAddress && (
                    <span className="mt-0.5 block line-clamp-1 text-xs text-muted-foreground">
                      {suggestion.formattedAddress}
                    </span>
                  )}
                </span>
                <span className="grid size-8 shrink-0 place-items-center rounded-md border border-border text-muted-foreground transition-colors group-hover:border-primary/30 group-hover:text-primary">
                  <Check className="size-4" />
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="grid min-w-0 grid-cols-1 gap-px bg-border md:grid-cols-2">
        <div className="relative min-w-0 aspect-[4/3] bg-muted md:aspect-[16/10] lg:aspect-[5/4]">
          {mapSrc ? (
            <button
              type="button"
              onClick={() =>
                onImageOpen?.({
                  src: mapSrc,
                  title: "Selected source map",
                  subtitle: locationName || address || undefined,
                })
              }
              className="absolute inset-0 size-full overflow-hidden text-left"
            >
              <img
                src={mapSrc}
                alt="Map of selected location"
                className="absolute inset-0 size-full object-cover outline outline-1 outline-black/10 dark:outline-white/10"
              />
              <span className="absolute right-2 top-2 grid size-8 place-items-center rounded-md bg-background/85 text-foreground shadow-sm backdrop-blur transition-transform active:scale-[0.96]">
                <Maximize2 className="size-4" />
              </span>
            </button>
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

        <div className="relative min-w-0 aspect-[4/3] bg-muted md:aspect-[16/10] lg:aspect-[5/4]">
          {sourceImg && !streetViewError ? (
            <button
              type="button"
              onClick={() =>
                onImageOpen?.({
                  src: sourceImg,
                  title: sourceLabel,
                  subtitle: locationName || address || undefined,
                })
              }
              className="absolute inset-0 size-full overflow-hidden text-left"
            >
              <img
                src={sourceImg}
                alt="Source photo to be transformed"
                className="absolute inset-0 size-full object-cover outline outline-1 outline-black/10 dark:outline-white/10"
                onError={() => setStreetViewError(true)}
              />
              <span className="absolute right-2 top-2 grid size-8 place-items-center rounded-md bg-background/85 text-foreground shadow-sm backdrop-blur transition-transform active:scale-[0.96]">
                <Maximize2 className="size-4" />
              </span>
            </button>
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
