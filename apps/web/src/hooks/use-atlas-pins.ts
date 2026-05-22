"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@convex-starter/backend/convex/_generated/api";
import { issuePinColors } from "@/lib/badge-styles";
import type { IssueType, Severity } from "@/lib/dream-types";

export type AtlasPin = {
  _id: string;
  lat: number;
  lng: number;
  issueType: IssueType;
  severity: Severity;
  title: string;
  locationName: string;
  votes: number;
  beforeImageUrl: string | null;
  afterImageUrl: string | null;
};

export type AtlasViewport = {
  west: number;
  south: number;
  east: number;
  north: number;
};

export type AtlasFeatureCollection = {
  type: "FeatureCollection";
  features: Array<{
    type: "Feature";
    geometry: {
      type: "Point";
      coordinates: [number, number];
    };
    properties: {
      id: string;
      title: string;
      locationName: string;
      issueType: IssueType;
      severity: Severity;
      votes: number;
      color: string;
    };
  }>;
};

function isInsideViewport(pin: AtlasPin, viewport: AtlasViewport) {
  return (
    pin.lng >= viewport.west &&
    pin.lng <= viewport.east &&
    pin.lat >= viewport.south &&
    pin.lat <= viewport.north
  );
}

export function useAtlasPins(initialPins: Array<AtlasPin> = [], limit = 5000) {
  const reports = useQuery(api.reports.listReportsForMap, { limit });
  const [viewport, setViewport] = useState<AtlasViewport | null>(null);
  const [debouncedViewport, setDebouncedViewport] =
    useState<AtlasViewport | null>(null);

  useEffect(() => {
    const timeout = window.setTimeout(
      () => setDebouncedViewport(viewport),
      140,
    );
    return () => window.clearTimeout(timeout);
  }, [viewport]);

  const pins = useMemo(
    () => (reports ?? initialPins) as Array<AtlasPin>,
    [initialPins, reports],
  );

  const reportsById = useMemo(() => {
    const map = new Map<string, AtlasPin>();
    pins.forEach((pin) => map.set(pin._id, pin));
    return map;
  }, [pins]);

  const visiblePins = useMemo(() => {
    if (!debouncedViewport) {
      return pins;
    }
    return pins.filter((pin) => isInsideViewport(pin, debouncedViewport));
  }, [debouncedViewport, pins]);

  const geojson = useMemo<AtlasFeatureCollection>(
    () => ({
      type: "FeatureCollection",
      features: pins.map((pin) => ({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [pin.lng, pin.lat],
        },
        properties: {
          id: pin._id,
          title: pin.title,
          locationName: pin.locationName,
          issueType: pin.issueType,
          severity: pin.severity,
          votes: pin.votes,
          color: issuePinColors[pin.issueType],
        },
      })),
    }),
    [pins],
  );

  return {
    pins,
    visiblePins,
    reportsById,
    geojson,
    isLoading:
      reports === undefined && initialPins.length > 0 && pins.length === 0,
    setViewport,
  };
}
