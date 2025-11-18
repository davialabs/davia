import { bundleMDX } from "mdx-bundler";

export type Project = {
  id: string;
  path: string;
  running: boolean;
  workspace_id?: string;
};

export type FlatTreeNode = {
  title: string;
  children: string[];
};

export type FlatTree = Record<string, FlatTreeNode>;

export type AssetTrees = Record<string, FlatTree>;

export type BundleMDXResult = {
  result: Awaited<ReturnType<typeof bundleMDX>>;
  dataImports: string[];
};
