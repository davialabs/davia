"use client";

import { useRouter } from "next/navigation";
import { useProjects } from "@/providers/projects-provider";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Spinner } from "@/components/ui/spinner";
import { FileCodeIcon, RefreshCcwIcon } from "lucide-react";

export function EmptyDocumentation() {
  const router = useRouter();
  const { currentProject } = useProjects();
  const isRunning = currentProject?.running === true;

  return (
    <div className="flex flex-1 items-center justify-center h-full p-4">
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            {isRunning ? <Spinner className="size-8" /> : <FileCodeIcon />}
          </EmptyMedia>
          <EmptyTitle>
            {isRunning ? "Documenting Project" : "Empty Documentation"}
          </EmptyTitle>
          <EmptyDescription>
            {isRunning ? (
              "The project is being documented. Please wait while we generate the documentation."
            ) : (
              <>
                No pages found for this repository. Please generate
                documentation first by running{" "}
                <code className="bg-muted p-1 text-xs rounded-md">
                  pnpm run docs
                </code>{" "}
                in the terminal.
              </>
            )}
          </EmptyDescription>
        </EmptyHeader>
        {isRunning && (
          <EmptyContent>
            <Button onClick={() => router.refresh()}>
              <RefreshCcwIcon />
              Refresh
            </Button>
          </EmptyContent>
        )}
      </Empty>
    </div>
  );
}

export function PageNotFound() {
  return (
    <div className="flex flex-1 items-center justify-center h-full p-4">
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <FileCodeIcon />
          </EmptyMedia>
          <EmptyTitle>Page Not Found</EmptyTitle>
          <EmptyDescription>
            The page you are looking for does not exist.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    </div>
  );
}
