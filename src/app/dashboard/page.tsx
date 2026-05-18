import type { SkillNode, SkillEdge, TeachingPlan } from "@/lib/types";
import { SkillTreeLoader } from "@/components/skill-tree/SkillTreeLoader";
import { createClient, hasSupabaseConfig } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

const TREE_ID = "machine-learning-engineering-llm-mastery";
const LLM_THEORY_TREE_ID = "llm-theory-bare-graph";
const LLM_THEORY_BRANCH_TREE_ID = "llm-theory-branchy-example";
const LLM_THEORY_PATH = {
  id: LLM_THEORY_TREE_ID,
  subject: "LLM Theory",
  href: `/dashboard?treeId=${LLM_THEORY_TREE_ID}`,
  deletable: false,
};
const LLM_THEORY_BRANCH_PATH = {
  id: LLM_THEORY_BRANCH_TREE_ID,
  subject: "LLM Theory Branches",
  href: `/dashboard?treeId=${LLM_THEORY_BRANCH_TREE_ID}`,
  deletable: false,
};
const X_START = 96;
const X_GAP = 304;
const Y_BASE = 320;
const NODE_W = 232;
const NODE_H = 78;
const BRANCH_VERTICAL_GAP = NODE_H + 24;
const BRANCH_LANE_GAP = NODE_H + 32;
const BRANCH_PADDING_X = 36;
const MIN_BRANCH_Y = 32;

interface BranchLane {
  side: "below" | "above";
  lane: number;
  y: number;
  ranges: Array<{ left: number; right: number }>;
}

interface BranchPlacement {
  startX: number;
  direction: 1 | -1;
  y: number;
}

const LLM_THEORY_NODES: SkillNode[] = [
  {
    id: "llm_tokens_context",
    treeId: "input-json",
    name: "Tokens and Context",
    description: "LLMs turn text into token IDs, embed those IDs as vectors, and use the surrounding context as the information available for prediction.",
    category: "technical_and_code",
    status: "current",
    x: X_START,
    y: Y_BASE,
    prereqs: [],
    difficultyLevel: 2,
    isCheckpoint: false,
    zone: "Representation",
    zoneColor: "#3B82F6",
  },
  {
    id: "llm_forward_pass",
    treeId: "input-json",
    name: "Transformer Forward Pass",
    description: "Attention and feed-forward layers mix contextual information and produce logits: raw scores for the next token.",
    category: "technical_and_code",
    status: "available",
    x: X_START + X_GAP,
    y: Y_BASE,
    prereqs: ["llm_tokens_context"],
    difficultyLevel: 4,
    isCheckpoint: false,
    zone: "Architecture",
    zoneColor: "#10B981",
  },
  {
    id: "llm_loss_functions",
    treeId: "input-json",
    name: "Loss Functions",
    description: "Cross-entropy compares predicted token probabilities with the real next token, turning prediction quality into a single training signal.",
    category: "math_and_logic",
    status: "available",
    x: X_START + X_GAP * 2,
    y: Y_BASE,
    prereqs: ["llm_forward_pass"],
    difficultyLevel: 5,
    isCheckpoint: true,
    zone: "Training Signal",
    zoneColor: "#8B5CF6",
  },
  {
    id: "llm_backpropagation",
    treeId: "input-json",
    name: "Backpropagation",
    description: "Backpropagation applies the chain rule through the transformer to compute how each parameter contributed to the loss.",
    category: "math_and_logic",
    status: "available",
    x: X_START + X_GAP * 3,
    y: Y_BASE,
    prereqs: ["llm_loss_functions"],
    difficultyLevel: 6,
    isCheckpoint: false,
    zone: "Credit Assignment",
    zoneColor: "#F59E0B",
  },
  {
    id: "llm_gradient_descent",
    treeId: "input-json",
    name: "Gradient Descent Updates",
    description: "Optimizers use gradients to adjust model weights, gradually making the next-token predictions less wrong over many batches.",
    category: "math_and_logic",
    status: "available",
    x: X_START + X_GAP * 4,
    y: Y_BASE,
    prereqs: ["llm_backpropagation"],
    difficultyLevel: 6,
    isCheckpoint: true,
    zone: "Optimization",
    zoneColor: "#EC4899",
  },
];

const LLM_THEORY_EDGES: SkillEdge[] = LLM_THEORY_NODES.flatMap((node) =>
  node.prereqs.map((fromNodeId) => ({
    id: `edge_${fromNodeId}_${node.id}`,
    treeId: "input-json",
    fromNodeId,
    toNodeId: node.id,
  })),
);

