
import OpenAI from "openai";
import { NextResponse } from "next/server";

export async function GET() {
    const apiKey = process.env.NEBIUS_API_KEY;
    const model = process.env.NEBIUS_MODEL;

    if (!apiKey || !model) {
        return NextResponse.json(
            { error: "Nebius API key or model ID is missing." },
            { status: 500 }
        );
    }

    try {
        const client = new OpenAI({
            apiKey,
            baseURL: "https://api.tokenfactory.nebius.com/v1/",
        });

        const result = await client.chat.completions.create({
            model,
            messages: [
                {
                    role: "system",
                    content:
                        "You are the AI assistant for Mnemo, a personal memory and productivity app.",
                },
                {
                    role: "user",
                    content: "Reply with: AI connection successful!",
                },
            ],
            max_tokens: 60,
        });

        return NextResponse.json({
            success: true,
            reply: result.choices[0]?.message?.content,
        });
    } catch (error) {
        console.error("Nebius request failed:", error);

        return NextResponse.json(
            { error: "Nebius request failed. Check the server terminal." },
            { status: 502 }
        );
    }
}
