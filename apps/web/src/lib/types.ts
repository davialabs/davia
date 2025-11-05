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
