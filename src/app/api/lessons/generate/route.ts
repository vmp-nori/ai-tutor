import {
  BedrockRuntimeClient,
  ConverseCommand,
  type ConverseCommandOutput,
} from "@aws-sdk/client-bedrock-runtime";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { NextRequest, NextResponse } from "next/server";
import { createClient, hasSupabaseConfig } from "@/lib/supabase/server";
import type {
  CompareSlide,
  ConceptSlide,
  CoverSlide,
  GeneratedLesson,
  LessonDiagram,
  LessonSlide,
  LessonSlideKind,
  MisconceptionsSlide,
  TeachingPlan,
  TryThisSlide,
  WorkedExampleSlide,
  WrapUpSlide,
} from "@/lib/types";

export const runtime = "nodejs";

interface LessonRequest {
  treeId?: unknown;
  nodeId?: unknown;
}

interface StoredTree {
  id: string;
  subject: string;
  goal: string;
}

interface StoredNode {
  id: string;
  tree_id: string;
  name: string;
  description: string;
  category?: string | null;
  teaching_brief?: string | null;
  teaching_plan?: unknown;
  generated_lesson?: unknown;
}

interface StoredPrerequisite {
  id: string;
  name: string;
  description: string;
}

class LessonValidationError extends Error {}

const DEFAULT_MODEL = "arn:aws:bedrock:us-east-1:393459799930:inference-profile/global.anthropic.claude-sonnet-4-6";
const DEFAULT_REGION = "us-east-1";
const MAX_ID_LENGTH = 180;
const TOOL_NAME = "submit_lesson";
const LESSON_SCHEMA_VERSION = 2;
const LESSON_STYLE_VERSION = 1;
const DEV_LESSON_CACHE_PATH = join(process.cwd(), ".pathwise-dev-cache", "lessons.json");

const PROMPT_PATHS: Record<string, string> = {
  math_and_logic: join(process.cwd(), "prompts", "math_and_logic.txt"),
  systems_and_economics: join(process.cwd(), "prompts", "systems_and_economics.txt"),
  technical_and_code: join(process.cwd(), "prompts", "technical_and_code.txt"),
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function useDevLessonCache() {
  return process.env.NODE_ENV !== "production" && process.env.PATHWISE_DISABLE_DEV_LESSON_CACHE !== "1";
}

function isAwsServiceError(error: unknown): error is Error & {
  $metadata?: { httpStatusCode?: number };
} {
  return error instanceof Error && "$metadata" in error;
}

function trimString(value: unknown, maxLength: number) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLength);
}

function lessonText(value: unknown, maxLength: number) {
  return trimString(value, maxLength)
    .replace(/\s+[—–]\s+/g, ", ")
    .replace(/[—–]/g, "-");
}

function stringArray(value: unknown, maxItems: number, maxLength: number) {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => lessonText(item, maxLength))
    .filter(Boolean)
    .slice(0, maxItems);
}

