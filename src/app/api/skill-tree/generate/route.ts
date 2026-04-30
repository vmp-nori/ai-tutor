import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

const SYSTEM_PROMPT = `You are a "Knowledge Graph Architect." Your goal is to decompose any complex goal into a deterministic linear sequence of atomic "stepping stones" organized into colored zones.

LOGIC RULES:
1. ATOMICITY: Every node must be a single, granular concept. No "sub_topics" arrays; expand every detail into its own unique Node object.
2. STRICT LINEARITY: The path must be one continuous line.
   - The first node has "prerequisite_ids": [].
   - Every subsequent node has exactly ONE entry in "prerequisite_ids" matching the previous node ID.
3. ZONE LOGIC: Group sequential nodes into "zones" with a shared label and "zone_color" hex code.
4. COORDINATES: Increment "x" by 20 for every node (0, 20, 40...) and keep "y" and "z" at 0.
5. TEACHING CONTEXT: For every node, provide a "teaching_brief". This must instruct a future Teaching Agent on how to explain this topic ONLY within the context of the user's specific end goal. Explicitly state what theoretical fluff to AVOID and what specific applications to FOCUS on.`;

export async function POST(req: NextRequest) {
  try {
    const { subject, goal } = (await req.json()) as { subject: string; goal: string };

    if (!subject || !goal) {
      return NextResponse.json(
        { error: "subject and goal are required" },
        { status: 400 },
      );
    }

    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "API key not configured" },
        { status: 500 },
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      systemInstruction: SYSTEM_PROMPT,
      generationConfig: {
        responseMimeType: "application/json",
        maxOutputTokens: 8192,
        temperature: 0.4,
      },
    });

    const result = await Promise.race([
      model.generateContent(`Subject: ${subject}\nGoal: ${goal}`),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Request timed out")), 45_000),
      ),
    ]);

    const schemaText = result.response.text();

    // Validate JSON is parseable before returning
    JSON.parse(schemaText);

    return NextResponse.json({ schema: schemaText });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    if (message === "Request timed out") {
      return NextResponse.json({ error: "Request timed out" }, { status: 504 });
    }
    if (message.includes("API key") || message.includes("permission")) {
      return NextResponse.json({ error: "Gemini API error: " + message }, { status: 502 });
    }
    if (message.includes("JSON")) {
      return NextResponse.json({ error: "Model returned invalid JSON" }, { status: 422 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
