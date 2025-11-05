"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  removeItemsFromParents,
  insertItemsAtTarget,
  dragAndDropFeature,
  hotkeysCoreFeature,
  renamingFeature,
  syncDataLoaderFeature,
} from "@headless-tree/core";
import { useTree as useHeadlessTree } from "@headless-tree/react";
import { useLocalStorage } from "usehooks-ts";
import { useProjects } from "@/providers/projects-provider";
import type { FlatTree, FlatTreeNode } from "@/lib/types";
import { customClickBehavior } from "./plugins";
import { MemoizedNavTreeItem } from "./nav-tree-item";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
} from "@/components/ui/sidebar";
import type { FallbackProps } from "react-error-boundary";

export function NavTree() {
  const { trees } = useProjects();
  const { projectId, pagePath: pagePathParams } = useParams<{
    projectId?: string;
    pagePath?: string[];
  }>();
  const pagePath = pagePathParams?.join("/");

  // Get the tree for the current project, default to null if it doesn't exist
  const treeState: FlatTree | null =
    projectId && trees[projectId] ? trees[projectId] : null;

  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [localStorageExpandedItems, setLocalStorageExpandedItems] =
    useLocalStorage<string[]>(`expanded-items-${projectId}`, []);

  // Load expanded items from localStorage when component mounts
  useEffect(() => {
    if (!localStorageExpandedItems || localStorageExpandedItems.length === 0)
      return;
    const treeKeys = Object.keys(treeState ?? {});
    if (treeKeys.length === 0) return;

    const treeKeySet = new Set(treeKeys);
    const filteredExpandedItems = localStorageExpandedItems.filter((id) =>
      treeKeySet.has(id)
    );
    setLocalStorageExpandedItems(filteredExpandedItems);
    setExpandedItems(filteredExpandedItems);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save expanded items to localStorage when expandedItems changes
  useEffect(() => {
    setLocalStorageExpandedItems(expandedItems);
  }, [expandedItems, setLocalStorageExpandedItems]);

  const tree = useHeadlessTree<FlatTreeNode>({
    state: { expandedItems },
    setExpandedItems,
    rootItemId: "root",
    getItemName: (item) => item.getItemData().title,
    isItemFolder: () => true,
    dataLoader: {
      getItem: (id) =>
        treeState?.[id] || {
          title: "Untitled",
          children: [],
        },
      getChildren: (id: string) => treeState?.[id]?.children ?? [],
    },
    indent: 20,
    features: [syncDataLoaderFeature, hotkeysCoreFeature, customClickBehavior],
  });

  // Rebuild tree when treeState changes
  useEffect(() => {
    if (treeState) {
      tree.rebuildTree();
    }
  }, [treeState, tree]);

  if (!projectId || !treeState) {
    return null;
  }

  return (
    <SidebarGroup>
      <SidebarGroupContent>
        <SidebarMenu {...tree.getContainerProps()} className="gap-px">
          {tree.getItems().map((item) => {
            const itemId = item.getId();
            const title = item.getItemName();
            const hasChildren = item.getItemData().children.length > 0;
            const isExpanded = item.isExpanded();
            const isSelected = itemId === pagePath;
            const level = item.getItemMeta().level;

            return (
              <MemoizedNavTreeItem
                {...item.getProps()}
                key={itemId}
                projectId={projectId}
                id={itemId}
                title={title}
                hasChildren={hasChildren}
                isExpanded={isExpanded}
                isSelected={isSelected}
                level={level}
                item={item}
              />
            );
          })}
          {/* <div
            style={tree.getDragLineStyle()}
            className="h-0.5 bg-cyan-500/50"
          /> */}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

export function NavTreeFallback({ error, resetErrorBoundary }: FallbackProps) {
  const errorMessage = error?.message
    ? error.message
    : JSON.stringify(error, null, 2);

  return (
    <Card className="m-2">
      <CardHeader>
        <CardTitle className="text-destructive">An error occurred</CardTitle>
        <CardDescription className="overflow-y-auto max-h-48">
          {errorMessage}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button
          size="sm"
          className="w-full"
          onClick={() => resetErrorBoundary()}
        >
          Retry
        </Button>
      </CardContent>
    </Card>
  );
}