function normalizeTeachingPlan(value: unknown, node: StoredNode): TeachingPlan {
  if (!isRecord(value)) {
    const fallback = node.teaching_brief?.trim() || node.description;
    return {
      objective: node.description,
      goalContext: fallback,
      focusPoints: [node.description],
      avoid: [],
    };
  }

  return {
    objective: trimString(value.objective, 600) || node.description,
    goalContext: trimString(value.goalContext ?? value.goal_context, 800) || node.teaching_brief?.trim() || node.description,
    focusPoints: stringArray(value.focusPoints ?? value.focus_points, 6, 240),
    avoid: stringArray(value.avoid, 5, 240),
    ...(trimString(value.interactiveHint ?? value.interactive_hint, 600)
      ? { interactiveHint: trimString(value.interactiveHint ?? value.interactive_hint, 600) }
      : {}),
  };
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

function buildLessonPrompt({
  tree,
  node,
  teachingPlan,
  prerequisites,
}: {
  tree: StoredTree;
  node: StoredNode;
  teachingPlan: TeachingPlan;
  prerequisites: StoredPrerequisite[];
}) {
  const prerequisiteText = prerequisites.length > 0
    ? prerequisites.map((item) => `- ${item.name}: ${item.description}`).join("\n")
    : "- None";

  return `Subject: ${tree.subject}
Final goal: ${tree.goal}

Concept to teach:
- Name: ${node.name}
- Description: ${node.description}

Prerequisites already introduced:
${prerequisiteText}

Teaching plan:
- Objective: ${teachingPlan.objective}
- Goal context: ${teachingPlan.goalContext}
- Focus points: ${teachingPlan.focusPoints.length > 0 ? teachingPlan.focusPoints.join("; ") : node.description}
- Avoid: ${teachingPlan.avoid.length > 0 ? teachingPlan.avoid.join("; ") : "No specific detours listed."}
- Interactive hint: ${teachingPlan.interactiveHint || "Only include a diagram if the concept genuinely benefits from one."}

Submit a concise 5-8 slide lesson deck through the ${TOOL_NAME} tool. The deck must be easier to digest than a long article: one teaching move per slide, concrete examples, and diagrams only where they reduce cognitive load.

Formatting contract:
- Use KaTeX-compatible LaTeX only.
- Do not escape math delimiters. Write $x$, never \\$x\\$.
- Inline math must be one complete expression inside one pair of dollar signs, for example $z = Wx + b$. Never write $z = W$ x + b.
- Standalone equations must use $$...$$ and include the entire equation inside the delimiters.
- Put matrices and multi-line equations in standalone $$...$$ blocks. Include the leading variable, the full \\begin{...}...\\end{...} environment, and any \\text{...} annotation inside the same block.
- Never put raw LaTeX commands outside math delimiters. This includes \\quad, \\text, \\frac, \\sum, and \\cdot.
- Use \\text{...} with exactly one pair of braces. Do not write \\text{{...}}.
- Use \\cdot or \\times for mathematical multiplication. Use @ only inside fenced code blocks when showing NumPy or Python.
- Put executable code in fenced markdown code blocks with a language tag. Do not mix code comments into LaTeX equations.`;
}

const DIAGRAM_SCHEMA = {
  type: "object",
  description: "Optional slide visual. Include only when it materially clarifies the slide.",
  properties: {
    type: {
      type: "string",
      enum: [
        "function_plot",
        "number_line",
        "bar_chart",
        "line_chart",
        "step_sequence",
        "comparison_table",
        "parameterized_sim",
      ],
    },
    title: { type: "string", description: "Short visual title." },
    spec: {
      type: "object",
      description: "Renderer-specific spec. For parameterized_sim use controls, expression, xRange, yRange, resultLabel, and captionTemplate.",
    },
  },
  required: ["type", "title", "spec"],
};

const LESSON_TOOL_SCHEMA = {
  type: "object",
  properties: {
    schemaVersion: { const: LESSON_SCHEMA_VERSION },
    styleVersion: { const: LESSON_STYLE_VERSION },
    title: { type: "string", description: "Short lesson title, under 8 words." },
    slides: {
      type: "array",
      minItems: 5,
      maxItems: 8,
      description: "Ordered deck. First slide must be cover; last must be wrapUp; include exactly one workedExample.",
      items: {
        oneOf: [
          {
            type: "object",
            properties: {
              kind: { const: "cover" },
              title: { type: "string" },
              lede: { type: "string", description: "Hook sentence under 220 characters." },
              meta: {
                type: "object",
                properties: {
                  estTime: { type: "string", description: "Example: ~ 6 min" },
                  difficulty: { type: "string", description: "Example: Intermediate" },
                },
                required: ["estTime", "difficulty"],
              },
            },
            required: ["kind", "title", "lede", "meta"],
          },
          {
            type: "object",
            properties: {
              kind: { const: "concept" },
              eyebrow: { type: "string", description: "Short slide label, e.g. 02 · CORE IDEA." },
              heading: { type: "string" },
              lede: { type: "string" },
              body: { type: "string", description: "Markdown explanation, under 700 characters. Use valid KaTeX delimiters for all formulas." },
              diagram: DIAGRAM_SCHEMA,
            },
            required: ["kind", "eyebrow", "heading", "body"],
          },
          {
            type: "object",
            properties: {
              kind: { const: "compare" },
              eyebrow: { type: "string" },
              heading: { type: "string" },
              lede: { type: "string" },
              left: {
                type: "object",
                properties: {
                  label: { type: "string" },
                  body: { type: "string" },
                },
                required: ["label", "body"],
              },
              right: {
                type: "object",
                properties: {
                  label: { type: "string" },
                  body: { type: "string" },
                },
                required: ["label", "body"],
              },
              summary: { type: "string" },
            },
            required: ["kind", "eyebrow", "heading", "left", "right"],
          },
          {
            type: "object",
            properties: {
              kind: { const: "workedExample" },
              eyebrow: { type: "string" },
              heading: { type: "string" },
              problem: { type: "string" },
              solution: { type: "string", description: "Step-by-step markdown, under 900 characters. Put complete formulas inside $...$ or $$...$$ and code inside fenced code blocks." },
              diagram: DIAGRAM_SCHEMA,
            },
            required: ["kind", "eyebrow", "heading", "problem", "solution"],
          },
          {
            type: "object",
            properties: {
              kind: { const: "misconceptions" },
              eyebrow: { type: "string" },
              heading: { type: "string" },
              items: {
                type: "array",
                minItems: 2,
                maxItems: 3,
                items: {
                  type: "object",
                  properties: {
                    wrong: { type: "string" },
                    right: { type: "string" },
                  },
                  required: ["wrong", "right"],
                },
              },
            },
            required: ["kind", "eyebrow", "heading", "items"],
          },
          {
            type: "object",
            properties: {
              kind: { const: "tryThis" },
              eyebrow: { type: "string" },
              heading: { type: "string" },
              prompt: { type: "string" },
              hint: { type: "string" },
            },
            required: ["kind", "eyebrow", "heading", "prompt"],
          },
          {
            type: "object",
            properties: {
              kind: { const: "wrapUp" },
              eyebrow: { type: "string" },
              heading: { type: "string" },
              keyIdeas: {
                type: "array",
                minItems: 2,
                maxItems: 4,
                items: { type: "string" },
              },
              nextHook: { type: "string" },
            },
            required: ["kind", "eyebrow", "heading", "keyIdeas"],
          },
        ],
      },
    },
  },
  required: ["schemaVersion", "styleVersion", "title", "slides"],
};

function buildBedrockCommand(prompt: string, systemPrompt: string) {
  const modelId = process.env.BEDROCK_MODEL_ID?.trim() || DEFAULT_MODEL;

  return new ConverseCommand({
    modelId,
    system: [{ text: systemPrompt }],
    messages: [
      {
        role: "user",
        content: [{ text: prompt }],
      },
    ],
    inferenceConfig: {
      maxTokens: 10000,
      temperature: 0.45,
    },
    toolConfig: {
      tools: [
        {
          toolSpec: {
            name: TOOL_NAME,
            description: "Submit the completed Pathwise lesson as a versioned slide deck.",
            inputSchema: { json: LESSON_TOOL_SCHEMA as never },
          },
        },
      ],
      toolChoice: { tool: { name: TOOL_NAME } },
    },
  });
}

function extractToolInput(value: ConverseCommandOutput): unknown {
  const content = value.output?.message?.content ?? [];
  for (const block of content) {
    if ("toolUse" in block && block.toolUse?.name === TOOL_NAME) {
      return block.toolUse.input;
    }
  }
  return null;
}

const VALID_DIAGRAM_TYPES = new Set([
  "function_plot",
  "number_line",
  "bar_chart",
  "line_chart",
  "step_sequence",
  "comparison_table",
  "parameterized_sim",
]);

function isValidRange(value: unknown): value is [number, number] {
  return Array.isArray(value)
    && value.length === 2
    && typeof value[0] === "number"
    && typeof value[1] === "number"
    && Number.isFinite(value[0])
    && Number.isFinite(value[1])
    && value[0] < value[1];
}

function clampParameterizedSpec(spec: Record<string, unknown>) {
  const rawControls = Array.isArray(spec.controls) ? spec.controls : [];
  const controls = rawControls
    .map((item) => {
      if (!isRecord(item)) return null;
      const id = trimString(item.id, 40);
      const label = trimString(item.label, 80);
      const min = typeof item.min === "number" ? item.min : null;
      const max = typeof item.max === "number" ? item.max : null;
      const step = typeof item.step === "number" ? item.step : null;
      const defaultValue = typeof item.default === "number" ? item.default : null;
      if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(id) || !label || min === null || max === null || step === null || defaultValue === null) {
        return null;
      }
      if (!Number.isFinite(min) || !Number.isFinite(max) || !Number.isFinite(step) || !Number.isFinite(defaultValue) || min >= max || step <= 0) {
        return null;
      }
      return {
        id,
        label,
        min,
        max,
        step,
        default: Math.min(max, Math.max(min, defaultValue)),
        ...(trimString(item.unit, 20) ? { unit: trimString(item.unit, 20) } : {}),
      };
    })
    .filter((item): item is { id: string; label: string; min: number; max: number; step: number; default: number; unit?: string } => item !== null)
    .slice(0, 2);

  const expression = trimString(spec.expression, 260);
  if (controls.length === 0 || !expression) return null;

  return {
    controls,
    expression,
    ...(isValidRange(spec.xRange) ? { xRange: spec.xRange } : {}),
    ...(isValidRange(spec.yRange) ? { yRange: spec.yRange } : {}),
    ...(trimString(spec.resultLabel, 80) ? { resultLabel: trimString(spec.resultLabel, 80) } : {}),
    ...(trimString(spec.captionTemplate, 240) ? { captionTemplate: trimString(spec.captionTemplate, 240) } : {}),
  };
}

