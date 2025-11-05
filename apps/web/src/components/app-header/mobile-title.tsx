"use client";

import { useParams } from "next/navigation";
import { useProjects } from "@/providers/projects-provider";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";

export function MobileTitle() {
  const { trees } = useProjects();
  const { projectId, pagePath: pagePathParams } = useParams<{
    projectId?: string;
    pagePath?: string[];
  }>();
  const pagePath = pagePathParams?.join("/");

  // Get the tree for the current project, default to null if it doesn't exist
  const tree = projectId && trees[projectId] ? trees[projectId] : null;

  const page = pagePath && tree ? tree[pagePath] : undefined;
  const pageTitle = page?.title;

  if (!pageTitle) {
    return null;
  }

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem className="max-w-xs">
          <BreadcrumbPage className="truncate">{pageTitle}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}