const LLM_THEORY_BRANCH_NODES: SkillNode[] = [
  ...LLM_THEORY_NODES,
  {
    id: "llm_subword_tokenization",
    treeId: "input-json",
    name: "Subword Tokenization",
    description: "BPE-style tokenizers split text into reusable chunks, which shapes what the model can represent cheaply or awkwardly.",
    category: "technical_and_code",
    status: "available",
    x: X_START + 42,
    y: Y_BASE + 146,
    prereqs: ["llm_tokens_context"],
    difficultyLevel: 3,
    isCheckpoint: false,
    zone: "Token Branches",
    zoneColor: "#3B82F6",
    isBranch: true,
    branchAnchorNodeId: "llm_tokens_context",
    branchGroupId: "tokens-practical",
    branchLabel: "Input mechanics",
  },
  {
    id: "llm_vocab_tradeoffs",
    treeId: "input-json",
    name: "Vocabulary Tradeoffs",
    description: "Vocabulary size changes sequence length, rare-word handling, multilingual coverage, and the cost of the output layer.",
    category: "technical_and_code",
    status: "available",
    x: X_START + 344,
    y: Y_BASE + 210,
    prereqs: ["llm_subword_tokenization"],
    difficultyLevel: 4,
    isCheckpoint: false,
    zone: "Token Branches",
    zoneColor: "#3B82F6",
    isBranch: true,
    branchAnchorNodeId: "llm_subword_tokenization",
    branchGroupId: "tokens-practical",
    branchLabel: "Tokenizer consequences",
  },
  {
    id: "llm_position_encodings",
    treeId: "input-json",
    name: "Position Encodings",
    description: "Position information lets the transformer distinguish the same token appearing in different places in the context.",
    category: "math_and_logic",
    status: "available",
    x: X_START + 298,
    y: Y_BASE - 164,
    prereqs: ["llm_tokens_context"],
    difficultyLevel: 4,
    isCheckpoint: false,
    zone: "Representation",
    zoneColor: "#3B82F6",
    isBranch: true,
    branchAnchorNodeId: "llm_tokens_context",
    branchGroupId: "position-sidequest",
    branchLabel: "Sequence order",
  },
  {
    id: "llm_attention_scores",
    treeId: "input-json",
    name: "Attention Scores",
    description: "Queries and keys produce relevance scores, deciding which earlier tokens each position should read from.",
    category: "math_and_logic",
    status: "available",
    x: X_START + X_GAP + 70,
    y: Y_BASE - 152,
    prereqs: ["llm_forward_pass"],
    difficultyLevel: 5,
    isCheckpoint: false,
    zone: "Attention",
    zoneColor: "#10B981",
    isBranch: true,
    branchAnchorNodeId: "llm_forward_pass",
    branchGroupId: "attention-useful",
    branchLabel: "Attention internals",
  },
  {
    id: "llm_multi_head_attention",
    treeId: "input-json",
    name: "Multi-Head Attention",
    description: "Multiple attention heads let the model track several relationships at once instead of betting on one similarity pattern.",
    category: "technical_and_code",
    status: "available",
    x: X_START + X_GAP * 2 - 24,
    y: Y_BASE - 244,
    prereqs: ["llm_attention_scores"],
    difficultyLevel: 6,
    isCheckpoint: false,
    zone: "Attention",
    zoneColor: "#10B981",
    isBranch: true,
    branchAnchorNodeId: "llm_attention_scores",
    branchGroupId: "attention-useful",
    branchLabel: "Attention internals",
  },
  {
    id: "llm_kv_cache",
    treeId: "input-json",
    name: "KV Cache",
    description: "During generation, cached keys and values avoid recomputing the whole prefix for every new token.",
    category: "technical_and_code",
    status: "available",
    x: X_START + X_GAP * 2 + 206,
    y: Y_BASE - 156,
    prereqs: ["llm_multi_head_attention"],
    difficultyLevel: 5,
    isCheckpoint: false,
    zone: "Inference",
    zoneColor: "#10B981",
    isBranch: true,
    branchAnchorNodeId: "llm_multi_head_attention",
    branchGroupId: "attention-useful",
    branchLabel: "Generation cost",
  },
  {
    id: "llm_softmax_probabilities",
    treeId: "input-json",
    name: "Softmax Probabilities",
    description: "Softmax turns logits into a probability distribution, making one correct next-token label comparable to all alternatives.",
    category: "math_and_logic",
    status: "available",
    x: X_START + X_GAP * 2 + 48,
    y: Y_BASE + 150,
    prereqs: ["llm_loss_functions"],
    difficultyLevel: 4,
    isCheckpoint: false,
    zone: "Loss Branches",
    zoneColor: "#8B5CF6",
    isBranch: true,
    branchAnchorNodeId: "llm_loss_functions",
    branchGroupId: "loss-practical",
    branchLabel: "Probability layer",
  },
  {
    id: "llm_perplexity",
    treeId: "input-json",
    name: "Perplexity",
    description: "Perplexity repackages average cross-entropy as an intuitive measure of how uncertain the model is on held-out text.",
    category: "math_and_logic",
    status: "available",
    x: X_START + X_GAP * 3 - 42,
    y: Y_BASE + 238,
    prereqs: ["llm_softmax_probabilities"],
    difficultyLevel: 5,
    isCheckpoint: false,
    zone: "Evaluation",
    zoneColor: "#8B5CF6",
    isBranch: true,
    branchAnchorNodeId: "llm_softmax_probabilities",
    branchGroupId: "loss-practical",
    branchLabel: "Loss reading",
  },
  {
    id: "llm_batching",
    treeId: "input-json",
    name: "Batching and Masking",
    description: "Training batches pack many sequences together while masks prevent padding or future tokens from contaminating the loss.",
    category: "technical_and_code",
    status: "available",
    x: X_START + X_GAP * 2 - 214,
    y: Y_BASE + 248,
    prereqs: ["llm_loss_functions"],
    difficultyLevel: 4,
    isCheckpoint: false,
    zone: "Training Data",
    zoneColor: "#8B5CF6",
    isBranch: true,
    branchAnchorNodeId: "llm_loss_functions",
    branchGroupId: "batch-sidequest",
    branchLabel: "Batch details",
  },
  {
    id: "llm_chain_rule",
    treeId: "input-json",
    name: "Chain Rule Paths",
    description: "Every layer receives gradients by multiplying local derivatives along the paths that connect outputs back to parameters.",
    category: "math_and_logic",
    status: "available",
    x: X_START + X_GAP * 3 + 66,
    y: Y_BASE - 160,
    prereqs: ["llm_backpropagation"],
    difficultyLevel: 6,
    isCheckpoint: false,
    zone: "Backprop Branches",
    zoneColor: "#F59E0B",
    isBranch: true,
    branchAnchorNodeId: "llm_backpropagation",
    branchGroupId: "backprop-useful",
    branchLabel: "Gradient routing",
  },
  {
    id: "llm_gradient_checkpoints",
    treeId: "input-json",
    name: "Activation Checkpointing",
    description: "Checkpointing trades extra recomputation for lower memory, which matters when backpropagating through deep transformers.",
    category: "technical_and_code",
    status: "available",
    x: X_START + X_GAP * 4 - 30,
    y: Y_BASE - 252,
    prereqs: ["llm_chain_rule"],
    difficultyLevel: 6,
    isCheckpoint: false,
    zone: "Training Memory",
    zoneColor: "#F59E0B",
    isBranch: true,
    branchAnchorNodeId: "llm_chain_rule",
    branchGroupId: "backprop-useful",
    branchLabel: "Memory tricks",
  },
  {
    id: "llm_vanishing_exploding",
    treeId: "input-json",
    name: "Gradient Stability",
    description: "Normalization, residual connections, and clipping keep gradients from shrinking away or exploding during long training runs.",
    category: "math_and_logic",
    status: "available",
    x: X_START + X_GAP * 3 + 238,
    y: Y_BASE + 150,
    prereqs: ["llm_backpropagation"],
    difficultyLevel: 6,
    isCheckpoint: false,
    zone: "Training Stability",
    zoneColor: "#F59E0B",
    isBranch: true,
    branchAnchorNodeId: "llm_backpropagation",
    branchGroupId: "stability-sidequest",
    branchLabel: "Gradient health",
  },
  {
    id: "llm_adamw",
    treeId: "input-json",
    name: "AdamW Optimizer",
    description: "AdamW tracks moving averages of gradients and separates weight decay, making large-scale transformer training more stable.",
    category: "math_and_logic",
    status: "available",
    x: X_START + X_GAP * 4 + 48,
    y: Y_BASE + 154,
    prereqs: ["llm_gradient_descent"],
    difficultyLevel: 6,
    isCheckpoint: false,
    zone: "Optimization",
    zoneColor: "#EC4899",
    isBranch: true,
    branchAnchorNodeId: "llm_gradient_descent",
    branchGroupId: "optimizer-useful",
    branchLabel: "Optimizer choices",
  },
  {
    id: "llm_lr_schedule",
    treeId: "input-json",
    name: "Learning Rate Schedules",
    description: "Warmup and decay control how aggressively weights move early, mid, and late in training.",
    category: "math_and_logic",
    status: "available",
    x: X_START + X_GAP * 5 - 24,
    y: Y_BASE + 238,
    prereqs: ["llm_adamw"],
    difficultyLevel: 5,
    isCheckpoint: false,
    zone: "Optimization",
    zoneColor: "#EC4899",
    isBranch: true,
    branchAnchorNodeId: "llm_adamw",
    branchGroupId: "optimizer-useful",
    branchLabel: "Training knobs",
  },
  {
    id: "llm_data_quality",
    treeId: "input-json",
    name: "Data Quality Effects",
    description: "The loss only teaches from the data it sees, so filtering, deduplication, and mixtures strongly affect final model behavior.",
    category: "systems_and_economics",
    status: "available",
    x: X_START + X_GAP * 4 + 230,
    y: Y_BASE - 138,
    prereqs: ["llm_gradient_descent"],
    difficultyLevel: 5,
    isCheckpoint: false,
    zone: "Training Data",
    zoneColor: "#EC4899",
    isBranch: true,
    branchAnchorNodeId: "llm_gradient_descent",
    branchGroupId: "data-sidequest",
    branchLabel: "What gets learned",
  },
];

