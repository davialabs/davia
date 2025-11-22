import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  /* config options here */
  output: "standalone",
  reactCompiler: true,
  outputFileTracingRoot: path.join(__dirname, "../../"),
  serverExternalPackages: ["mdx-bundler", "esbuild"],
};

export default nextConfig;
