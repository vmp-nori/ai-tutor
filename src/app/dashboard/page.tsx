import type { SkillNode, SkillEdge } from "@/lib/types";
import { SkillTreeLoader } from "@/components/skill-tree/SkillTreeLoader";
import { createClient, hasSupabaseConfig } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

const TREE_ID = "machine-learning-engineering-llm-mastery";
const X_START = 96;
const X_GAP = 304;
const Y_BASE = 320;

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
  treeId: TREE_ID,
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
  treeId: TREE_ID,
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
      treeId: TREE_ID,
      fromNodeId,
      toNodeId: node.id,
    })),
  ),
  ...terminalNodeIds.map((fromNodeId) => ({
    id: `edge_${fromNodeId}_goal`,
    treeId: TREE_ID,
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
  position_x: number;
  position_y: number;
  difficulty_level: number | null;
  is_checkpoint: boolean | null;
  zone: string | null;
  zone_color: string | null;
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

function buildStoredGraph(
  tree: StoredTree,
  storedNodes: StoredNode[],
  storedEdges: StoredEdge[],
  progress: StoredProgress[],
) {
  const statusByNodeId = new Map(progress.map((item) => [item.node_id, item.status]));
  const coordinateColumns = Array.from(
    new Set(storedNodes.map((node) => node.position_x)),
  ).sort((a, b) => a - b);
  const xByCoordinate = new Map(
    coordinateColumns.map((coordinate, index) => [coordinate, X_START + index * X_GAP]),
  );

  const nodes: SkillNode[] = storedNodes.map((node, index) => ({
    id: node.id,
    treeId: tree.id,
    name: node.name,
    description: node.description,
    status: statusByNodeId.get(node.id) ?? (index === 0 ? "current" : "available"),
    x: xByCoordinate.get(node.position_x) ?? X_START + index * X_GAP,
    y: Y_BASE - node.position_y * 8,
    prereqs: storedEdges
      .filter((edge) => edge.to_node_id === node.id)
      .map((edge) => edge.from_node_id),
    difficultyLevel: node.difficulty_level ?? undefined,
    isCheckpoint: node.is_checkpoint ?? undefined,
    zone: node.zone ?? undefined,
    zoneColor: node.zone_color ?? undefined,
  }));

  const sourceIds = new Set(storedEdges.map((edge) => edge.from_node_id));
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
    nodes: [...nodes, goalNode],
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
  const selectedTreeId = requestedTreeId ?? userLearningPaths?.[0]?.id;
  const learningPaths =
    userLearningPaths && userLearningPaths.length > 0
      ? userLearningPaths
      : [{ id: TREE_ID, subject: DEFAULT_GRAPH.subject, href: "/dashboard" }];

  if (selectedTreeId) {
    const selectedTree = userLearningPaths?.find((path) => path.id === selectedTreeId);

    if (selectedTree) {
      const [
        { data: tree },
        { data: storedNodes },
        { data: storedEdges },
        { data: progress },
      ] = await Promise.all([
        supabase
          .from("skill_trees")
          .select("id, subject, goal")
          .eq("id", selectedTree.id)
          .eq("user_id", user.id)
          .single(),
        supabase
          .from("skill_nodes")
          .select("id, tree_id, name, description, position_x, position_y, difficulty_level, is_checkpoint, zone, zone_color")
          .eq("tree_id", selectedTree.id)
          .order("position_x", { ascending: true }),
        supabase
          .from("skill_edges")
          .select("tree_id, from_node_id, to_node_id")
          .eq("tree_id", selectedTree.id),
        supabase
          .from("user_node_progress")
          .select("node_id, status")
          .eq("user_id", user.id),
      ]);

      if (tree && storedNodes && storedNodes.length > 0) {
        const graph = buildStoredGraph(
          tree as StoredTree,
          storedNodes as StoredNode[],
          (storedEdges ?? []) as StoredEdge[],
          (progress ?? []) as StoredProgress[],
        );

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
