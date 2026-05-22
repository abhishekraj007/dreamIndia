import { v } from "convex/values";
import { action } from "./_generated/server";

export const analyzeReportPhoto = action({
  args: {
    storageId: v.string(),
  },
  handler: async (ctx, { storageId }) => {
    // 1. Get the temporary public URL of the uploaded image
    const imageUrl = await ctx.storage.getUrl(storageId);
    if (!imageUrl) {
      throw new Error("Failed to generate image URL from storage.");
    }

    // 2. Fetch OpenRouter API key
    const openrouterKey = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY;
    if (!openrouterKey) {
      throw new Error("Neither OPENROUTER_API_KEY nor OPENAI_API_KEY is configured in Convex environment variables.");
    }

    // 3. Request OpenRouter google/gemini-3.1-flash-lite
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openrouterKey}`,
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
  "planningGoal": "A practical, realistic urban planning solution to transform this space (e.g., covered drains with structured footpaths, cobblestone traffic calming, organized public trash bins with landscaping).",
  "severity": "low" | "medium" | "high" | "critical" (Assess based on immediate threat to public safety, walking access, and public hygiene),
  "tags": ["tag1", "tag2", "tag3"] (Provide 3 to 5 lowercase tags related to the problem, e.g. "footpath", "drainage", "garbage", "crossing")
}

Do not wrap in markdown code blocks. Return ONLY the raw JSON object.`
              },
              {
                type: "image_url",
                image_url: {
                  url: imageUrl
                }
              }
            ]
          }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenRouter API failed: ${response.statusText} - ${errorText}`);
    }

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("No analysis returned from vision model.");
    }

    // Parse the output, stripping any markdown code blocks if the model wrapped it
    let cleanContent = content.trim();
    if (cleanContent.startsWith("```")) {
      // strip ```json or ``` at start and ``` at end
      cleanContent = cleanContent.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
    }

    try {
      const parsed = JSON.parse(cleanContent);
      return {
        description: parsed.description || "Unspecified issue.",
        planningGoal: parsed.planningGoal || "Unspecified goal.",
        severity: parsed.severity || "medium",
        tags: Array.isArray(parsed.tags) ? parsed.tags : ["infrastructure"],
      };
    } catch (e) {
      console.error("Failed to parse JSON from content:", content, e);
      // Fallback in case parsing fails
      return {
        description: cleanContent || "Analysis completed.",
        planningGoal: "Modern civic improvements.",
        severity: "medium",
        tags: ["infrastructure"],
      };
    }
  }
});
