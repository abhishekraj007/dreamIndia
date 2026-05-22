"use node";

import { R2 } from "@convex-dev/r2";
import { HOUR } from "@convex-dev/rate-limiter";
import { ConvexError, v } from "convex/values";
import { components, internal } from "./_generated/api";
import { action, type ActionCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { authComponent } from "./lib/betterAuth";
import { rateLimiter } from "./lib/rateLimit";
import { runVisionAnalysis } from "./analysis";

const TRANSFORM_MODEL = "google/gemini-2.5-flash-image";
const r2 = new R2(components.r2);

const issueTypeValidator = v.union(
  v.literal("roads"),
  v.literal("rivers"),
  v.literal("popular-place"),
  v.literal("transit"),
  v.literal("waste"),
  v.literal("drainage"),
);

const severityValidator = v.union(
  v.literal("low"),
  v.literal("medium"),
  v.literal("high"),
  v.literal("critical"),
);

const analysisResultValidator = v.object({
  description: v.string(),
  planningGoal: v.string(),
  severity: severityValidator,
  tags: v.array(v.string()),
});

function buildIssueDesignDirectives(issueType: string) {
  switch (issueType) {
    case "roads":
      return [
        "Install continuous, level footpaths on both sides with clear curbs and accessible ramps.",
        "Cover roadside drains and add frequent stormwater inlets with proper surface slope.",
        "Calm the carriageway with a tighter, cleaner street section and organized curb management.",
        "Add marked pedestrian crossings, bollards where needed, tree grates, and high-quality street lighting.",
        "Organize parking so vehicles no longer block walking space or drainage edges.",
      ];
    case "rivers":
      return [
        "Create a clean and engineered river edge with flood-safe paving, railings, and shaded promenade zones.",
        "Add trash interception, landscape stabilization, seating, and safer walking access.",
        "Remove dumping, erosion, and visual clutter while keeping the river alignment realistic.",
      ];
    case "popular-place":
      return [
        "Upgrade the area into a clean, welcoming civic destination with strong pedestrian priority.",
        "Add coordinated paving, seating, signage, lighting, shaded waiting space, and orderly frontage edges.",
        "Reduce clutter and make the public realm feel premium, legible, and safe.",
      ];
    case "transit":
      return [
        "Add an accessible transit edge with proper shelter, boarding zone, seating, signage, and lighting.",
        "Improve pedestrian approach paths, curb alignment, crossings, and waiting comfort.",
        "Keep bus and vehicle movement realistic while making the stop feel organized and safe.",
      ];
    case "waste":
      return [
        "Replace informal dumping with a clean, organized waste-management zone using screened bins and paved service areas.",
        "Add drainage, wash-down surfaces, planting buffers, and pedestrian-safe edges.",
        "Make the space feel sanitary, orderly, and permanently maintainable.",
      ];
    case "drainage":
      return [
        "Build a complete drainage upgrade with covered channels, grated inlets, clean curb lines, and corrected surface slope.",
        "Integrate the drainage into a high-quality pedestrian environment with continuous paving and safer crossings.",
        "Eliminate waterlogging risk, exposed channels, and broken edge conditions.",
      ];
    default:
      return [
        "Create a coherent, high-quality civic upgrade with safe walking space, drainage, greenery, and clean public edges.",
      ];
  }
}

function buildPrompt(args: {
  locationName: string;
  issueType: string;
  planningGoal: string;
  notes: string;
}) {
  const issueDirectives = buildIssueDesignDirectives(args.issueType);

  return [
    "TASK: Generate an edited, photorealistic civic transformation image from the provided source photo.",
    "DESIGN INTENT: Make the street feel like a best-in-class complete-street upgrade inspired by the clarity, cleanliness, safety, and coherence of top-quality urban streets in leading European and East Asian cities, but adapted to Indian climate, density, street width, local trees, materials, and neighborhood character.",
    `LOCATION: ${args.locationName}.`,
    `ISSUE TYPE: ${args.issueType}.`,
    `PRIMARY GOAL: ${args.planningGoal}.`,
    args.notes ? `OBSERVED PROBLEMS: ${args.notes}.` : "",
    "PRESERVE:",
    "- Keep the same camera position, perspective, sunlight direction, road alignment, building massing, and recognizable site geometry.",
    "- Keep the transformation believable as a completed municipal or urban-design project, not fantasy concept art.",
    "- Retain the local character of the neighborhood while dramatically improving the public realm.",
    "UPGRADE WITH:",
    ...issueDirectives.map((directive) => `- ${directive}`),
    "- Use high-quality but believable civic materials such as concrete or stone pavers, proper curbs, cast drain covers, tactile paving where appropriate, tree pits with grates, subtle bollards, painted crossings, and coherent street furniture.",
    "- Make the result feel intentional, orderly, premium, shaded, walkable, and easy to maintain.",
    "QUALITY BAR:",
    "- The after image should look like a bold, world-class public-realm upgrade, not just a basic cleanup or resurfacing.",
    "- Walking space should be continuous, obstruction-free, and clearly safer than the original scene.",
    "- Drainage, parking, utilities, planting, and pedestrian movement should all look designed as one system.",
    "AVOID:",
    "- No fantasy architecture, skyline changes, luxury towers, oversized boulevards, tram systems, or major rebuilding of private buildings.",
    "- Do not westernize the scene unrealistically or erase Indian context.",
    "- Do not remove mature trees unless safety requires it; integrate them with proper pits, grates, or landscape treatment.",
    "- Do not add fake text, political branding, unreadable signage, or decorative gimmicks.",
    "OUTPUT:",
    "- Return the transformed result as an image output, not a text-only explanation.",
    "- If you include any text, keep it brief and still provide the edited image in the images field.",
    "CRITICAL: Avoid using any emojis in your response.",
  ]
    .filter(Boolean)
    .join("\n");
}

function extensionForContentType(contentType: string) {
  switch (contentType) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/gif":
      return "gif";
    case "image/avif":
      return "avif";
    default:
      return "bin";
  }
}

