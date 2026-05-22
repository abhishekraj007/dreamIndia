import { ConvexError, v } from "convex/values";
import { action } from "./_generated/server";
import { api } from "./_generated/api";
import { authComponent } from "./lib/betterAuth";

export const generateProposal = action({
  args: {
    reportId: v.id("transformationReports"),
  },
  returns: v.object({ proposal: v.string() }),
  handler: async (ctx, { reportId }): Promise<{ proposal: string }> => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) {
      throw new ConvexError("Sign in before generating a planning proposal.");
    }

    // Cast api to any to break TypeScript circularity
    const anyApi = api as any;

    // 1. Fetch the report details from the database
    const report: any = await ctx.runQuery(anyApi.reports.getReport, {
      id: reportId,
    });
    if (!report) {
      throw new Error("Report not found.");
    }
    if (report.aiProposal) {
      return { proposal: report.aiProposal };
    }

    // 2. Fetch OpenRouter API key
    const openrouterKey =
      process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY;
    if (!openrouterKey) {
      throw new Error(
        "Neither OPENROUTER_API_KEY nor OPENAI_API_KEY is configured in Convex environment variables.",
      );
    }

    // 3. Construct prompt for civic consultant
    const prompt: string = `You are an expert Urban Planner and Civic Consultant. Write a highly professional, detailed, and persuasive Municipal Proposal and Citizen Petition addressed to the local municipality and state urban development authorities.

Use the following real-world civic issue report from India:
- Project Title: ${report.title}
- Location: ${report.locationName} ${report.address ? `(${report.address})` : ""}
- Infrastructure Issue Type: ${report.issueType}
- Current Severity Level: ${report.severity}
- Citizen Problem Description: ${report.description}
- Vision & Planning Goal: ${report.planningGoal}
- Google Maps Location: ${report.googleMapsUrl || "Not specified"}
- Target Tags: ${report.tags.join(", ")}

Your response MUST be a beautiful, comprehensive document formatted in Markdown.
Follow these structural guidelines:
1. SUBJECT LINE: A formal, professional subject header.
2. EXECUTIVE SUMMARY: Clear overview of the current challenges and the proposed "Dream India" vision.
3. DETAILED CIVIC PROBLEM ANALYSIS: Elaborate on the structural defects, safety hazards, hygiene risks, or environmental impacts shown in the description.
4. PROPOSED URBAN PLANNING & ENGINEERING SOLUTION: Concrete, modern infrastructure solutions (e.g., footpaths with utility ducts, rain water harvesting, segregated dustbins, intelligent streetlights, drainage pipes, smart crossings).
5. CITIZEN ADVOCACY & SOCIAL IMPACT: Explain how the transformation benefits the local community, students, women, senior citizens, and shopkeepers.
6. FORMAL PETITION SIGN-OFF: Conclude with a strong call to action for the Municipal Commissioner and an endorsement statement for local citizens to sign.

CRITICAL RULES:
- Do not use ANY emojis in the entire document.
- Do not use generic placeholders. Use the actual location, titles, and details provided above.
- Make the tone formal, engineering-focused, yet community-driven.`;

    // 4. Request OpenRouter google/gemini-3.1-flash-lite
    const response: Response = await fetch(
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
              content: prompt,
            },
          ],
        }),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `OpenRouter API failed: ${response.statusText} - ${errorText}`,
      );
    }

    const result: any = await response.json();
    const proposalMarkdown: string = result.choices?.[0]?.message?.content;
    if (!proposalMarkdown) {
      throw new Error("No proposal returned from the planning agent.");
    }

    // 5. Save the generated proposal back to the report database
    await ctx.runMutation(anyApi.reports.saveAiProposal, {
      id: reportId,
      proposal: proposalMarkdown,
    });

    return {
      proposal: proposalMarkdown,
    };
  },
});
