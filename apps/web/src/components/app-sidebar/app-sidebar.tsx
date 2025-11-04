"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { ProjectSwitcher } from "./project-switcher";
import { ProjectState } from "@/lib/types";
import { RefreshCcwIcon } from "lucide-react";

export function AppSidebar({
  state,
  assets,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  state: Record<string, ProjectState>;
  assets: string[];
}) {
  const router = useRouter();

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center justify-between gap-1">
              <ProjectSwitcher projects={state} />
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

      <SidebarContent></SidebarContent>

      <SidebarRail />
    </Sidebar>
  );
}
