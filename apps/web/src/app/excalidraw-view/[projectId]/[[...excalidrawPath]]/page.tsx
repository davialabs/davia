import { existsSync, readFileSync } from "fs";
import { join, basename } from "path";
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

  const assetsPath = join(project.path, ".davia", "assets");
  const assetPath = join(assetsPath, ...excalidrawPath);

  // Check if the JSON file exists
  if (!existsSync(assetPath)) {
    // If JSON doesn't exist, check if there's a corresponding mermaid file
    const pathString = excalidrawPath.join("/");
    if (pathString.startsWith("data/") && pathString.endsWith(".json")) {
      const fileBasename = basename(pathString, ".json");
      const mermaidPath = join(assetsPath, "mermaids", `${fileBasename}.mmd`);

      if (existsSync(mermaidPath)) {
        // Read the mermaid content
        let mermaidContent: string;
        try {
          mermaidContent = readFileSync(mermaidPath, "utf-8");
        } catch (error) {
          console.error(`Error reading mermaid file ${mermaidPath}:`, error);
          return <EmptyExcalidraw />;
        }

        // Pass mermaid content with a flag to indicate it needs conversion
        return (
          <ExcalidrawWrapper
            projectId={projectId}
            excalidrawPath={excalidrawPath.join("/")}
            excalidrawContent={mermaidContent}
            isMermaid={true}
          />
        );
      }
    }
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