async function blobToDataUrl(blob: Blob) {
  const arrayBuffer = await blob.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString("base64");
  const contentType = blob.type || "image/png";
  return `data:${contentType};base64,${base64}`;
}

function dataUrlToBlob(dataUrl: string) {
  const match = dataUrl.match(/^data:([^;,]+)?(;base64)?,([\s\S]*)$/);
  if (!match) {
    throw new ConvexError("Generated image data URL is invalid.");
  }
  const contentType = match[1] || "image/png";
  const isBase64 = Boolean(match[2]);
  const payload = match[3] || "";
  const bytes = isBase64
    ? Buffer.from(payload, "base64")
    : Buffer.from(decodeURIComponent(payload), "utf8");
  return new Blob([bytes], { type: contentType });
}

async function loadImageBlobFromResult(imageUrl: string) {
  return imageUrl.startsWith("data:")
    ? dataUrlToBlob(imageUrl)
    : await fetchImageBlob(imageUrl, "Unable to fetch transformed image.");
}

async function fetchImageBlob(url: string, errorMessage: string) {
  const response = await fetch(url);
  if (!response.ok) {
    const body = await response.text();
    throw new ConvexError(`${errorMessage} ${response.status} ${body}`);
  }
  return await response.blob();
}

async function loadSourceImage(
  ctx: ActionCtx,
  args: { photoStorageId?: Id<"_storage">; lat?: number; lng?: number },
) {
  if (args.photoStorageId) {
    const blob = await ctx.storage.get(args.photoStorageId);
    if (!blob) {
      throw new ConvexError("Uploaded before image was not found in storage.");
    }
    return {
      beforeStorageId: args.photoStorageId,
      blob,
      dataUrl: await blobToDataUrl(blob),
    };
  }

  if (args.lat === undefined || args.lng === undefined) {
    throw new ConvexError("A photo or a latitude/longitude pair is required.");
  }

  const googleMapsKey = process.env.GOOGLE_MAPS_KEY;
  if (!googleMapsKey) {
    throw new ConvexError(
      "GOOGLE_MAPS_KEY is not configured in Convex environment variables.",
    );
  }

  const streetViewUrl = new URL(
    "https://maps.googleapis.com/maps/api/streetview",
  );
  streetViewUrl.searchParams.set("location", `${args.lat},${args.lng}`);
  streetViewUrl.searchParams.set("size", "1024x768");
  streetViewUrl.searchParams.set("fov", "80");
  streetViewUrl.searchParams.set("pitch", "0");
  streetViewUrl.searchParams.set("key", googleMapsKey);

  const blob = await fetchImageBlob(
    streetViewUrl.toString(),
    "Unable to fetch Google Street View fallback image.",
  );
  const beforeStorageId = await ctx.storage.store(blob);
  return {
    beforeStorageId,
    blob,
    dataUrl: await blobToDataUrl(blob),
  };
}

