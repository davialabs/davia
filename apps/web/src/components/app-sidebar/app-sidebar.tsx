"use client";

import { Button } from "@/components/ui/button";
import { NavTree, NavTreeFallback } from "./nav-tree";
import { ErrorBoundary } from "react-error-boundary";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { ProjectSwitcher } from "./project-switcher";
import { RefreshCcwIcon } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center justify-between gap-1">
              <ProjectSwitcher />
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => {
                      window.location.reload();
                    }}
                  >
                    <RefreshCcwIcon />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Reload the project</TooltipContent>
              </Tooltip>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <ErrorBoundary FallbackComponent={NavTreeFallback}>
          <NavTree />
        </ErrorBoundary>
      </SidebarContent>

      <SidebarRail />
    </Sidebar>
  );
}
