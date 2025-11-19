import { existsSync, readFileSync } from "fs";
import { join } from "path";
import { ExcalidrawWrapper } from "./excalidraw-wrapper";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { SplinePointerIcon } from "lucide-react";
import { readProjects, findProjectById } from "@/lib/projects";

export default async function ExcalidrawViewPage({
  params,
}: {
  params: Promise<{ projectId: string; excalidrawPath: string[] }>;
}) {
  const { projectId, excalidrawPath } = await params;

  // Read projects and find project by id
  const projects = await readProjects();
  const project = findProjectById(projects, projectId);

  if (!project) {
    return <EmptyExcalidraw />;
  }

  // Check if the asset folder exists
  const assetPath = join(project.path, ".davia", "assets", ...excalidrawPath);
  if (!existsSync(assetPath)) {
    return <EmptyExcalidraw />;
  }

  // Read the excalidraw file content
  let excalidrawContent: string;
  try {
    excalidrawContent = readFileSync(assetPath, "utf-8");
  } catch (error) {
    console.error(`Error reading ${assetPath}:`, error);
    return <EmptyExcalidraw />;
  }

  return (
    <ExcalidrawWrapper
      projectId={projectId}
      excalidrawPath={excalidrawPath.join("/")}
      excalidrawContent={excalidrawContent}
    />
  );
}

function EmptyExcalidraw() {
  return (
    <div className="flex flex-1 items-center justify-center h-full p-4">
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <SplinePointerIcon />
          </EmptyMedia>
          <EmptyTitle>Empty Excalidraw</EmptyTitle>
          <EmptyDescription>
            No excalidraw found for the given path.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    </div>
  );
}