function clampComparisonTableSpec(spec: Record<string, unknown>) {
  const columns = Array.isArray(spec.columns) ? spec.columns.filter((c): c is string => typeof c === "string").map((c) => trimString(c, 60)).filter(Boolean) : [];
  const rows = Array.isArray(spec.rows)
    ? spec.rows
        .map((item) => {
          if (!isRecord(item)) return null;
          const label = trimString(item.label, 100);
          const values = Array.isArray(item.values)
            ? item.values.filter((v): v is string => typeof v === "string").map((v) => trimString(v, 160)).slice(0, columns.length)
            : [];
          return label && values.length > 0 ? { label, values } : null;
        })
        .filter((item): item is { label: string; values: string[] } => item !== null)
        .slice(0, 8)
    : [];

  if (columns.length < 2 || rows.length < 2) return null;
  return { columns, rows };
}

function clampStepSequenceSpec(spec: Record<string, unknown>) {
  const steps = Array.isArray(spec.steps)
    ? spec.steps
        .map((item) => {
          if (!isRecord(item)) return null;
          const label = trimString(item.label, 100);
          if (!label) return null;
          const description = trimString(item.description, 200);
          const highlight = typeof item.highlight === "boolean" ? item.highlight : false;
          return { label, ...(description ? { description } : {}), ...(highlight ? { highlight } : {}) };
        })
        .filter((item): item is { label: string; description?: string; highlight?: true } => item !== null)
        .slice(0, 8)
    : [];

  if (steps.length < 2) return null;
  return { steps };
}

