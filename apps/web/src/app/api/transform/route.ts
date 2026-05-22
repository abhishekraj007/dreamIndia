import { NextResponse } from "next/server";
import OpenAI, { toFile } from "openai";
import sharp from "sharp";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY is not configured." },
        { status: 503 },
      );
    }

    const formData = await request.formData();
    const photo = formData.get("photo");
    const locationName = String(
      formData.get("locationName") || "an Indian civic location",
    );
    const issueType = String(formData.get("issueType") || "infrastructure");
    const planningGoal = String(
      formData.get("planningGoal") ||
        "safe, clean, climate-resilient public infrastructure",
    );
    const notes = String(formData.get("notes") || "");

    const prompt = [
      "Transform this India civic infrastructure photo into a realistic planning visualization.",
      `Location context: ${locationName}.`,
      `Issue type: ${issueType}.`,
      `Transformation goal: ${planningGoal}.`,
      notes ? `Additional citizen notes: ${notes}.` : "",
      "Keep the same camera perspective and recognizable site geometry where possible.",
      "Show practical interventions: safe walking space, drainage, shade, clean edges, accessible crossings, organized utilities, and maintainable public realm.",
      "Do not add fantasy architecture, monuments, political branding, luxury towers, fake text, or unreadable signage.",
    ]
      .filter(Boolean)
      .join(" ");

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const models = ["gpt-image-2", "gpt-image-1.5"];
    let lastError: unknown;

    for (const model of models) {
      try {
        const params = {
          model: model as never,
          prompt,
          size: "1536x1024" as const,
        };
        const isFile = photo instanceof File && photo.size > 0;
        const result = isFile
          ? await client.images.edit({
              ...params,
              image: await toFile(
                await sharp(Buffer.from(await photo.arrayBuffer()))
                  .rotate()
                  .resize(1536, 1024, {
                    fit: "inside",
                    withoutEnlargement: true,
                  })
                  .png()
                  .toBuffer(),
                "citizen-photo.png",
                { type: "image/png" },
              ),
            })
          : await client.images.generate(params);

        const image = result.data?.[0];
        if (image?.b64_json) {
          return NextResponse.json({
            imageUrl: `data:image/png;base64,${image.b64_json}`,
            model,
            prompt,
          });
        }
        if (image?.url) {
          return NextResponse.json({ imageUrl: image.url, model, prompt });
        }
        throw new Error("Image model returned no image payload.");
      } catch (error) {
        lastError = error;
      }
    }

    throw lastError;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to transform image.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
