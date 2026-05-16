import {
  BedrockRuntimeClient,
  ConverseStreamCommand,
  type ConverseStreamResponse,
} from "@aws-sdk/client-bedrock-runtime";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { NextRequest, NextResponse } from "next/server";
import {
  detectNsfwCourseContent,
  detectProhibitedCourseContent,
  NSFW_COURSE_ERROR,
  PROHIBITED_COURSE_ERROR,
} from "@/lib/contentSafety";
import { createClient, hasSupabaseConfig } from "@/lib/supabase/server";

export const runtime = "nodejs";

interface GenerateRequest {
  goal?: unknown;
  subject?: unknown;
}

const DEFAULT_MODEL = "arn:aws:bedrock:us-east-1:393459799930:inference-profile/global.anthropic.claude-sonnet-4-6";
const DEFAULT_REGION = "us-east-1";
const MAX_OUTPUT_TOKENS = 24_000;
const MAX_GOAL_LENGTH = 800;
const MAX_SUBJECT_LENGTH = 140;
const SYSTEM_PROMPT_PATH = join(process.cwd(), "prompts", "graphgeneration.txt");


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

Return a complete pathwise skill tree JSON object for this end goal.`;
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
      maxTokens: MAX_OUTPUT_TOKENS,
      temperature: 0.35,
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

          const stopReason = event.messageStop?.stopReason;
          if (stopReason === "max_tokens") {
            throw new Error("Generation reached the output limit before the JSON finished. Try a narrower goal.");
          }

          if (stopReason === "malformed_model_output" || stopReason === "model_context_window_exceeded") {
            throw new Error(`Generation stopped before valid JSON was complete: ${stopReason}`);
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

    const contentSafety = detectNsfwCourseContent([goal, subject]);
    if (contentSafety.isBlocked) {
      return NextResponse.json(
        { error: NSFW_COURSE_ERROR },
        { status: 422 },
      );
    }

    const prohibitedContent = detectProhibitedCourseContent([goal, subject]);
    if (prohibitedContent.isBlocked) {
      return NextResponse.json(
        { error: PROHIBITED_COURSE_ERROR },
        { status: 422 },
      );
    }

    const systemPrompt = await readSystemPrompt();
    const bedrockResponse = await getBedrockClient().send(buildBedrockCommand(goal, subject, systemPrompt), {
      abortSignal: AbortSignal.timeout(120_000),
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
