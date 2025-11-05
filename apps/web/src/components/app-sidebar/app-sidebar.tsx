"use client";

import { useRouter } from "next/navigation";
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

export function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
  const router = useRouter();

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center justify-between gap-1">
              <ProjectSwitcher />
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => {
                  router.refresh();
                }}
              >
                <RefreshCcwIcon />
              </Button>
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
