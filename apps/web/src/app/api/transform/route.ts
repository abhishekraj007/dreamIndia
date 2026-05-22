import { NextResponse } from "next/server";
import sharp from "sharp";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const openrouterKey = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY;
    if (!openrouterKey) {
      return NextResponse.json(
        { error: "Neither OPENROUTER_API_KEY nor OPENAI_API_KEY is configured." },
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
      "CRITICAL: Avoid using any emojis in your response.",
    ]
      .filter(Boolean)
      .join(" ");

    const isFile = photo instanceof File && photo.size > 0;
    if (!isFile) {
      return NextResponse.json(
        { error: "A valid photo must be uploaded for the transformation." },
        { status: 400 },
      );
    }

    // Process image buffer using sharp to output standard PNG
    const imageBuffer = Buffer.from(await photo.arrayBuffer());
    const processedPngBuffer = await sharp(imageBuffer)
      .rotate()
      .resize(1024, 768, {
        fit: "inside",
        withoutEnlargement: true,
      })
      .png()
      .toBuffer();

    const base64Image = processedPngBuffer.toString("base64");
    const imageUrlData = `data:image/png;base64,${base64Image}`;

    // Request OpenRouter Chat Completions with modalities to generate the image
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openrouterKey}`,
        "HTTP-Referer": "https://cockroachdreamindia.com",
        "X-Title": "CockroachDreamIndia",
      },
      body: JSON.stringify({
        model: "google/gemini-3.1-flash-image-preview",
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
                  url: imageUrlData,
                },
              },
            ],
          },
        ],
        modalities: ["image", "text"],
        image_config: {
          image_size: "1K",
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenRouter image transformation failed: ${response.statusText} - ${errorText}`);
    }

    const result = await response.json();
    const message = result.choices?.[0]?.message;
    
    // Look for image URL in various possible locations in the OpenRouter response
    let generatedImageUrl: string | null = null;
    
    if (message?.images?.[0]?.image_url?.url) {
      generatedImageUrl = message.images[0].image_url.url;
    } else if (message?.image_url?.url) {
      generatedImageUrl = message.image_url.url;
    } else if (typeof message?.content === "string" && message.content.startsWith("http")) {
      generatedImageUrl = message.content.trim();
    } else if (result.choices?.[0]?.image_url?.url) {
      generatedImageUrl = result.choices[0].image_url.url;
    }

    if (!generatedImageUrl) {
      console.error("OpenRouter full response payload:", JSON.stringify(result));
      throw new Error("No transformed image URL returned from the OpenRouter model.");
    }

    return NextResponse.json({
      imageUrl: generatedImageUrl,
      model: "google/gemini-3.1-flash-image-preview",
      prompt,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to transform image.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