const LLM_THEORY_BRANCH_EDGES: SkillEdge[] = LLM_THEORY_BRANCH_NODES.flatMap((node) =>
  node.prereqs.map((fromNodeId) => ({
    id: `edge_${fromNodeId}_${node.id}`,
    treeId: "input-json",
    fromNodeId,
    toNodeId: node.id,
  })),
);

const DEFAULT_GRAPH = {
  subject: "Machine Learning Engineering and LLM Mastery",
  goal: "From foundational mathematics to professional machine learning deployment and large language model architecture design.",
  nodes: [
    {
      id: "python_core",
      name: "Python for ML Engineering",
      description: "Mastering Python syntax, data structures, and the scientific library ecosystem essential for machine learning tasks.",
      difficulty_level: 2,
      is_checkpoint: false,
      zone: "Foundations",
      zone_color: "#3B82F6",
      prerequisite_ids: [],
      coordinates: { x: 0, y: 0, z: 0 },
    },
    {
      id: "numpy_linear_algebra",
      name: "NumPy and Linear Algebra",
      description: "Learning matrix multiplication, tensor operations, and vectorization techniques using the NumPy library.",
      difficulty_level: 3,
      is_checkpoint: false,
      zone: "Foundations",
      zone_color: "#3B82F6",
      prerequisite_ids: ["python_core"],
      coordinates: { x: 20, y: 0, z: 0 },
    },
    {
      id: "calculus_gradients",
      name: "Multivariate Calculus and Gradients",
      description: "Understanding partial derivatives and how they compute the direction of steepest descent for optimization.",
      difficulty_level: 4,
      is_checkpoint: true,
      zone: "Foundations",
      zone_color: "#3B82F6",
      prerequisite_ids: ["numpy_linear_algebra"],
      coordinates: { x: 40, y: 0, z: 0 },
    },
    {
      id: "linear_regression",
      name: "Linear Regression Analysis",
      description: "Constructing and solving the simplest predictive model to understand error minimization and parameter fitting.",
      difficulty_level: 3,
      is_checkpoint: false,
      zone: "Classical ML",
      zone_color: "#10B981",
      prerequisite_ids: ["calculus_gradients"],
      coordinates: { x: 60, y: 0, z: 0 },
    },
    {
      id: "logistic_regression",
      name: "Logistic Classification",
      description: "Adapting regression for discrete classification tasks using the sigmoid function and cross-entropy loss.",
      difficulty_level: 4,
      is_checkpoint: false,
      zone: "Classical ML",
      zone_color: "#10B981",
      prerequisite_ids: ["linear_regression"],
      coordinates: { x: 80, y: 0, z: 0 },
    },
    {
      id: "validation_regularization",
      name: "Regularization and Validation",
      description: "Techniques like L1/L2 penalties and cross-validation to prevent overfitting and improve model generalization.",
      difficulty_level: 4,
      is_checkpoint: true,
      zone: "Classical ML",
      zone_color: "#10B981",
      prerequisite_ids: ["logistic_regression"],
      coordinates: { x: 100, y: 0, z: 0 },
    },
    {
      id: "artificial_neural_networks",
      name: "Artificial Neural Networks",
      description: "Building layered networks of neurons that use non-linear activation functions to map complex inputs to outputs.",
      difficulty_level: 5,
      is_checkpoint: false,
      zone: "Deep Learning",
      zone_color: "#8B5CF6",
      prerequisite_ids: ["validation_regularization"],
      coordinates: { x: 120, y: 0, z: 0 },
    },
    {
      id: "backpropagation_alg",
      name: "The Backpropagation Algorithm",
      description: "Understanding the chain rule implementation that allows neural networks to update weights based on error.",
      difficulty_level: 6,
      is_checkpoint: false,
      zone: "Deep Learning",
      zone_color: "#8B5CF6",
      prerequisite_ids: ["artificial_neural_networks"],
      coordinates: { x: 140, y: 0, z: 0 },
    },
    {
      id: "dl_frameworks",
      name: "Deep Learning Frameworks",
      description: "Implementing neural architectures using professional-grade libraries like PyTorch or TensorFlow.",
      difficulty_level: 5,
      is_checkpoint: true,
      zone: "Deep Learning",
      zone_color: "#8B5CF6",
      prerequisite_ids: ["backpropagation_alg"],
      coordinates: { x: 160, y: 0, z: 0 },
    },
    {
      id: "word_embeddings",
      name: "Word Embeddings",
      description: "Mapping words to continuous vector spaces where geometric distance represents semantic similarity.",
      difficulty_level: 6,
      is_checkpoint: false,
      zone: "Transformers & NLP",
      zone_color: "#93C5FD",
      prerequisite_ids: ["dl_frameworks"],
      coordinates: { x: 180, y: 0, z: 0 },
    },
    {
      id: "self_attention",
      name: "The Self-Attention Mechanism",
      description: "Deep dive into how models weight the importance of different words in a sequence simultaneously.",
      difficulty_level: 8,
      is_checkpoint: false,
      zone: "Transformers & NLP",
      zone_color: "#93C5FD",
      prerequisite_ids: ["word_embeddings"],
      coordinates: { x: 200, y: 0, z: 0 },
    },
    {
      id: "transformer_architecture",
      name: "The Transformer Architecture",
      description: "Studying the complete encoder-decoder structure that serves as the foundation for all modern LLMs.",
      difficulty_level: 8,
      is_checkpoint: true,
      zone: "Transformers & NLP",
      zone_color: "#93C5FD",
      prerequisite_ids: ["self_attention"],
      coordinates: { x: 220, y: 0, z: 0 },
    },
    {
      id: "next_token_prediction",
      name: "Pre-training: Next Token Prediction",
      description: "Learning how LLMs are trained on massive datasets to predict the statistically most likely subsequent token.",
      difficulty_level: 7,
      is_checkpoint: false,
      zone: "LLM Theory",
      zone_color: "#EC4899",
      prerequisite_ids: ["transformer_architecture"],
      coordinates: { x: 240, y: 0, z: 0 },
    },
    {
      id: "instruction_tuning",
      name: "Instruction Fine-Tuning",
      description: "Adapting a base LLM to follow specific human instructions using smaller, high-quality supervised datasets.",
      difficulty_level: 8,
      is_checkpoint: false,
      zone: "LLM Theory",
      zone_color: "#EC4899",
      prerequisite_ids: ["next_token_prediction"],
      coordinates: { x: 260, y: 0, z: 0 },
    },
    {
      id: "rlhf_alignment",
      name: "Alignment via RLHF",
      description: "Refining LLM outputs using Reinforcement Learning from Human Feedback to ensure safety and helpfulness.",
      difficulty_level: 9,
      is_checkpoint: true,
      zone: "LLM Theory",
      zone_color: "#EC4899",
      prerequisite_ids: ["instruction_tuning"],
      coordinates: { x: 280, y: 0, z: 0 },
    },
    {
      id: "containerization",
      name: "ML Containerization with Docker",
      description: "Packaging machine learning environments and models into isolated containers for consistent deployment.",
      difficulty_level: 6,
      is_checkpoint: false,
      zone: "ML Engineering",
      zone_color: "#EF4444",
      prerequisite_ids: ["rlhf_alignment"],
      coordinates: { x: 300, y: 0, z: 0 },
    },
    {
      id: "inference_optimization",
      name: "Inference Optimization",
      description: "Applying quantization and pruning to reduce LLM memory footprint and increase generation speed.",
      difficulty_level: 8,
      is_checkpoint: false,
      zone: "ML Engineering",
      zone_color: "#EF4444",
      prerequisite_ids: ["containerization"],
      coordinates: { x: 320, y: 0, z: 0 },
    },
    {
      id: "api_deployment",
      name: "Production API Deployment",
      description: "Creating high-performance endpoints for model inference using FastAPI or industrial serving frameworks.",
      difficulty_level: 7,
      is_checkpoint: false,
      zone: "ML Engineering",
      zone_color: "#EF4444",
      prerequisite_ids: ["inference_optimization"],
      coordinates: { x: 340, y: 0, z: 0 },
    },
    {
      id: "mlops_cicd",
      name: "MLOps and CI/CD Pipelines",
      description: "Automating the training, testing, and deployment cycle for machine learning systems in production.",
      difficulty_level: 9,
      is_checkpoint: true,
      zone: "ML Engineering",
      zone_color: "#EF4444",
      prerequisite_ids: ["api_deployment"],
      coordinates: { x: 360, y: 0, z: 0 },
    },
  ],
};

