import {
  BedrockRuntimeClient,
  ConverseStreamCommand,
  type ConverseStreamResponse,
} from "@aws-sdk/client-bedrock-runtime";
import { NextRequest, NextResponse } from "next/server";
import { createClient, hasSupabaseConfig } from "@/lib/supabase/server";

export const runtime = "nodejs";

interface GenerateRequest {
  goal?: unknown;
  subject?: unknown;
}

const DEFAULT_MODEL = "us.anthropic.claude-haiku-4-5-20251001";
const DEFAULT_REGION = "us-east-1";
const MAX_GOAL_LENGTH = 800;
const MAX_SUBJECT_LENGTH = 140;
const JSON_SKELETON = `{
  "subject": "Concise inferred subject label",
  "goal": "The user's exact end goal, cleaned up for readability",
  "nodes": [
    {
      "id": "lowercase_snake_case_id",
      "name": "Atomic concept name",
      "description": "One sentence explaining what the learner must understand",
      "teaching_brief": "Goal-specific guidance for a future teaching agent",
      "difficulty_level": 1,
      "is_checkpoint": false,
      "zone": "Sequential zone name",
      "zone_color": "#3B82F6",
      "prerequisite_ids": [],
      "coordinates": { "x": 0, "y": 0, "z": 0 }
    }
  ]
}`;

const SYSTEM_PROMPT = `You are a Knowledge Graph Architect for Pathwise.

Given a learner's end goal, decompose the domain into a deterministic learning graph for the Pathwise website. Return only valid JSON matching the requested schema.

Rules:
- The graph must be a directed acyclic graph of atomic prerequisite concepts.
- The path must be linear or nearly linear: each node can have at most one prerequisite_id.
- Include 8 to 18 nodes grouped into 3 to 6 sequential zones.
- Every prerequisite_id must refer to an earlier node id.
- Use stable lowercase snake_case ids.
- difficulty_level must be an integer from 1 to 10.
- Coordinates.x must increase by about 20 for each learning layer. Coordinates.y and coordinates.z should be 0 unless a tiny visual offset is necessary.
- The final user goal is represented by the top-level goal string, not as a node.
- For every node, include a teaching_brief that tells a future teaching agent what to focus on for this exact goal and what theory to avoid.
- Keep names and descriptions concise.
- Fill every required key in this skeleton for every response:
${JSON_SKELETON}
- Do not include markdown, code fences, comments, or text outside the JSON object.`;

const responseJsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    subject: { type: "string" },
    goal: { type: "string" },
    nodes: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          description: { type: "string" },
          teaching_brief: { type: "string" },
          difficulty_level: { type: "integer" },
          is_checkpoint: { type: "boolean" },
          zone: { type: "string" },
          zone_color: { type: "string" },
          prerequisite_ids: {
            type: "array",
            items: { type: "string" },
          },
          coordinates: {
            type: "object",
            additionalProperties: false,
            properties: {
              x: { type: "number" },
              y: { type: "number" },
              z: { type: "number" },
            },
            required: ["x", "y", "z"],
          },
        },
        required: [
          "id",
          "name",
          "description",
          "teaching_brief",
          "difficulty_level",
          "is_checkpoint",
          "zone",
          "zone_color",
          "prerequisite_ids",
          "coordinates",
        ],
      },
    },
  },
  required: ["subject", "goal", "nodes"],
};

function isAwsServiceError(error: unknown): error is Error & {
  $metadata?: { httpStatusCode?: number };
} {
  return error instanceof Error && "$metadata" in error;
}

function trimString(value: unknown, maxLength: number) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLength);
}

function buildUserPrompt(goal: string, subject: string) {
  const subjectLine = subject ? `Suggested subject label: ${subject}` : "Infer a concise subject label.";
  return `${subjectLine}
End goal: ${goal}

Return a complete Pathwise skill tree JSON object for this end goal.`;
}

function getBedrockClient() {
  return new BedrockRuntimeClient({
    region: process.env.AWS_BEDROCK_REGION?.trim() || process.env.AWS_REGION?.trim() || DEFAULT_REGION,
  });
}

function buildBedrockCommand(goal: string, subject: string) {
  const modelId = process.env.BEDROCK_MODEL_ID?.trim() || DEFAULT_MODEL;

  return new ConverseStreamCommand({
    modelId,
    system: [{ text: SYSTEM_PROMPT }],
    messages: [
      {
        role: "user",
        content: [{ text: buildUserPrompt(goal, subject) }],
      },
    ],
    inferenceConfig: {
      maxTokens: 8192,
      temperature: 0.35,
    },
    outputConfig: {
      textFormat: {
        type: "json_schema",
        structure: {
          jsonSchema: {
            name: "pathwise_skill_tree",
            description: "Pathwise skill tree JSON for a learner's end goal.",
            schema: JSON.stringify(responseJsonSchema),
          },
        },
      },
    },
  });
}

function bedrockTextStream(stream: NonNullable<ConverseStreamResponse["stream"]>) {
  const encoder = new TextEncoder();

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const event of stream) {
          const text = event.contentBlockDelta?.delta?.text;
          if (text) {
            controller.enqueue(encoder.encode(text));
          }
        }

        controller.close();
      } catch (error) {
        controller.error(error);
      }
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    if (!hasSupabaseConfig()) {
      return NextResponse.json(
        { error: "Supabase is not configured" },
        { status: 503 },
      );
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as GenerateRequest;
    const goal = trimString(body.goal, MAX_GOAL_LENGTH);
    const subject = trimString(body.subject, MAX_SUBJECT_LENGTH);

    if (!goal) {
      return NextResponse.json(
        { error: "goal is required" },
        { status: 400 },
      );
    }

    const bedrockResponse = await getBedrockClient().send(buildBedrockCommand(goal, subject), {
      abortSignal: AbortSignal.timeout(45_000),
    });

    if (!bedrockResponse.stream) {
      return NextResponse.json(
        { error: "Bedrock generation stream did not start" },
        { status: 502 },
      );
    }

    return new Response(bedrockTextStream(bedrockResponse.stream), {
      headers: {
        "Cache-Control": "no-store",
        "Content-Type": "text/plain; charset=utf-8",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "TimeoutError") {
      return NextResponse.json({ error: "Request timed out" }, { status: 504 });
    }

    if (isAwsServiceError(error)) {
      console.error("Bedrock skill tree generation failed", error);
      const status = error.$metadata?.httpStatusCode;
      return NextResponse.json(
        { error: error.message || "Generation service rejected the request" },
        { status: status && status >= 400 && status < 500 ? 502 : 503 },
      );
    }

    console.error("Skill tree generation failed", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