function clampDiagram(value: unknown): LessonDiagram | undefined {
  if (!isRecord(value)) return undefined;
  const type = trimString(value.type, 40);
  if (!VALID_DIAGRAM_TYPES.has(type)) return undefined;

  let spec: Record<string, unknown>;
  if (typeof value.spec === "string") {
    try {
      const parsed: unknown = JSON.parse(value.spec);
      if (!isRecord(parsed)) return undefined;
      spec = parsed;
    } catch {
      return undefined;
    }
  } else if (isRecord(value.spec)) {
    spec = value.spec;
  } else {
    return undefined;
  }

  let clampedSpec: Record<string, unknown> | null = spec;
  if (type === "parameterized_sim") {
    clampedSpec = clampParameterizedSpec(spec);
  } else if (type === "comparison_table") {
    clampedSpec = clampComparisonTableSpec(spec);
  } else if (type === "step_sequence") {
    clampedSpec = clampStepSequenceSpec(spec);
  }
  if (!clampedSpec) return undefined;

  return {
    type: type as LessonDiagram["type"],
    title: trimString(value.title, 140) || "Diagram",
    spec: clampedSpec,
  };
}

function clampSlide(value: unknown): LessonSlide | null {
  if (!isRecord(value)) return null;
  const kind = trimString(value.kind, 32) as LessonSlideKind;

  if (kind === "cover") {
    const meta = isRecord(value.meta) ? value.meta : {};
    const slide: CoverSlide = {
      kind: "cover",
      title: lessonText(value.title, 180),
      lede: lessonText(value.lede, 320),
      meta: {
        estTime: lessonText(meta.estTime, 60) || "~ 6 min",
        difficulty: lessonText(meta.difficulty, 60) || "Intermediate",
      },
    };
    return slide.title && slide.lede ? slide : null;
  }

  if (kind === "concept") {
    const slide: ConceptSlide = {
      kind: "concept",
      eyebrow: lessonText(value.eyebrow, 80),
      heading: lessonText(value.heading, 160),
      body: lessonText(value.body, 1400),
    };
    const lede = lessonText(value.lede, 360);
    const diagram = clampDiagram(value.diagram);
    if (lede) slide.lede = lede;
    if (diagram) slide.diagram = diagram;
    return slide.heading && slide.body ? slide : null;
  }

  if (kind === "compare") {
    const left = isRecord(value.left) ? value.left : null;
    const right = isRecord(value.right) ? value.right : null;
    if (!left || !right) return null;
    const slide: CompareSlide = {
      kind: "compare",
      eyebrow: lessonText(value.eyebrow, 80),
      heading: lessonText(value.heading, 160),
      left: {
        label: lessonText(left.label, 60),
        body: lessonText(left.body, 420),
      },
      right: {
        label: lessonText(right.label, 60),
        body: lessonText(right.body, 420),
      },
    };
    const lede = lessonText(value.lede, 360);
    const summary = lessonText(value.summary, 360);
    if (lede) slide.lede = lede;
    if (summary) slide.summary = summary;
    return slide.heading && slide.left.body && slide.right.body ? slide : null;
  }

  if (kind === "workedExample") {
    const slide: WorkedExampleSlide = {
      kind: "workedExample",
      eyebrow: lessonText(value.eyebrow, 80),
      heading: lessonText(value.heading, 160),
      problem: lessonText(value.problem, 520),
      solution: lessonText(value.solution, 1800),
    };
    const diagram = clampDiagram(value.diagram);
    if (diagram) slide.diagram = diagram;
    return slide.problem && slide.solution ? slide : null;
  }

  if (kind === "misconceptions") {
    const items = Array.isArray(value.items)
      ? value.items
          .map((item) => {
            if (!isRecord(item)) return null;
            const wrong = lessonText(item.wrong, 260);
            const right = lessonText(item.right, 260);
            return wrong && right ? { wrong, right } : null;
          })
          .filter((item): item is { wrong: string; right: string } => item !== null)
          .slice(0, 3)
      : [];
    if (items.length < 2) return null;
    const slide: MisconceptionsSlide = {
      kind: "misconceptions",
      eyebrow: lessonText(value.eyebrow, 80),
      heading: lessonText(value.heading, 160) || "Common mistakes",
      items,
    };
    return slide;
  }

  if (kind === "tryThis") {
    const slide: TryThisSlide = {
      kind: "tryThis",
      eyebrow: lessonText(value.eyebrow, 80),
      heading: lessonText(value.heading, 160) || "Try this",
      prompt: lessonText(value.prompt, 420),
    };
    const hint = lessonText(value.hint, 360);
    if (hint) slide.hint = hint;
    return slide.prompt ? slide : null;
  }

  if (kind === "wrapUp") {
    const slide: WrapUpSlide = {
      kind: "wrapUp",
      eyebrow: lessonText(value.eyebrow, 80),
      heading: lessonText(value.heading, 160) || "Wrap up",
      keyIdeas: stringArray(value.keyIdeas, 4, 220),
    };
    const nextHook = lessonText(value.nextHook, 260);
    if (nextHook) slide.nextHook = nextHook;
    return slide.keyIdeas.length >= 2 ? slide : null;
  }

  return null;
}

