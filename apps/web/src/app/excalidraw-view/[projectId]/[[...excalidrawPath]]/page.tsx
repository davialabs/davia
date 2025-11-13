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

export default async function ExcalidrawViewPage({
  params,
}: {
  params: Promise<{ projectId: string; excalidrawPath: string[] }>;
}) {
  const { projectId, excalidrawPath } = await params;

  // Get monorepo root from environment variable
  const monorepoRoot = process.env.DAVIA_MONOREPO_ROOT!;

  // Check if the asset folder exists
  const assetPath = join(
    monorepoRoot,
    ".davia",
    "assets",
    projectId,
    ...excalidrawPath
  );
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
