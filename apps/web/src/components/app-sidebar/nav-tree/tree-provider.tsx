"use client";

import { createContext, type ReactNode, use } from "react";
import type { FlatTree } from "@/lib/types";

const TreeContext = createContext<FlatTree | null>(null);

type TreeProviderProps = {
  tree: FlatTree;
  children: ReactNode;
};

export function TreeProvider({ tree, children }: TreeProviderProps) {
  return <TreeContext value={tree}>{children}</TreeContext>;
}

export function useTree() {
  const tree = use(TreeContext);

  if (!tree) {
    throw new Error("useTree must be used within a TreeProvider");
  }

  return tree;
}
