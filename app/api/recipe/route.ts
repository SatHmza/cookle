import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic();

export async function POST(request: NextRequest) {
  const { ingredients, dietary, timeLimit } = await request.json();

  if (!ingredients || ingredients.trim().length === 0) {
    return NextResponse.json({ error: "No ingredients provided" }, { status: 400 });
  }

  const prompt = `You are a chaotic, enthusiastic kitchen gremlin who lives in the user's fridge. Your job is to look at what they have and DECIDE what they're cooking tonight. No wishy-washy suggestions — you DECIDE.

The user has these ingredients: ${ingredients}
Dietary preference: ${dietary === "None" ? "No restrictions" : dietary}
Time available: ${timeLimit}

Pick ONE recipe that works best with what they have. Be creative but realistic. Match as many of their ingredients as possible.

Return ONLY a valid JSON object with no markdown fences, no explanation, just raw JSON:
{
  "name": "Recipe Name",
  "emoji": "🍝",
  "description": "A fun, playful 1-2 sentence description in a casual tone",
  "time": "25 mins",
  "difficulty": "Easy",
  "matched_ingredients": ["list only ingredients from their input that are used"],
  "extra_ingredients": ["salt", "olive oil", "any basic pantry staples they might need"],
  "steps": ["Step 1: specific instruction", "Step 2: specific instruction", "Step 3: specific instruction"],
  "gremlin_note": "A short, funny, unhinged-in-a-good-way comment from the kitchen gremlin"
}`;

  try {
    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found in response");

    const recipe = JSON.parse(jsonMatch[0]);
    return NextResponse.json(recipe);
  } catch (error) {
    console.error("Claude error:", error);
    return NextResponse.json({ error: "Failed to generate recipe. Try again!" }, { status: 500 });
  }
}