function normalizeLesson(value: unknown, node: StoredNode): GeneratedLesson {
  if (!isRecord(value)) {
    throw new LessonValidationError("Lesson response was not an object");
  }

  if (value.schemaVersion !== LESSON_SCHEMA_VERSION) {
    throw new LessonValidationError(`Lesson response was not schemaVersion ${LESSON_SCHEMA_VERSION}`);
  }

  if (value.styleVersion !== LESSON_STYLE_VERSION) {
    throw new LessonValidationError(`Lesson response was not styleVersion ${LESSON_STYLE_VERSION}`);
  }

  const slides = Array.isArray(value.slides)
    ? value.slides.map(clampSlide).filter((slide): slide is LessonSlide => slide !== null)
    : [];

  if (slides.length < 5 || slides.length > 8) {
    throw new LessonValidationError("Lesson deck must contain 5-8 valid slides");
  }

  if (slides[0]?.kind !== "cover" || slides[slides.length - 1]?.kind !== "wrapUp") {
    throw new LessonValidationError("Lesson deck must start with cover and end with wrapUp");
  }

  if (slides.filter((slide) => slide.kind === "workedExample").length !== 1) {
    throw new LessonValidationError("Lesson deck must contain exactly one workedExample slide");
  }

  return {
    schemaVersion: LESSON_SCHEMA_VERSION,
    styleVersion: LESSON_STYLE_VERSION,
    title: lessonText(value.title, 180) || node.name,
    slides,
  };
}