function findGeneratedImageUrl(result: any) {
  const message = result.choices?.[0]?.message;
  if (message?.images?.[0]?.image_url?.url) {
    return String(message.images[0].image_url.url);
  }
  if (message?.image_url?.url) {
    return String(message.image_url.url);
  }
  if (
    typeof message?.content === "string" &&
    message.content.trim().startsWith("http")
  ) {
    return message.content.trim();
  }
  if (
    typeof message?.content === "string" &&
    message.content.trim().startsWith("data:")
  ) {
    return message.content.trim();
  }
  if (Array.isArray(message?.content)) {
    for (const part of message.content) {
      if (typeof part === "string") {
        const trimmed = part.trim();
        if (trimmed.startsWith("http") || trimmed.startsWith("data:")) {
          return trimmed;
        }
      }
      if (typeof part?.image_url?.url === "string") {
        return String(part.image_url.url);
      }
      if (typeof part?.url === "string") {
        const trimmed = part.url.trim();
        if (trimmed.startsWith("http") || trimmed.startsWith("data:")) {
          return trimmed;
        }
      }
    }
  }
  if (result.choices?.[0]?.image_url?.url) {
    return String(result.choices[0].image_url.url);
  }
  return null;
}

async function persistBlobToR2(
  ctx: ActionCtx,
  userId: string,
  blob: Blob,
  kind: "before" | "after",
) {
  const contentType = blob.type || "application/octet-stream";
  const extension = extensionForContentType(contentType);
  const key = `${userId}/reports/${Date.now()}-${kind}-${crypto.randomUUID()}.${extension}`;
  const storedKey = await r2.store(ctx, blob, { key, type: contentType });

  const anyInternal = internal as any;
  const registration: { created: boolean } = await ctx.runMutation(
    anyInternal.uploads.createUploadRecord,
    {
      key: storedKey,
      userId,
      contentType,
      contentLength: blob.size,
    },
  );

  if (!registration.created) {
    throw new ConvexError("Report image could not be persisted to R2.");
  }

  return {
    key: storedKey,
    url: await r2.getUrl(storedKey),
  };
}

async function getAssetUrl(
  ctx: ActionCtx,
  storageId: Id<"_storage">,
  r2Key?: string,
) {
  if (r2Key) {
    return await r2.getUrl(r2Key);
  }
  return await getStorageUrl(ctx, storageId);
}

