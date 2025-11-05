"use client";

import { useTheme } from "next-themes";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { ChevronDownIcon, CheckIcon } from "lucide-react";
import { useProjects } from "@/providers/projects-provider";
import { useHasMounted } from "@/hooks/use-has-mounted";
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
import { Spinner } from "@/components/ui/spinner";
import { getBaseName } from "@/lib/utils";

export function ProjectSwitcher() {
  const mounted = useHasMounted();
  const { resolvedTheme } = useTheme();
  const router = useRouter();
  const { projectId } = useParams<{ projectId?: string }>();
  const { projects, currentProject } = useProjects();

  const handleSwitchProject = (projectId: string) => {
    router.push(`/${projectId}`);
  };

  const triggerContent = (
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
  );

  // Only render DropdownMenu after mount to avoid hydration mismatches with Radix UI IDs
  if (!mounted) {
    return triggerContent;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{triggerContent}</DropdownMenuTrigger>
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
              <Item size="sm" className="w-full p-1">
                <ItemContent className="gap-0.5 min-w-0">
                  <ItemTitle className="w-full">
                    <span
                      className="truncate block"
                      title={getBaseName(project.path)}
                    >
                      {getBaseName(project.path)}
                    </span>
                    {project.running && (
                      <Spinner className="size-3 text-muted-foreground shrink-0" />
                    )}
                  </ItemTitle>
                  <ItemDescription>
                    <span className="truncate block" title={project.path}>
                      {project.path}
                    </span>
                  </ItemDescription>
                </ItemContent>
                {id === projectId && (
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
