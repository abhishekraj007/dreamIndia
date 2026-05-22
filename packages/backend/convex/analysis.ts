import { ConvexError, v } from "convex/values";
import { action, type ActionCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

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

export type VisionAnalysisResult = {
  description: string;
  planningGoal: string;
  severity: "low" | "medium" | "high" | "critical";
  tags: Array<string>;
};

export type VisionAnalysisSource =
  | { storageId: Id<"_storage">; dataUrl?: never }
  | { dataUrl: string; storageId?: never };

function normalizeSeverity(value: unknown): VisionAnalysisResult["severity"] {
  if (
    value === "low" ||
    value === "medium" ||
    value === "high" ||
    value === "critical"
  ) {
    return value;
  }
  return "medium";
}

function normalizeTags(value: unknown): Array<string> {
  if (!Array.isArray(value)) {
    return ["infrastructure"];
  }
  const tags = value
    .filter((tag): tag is string => typeof tag === "string")
    .map((tag) => tag.trim().toLowerCase())
    .filter(Boolean)
    .slice(0, 5);
  return tags.length ? tags : ["infrastructure"];
}

async function getImageUrl(ctx: ActionCtx, source: VisionAnalysisSource) {
  if ("dataUrl" in source) {
    return source.dataUrl;
  }

  const imageUrl = await ctx.storage.getUrl(source.storageId);
  if (!imageUrl) {
    throw new ConvexError("Failed to generate image URL from storage.");
  }
  return imageUrl;
}

export async function runVisionAnalysis(
  ctx: ActionCtx,
  source: VisionAnalysisSource,
): Promise<VisionAnalysisResult> {
  const imageUrl = await getImageUrl(ctx, source);
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
        model: "google/gemini-3.1-flash-lite",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Analyze this bad civic infrastructure photo from India. Your analysis MUST be returned as a valid JSON object.
Return EXACTLY this JSON structure:
{
  "description": "A precise description of the bad condition shown in the image (e.g. broken pavement, heavy waterlogging, garbage dump, open sewer). Be objective.",
  "planningGoal": "A bold but realistic urban-planning transformation brief that would make this space feel world-class, highly walkable, clean, and well-organized while still fitting Indian context. Mention specific physical upgrades such as continuous footpaths, covered drains, tree pits, crossings, calmer carriageway design, organized parking, utility cleanup, lighting, and durable materials.",
  "severity": "low" | "medium" | "high" | "critical" (Assess based on immediate threat to public safety, walking access, and public hygiene),
  "tags": ["tag1", "tag2", "tag3"] (Provide 3 to 5 lowercase tags related to the problem, e.g. "footpath", "drainage", "garbage", "crossing")
}

The planningGoal should not be a minor cleanup. It should describe a coherent, premium, municipal-grade upgrade inspired by the quality of the best contemporary streets internationally, but adapted to Indian climate, scale, and street conditions.

Do not wrap in markdown code blocks. Return ONLY the raw JSON object.`,
              },
              {
                type: "image_url",
                image_url: {
                  url: imageUrl,
                },
              },
            ],
          },
        ],
      }),
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new ConvexError(
      `OpenRouter API failed: ${response.statusText} - ${errorText}`,
    );
  }

  const result = await response.json();
  const content = result.choices?.[0]?.message?.content;
  if (!content || typeof content !== "string") {
    throw new ConvexError("No analysis returned from vision model.");
  }

  let cleanContent = content.trim();
  if (cleanContent.startsWith("```")) {
    cleanContent = cleanContent
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/, "");
  }

  try {
    const parsed = JSON.parse(cleanContent) as Record<string, unknown>;
    return {
      description:
        typeof parsed.description === "string" && parsed.description.trim()
          ? parsed.description.trim()
          : "Unspecified issue.",
      planningGoal:
        typeof parsed.planningGoal === "string" && parsed.planningGoal.trim()
          ? parsed.planningGoal.trim()
          : "Modern civic improvements.",
      severity: normalizeSeverity(parsed.severity),
      tags: normalizeTags(parsed.tags),
    };
  } catch (error) {
    console.error("Failed to parse JSON from vision analysis:", content, error);
    return {
      description: cleanContent || "Analysis completed.",
      planningGoal: "Modern civic improvements.",
      severity: "medium",
      tags: ["infrastructure"],
    };
  }
}

export const analyzeReportPhoto = action({
  args: {
    storageId: v.optional(v.id("_storage")),
    dataUrl: v.optional(v.string()),
  },
  returns: analysisResultValidator,
  handler: async (ctx, args) => {
    if (args.storageId) {
      return await runVisionAnalysis(ctx, { storageId: args.storageId });
    }
    if (args.dataUrl) {
      return await runVisionAnalysis(ctx, { dataUrl: args.dataUrl });
    }
    throw new ConvexError(
      "A storageId or dataUrl is required for photo analysis.",
    );
  },
});
