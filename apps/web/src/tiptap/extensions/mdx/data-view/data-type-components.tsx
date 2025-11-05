import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import CodeMirror, { EditorView } from "@uiw/react-codemirror";
import { vscodeLight, vscodeDark } from "@uiw/codemirror-theme-vscode";
import { langs } from "@uiw/codemirror-extensions-langs";
import { useTheme } from "next-themes";
import { useMemo } from "react";
import { inferColumnsMetadata } from "@/tiptap/ui/data-table/utils";
import { DataTable, createColumns } from "@/tiptap/ui/data-table";

export function NullUndefinedContent() {
  return (
    <pre>
      <code>null or undefined</code>
    </pre>
  );
}

export function PrimitiveContent({
  data,
  updateData,
}: {
  data: boolean | number | string;
  updateData: (next: boolean | number | string) => void;
}) {
  if (typeof data === "boolean") {
    return (
      <Checkbox
        checked={data}
        onCheckedChange={(checked) => updateData(checked as boolean)}
      />
    );
  }

  return (
    <Input
      type={typeof data === "number" ? "number" : "text"}
      value={data}
      onChange={(e) => {
        const value = e.target.value;
        if (typeof data === "number") {
          updateData(Number(value));
        } else {
          updateData(value);
        }
      }}
    />
  );
}

export function ObjectContent({
  data,
  updateData,
}: {
  data: Record<string, unknown>;
  updateData: (next: Record<string, unknown>) => void;
}) {
  const { resolvedTheme } = useTheme();

  const handleChange = (value: string) => {
    try {
      const parsed = JSON.parse(value);
      updateData(parsed);
    } catch {
      // Invalid JSON, don't update
    }
  };

  return (
    <CodeMirror
      value={JSON.stringify(data, null, 2)}
      onChange={handleChange}
      theme={resolvedTheme === "dark" ? vscodeDark : vscodeLight}
      height="10rem"
      extensions={[langs.json(), EditorView.lineWrapping]}
      width="100%"
      className="text-xs h-full w-full border border-input rounded-md px-3 py-1"
    />
  );
}

export function ArrayContent({
  data,
  updateData,
  storageKey,
}: {
  data: unknown[];
  updateData: (next: unknown[]) => void;
  storageKey: string;
}) {
  const { resolvedTheme } = useTheme();

  // Validate data is array of objects
  const isArrayOfObjects = useMemo(
    () =>
      data.every(
        (item) =>
          typeof item === "object" && !Array.isArray(item) && item !== null
      ),
    [data]
  );

  // Only compute table-related data if it's an array of objects
  const tableData = useMemo(
    () => (isArrayOfObjects ? (data as Record<string, unknown>[]) : []),
    [data, isArrayOfObjects]
  );

  const columnsMetadata = useMemo(
    () => (isArrayOfObjects ? inferColumnsMetadata(tableData) : []),
    [tableData, isArrayOfObjects]
  );

  const columns = useMemo(
    () => (isArrayOfObjects ? createColumns(columnsMetadata) : []),
    [columnsMetadata, isArrayOfObjects]
  );

  if (data.length === 0) {
    return (
      <pre>
        <code>Empty array</code>
      </pre>
    );
  }

  // If not array of objects, use CodeMirror like ObjectContent
  if (!isArrayOfObjects) {
    const handleChange = (value: string) => {
      try {
        const parsed = JSON.parse(value);
        updateData(parsed);
      } catch {
        // Invalid JSON, don't update
      }
    };

    return (
      <CodeMirror
        value={JSON.stringify(data, null, 2)}
        onChange={handleChange}
        theme={resolvedTheme === "dark" ? vscodeDark : vscodeLight}
        height="10rem"
        extensions={[langs.json(), EditorView.lineWrapping]}
        width="100%"
        className="text-xs h-full w-full border border-input rounded-md px-3 py-1"
      />
    );
  }

  return (
    <DataTable
      data={tableData}
      columns={columns}
      storageKey={storageKey}
      updateData={updateData}
    />
  );
}
