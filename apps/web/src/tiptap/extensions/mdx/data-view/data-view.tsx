"use client";

import { Fragment, useMemo } from "react";
import { useParams } from "next/navigation";
import { capitalCase } from "change-case";
import { useData } from "@/tiptap/hooks/use-data";
import { Separator } from "@/components/ui/separator";
import {
  NullUndefinedContent,
  PrimitiveContent,
  ObjectContent,
  ArrayContent,
} from "./data-type-components";

export function DataView({ dataImports }: { dataImports: string[] }) {
  return (
    <div className="flex flex-col">
      {dataImports.map((importPath, index) => (
        <Fragment key={importPath}>
          <DataViewItem importPath={importPath} />
          {index < dataImports.length - 1 && <Separator className="my-4" />}
        </Fragment>
      ))}
    </div>
  );
}

function DataViewItem({ importPath }: { importPath: string }) {
  const projectId = useParams<{ projectId: string }>();
  const { data, updateData } = useData(importPath);
  // Check if data is an object (not array) with first-level keys
  const isObject = useMemo(
    () =>
      data &&
      typeof data === "object" &&
      !Array.isArray(data) &&
      Object.keys(data).length > 0,
    [data]
  );

  if (isObject) {
    return (
      <div className="flex flex-col">
        <DataViewItemTitle importPath={importPath} />
        {Object.keys(data).map((key, index) => {
          const updateSubData = (next: unknown) => {
            updateData({
              ...data,
              [key]: next,
            });
          };
          return (
            <Fragment key={key}>
              <p className="text-sm font-medium">{capitalCase(key)}:</p>
              <DataViewItemContent
                data={data[key]}
                updateData={updateSubData}
                storageKey={`data-view-${projectId}-${key}-${importPath}`}
              />
              {index < Object.keys(data).length - 1 && (
                <Separator className="my-4" />
              )}
            </Fragment>
          );
        })}
      </div>
    );
  }

  // For arrays or primitives, use the original structure
  return (
    <div className="flex flex-col">
      <DataViewItemTitle importPath={importPath} />
      <DataViewItemContent
        data={data}
        updateData={updateData}
        storageKey={`data-view-${projectId}-${importPath}`}
      />
    </div>
  );
}

function DataViewItemTitle({ importPath }: { importPath: string }) {
  const title = useMemo(() => {
    // Extract filename from path (e.g., "data/my-page/my-todos.json" -> "my-todos.json")
    const filename = importPath.split("/").pop() || "";

    // Remove extension (e.g., "my-todos.json" -> "my-todos")
    const nameWithoutExtension = filename.replace(/\.[^/.]+$/, "");

    // Transform to capital case (e.g., "my-todos" -> "My Todos")
    return capitalCase(nameWithoutExtension);
  }, [importPath]);

  return <h3 className="mt-0!">{title}</h3>;
}

function DataViewItemContent({
  data,
  updateData,
  storageKey,
}: {
  data: unknown;
  updateData: (next: unknown) => void;
  storageKey: string;
}) {
  switch (true) {
    case data === null || data === undefined:
      return <NullUndefinedContent />;

    case typeof data === "boolean" ||
      typeof data === "number" ||
      typeof data === "string":
      return <PrimitiveContent data={data} updateData={updateData} />;

    case Array.isArray(data):
      return (
        <ArrayContent
          data={data}
          updateData={updateData}
          storageKey={storageKey}
        />
      );

    case typeof data === "object":
      return (
        <ObjectContent
          data={data as Record<string, unknown>}
          updateData={updateData}
        />
      );

    default:
      return (
        <pre>
          <code>{JSON.stringify(data, null, 2)}</code>
        </pre>
      );
  }
}
