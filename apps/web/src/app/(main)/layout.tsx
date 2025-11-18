import { AppSidebar } from "@/components/app-sidebar";
import { Header } from "@/components/app-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { ProjectsProvider } from "@/providers/projects-provider";
import { Project } from "@/lib/types";
import { buildAssetTrees } from "@/lib/tree/server";
import { readProjects } from "@/lib/projects";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Read projects from env-paths
  const projectsArray = await readProjects();

  // Convert to Record<string, Project> keyed by project id
  const projects: Record<string, Project> = {};
  for (const project of projectsArray) {
    projects[project.id] = project;
  }

  // Build tree structures for all projects
  const trees = buildAssetTrees(projectsArray);

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
