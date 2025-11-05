"use client";

import { memo } from "react";
import Link from "next/link";
import type { ItemInstance } from "@headless-tree/core";
import type { FlatTreeNode } from "@/lib/types";
import {
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { ChevronRight } from "lucide-react";

type NavTreeItemProps = React.ComponentProps<"li"> & {
  projectId: string;
  id: string;
  title: string;
  hasChildren: boolean;
  isExpanded: boolean;
  isSelected: boolean;
  level: number;
  item: ItemInstance<FlatTreeNode>;
};

function NavTreeItem({
  projectId,
  id,
  title,
  hasChildren,
  isExpanded,
  isSelected,
  level,
  item,
  ...props
}: NavTreeItemProps) {
  return (
    <SidebarMenuItem style={{ paddingLeft: `${level * 20}px` }} {...props}>
      <SidebarMenuButton isActive={isSelected} asChild>
        <Link href={`/${projectId}/${id}`}>
          <span>{title}</span>
        </Link>
      </SidebarMenuButton>
      {hasChildren && (
        <SidebarMenuAction
          onClick={isExpanded ? item.collapse : item.expand}
          data-state={isExpanded ? "open" : "closed"}
          className="data-[state=open]:rotate-90"
        >
          <ChevronRight />
          <span className="sr-only">Toggle</span>
        </SidebarMenuAction>
      )}
    </SidebarMenuItem>
  );
}

export const MemoizedNavTreeItem = memo(NavTreeItem);