const coordinateColumns = Array.from(
  new Set(DEFAULT_GRAPH.nodes.map((node) => node.coordinates.x)),
).sort((a, b) => a - b);

const xByCoordinate = new Map(
  coordinateColumns.map((coordinate, index) => [coordinate, X_START + index * X_GAP]),
);

const COURSE_NODES: SkillNode[] = DEFAULT_GRAPH.nodes.map((node, index) => ({
  id: node.id,
  treeId: "input-json",
  name: node.name,
  description: node.description,
  status: index === 0 ? "current" : "available",
  x: xByCoordinate.get(node.coordinates.x) ?? X_START + index * X_GAP,
  y: Y_BASE - node.coordinates.y * 8,
  prereqs: node.prerequisite_ids,
  difficultyLevel: node.difficulty_level,
  isCheckpoint: node.is_checkpoint,
  zone: node.zone,
  zoneColor: node.zone_color,
}));

const terminalNodeIds = COURSE_NODES.filter((node) => {
  return !COURSE_NODES.some((candidate) => candidate.prereqs.includes(node.id));
}).map((node) => node.id);

const GOAL_NODE: SkillNode = {
  id: "goal",
  treeId: "input-json",
  name: DEFAULT_GRAPH.subject,
  description: DEFAULT_GRAPH.goal,
  status: "available",
  x: Math.max(...COURSE_NODES.map((node) => node.x)) + X_GAP,
  y: Y_BASE,
  prereqs: terminalNodeIds,
  difficultyLevel: Math.max(...COURSE_NODES.map((node) => node.difficultyLevel ?? 1)),
  isCheckpoint: true,
  zone: "End goal",
  zoneColor: "#3B82F6",
};

