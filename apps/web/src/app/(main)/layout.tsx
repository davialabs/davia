import { readFileSync, readdirSync } from "fs";
import { join } from "path";
import { AppSidebar } from "@/components/app-sidebar";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { ProjectsProvider } from "@/providers/projects-provider";
import { ProjectState } from "@/lib/types";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Get monorepo root from environment variable
  const monorepoRoot = process.env.DAVIA_MONOREPO_ROOT;

  if (!monorepoRoot) {
    throw new Error(
      "DAVIA_MONOREPO_ROOT environment variable is not set. Please run `pnpm run open` to start the web app."
    );
  }

  // Read projects.json
  const projectsJsonPath = join(monorepoRoot, ".davia", "projects.json");
  let projects: Record<string, ProjectState> = {};
  try {
    const projectsContent = readFileSync(projectsJsonPath, "utf-8");
    if (projectsContent.trim()) {
      projects = JSON.parse(projectsContent);
    }
  } catch (error) {
    console.error("Error reading projects.json:", error);
  }

  // Read assets folder
  const assetsPath = join(monorepoRoot, ".davia", "assets");
  let assets: string[] = [];
  try {
    assets = readdirSync(assetsPath);
  } catch (error) {
    console.error("Error reading assets folder:", error);
  }

  return (
    <ProjectsProvider projects={projects} assets={assets}>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-14 shrink-0 items-center gap-2 border-b">
            <div className="flex flex-1 items-center gap-2 px-3">
              <SidebarTrigger />
              <Separator
                orientation="vertical"
                className="mr-2 data-[orientation=vertical]:h-4"
              />
            </div>
            <div className="ml-auto px-3">{/* <NavActions /> */}</div>
          </header>
          <main className="flex-1">{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </ProjectsProvider>
  );
}
