import { readFileSync } from "fs";
import { redirect } from "next/navigation";
import { join } from "path";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { FolderCodeIcon } from "lucide-react";

export default function NoRepoIdPage() {
  // Get monorepo root from environment variable
  const monorepoRoot = process.env.DAVIA_MONOREPO_ROOT!;

  // Read state.json
  const projectsJsonPath = join(monorepoRoot, ".davia", "projects.json");
  let projects = {};
  try {
    const projectsContent = readFileSync(projectsJsonPath, "utf-8");
    if (projectsContent.trim()) {
      projects = JSON.parse(projectsContent);
    }
  } catch (error) {
    console.error("Error reading projects.json:", error);
  }

  if (Object.keys(projects).length > 0) {
    redirect(`/${Object.keys(projects)[0]}`);
  } else {
    return (
      <div className="flex flex-1 items-center justify-center h-full p-4">
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <FolderCodeIcon />
            </EmptyMedia>
            <EmptyTitle>No Documentation Yet</EmptyTitle>
            <EmptyDescription>
              You haven&apos;t generated any documentation yet. Get started by
              doing{" "}
              <code className="bg-muted p-1 text-xs rounded-md">
                pnpm run docs
              </code>{" "}
              in the terminal.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    );
  }
}
