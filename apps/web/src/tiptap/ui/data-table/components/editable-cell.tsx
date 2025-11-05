"use client";

import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import type { ColumnType } from "../utils";
import { useCellStateContext } from "../cell-state-provider";
import { AutosizeTextarea } from "./autosize-textarea";

export function EditableCell({
  value,
  type,
  rowIndex,
  columnId,
}: {
  value: unknown;
  type: ColumnType;
  rowIndex: number;
  columnId: string;
}) {
  const cellState = useCellStateContext();
  const isEditing =
    cellState.editingCell?.rowIndex === rowIndex &&
    cellState.editingCell?.columnId === columnId;
  const isFocused =
    cellState.focusedCell?.rowIndex === rowIndex &&
    cellState.focusedCell?.columnId === columnId;

  // Boolean: Always show switch
  if (type === "boolean") {
    return (
      <div
        className={cn(
          "flex h-full px-3 py-2 transition-[box-shadow]",
          isFocused && "ring-inset ring-ring/50 ring-[2px] outline-none"
        )}
        onClick={(e) => {
          // Only set focus if clicking on the cell background, not the switch
          if (e.target === e.currentTarget) {
            cellState.setFocusedCell({ rowIndex, columnId });
          }
        }}
      >
        <Switch
          checked={Boolean(value)}
          onCheckedChange={(checked) =>
            cellState.updateCellData(rowIndex, columnId, checked)
          }
        />
      </div>
    );
  }

  // Click to edit for other types
  if (isEditing) {
    return (
      <div className="h-full px-3 py-2 bg-muted/50 ring-inset ring-ring/50 ring-[3px] outline-none transition-all">
        {type === "complex" ? (
          <AutosizeTextarea
            autoFocus
            minHeight={0}
            offsetBorder={0}
            defaultValue={JSON.stringify(value, null, 2)}
            onFocus={(e) => {
              // Move cursor to end of text
              const length = e.target.value.length;
              e.target.setSelectionRange(length, length);
            }}
            onBlur={(e) => {
              try {
                cellState.updateCellData(
                  rowIndex,
                  columnId,
                  JSON.parse(e.target.value)
                );
              } catch {
                // Invalid JSON, revert
              }
              cellState.setEditingCell(null);
              cellState.refocusTable();
            }}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                cellState.setEditingCell(null);
                cellState.refocusTable();
              }
            }}
            className="focus-visible:ring-0 focus-visible:ring-offset-0 p-0 w-full h-auto font-mono text-xs resize-none"
          />
        ) : (
          <AutosizeTextarea
            autoFocus
            minHeight={0}
            offsetBorder={0}
            defaultValue={
              value === null || value === undefined ? "" : String(value)
            }
            onFocus={(e) => {
              // Move cursor to end of text
              const length = e.target.value.length;
              e.target.setSelectionRange(length, length);
            }}
            onBlur={(e) => {
              const trimmedValue = e.target.value.trim();
              if (type === "number") {
                if (trimmedValue === "") {
                  cellState.updateCellData(rowIndex, columnId, null);
                } else {
                  const numValue = Number(trimmedValue);
                  cellState.updateCellData(
                    rowIndex,
                    columnId,
                    isNaN(numValue) ? null : numValue
                  );
                }
              } else {
                cellState.updateCellData(rowIndex, columnId, e.target.value);
              }
              cellState.setEditingCell(null);
              cellState.refocusTable();
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                e.currentTarget.blur();
              }
              if (e.key === "Escape") {
                cellState.setEditingCell(null);
                cellState.refocusTable();
              }
            }}
            className={cn(
              "focus-visible:ring-0 focus-visible:ring-offset-0 p-0 w-full h-auto resize-none",
              type === "number" && "text-right"
            )}
          />
        )}
      </div>
    );
  }

  // View mode: click to edit
  return (
    <div
      className={cn(
        "cursor-pointer flex h-full px-3 py-2 transition-[box-shadow]",
        type === "number" && "justify-end",
        isFocused && "ring-inset ring-ring/50 ring-[2px] outline-none"
      )}
      onClick={() => {
        cellState.setFocusedCell({ rowIndex, columnId });
        cellState.setEditingCell({ rowIndex, columnId });
      }}
    >
      {type === "complex" ? (
        <pre className="whitespace-pre-wrap break-words font-mono text-xs">
          {JSON.stringify(value, null, 2)}
        </pre>
      ) : value === null || value === undefined ? (
        ""
      ) : (
        <span className="whitespace-pre-wrap break-words">{String(value)}</span>
      )}
    </div>
  );
}
