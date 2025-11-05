"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import { capitalCase } from "change-case";
import { useData } from "@/tiptap/hooks/use-data";
import { inferColumnsMetadata } from "@/tiptap/ui/data-table/utils";
import { DataTable, createColumns } from "@/tiptap/ui/data-table";

export function DatabaseRenderer({ databasePath }: { databasePath: string }) {
  const { projectId } = useParams<{ projectId: string }>();
  const storageKey = `data-view-${projectId}-${databasePath}`;

  const title = useMemo(() => {
    // Extract filename from path (e.g., "data/my-page/my-todos.json" -> "my-todos.json")
    const filename = databasePath.split("/").pop() || "";

    // Remove extension (e.g., "my-todos.json" -> "my-todos")
    const nameWithoutExtension = filename.replace(/\.[^/.]+$/, "");

    // Transform to capital case (e.g., "my-todos" -> "My Todos")
    return capitalCase(nameWithoutExtension);
  }, [databasePath]);

  const { data, updateData } = useData(databasePath);

  const columnsMetadata = useMemo(() => inferColumnsMetadata(data), [data]);

  const columns = useMemo(
    () => createColumns(columnsMetadata),
    [columnsMetadata]
  );

  if (!Array.isArray(data)) return null;

  return (
    <>
      <h3 className="mt-0!">{title}</h3>
      <DataTable
        data={data as Record<string, unknown>[]}
        columns={columns}
        storageKey={storageKey}
        updateData={updateData}
      />
    </>
  );
}
