"use client";

import { Fragment, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useProjects } from "@/providers/projects-provider";
import { getPageAncestors } from "@/lib/tree/client";
import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function NavigationBreadcrumb() {
  const { trees } = useProjects();
  const { repoId, pagePath: pagePathParams } = useParams<{
    repoId?: string;
    pagePath?: string[];
  }>();
  const pagePath = pagePathParams?.join("/");

  // Get the tree for the current project, default to null if it doesn't exist
  const tree = repoId && trees[repoId] ? trees[repoId] : null;

  const [breadcrumbItems, setBreadcrumbItems] = useState<
    { id: string; title: string }[]
  >([]);

  // Update breadcrumb items when tree or pagePath changes
  useEffect(() => {
    if (!pagePath || !tree) {
      setBreadcrumbItems([]);
      return;
    }

    const page = tree[pagePath];
    const pageTitle = page?.title ?? "Untitled";

    // Get all ancestors (parents) of the current page
    const ancestors = getPageAncestors(pagePath, tree);

    // Build the complete breadcrumb path including current page
    const items = [...ancestors, { id: pagePath, title: pageTitle }];

    setBreadcrumbItems(items);
  }, [pagePath, tree]);

  if (breadcrumbItems.length === 0) {
    return null;
  }

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {breadcrumbItems.length <= 3 ? (
          // Show all items when 3 or fewer
          breadcrumbItems.map((item, index) => (
            <Fragment key={item.id}>
              <BreadcrumbItem className="max-w-xs">
                {index === breadcrumbItems.length - 1 ? (
                  // Last item (current page) - non-clickable
                  <BreadcrumbPage className="truncate">
                    {item.title}
                  </BreadcrumbPage>
                ) : (
                  // Parent pages - clickable
                  <BreadcrumbLink asChild>
                    <Link href={`/${repoId}/${item.id}`} className="truncate">
                      {item.title}
                    </Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {index < breadcrumbItems.length - 1 && <BreadcrumbSeparator />}
            </Fragment>
          ))
        ) : (
          // Show collapsed view when 4 or more items
          <>
            {/* First item */}
            {breadcrumbItems[0] && (
              <>
                <BreadcrumbItem className="max-w-xs">
                  <BreadcrumbLink asChild>
                    <Link
                      href={`/${repoId}/${breadcrumbItems[0].id}`}
                      className="truncate"
                    >
                      {breadcrumbItems[0].title}
                    </Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
              </>
            )}

            {/* Dropdown for middle items */}
            <BreadcrumbItem>
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-1">
                  <BreadcrumbEllipsis className="size-4" />
                  <span className="sr-only">Toggle menu</span>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  {breadcrumbItems.slice(1, -2).map((item) => (
                    <DropdownMenuItem key={item.id} asChild>
                      <Link href={`/${repoId}/${item.id}`} className="truncate">
                        {item.title}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </BreadcrumbItem>
            <BreadcrumbSeparator />

            {/* Last two items */}
            {breadcrumbItems.slice(-2).map((item, index) => (
              <Fragment key={item.id}>
                <BreadcrumbItem className="max-w-xs">
                  {index === 1 ? (
                    // Last item (current page) - non-clickable
                    <BreadcrumbPage className="truncate">
                      {item.title}
                    </BreadcrumbPage>
                  ) : (
                    // Second to last item - clickable
                    <BreadcrumbLink asChild>
                      <Link href={`/${repoId}/${item.id}`} className="truncate">
                        {item.title}
                      </Link>
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
                {index < 1 && <BreadcrumbSeparator />}
              </Fragment>
            ))}
          </>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