async function runImageTransform(sourceDataUrl: string, prompt: string) {
  const openrouterKey =
    process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY;
  if (!openrouterKey) {
    throw new ConvexError(
      "Neither OPENROUTER_API_KEY nor OPENAI_API_KEY is configured in Convex environment variables.",
    );
  }

  const response = await fetch(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openrouterKey}`,
        "HTTP-Referer": "https://cockroachdreamindia.com",
        "X-Title": "CockroachDreamIndia",
      },
      body: JSON.stringify({
        model: TRANSFORM_MODEL,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: prompt,
              },
              {
                type: "image_url",
                image_url: {
                  url: sourceDataUrl,
                },
              },
            ],
          },
        ],
        modalities: ["image", "text"],
        image_config: {
          image_size: "2K",
        },
      }),
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new ConvexError(
      `OpenRouter image transformation failed: ${response.statusText} - ${errorText}`,
    );
  }

  const result = await response.json();
  const generatedImageUrl = findGeneratedImageUrl(result);
  if (!generatedImageUrl) {
    console.error("OpenRouter full response payload:", JSON.stringify(result));
    throw new ConvexError(
      "No transformed image URL returned from the OpenRouter model.",
    );
  }
  return generatedImageUrl;
}

async function getStorageUrl(ctx: ActionCtx, storageId: Id<"_storage">) {
  const url = await ctx.storage.getUrl(storageId);
  if (!url) {
    throw new ConvexError("Failed to create a signed image URL.");
  }
  return url;
}

export const transformImage = action({
  args: {
    photoStorageId: v.optional(v.id("_storage")),
    lat: v.optional(v.number()),
    lng: v.optional(v.number()),
    locationName: v.string(),
    issueType: issueTypeValidator,
    planningGoal: v.string(),
    notes: v.string(),
  },
  returns: v.object({
    beforeStorageId: v.id("_storage"),
    afterStorageId: v.id("_storage"),
    beforeR2Key: v.optional(v.string()),
    afterR2Key: v.optional(v.string()),
    beforeUrl: v.string(),
    afterUrl: v.string(),
    model: v.string(),
    analysis: analysisResultValidator,
  }),
  handler: async (ctx, args) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) {
      throw new ConvexError("Sign in to generate a transformation.");
    }

    const anyInternal = internal as any;
    const access: { isPremium: boolean } = await ctx.runQuery(
      anyInternal.transformAccess.getTransformUserAccess,
      { authUserId: user._id },
    );

    await rateLimiter.limit(ctx, "transformPerUser", {
      key: user._id,
      throws: true,
      ...(access.isPremium
        ? {
            config: {
              kind: "token bucket" as const,
              rate: 60,
              period: HOUR,
              capacity: 60,
            },
          }
        : {}),
    });

    const source = await loadSourceImage(ctx, args);
    const beforeAsset = await persistBlobToR2(
      ctx,
      user._id,
      source.blob,
      "before",
    );
    const prompt = buildPrompt(args);
    const [analysis, generatedImageUrl] = await Promise.all([
      runVisionAnalysis(ctx, { dataUrl: source.dataUrl }),
      runImageTransform(source.dataUrl, prompt),
    ]);
    const transformedBlob = await loadImageBlobFromResult(generatedImageUrl);
    const afterStorageId = await ctx.storage.store(transformedBlob);
    const afterAsset = await persistBlobToR2(
      ctx,
      user._id,
      transformedBlob,
      "after",
    );

    return {
      beforeStorageId: source.beforeStorageId,
      afterStorageId,
      beforeR2Key: beforeAsset.key,
      afterR2Key: afterAsset.key,
      beforeUrl: await getAssetUrl(
        ctx,
        source.beforeStorageId,
        beforeAsset.key,
      ),
      afterUrl: await getAssetUrl(ctx, afterStorageId, afterAsset.key),
      model: TRANSFORM_MODEL,
      analysis,
    };
  },
});

export const ensureStorageImageInR2 = action({
  args: {
    storageId: v.id("_storage"),
  },
  returns: v.object({
    storageId: v.id("_storage"),
    r2Key: v.string(),
    url: v.string(),
  }),
  handler: async (ctx, args) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) {
      throw new ConvexError("Sign in to persist report images.");
    }

    const blob = await ctx.storage.get(args.storageId);
    if (!blob) {
      throw new ConvexError("Uploaded report image was not found in storage.");
    }

    const asset = await persistBlobToR2(ctx, user._id, blob, "before");
    return {
      storageId: args.storageId,
      r2Key: asset.key,
      url: asset.url,
    };
  },
});
