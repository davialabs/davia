"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { ChevronDownIcon, CheckIcon } from "lucide-react";
import { ProjectState } from "@/lib/types";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuGroup,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { SidebarMenuButton } from "@/components/ui/sidebar";
import {
  Item,
  ItemContent,
  ItemTitle,
  ItemDescription,
  ItemActions,
} from "@/components/ui/item";

function getBaseName(path: string): string {
  const parts = path.split("/").filter(Boolean);
  return parts[parts.length - 1] || path;
}

export function ProjectSwitcher({
  projects,
}: {
  projects: Record<string, ProjectState>;
}) {
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme } = useTheme();
  const params = useParams<{ repoId?: string }>();
  const router = useRouter();
  const repoId = params.repoId;

  useEffect(() => {
    setMounted(true);
  }, []);

  // Get current project only if repoId exists and is in projects
  const currentProject =
    repoId && projects[repoId] ? { id: repoId, ...projects[repoId] } : null;

  const handleSwitchProject = (projectId: string) => {
    router.push(`/${projectId}`);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <SidebarMenuButton className="w-fit">
          <Image
            src={
              !mounted
                ? "/logo-light.svg"
                : resolvedTheme === "light"
                  ? "/logo-light.svg"
                  : "/logo-dark.svg"
            }
            alt="Davia"
            width={20}
            height={20}
            priority
          />
          {currentProject?.path ? (
            <span className="truncate text-sm font-medium">
              {getBaseName(currentProject.path)}
            </span>
          ) : (
            <span className="truncate text-sm font-medium text-muted-foreground">
              Select a project
            </span>
          )}
          <ChevronDownIcon className="opacity-50" />
        </SidebarMenuButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-64 rounded-lg"
        align="start"
        side="bottom"
        sideOffset={4}
      >
        <DropdownMenuLabel className="text-muted-foreground text-xs">
          Projects
        </DropdownMenuLabel>
        <DropdownMenuGroup className="max-h-40 overflow-y-auto">
          {Object.entries(projects).map(([id, project]) => (
            <DropdownMenuItem
              key={id}
              onClick={() => handleSwitchProject(id)}
              className="p-0"
            >
              <Item size="sm" className="w-full p-2">
                <ItemContent className="gap-0.5 min-w-0 flex-1">
                  <ItemTitle className="w-full min-w-0">
                    <span className="truncate block">
                      {getBaseName(project.path)}
                    </span>
                  </ItemTitle>
                  <ItemDescription className="w-full min-w-0">
                    <span className="truncate block">{project.path}</span>
                  </ItemDescription>
                </ItemContent>
                {id === repoId && (
                  <ItemActions>
                    <CheckIcon className="size-4" />
                  </ItemActions>
                )}
              </Item>
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
