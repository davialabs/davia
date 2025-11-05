import { bundleMDX } from "mdx-bundler";

export type ProjectState = {
  path: string;
  running: boolean;
};

export type FlatTreeNode = {
  title: string;
  children: string[];
};

export type FlatTree = Record<string, FlatTreeNode>;

export type AssetTrees = Record<string, FlatTree>;

export type BundleMDXResult = {
  result: Awaited<ReturnType<typeof bundleMDX>>;
  css: string;
  dataImports: string[];
};
