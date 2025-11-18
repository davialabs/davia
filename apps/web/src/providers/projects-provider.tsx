"use client";

import { createContext, type ReactNode, use, useState, useEffect } from "react";
import { useParams } from "next/navigation";
import type { Project, AssetTrees } from "@/lib/types";

type ProjectsContextValue = {
  projects: Record<string, Project>;
  trees: AssetTrees;
  setTrees: React.Dispatch<React.SetStateAction<AssetTrees>>;
  currentProject: Project | null;
};

const ProjectsContext = createContext<ProjectsContextValue | null>(null);

type ProjectsProviderProps = {
  projects: Record<string, Project>;
  initialTrees: AssetTrees;
  children: ReactNode;
};

export function ProjectsProvider({
  projects,
  initialTrees,
  children,
}: ProjectsProviderProps) {
  const { projectId } = useParams<{ projectId?: string }>();
  const [trees, setTrees] = useState<AssetTrees>(initialTrees);

  // Update trees when prop changes (e.g., on router.refresh)
  useEffect(() => {
    setTrees(initialTrees);
  }, [initialTrees]);

  // Get current project only if projectId exists and is in projects
  const currentProject =
    projectId && projects[projectId] ? projects[projectId] : null;

  const value: ProjectsContextValue = {
    projects,
    trees,
    setTrees,
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
