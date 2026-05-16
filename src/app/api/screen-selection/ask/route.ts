import {
  BedrockRuntimeClient,
  ConverseStreamCommand,
  type ConverseStreamResponse,
} from "@aws-sdk/client-bedrock-runtime";
import { NextRequest, NextResponse } from "next/server";
import { createClient, hasSupabaseConfig } from "@/lib/supabase/server";

export const runtime = "nodejs";

interface AskSelectionRequest {
  contextKind?: unknown;
  prompt?: unknown;
  selectedContext?: unknown;
  selectedText?: unknown;
  rect?: unknown;
}

const HAIKU_45_BASE_MODEL = "anthropic.claude-haiku-4-5-20251001-v1:0";
const HAIKU_45_INFERENCE_PROFILE = `global.${HAIKU_45_BASE_MODEL}`;
const DEFAULT_CHAT_MODEL = HAIKU_45_INFERENCE_PROFILE;
const DEFAULT_REGION = "us-east-1";
const MAX_PROMPT_LENGTH = 1200;
const MAX_SELECTION_LENGTH = 6000;
const MAX_CONTEXT_LENGTH = 12000;

function isAwsServiceError(error: unknown): error is Error & {
  $metadata?: { httpStatusCode?: number };
} {
  return error instanceof Error && "$metadata" in error;
}

function trimString(value: unknown, maxLength: number) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLength);
}

function parseContextKind(value: unknown) {
  return value === "lesson" ? "lesson" : "selection";
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

function serializeSelectionContext(value: unknown) {
  if (!value || typeof value !== "object") return "";

  try {
    return JSON.stringify(value, null, 2).slice(0, MAX_CONTEXT_LENGTH);
  } catch {
    return "";
  }
}

function resolveChatModelId() {
  const configuredModel = process.env.BEDROCK_SELECTION_CHAT_MODEL_ID?.trim();

  if (!configuredModel || configuredModel === HAIKU_45_BASE_MODEL) {
    return DEFAULT_CHAT_MODEL;
  }

  return configuredModel;
}

function buildUserPrompt(prompt: string, selectedText: string, selectedContext: string, contextKind: "lesson" | "selection") {
  if (contextKind === "lesson") {
    return `The learner is asking about the current Pathwise lesson page.

Readable lesson text:

${selectedText || "[No plain text was extracted, but structured lesson context may still be available below.]"}

Structured lesson context:

${selectedContext || "[No structured lesson context was captured.]"}

Question:
${prompt}`;
  }

  return `The learner selected a region of a Pathwise lesson.

Selected text from the highlighted region:

${selectedText || "[No readable text was captured from the selected area.]"}

Structured context from lesson-rendered elements intersecting the highlighted region:

${selectedContext || "[No structured element context was captured.]"}

Question:
${prompt}`;
}

function buildBedrockCommand(prompt: string, selectedText: string, selectedContext: string, contextKind: "lesson" | "selection") {
  const modelId = resolveChatModelId();

  return new ConverseStreamCommand({
    modelId,
    system: [
      {
        text: [
          "You are Pathwise's contextual tutor.",
          "Answer using the provided lesson or selected on-screen context first.",
          "Be concise, concrete, and educational.",
          "If the provided context is not enough, say what is missing and answer from general principles only when useful.",
          "Do not create a new learning path yet. This feature will be wired later.",
        ].join(" "),
      },
    ],
    messages: [
      {
        role: "user",
        content: [{ text: buildUserPrompt(prompt, selectedText, selectedContext, contextKind) }],
      },
    ],
    inferenceConfig: {
      maxTokens: 1600,
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

    const body = (await req.json()) as AskSelectionRequest;
    const prompt = trimString(body.prompt, MAX_PROMPT_LENGTH);
    const selectedText = trimString(body.selectedText, MAX_SELECTION_LENGTH);
    const selectedContext = serializeSelectionContext(body.selectedContext);
    const contextKind = parseContextKind(body.contextKind);

    if (!prompt) {
      return NextResponse.json(
        { error: "prompt is required" },
        { status: 400 },
      );
    }

    const bedrockResponse = await getBedrockClient().send(buildBedrockCommand(prompt, selectedText, selectedContext, contextKind), {
      abortSignal: AbortSignal.timeout(90_000),
    });

    if (!bedrockResponse.stream) {
      return NextResponse.json(
        { error: "Bedrock answer stream did not start" },
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
      console.error("Bedrock screen selection answer failed", error);
      const status = error.$metadata?.httpStatusCode;
      return NextResponse.json(
        { error: error.message || "Answer service rejected the request" },
        { status: status && status >= 400 && status < 500 ? 502 : 503 },
      );
    }

    console.error("Screen selection answer failed", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