function isMissingNodeMetadataError(message: string) {
  return (
    message.includes("Could not find the 'teaching_brief' column of 'skill_nodes'") ||
    message.includes("Could not find the 'teaching_plan' column of 'skill_nodes'") ||
    message.includes("Could not find the 'generated_lesson' column of 'skill_nodes'") ||
    message.includes("column skill_nodes.teaching_brief does not exist") ||
    message.includes("column skill_nodes.teaching_plan does not exist") ||
    message.includes("column skill_nodes.generated_lesson does not exist")
  );
}

function devLessonCacheKey(treeId: string, nodeId: string) {
  return `${treeId}:${nodeId}`;
}

async function readDevLessonCache() {
  if (!useDevLessonCache()) return {};

  try {
    const text = await readFile(DEV_LESSON_CACHE_PATH, "utf8");
    const parsed = JSON.parse(text) as unknown;
    return isRecord(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

async function getCachedDevLesson(treeId: string, nodeId: string, node: StoredNode) {
  const cache = await readDevLessonCache();
  const cached = cache[devLessonCacheKey(treeId, nodeId)] ?? cache[devLessonCacheKey(treeId, node.id)];
  if (!isRecord(cached)) return null;

  try {
    return normalizeLesson(cached, node);
  } catch {
    return null;
  }
}

async function writeCachedDevLesson(treeId: string, nodeId: string, lesson: GeneratedLesson) {
  if (!useDevLessonCache()) return;

  try {
    const cache = await readDevLessonCache();
    cache[devLessonCacheKey(treeId, nodeId)] = lesson;
    await mkdir(join(process.cwd(), ".pathwise-dev-cache"), { recursive: true });
    await writeFile(DEV_LESSON_CACHE_PATH, `${JSON.stringify(cache, null, 2)}\n`, "utf8");
  } catch (error) {
    console.warn("Dev lesson cache could not be written", error);
  }
}

function nodeIdCandidates(treeId: string, nodeId: string) {
  const prefix = `${treeId}_`;
  const candidates = [nodeId];

  if (nodeId.startsWith(prefix)) {
    candidates.push(nodeId.slice(prefix.length));
  } else {
    candidates.push(`${prefix}${nodeId}`);
  }

  return Array.from(new Set(candidates.filter(Boolean)));
}

function pickCandidateNode<T extends { id: string }>(nodes: T[] | null, candidates: string[]) {
  if (!nodes || nodes.length === 0) return null;
  return candidates.map((candidate) => nodes.find((node) => node.id === candidate)).find(Boolean) ?? null;
}

async function fetchStoredNode(
  supabase: Awaited<ReturnType<typeof createClient>>,
  treeId: string,
  nodeId: string,
) {
  const candidates = nodeIdCandidates(treeId, nodeId);
  const richResult = await supabase
    .from("skill_nodes")
    .select("id, tree_id, name, description, category, teaching_brief, teaching_plan, generated_lesson")
    .eq("tree_id", treeId)
    .in("id", candidates);

  if (!richResult.error) {
    return { data: pickCandidateNode(richResult.data, candidates), error: null };
  }

  if (!isMissingNodeMetadataError(richResult.error.message)) {
    return richResult;
  }

  const legacyResult = await supabase
    .from("skill_nodes")
    .select("id, tree_id, name, description, teaching_brief")
    .eq("tree_id", treeId)
    .in("id", candidates);

  if (!legacyResult.error) {
    return { data: pickCandidateNode(legacyResult.data, candidates), error: null };
  }

  if (!isMissingNodeMetadataError(legacyResult.error.message)) {
    return legacyResult;
  }

  const baseResult = await supabase
    .from("skill_nodes")
    .select("id, tree_id, name, description")
    .eq("tree_id", treeId)
    .in("id", candidates);

  if (!baseResult.error) {
    return { data: pickCandidateNode(baseResult.data, candidates), error: null };
  }

  return baseResult;
}

export async function POST(req: NextRequest) {
  try {
    if (!hasSupabaseConfig()) {
      return NextResponse.json({ error: "Supabase is not configured" }, { status: 503 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as LessonRequest;
    const treeId = trimString(body.treeId, MAX_ID_LENGTH);
    const nodeId = trimString(body.nodeId, MAX_ID_LENGTH);

    if (!treeId || !nodeId) {
      return NextResponse.json({ error: "treeId and nodeId are required" }, { status: 400 });
    }

    const { data: tree, error: treeError } = await supabase
      .from("skill_trees")
      .select("id, subject, goal")
      .eq("id", treeId)
      .eq("user_id", user.id)
      .single();

    if (treeError || !tree) {
      return NextResponse.json({ error: "Learning path was not found" }, { status: 404 });
    }

    const { data: node, error: nodeError } = await fetchStoredNode(supabase, treeId, nodeId);
    if (nodeError || !node) {
      return NextResponse.json({ error: "Concept was not found" }, { status: 404 });
    }

    const storedNode = node as StoredNode;

    if (isRecord(storedNode.generated_lesson)) {
      try {
        const cached = normalizeLesson(storedNode.generated_lesson, storedNode);
        await writeCachedDevLesson(treeId, storedNode.id, cached);
        return NextResponse.json(cached, {
          headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" },
        });
      } catch {
        // Legacy or malformed cached lessons regenerate and are overwritten below.
      }
    }

    const devCachedLesson = await getCachedDevLesson(treeId, nodeId, storedNode);
    if (devCachedLesson) {
      return NextResponse.json(devCachedLesson, {
        headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" },
      });
    }

    const { data: prerequisiteEdges } = await supabase
      .from("skill_edges")
      .select("from_node_id")
      .eq("tree_id", treeId)
      .eq("to_node_id", nodeId);

    const prerequisiteIds = (prerequisiteEdges ?? [])
      .map((edge) => edge.from_node_id)
      .filter((id): id is string => typeof id === "string");

    const { data: prerequisites } = prerequisiteIds.length > 0
      ? await supabase
          .from("skill_nodes")
          .select("id, name, description")
          .in("id", prerequisiteIds)
      : { data: [] };

    const category = typeof storedNode.category === "string" ? storedNode.category : "technical_and_code";
    const promptPath = PROMPT_PATHS[category] ?? PROMPT_PATHS.technical_and_code;
    const systemPrompt = (await readFile(promptPath, "utf8")).trim();
    const teachingPlan = normalizeTeachingPlan(storedNode.teaching_plan, storedNode);
    const bedrockResponse = await getBedrockClient().send(
      buildBedrockCommand(buildLessonPrompt({
        tree: tree as StoredTree,
        node: storedNode,
        teachingPlan,
        prerequisites: (prerequisites ?? []) as StoredPrerequisite[],
      }), systemPrompt),
      { abortSignal: AbortSignal.timeout(120_000) },
    );

    const toolInput = extractToolInput(bedrockResponse);
    if (!isRecord(toolInput)) {
      console.error("Bedrock did not return a submit_lesson tool call", bedrockResponse.output?.message?.content);
      return NextResponse.json({ error: "Lesson response could not be parsed" }, { status: 502 });
    }

    let lesson: GeneratedLesson;
    try {
      lesson = normalizeLesson(toolInput, storedNode);
    } catch (error) {
      console.error("Bedrock lesson tool input failed validation", error, toolInput);
      return NextResponse.json({ error: "Lesson response did not match the slide schema" }, { status: 502 });
    }

    const cacheWrite = await supabase
      .from("skill_nodes")
      .update({ generated_lesson: lesson })
      .eq("tree_id", treeId)
      .eq("id", storedNode.id);
    if (cacheWrite.error) {
      console.error("Generated lesson could not be cached", cacheWrite.error);
    }

    await writeCachedDevLesson(treeId, storedNode.id, lesson);

    return NextResponse.json(lesson, {
      headers: {
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
        "X-Lesson-Cache": cacheWrite.error ? "write-failed" : "stored",
      },
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "TimeoutError") {
      return NextResponse.json({ error: "Request timed out" }, { status: 504 });
    }

    if (isAwsServiceError(error)) {
      console.error("Bedrock lesson generation failed", error);
      const status = error.$metadata?.httpStatusCode;
      return NextResponse.json(
        { error: error.message || "Lesson generation service rejected the request" },
        { status: status && status >= 400 && status < 500 ? 502 : 503 },
      );
    }

    console.error("Lesson generation failed", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
