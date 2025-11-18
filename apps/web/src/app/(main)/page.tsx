import { redirect } from "next/navigation";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { FolderCodeIcon } from "lucide-react";
import { readProjects } from "@/lib/projects";

export default async function NoProjectIdPage() {
  // Read projects from env-paths
  const projects = await readProjects();

  if (projects.length > 0) {
    redirect(`/${projects[0]!.id}`);
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