const NODES: SkillNode[] = [...COURSE_NODES, GOAL_NODE];

const EDGES: SkillEdge[] = [
  ...COURSE_NODES.flatMap((node) =>
    node.prereqs.map((fromNodeId) => ({
      id: `edge_${fromNodeId}_${node.id}`,
      treeId: "input-json",
      fromNodeId,
      toNodeId: node.id,
    })),
  ),
  ...terminalNodeIds.map((fromNodeId) => ({
    id: `edge_${fromNodeId}_goal`,
    treeId: "input-json",
    fromNodeId,
    toNodeId: "goal",
  })),
];

interface DashboardPageProps {
  searchParams?: Promise<{ treeId?: string }>;
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
  category?: "math_and_logic" | "systems_and_economics" | "technical_and_code" | null;
  teaching_brief?: string | null;
  teaching_plan?: unknown;
  position_x: number;
  position_y: number;
  difficulty_level?: number | null;
  is_checkpoint?: boolean | null;
  zone?: string | null;
  zone_color?: string | null;
  position_z?: number | null;
  is_branch?: boolean | null;
  branch_anchor_node_id?: string | null;
  branch_group_id?: string | null;
  branch_label?: string | null;
}

interface StoredEdge {
  tree_id: string;
  from_node_id: string;
  to_node_id: string;
}

interface StoredProgress {
  node_id: string;
  status: SkillNode["status"];
}

function isMissingSkillNodesMetadataError(message: string) {
  return (
    message.includes("Could not find the 'difficulty_level' column of 'skill_nodes'") ||
    message.includes("Could not find the 'is_checkpoint' column of 'skill_nodes'") ||
    message.includes("Could not find the 'zone' column of 'skill_nodes'") ||
    message.includes("Could not find the 'zone_color' column of 'skill_nodes'") ||
    message.includes("Could not find the 'teaching_brief' column of 'skill_nodes'") ||
    message.includes("Could not find the 'teaching_plan' column of 'skill_nodes'") ||
    message.includes("Could not find the 'category' column of 'skill_nodes'") ||
    message.includes("Could not find the 'is_branch' column of 'skill_nodes'") ||
    message.includes("Could not find the 'branch_anchor_node_id' column of 'skill_nodes'") ||
    message.includes("Could not find the 'branch_group_id' column of 'skill_nodes'") ||
    message.includes("Could not find the 'branch_label' column of 'skill_nodes'") ||
    message.includes("column skill_nodes.difficulty_level does not exist") ||
    message.includes("column skill_nodes.is_checkpoint does not exist") ||
    message.includes("column skill_nodes.zone does not exist") ||
    message.includes("column skill_nodes.zone_color does not exist") ||
    message.includes("column skill_nodes.teaching_brief does not exist") ||
    message.includes("column skill_nodes.teaching_plan does not exist") ||
    message.includes("column skill_nodes.category does not exist") ||
    message.includes("column skill_nodes.is_branch does not exist") ||
    message.includes("column skill_nodes.branch_anchor_node_id does not exist") ||
    message.includes("column skill_nodes.branch_group_id does not exist") ||
    message.includes("column skill_nodes.branch_label does not exist")
  );
}

