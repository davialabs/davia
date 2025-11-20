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
import { EmptyDocumentationClient } from "./empty-documentation-client";

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
              <EmptyDocumentationClient />
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    );
  }
}
