"use client";

import { createContext, type ReactNode, use, useState, useEffect } from "react";
import { useParams } from "next/navigation";
import type { ProjectState, AssetTrees } from "@/lib/types";

type ProjectsContextValue = {
  projects: Record<string, ProjectState>;
  trees: AssetTrees;
  setTrees: (trees: AssetTrees) => void;
  currentProjectId: string | null;
  currentProject: ({ id: string } & ProjectState) | null;
};

const ProjectsContext = createContext<ProjectsContextValue | null>(null);

type ProjectsProviderProps = {
  projects: Record<string, ProjectState>;
  initialTrees: AssetTrees;
  children: ReactNode;
};

export function ProjectsProvider({
  projects,
  initialTrees,
  children,
}: ProjectsProviderProps) {
  const { repoId } = useParams<{ repoId?: string }>();
  const [trees, setTrees] = useState<AssetTrees>(initialTrees);

  // Update trees when prop changes (e.g., on router.refresh)
  useEffect(() => {
    setTrees(initialTrees);
  }, [initialTrees]);

  // Get current project only if repoId exists and is in projects
  const currentProject =
    repoId && projects[repoId] ? { id: repoId, ...projects[repoId] } : null;

  const value: ProjectsContextValue = {
    projects,
    trees,
    setTrees,
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
