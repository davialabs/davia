import { readFileSync } from "fs";
import { join } from "path";
import { AppSidebar } from "@/components/app-sidebar";
import { Header } from "@/components/app-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { ProjectsProvider } from "@/providers/projects-provider";
import { ProjectState } from "@/lib/types";
import { buildAssetTrees } from "@/lib/tree/server";

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

  // Build tree structures for all assets
  const trees = buildAssetTrees(monorepoRoot);

  return (
    <ProjectsProvider projects={projects} initialTrees={trees}>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <Header />
          <main className="flex-1">{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </ProjectsProvider>
  );
}
