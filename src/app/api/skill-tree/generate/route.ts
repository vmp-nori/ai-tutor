import {
  BedrockRuntimeClient,
  ConverseStreamCommand,
  type ConverseStreamResponse,
} from "@aws-sdk/client-bedrock-runtime";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { NextRequest, NextResponse } from "next/server";
import { createClient, hasSupabaseConfig } from "@/lib/supabase/server";

export const runtime = "nodejs";

interface GenerateRequest {
  goal?: unknown;
  subject?: unknown;
}

const DEFAULT_MODEL = "arn:aws:bedrock:us-east-1:393459799930:inference-profile/global.anthropic.claude-opus-4-7";
const DEFAULT_REGION = "us-east-1";
const MAX_GOAL_LENGTH = 800;
const MAX_SUBJECT_LENGTH = 140;
const SYSTEM_PROMPT_PATH = join(process.cwd(), "prompts", "graphgeneration.txt");

const responseJsonSchema = {
  type: "object",
  description: "A compact Pathwise learning graph for one learner goal.",
  additionalProperties: false,
  properties: {
    subject: {
      type: "string",
      description: "A concise subject label inferred from the learner's goal.",
    },
    goal: {
      type: "string",
      description: "The learner's final goal, cleaned up for readability without changing intent.",
    },
    nodes: {
      type: "array",
      description: "Atomic prerequisite concepts ordered from foundation to final goal readiness.",
      items: {
        type: "object",
        description: "One teachable prerequisite concept in the learning graph.",
        additionalProperties: false,
        properties: {
          id: {
            type: "string",
            description: "Stable lowercase snake_case concept id.",
          },
          name: {
            type: "string",
            description: "Short human-readable concept name.",
          },
          description: {
            type: "string",
            description: "One sentence explaining what the learner must understand.",
          },
          teaching: {
            type: "object",
            description: "Instructions for a later teaching agent to teach this concept in context.",
            additionalProperties: false,
            properties: {
              objective: {
                type: "string",
                description: "The concrete capability the learner should gain from this lesson.",
              },
              goal_context: {
                type: "string",
                description: "Why this concept matters for the learner's final goal.",
              },
              focus_points: {
                type: "array",
                description: "Specific lesson priorities to cover.",
                items: { type: "string" },
              },
              avoid: {
                type: "array",
                description: "Detours, over-advanced details, or irrelevant theories to skip.",
                items: { type: "string" },
              },
              interactive_hint: {
                type: "string",
                description: "A useful interactive visual idea, or an empty string when none is useful.",
              },
            },
            required: [
              "objective",
              "goal_context",
              "focus_points",
              "avoid",
              "interactive_hint",
            ],
          },
          difficulty_level: {
            type: "integer",
            description: "Relative concept difficulty from 1 to 10.",
          },
          zone: {
            type: "string",
            description: "Sequential chapter name for this concept.",
          },
          zone_color: {
            type: "string",
            description: "Hex color assigned to this node's zone.",
          },
          category: {
            type: "string",
            description: "Learning category for this concept. Must be one of: math_and_logic, systems_and_economics, technical_and_code.",
            enum: ["math_and_logic", "systems_and_economics", "technical_and_code"],
          },
          prerequisite_ids: {
            type: "array",
            description: "Zero or one earlier node id that must be learned before this concept.",
            items: { type: "string" },
          },
          coordinates: {
            type: "object",
            description: "Graph layout coordinates for rendering the learning path.",
            additionalProperties: false,
            properties: {
              x: {
                type: "number",
                description: "Horizontal learning layer. Increase by about 20 each layer.",
              },
              y: {
                type: "number",
                description: "Small vertical offset for readability. Usually 0.",
              },
            },
            required: ["x", "y"],
          },
        },
        required: [
          "id",
          "name",
          "description",
          "teaching",
          "difficulty_level",
          "zone",
          "zone_color",
          "category",
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

async function readSystemPrompt() {
  const prompt = (await readFile(SYSTEM_PROMPT_PATH, "utf8")).trim();
  if (!prompt) {
    throw new Error("Skill tree system prompt file is empty");
  }

  return prompt;
}

function getBedrockClient() {
  const region = process.env.AWS_BEDROCK_REGION?.trim() || process.env.AWS_REGION?.trim() || DEFAULT_REGION;
  const bearerToken = process.env.AWS_BEARER_TOKEN_BEDROCK?.trim();

  if (bearerToken) {
    return new BedrockRuntimeClient({
      region,
      token: { token: bearerToken },
    });
  }

  return new BedrockRuntimeClient({ region });
}

function buildBedrockCommand(goal: string, subject: string, systemPrompt: string) {
  const modelId = process.env.BEDROCK_MODEL_ID?.trim() || DEFAULT_MODEL;

  return new ConverseStreamCommand({
    modelId,
    system: [{ text: systemPrompt }],
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

    const systemPrompt = await readSystemPrompt();
    const bedrockResponse = await getBedrockClient().send(buildBedrockCommand(goal, subject, systemPrompt), {
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
