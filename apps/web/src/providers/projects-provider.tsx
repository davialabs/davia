"use client";

import { createContext, type ReactNode, use } from "react";
import { useParams } from "next/navigation";
import type { ProjectState } from "@/lib/types";

type ProjectsContextValue = {
  projects: Record<string, ProjectState>;
  assets: string[];
  currentProjectId: string | null;
  currentProject: ({ id: string } & ProjectState) | null;
};

const ProjectsContext = createContext<ProjectsContextValue | null>(null);

type ProjectsProviderProps = {
  projects: Record<string, ProjectState>;
  assets: string[];
  children: ReactNode;
};

export function ProjectsProvider({
  projects,
  assets,
  children,
}: ProjectsProviderProps) {
  const { repoId } = useParams<{ repoId?: string }>();

  // Get current project only if repoId exists and is in projects
  const currentProject =
    repoId && projects[repoId] ? { id: repoId, ...projects[repoId] } : null;

  const value: ProjectsContextValue = {
    projects,
    assets,
    currentProjectId: repoId || null,
    currentProject,
  };

  return (
    <ProjectsContext.Provider value={value}>
      {children}
    </ProjectsContext.Provider>
  );
}

export function useProjects() {
  const context = use(ProjectsContext);

  if (!context) {
    throw new Error("useProjects must be used within a ProjectsProvider");
  }

  return context;
}