function isMissingTeachingPlanError(message: string) {
  return (
    message.includes("Could not find the 'teaching_plan' column of 'skill_nodes'") ||
    message.includes("column skill_nodes.teaching_plan does not exist")
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringValue(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : "";
}

function stringArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    : [];
}

function teachingPlan(value: unknown): TeachingPlan | undefined {
  if (!isRecord(value)) return undefined;

  const objective = stringValue(value.objective);
  const goalContext = stringValue(value.goalContext ?? value.goal_context);
  const focusPoints = stringArray(value.focusPoints ?? value.focus_points);
  const avoid = stringArray(value.avoid);
  const interactiveHint = stringValue(value.interactiveHint ?? value.interactive_hint);

  if (!objective && !goalContext && focusPoints.length === 0 && avoid.length === 0 && !interactiveHint) {
    return undefined;
  }

  return {
    objective,
    goalContext,
    focusPoints,
    avoid,
    ...(interactiveHint ? { interactiveHint } : {}),
  };
}

async function fetchStoredNodes(
  supabase: Awaited<ReturnType<typeof createClient>>,
  treeId: string,
) {
  const richResult = await supabase
    .from("skill_nodes")
    .select("id, tree_id, name, description, category, teaching_brief, teaching_plan, position_x, position_y, position_z, difficulty_level, is_checkpoint, zone, zone_color, is_branch, branch_anchor_node_id, branch_group_id, branch_label")
    .eq("tree_id", treeId)
    .order("position_x", { ascending: true });

  if (!richResult.error || !isMissingSkillNodesMetadataError(richResult.error.message)) {
    return richResult;
  }

  if (isMissingTeachingPlanError(richResult.error.message)) {
    const legacyTeachingResult = await supabase
      .from("skill_nodes")
      .select("id, tree_id, name, description, category, teaching_brief, position_x, position_y, position_z, difficulty_level, is_checkpoint, zone, zone_color, is_branch, branch_anchor_node_id, branch_group_id, branch_label")
      .eq("tree_id", treeId)
      .order("position_x", { ascending: true });

    if (!legacyTeachingResult.error || !isMissingSkillNodesMetadataError(legacyTeachingResult.error.message)) {
      return legacyTeachingResult;
    }
  }

  const branchAwareBaseResult = await supabase
    .from("skill_nodes")
    .select("id, tree_id, name, description, position_x, position_y, is_branch, branch_anchor_node_id, branch_group_id, branch_label")
    .eq("tree_id", treeId)
    .order("position_x", { ascending: true });

  if (!branchAwareBaseResult.error || !isMissingSkillNodesMetadataError(branchAwareBaseResult.error.message)) {
    return branchAwareBaseResult;
  }

  return supabase
    .from("skill_nodes")
    .select("id, tree_id, name, description, position_x, position_y")
    .eq("tree_id", treeId)
    .order("position_x", { ascending: true });
}

function buildSchemaJson(
  tree: StoredTree,
  storedNodes: StoredNode[],
  storedEdges: StoredEdge[],
  progress: StoredProgress[],
): string {
  const statusById = new Map(progress.map((p) => [p.node_id, p.status]));
  const prereqsByNode = new Map<string, string[]>();
  for (const edge of storedEdges) {
    const list = prereqsByNode.get(edge.to_node_id) ?? [];
    list.push(edge.from_node_id);
    prereqsByNode.set(edge.to_node_id, list);
  }

  const prefix = `${tree.id}_`;
  const strip = (id: string) => (id.startsWith(prefix) ? id.slice(prefix.length) : id);

  const nodes = storedNodes.map((node, index) => ({
    id: strip(node.id),
    name: node.name,
    description: node.description,
    category: node.category ?? "technical_and_code",
    teaching_brief: node.teaching_brief ?? "",
    teaching: node.teaching_plan ?? null,
    difficulty_level: node.difficulty_level ?? 1,
    is_checkpoint: node.is_checkpoint ?? false,
    zone: node.zone ?? "",
    zone_color: node.zone_color ?? "",
    prerequisite_ids: (prereqsByNode.get(node.id) ?? []).map(strip),
    coordinates: { x: node.position_x, y: node.position_y },
    status: statusById.get(node.id) ?? (index === 0 ? "current" : "available"),
    is_branch: node.is_branch ?? false,
    branch_anchor_node_id: node.branch_anchor_node_id ? strip(node.branch_anchor_node_id) : undefined,
    branch_group_id: node.branch_group_id ?? undefined,
    branch_label: node.branch_label ?? undefined,
  }));

  return JSON.stringify({ subject: tree.subject, goal: tree.goal, nodes });
}

function buildStoredGraph(
  tree: StoredTree,
  storedNodes: StoredNode[],
  storedEdges: StoredEdge[],
  progress: StoredProgress[],
) {
  const statusByNodeId = new Map(progress.map((item) => [item.node_id, item.status]));
  const mainStoredNodes = storedNodes.filter((node) => !node.is_branch);
  const branchStoredNodes = storedNodes.filter((node) => node.is_branch);
  const coordinateColumns = Array.from(
    new Set(mainStoredNodes.map((node) => node.position_x)),
  ).sort((a, b) => a - b);
  const xByCoordinate = new Map(
    coordinateColumns.map((coordinate, index) => [coordinate, X_START + index * X_GAP]),
  );

  const nodes: SkillNode[] = mainStoredNodes.map((node, index) => ({
    id: node.id,
    treeId: tree.id,
    name: node.name,
    description: node.description,
    category: node.category ?? "technical_and_code",
    status: statusByNodeId.get(node.id) ?? (index === 0 ? "current" : "available"),
    x: xByCoordinate.get(node.position_x) ?? X_START + index * X_GAP,
    y: Y_BASE - node.position_y * 8,
    prereqs: storedEdges
      .filter((edge) => edge.to_node_id === node.id)
      .map((edge) => edge.from_node_id),
    teachingBrief: node.teaching_brief ?? undefined,
    teachingPlan: teachingPlan(node.teaching_plan),
    difficultyLevel: node.difficulty_level ?? undefined,
    isCheckpoint: node.is_checkpoint ?? undefined,
    zone: node.zone ?? undefined,
    zoneColor: node.zone_color ?? undefined,
  }));

  const branchGroups = new Map<string, StoredNode[]>();
  for (const node of branchStoredNodes) {
    const key = node.branch_group_id ?? node.branch_anchor_node_id ?? node.id;
    const group = branchGroups.get(key) ?? [];
    group.push(node);
    branchGroups.set(key, group);
  }

  const branchLanes: BranchLane[] = [];
  const branchNodes: SkillNode[] = [];
  const placedNodesById = new Map(nodes.map((node) => [node.id, node]));
  const sortBranchGroups = (groups: StoredNode[][]) => groups.sort((leftGroup, rightGroup) => {
    const leftAnchor = placedNodesById.get(leftGroup[0]?.branch_anchor_node_id ?? "");
    const rightAnchor = placedNodesById.get(rightGroup[0]?.branch_anchor_node_id ?? "");
    const leftX = leftAnchor?.x ?? X_START;
    const rightX = rightAnchor?.x ?? X_START;
    if (leftX !== rightX) return leftX - rightX;
    return (leftGroup[0]?.branch_group_id ?? leftGroup[0]?.id ?? "").localeCompare(
      rightGroup[0]?.branch_group_id ?? rightGroup[0]?.id ?? "",
    );
  });
  const sortedBranchGroups = sortBranchGroups(Array.from(branchGroups.values()));

  function branchRange(startX: number, direction: 1 | -1, length: number) {
    const endX = startX + (length - 1) * X_GAP * direction;
    return {
      left: Math.min(startX, endX) - BRANCH_PADDING_X,
      right: Math.max(startX, endX) + NODE_W + BRANCH_PADDING_X,
    };
  }

  function rangesOverlap(left: { left: number; right: number }, right: { left: number; right: number }) {
    return left.left < right.right && right.left < left.right;
  }

  nodes.forEach((node) => {
    const range = branchRange(node.x, 1, 1);
    const laneRecord = branchLanes.find((item) => Math.abs(item.y - node.y) < NODE_H + 24);
    if (laneRecord) {
      laneRecord.ranges.push(range);
      return;
    }

    branchLanes.push({ side: "below", lane: -1, y: node.y, ranges: [range] });
  });

  function laneY(anchorY: number, side: "below" | "above", lane: number) {
    const distance = BRANCH_VERTICAL_GAP + lane * BRANCH_LANE_GAP;
    return side === "below" ? anchorY + distance : anchorY - distance;
  }

  function findBranchPlacement(anchorX: number, anchorY: number, groupLength: number, anchorIsBranch: boolean): BranchPlacement {
    const rightStartX = anchorX;
    const horizontalOptions: Array<{ startX: number; direction: 1 | -1 }> = [
      { startX: rightStartX, direction: 1 },
    ];
    if (anchorX - (groupLength - 1) * X_GAP >= X_START) {
      horizontalOptions.push({ startX: anchorX, direction: -1 });
    } else {
      horizontalOptions.push({ startX: X_START, direction: 1 });
    }

    const preferredSide: "above" | "below" = anchorIsBranch
      ? anchorY <= Y_BASE ? "above" : "below"
      : anchorY > Y_BASE ? "above" : "below";
    const candidates = Array.from({ length: sortedBranchGroups.length + 2 }, (_, lane) => lane)
      .flatMap((lane) => {
        const sides: Array<"below" | "above"> = laneY(anchorY, "above", lane) >= MIN_BRANCH_Y
          ? ["below", "above"]
          : ["below"];

        return sides.map((side) => ({
          lane,
          side,
          y: laneY(anchorY, side, lane),
        }));
      })
      .sort((left, right) => {
        const distanceDiff = Math.abs(left.y - anchorY) - Math.abs(right.y - anchorY);
        if (distanceDiff !== 0) return distanceDiff;
        if (left.side !== right.side) return left.side === preferredSide ? -1 : 1;
        return left.lane - right.lane;
      });

    for (const candidate of candidates) {
      const existingLane = branchLanes.find((item) => Math.abs(item.y - candidate.y) < NODE_H + 24);

      for (const option of horizontalOptions) {
        const range = branchRange(option.startX, option.direction, groupLength);
        const overlaps = existingLane?.ranges.some((usedRange) => rangesOverlap(range, usedRange)) ?? false;
        if (overlaps) continue;

        const laneRecord = existingLane ?? { side: candidate.side, lane: candidate.lane, y: candidate.y, ranges: [] };
        laneRecord.ranges.push(range);
        if (!existingLane) branchLanes.push(laneRecord);

        return {
          startX: option.startX,
          direction: option.direction,
          y: candidate.y,
        };
      }
    }

    const lane = sortedBranchGroups.length + branchLanes.length;
    const y = laneY(anchorY, "below", lane);
    const range = branchRange(rightStartX, 1, groupLength);
    branchLanes.push({ side: "below", lane, y, ranges: [range] });
    return { startX: rightStartX, direction: 1, y };
  }

  const pendingBranchGroups = [...sortedBranchGroups];
  while (pendingBranchGroups.length > 0) {
    const nextIndex = pendingBranchGroups.findIndex((group) => {
      const anchorId = group[0]?.branch_anchor_node_id;
      return !anchorId || placedNodesById.has(anchorId);
    });
    const groupIndex = nextIndex >= 0 ? nextIndex : 0;
    const [group] = pendingBranchGroups.splice(groupIndex, 1);
    sortBranchGroups(pendingBranchGroups);

    group.sort((left, right) => {
      if (left.position_z !== right.position_z) return (left.position_z ?? 0) - (right.position_z ?? 0);
      if (left.position_x !== right.position_x) return left.position_x - right.position_x;
      return left.id.localeCompare(right.id);
    });

    const first = group[0];
    const anchor = placedNodesById.get(first.branch_anchor_node_id ?? "");
    const anchorX = anchor?.x ?? X_START;
    const anchorY = anchor?.y ?? Y_BASE;
    const placement = findBranchPlacement(anchorX, anchorY, group.length, anchor?.isBranch === true);

    group.forEach((node, index) => {
      const branchNode: SkillNode = {
        id: node.id,
        treeId: tree.id,
        name: node.name,
        description: node.description,
        category: node.category ?? "technical_and_code",
        status: statusByNodeId.get(node.id) ?? "available",
        x: placement.startX + index * X_GAP * placement.direction,
        y: placement.y,
        prereqs: storedEdges
          .filter((edge) => edge.to_node_id === node.id)
          .map((edge) => edge.from_node_id),
        teachingBrief: node.teaching_brief ?? undefined,
        teachingPlan: teachingPlan(node.teaching_plan),
        difficultyLevel: node.difficulty_level ?? undefined,
        isCheckpoint: node.is_checkpoint ?? undefined,
        zone: node.zone ?? undefined,
        zoneColor: node.zone_color ?? undefined,
        isBranch: true,
        branchAnchorNodeId: node.branch_anchor_node_id ?? undefined,
        branchGroupId: node.branch_group_id ?? undefined,
        branchLabel: node.branch_label ?? undefined,
      };
      branchNodes.push(branchNode);
      placedNodesById.set(branchNode.id, branchNode);
    });
  }

  const allGraphNodes = [...nodes, ...branchNodes];

  const branchNodeIds = new Set(branchStoredNodes.map((node) => node.id));
  const sourceIds = new Set(
    storedEdges
      .filter((edge) => !branchNodeIds.has(edge.to_node_id))
      .map((edge) => edge.from_node_id),
  );
  const terminalNodeIds = nodes
    .filter((node) => !sourceIds.has(node.id))
    .map((node) => node.id);
  const goalNode: SkillNode = {
    id: `${tree.id}_goal`,
    treeId: tree.id,
    name: tree.subject,
    description: tree.goal,
    status: "available",
    x: Math.max(...nodes.map((node) => node.x)) + X_GAP,
    y: Y_BASE,
    prereqs: terminalNodeIds,
    isCheckpoint: true,
    zone: "End goal",
    zoneColor: "#3B82F6",
  };

  const edges: SkillEdge[] = [
    ...storedEdges.map((edge) => ({
      id: `edge_${edge.from_node_id}_${edge.to_node_id}`,
      treeId: tree.id,
      fromNodeId: edge.from_node_id,
      toNodeId: edge.to_node_id,
    })),
    ...terminalNodeIds.map((fromNodeId) => ({
      id: `edge_${fromNodeId}_${goalNode.id}`,
      treeId: tree.id,
      fromNodeId,
      toNodeId: goalNode.id,
    })),
  ];

  return {
    nodes: [...allGraphNodes, goalNode],
    edges,
    subject: tree.subject,
  };
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  if (!hasSupabaseConfig()) {
    redirect("/sign-in?callbackUrl=/dashboard");
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/sign-in?callbackUrl=/dashboard");
  }

  const { data: userLearningPaths } = await supabase
    .from("skill_trees")
    .select("id, subject")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  const params = await searchParams;
  const requestedTreeId = params?.treeId;
  const storedLearningPaths = userLearningPaths ?? [];
  const selectedTreeId = requestedTreeId ?? LLM_THEORY_TREE_ID;
  const learningPaths = [LLM_THEORY_PATH, LLM_THEORY_BRANCH_PATH, ...storedLearningPaths];

  if (selectedTreeId === LLM_THEORY_TREE_ID) {
    return (
      <SkillTreeLoader
        nodes={LLM_THEORY_NODES}
        edges={LLM_THEORY_EDGES}
        subject={LLM_THEORY_PATH.subject}
        learningPaths={learningPaths}
      />
    );
  }

  if (selectedTreeId === LLM_THEORY_BRANCH_TREE_ID) {
    return (
      <SkillTreeLoader
        nodes={LLM_THEORY_BRANCH_NODES}
        edges={LLM_THEORY_BRANCH_EDGES}
        subject={LLM_THEORY_BRANCH_PATH.subject}
        learningPaths={learningPaths}
      />
    );
  }

  if (selectedTreeId) {
    const selectedTree = storedLearningPaths.find((path) => path.id === selectedTreeId);

    if (selectedTree) {
      const [
        { data: tree },
        { data: storedEdges },
        { data: progress },
        { data: storedNodes },
      ] = await Promise.all([
        supabase
          .from("skill_trees")
          .select("id, subject, goal")
          .eq("id", selectedTree.id)
          .eq("user_id", user.id)
          .single(),
        supabase
          .from("skill_edges")
          .select("tree_id, from_node_id, to_node_id")
          .eq("tree_id", selectedTree.id),
        supabase
          .from("user_node_progress")
          .select("node_id, status")
          .eq("user_id", user.id),
        fetchStoredNodes(supabase, selectedTree.id),
      ]);

      if (tree && storedNodes && storedNodes.length > 0) {
        const typedTree = tree as StoredTree;
        const typedNodes = storedNodes as StoredNode[];
        const typedEdges = (storedEdges ?? []) as StoredEdge[];
        const typedProgress = (progress ?? []) as StoredProgress[];

        const graph = buildStoredGraph(typedTree, typedNodes, typedEdges, typedProgress);
        return (
          <SkillTreeLoader
            nodes={graph.nodes}
            edges={graph.edges}
            subject={graph.subject}
            learningPaths={learningPaths}
          />
        );
      }
    }
  }

  return (
    <SkillTreeLoader
      nodes={NODES}
      edges={EDGES}
      subject={DEFAULT_GRAPH.subject}
      learningPaths={learningPaths}
    />
  );
}
