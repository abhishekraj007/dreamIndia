import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { authComponent, createAuth } from "./lib/betterAuth";
// import * as PolarWebhooks from "./lib/polarWebhooks";
import { handleRevenueCatWebhook } from "./lib/revenuecatWebhooks";

const http = httpRouter();

function jsonError(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function parseCoordinate(value: string | null, min: number, max: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < min || parsed > max) {
    return null;
  }
  return parsed;
}

async function proxyGoogleMapsImage(
  endpoint: "staticmap" | "streetview",
  params: URLSearchParams,
) {
  const googleMapsKey = process.env.GOOGLE_MAPS_KEY;
  if (!googleMapsKey) {
    return jsonError(
      "GOOGLE_MAPS_KEY is not configured in Convex environment variables.",
      500,
    );
  }

  const url = new URL(`https://maps.googleapis.com/maps/api/${endpoint}`);
  params.set("key", googleMapsKey);
  url.search = params.toString();

  const response = await fetch(url.toString());
  if (!response.ok) {
    const body = await response.text();
    return new Response(body || "Google Maps image request failed.", {
      status: response.status,
      headers: {
        "Content-Type": response.headers.get("Content-Type") ?? "text/plain",
      },
    });
  }

  return new Response(response.body, {
    status: response.status,
    headers: {
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
      "Content-Type": response.headers.get("Content-Type") ?? "image/jpeg",
      "Cross-Origin-Resource-Policy": "cross-origin",
    },
  });
}

const serveStaticMap = httpAction(async (_ctx, request) => {
  const url = new URL(request.url);
  const lat = parseCoordinate(url.searchParams.get("lat"), -90, 90);
  const lng = parseCoordinate(url.searchParams.get("lng"), -180, 180);

  if (lat === null || lng === null) {
    return jsonError("Valid lat and lng query parameters are required.", 400);
  }

  const params = new URLSearchParams({
    center: `${lat},${lng}`,
    maptype: "roadmap",
    markers: `color:0xea580c|${lat},${lng}`,
    scale: "2",
    size: "640x400",
    zoom: "17",
  });

  return proxyGoogleMapsImage("staticmap", params);
});

const serveStreetView = httpAction(async (_ctx, request) => {
  const url = new URL(request.url);
  const lat = parseCoordinate(url.searchParams.get("lat"), -90, 90);
  const lng = parseCoordinate(url.searchParams.get("lng"), -180, 180);

  if (lat === null || lng === null) {
    return jsonError("Valid lat and lng query parameters are required.", 400);
  }

  const params = new URLSearchParams({
    fov: "85",
    heading: "210",
    location: `${lat},${lng}`,
    pitch: "0",
    return_error_code: "true",
    size: "640x400",
  });

  return proxyGoogleMapsImage("streetview", params);
});

// Register Better Auth routes
authComponent.registerRoutes(http, createAuth, { cors: true });

// Register Polar webhook routes
// polar.registerRoutes(http, {
//   onSubscriptionCreated: PolarWebhooks.handleSubscriptionCreated,
//   onSubscriptionUpdated: PolarWebhooks.handleSubscriptionUpdated,
//   onProductCreated: PolarWebhooks.handleProductCreated,
//   onProductUpdated: PolarWebhooks.handleProductUpdated,
// });

// Register RevenueCat webhook route
http.route({
  path: "/revenuecat/webhooks",
  method: "POST",
  handler: handleRevenueCatWebhook,
});

http.route({
  path: "/maps/static",
  method: "GET",
  handler: serveStaticMap,
});

http.route({
  path: "/maps/street-view",
  method: "GET",
  handler: serveStreetView,
});

export default http;
