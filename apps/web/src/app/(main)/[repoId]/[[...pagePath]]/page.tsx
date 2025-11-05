import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { FileCodeIcon } from "lucide-react";

export default async function PagePathPage({
  params,
}: {
  params: Promise<{ repoId: string; pagePath?: string[] }>;
}) {
  const { pagePath } = await params;

  if (!pagePath) {
    return (
      <div className="flex flex-1 items-center justify-center h-full p-4">
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <FileCodeIcon />
            </EmptyMedia>
            <EmptyTitle>No Page Selected</EmptyTitle>
            <EmptyDescription>
              Select a page from the sidebar to view its content.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    );
  }

  return <div>PagePathPage</div>;
}
