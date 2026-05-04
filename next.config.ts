import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/api/skill-tree/generate": ["./prompts/skill-tree-system-prompt.txt"],
  },
};

export default nextConfig;
